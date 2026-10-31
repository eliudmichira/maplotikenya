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

const ALLOWED_NAMES = [
  'eric kamau',
  'maploti',
  'keith kibe',
  'daniel akech',
  'samson gift'
];

async function purge() {
  console.log('🔍 Scanning Firestore listings to identify unauthorized agent properties...');
  const snap = await getDocs(collection(db, 'listings'));
  console.log(`Total listings in collection: ${snap.size}`);

  const toDelete = [];
  const removedCounts = {};

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const id = docSnap.id;
    const ag = d.agent || {};
    const name = (ag.name || d.agentName || '').trim().toLowerCase();
    const phone = String(ag.phone || ag.phoneNumber || d.agentPhone || d.contactPhone || d.phone || '');
    const isTikTok = d.source === 'tiktok' || !!d.tiktokId;
    const isEricPhone = phone.includes('705906024');

    const isAllowed =
      isTikTok ||
      isEricPhone ||
      ALLOWED_NAMES.some(allowed => name.includes(allowed));

    if (!isAllowed) {
      toDelete.push(id);
      removedCounts[name || 'Unknown'] = (removedCounts[name || 'Unknown'] || 0) + 1;
    }
  });

  console.log(`\nIdentified ${toDelete.length} unauthorized listings to remove.`);
  console.log('Breakdown by agent:', removedCounts);

  if (toDelete.length === 0) {
    console.log('No unauthorized listings found!');
    process.exit(0);
  }

  const BATCH_SIZE = 15;
  let deletedCount = 0;

  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const chunk = toDelete.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async (id) => {
      try {
        await execAsync(`firebase firestore:delete listings/${id} -f --project maploti`);
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting listings/${id}:`, err.message);
      }
    }));
    console.log(`Progress: deleted ${deletedCount} / ${toDelete.length}...`);
  }

  console.log(`\n🎉 Successfully removed all ${deletedCount} unauthorized listings from Firestore!`);
  process.exit(0);
}

purge().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
