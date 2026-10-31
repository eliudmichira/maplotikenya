const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  projectId: "maploti"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function normalizeStr(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function run() {
  console.log('Fetching listings from Firestore to identify clone duplicates...');
  const snap = await getDocs(collection(db, 'listings'));
  console.log(`Total listings in collection: ${snap.size}`);

  const groups = new Map();
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const id = docSnap.id;
    const title = d.title || '';
    const price = Number(d.price) || 0;
    const area = d.location?.area || d.location?.address || d.area || d.address || '';
    const bedrooms = Number(d.bedrooms) || 0;

    const dupKey = `${normalizeStr(title)}|${normalizeStr(area)}|${price}|${bedrooms}`;
    if (!groups.has(dupKey)) {
      groups.set(dupKey, []);
    }
    groups.get(dupKey).push({ id, data: d });
  });

  const deletions = [];
  for (const [key, items] of groups.entries()) {
    if (items.length > 1) {
      // Sort: keep the best one (prefer docs with tiktokVideo or images or views)
      items.sort((a, b) => {
        const aScore = (a.data.tiktokVideo || a.data.tiktok_url ? 50 : 0) +
                       (Array.isArray(a.data.images) ? a.data.images.length * 5 : 0) +
                       (Number(a.data.views) || 0);
        const bScore = (b.data.tiktokVideo || b.data.tiktok_url ? 50 : 0) +
                       (Array.isArray(b.data.images) ? b.data.images.length * 5 : 0) +
                       (Number(b.data.views) || 0);
        return bScore - aScore;
      });

      for (let i = 1; i < items.length; i++) {
        deletions.push(items[i].id);
      }
    }
  }

  console.log(`Identified ${deletions.length} clone documents to delete from Firestore.`);
  if (deletions.length === 0) {
    console.log('No duplicates found!');
    process.exit(0);
  }

  // Delete in concurrent batches of 10
  const BATCH_SIZE = 10;
  let deletedCount = 0;

  for (let i = 0; i < deletions.length; i += BATCH_SIZE) {
    const chunk = deletions.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (id) => {
      try {
        await execAsync(`firebase firestore:delete listings/${id} -f`);
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete listings/${id}:`, err.message);
      }
    }));
    console.log(`Deleted ${deletedCount} / ${deletions.length} clone documents...`);
  }

  console.log(`✅ Successfully cleaned up all ${deletedCount} clone duplicates from Firestore!`);
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
