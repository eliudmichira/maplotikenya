/**
 * Maploti - Comprehensive Listings Data Fixer
 *
 * 1. Deduplicates clone listings (retains best document, deletes redundant duplicates)
 * 2. Resolves micro-prices using description regex extraction or multiplier fallback
 * 3. Corrects listingType (sale vs rent) where titles/descriptions state "for sale"
 * 4. Fixes acreage calculations (e.g. 3.5 acres -> ~14,164 m2)
 *
 * Usage:
 *   node scripts/fixListingsData.cjs --dry-run
 *   node scripts/fixListingsData.cjs --execute
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, deleteDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  authDomain: "maploti.firebaseapp.com",
  projectId: "maploti",
  storageBucket: "maploti.firebasestorage.app",
  messagingSenderId: "689776477151",
  appId: "1:689776477151:web:29acc07e1e70666edd7a6a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function ensureAuthenticated() {
  const email = process.env.MAPLOTI_AGENT_EMAIL || 'agent@maploti.co.ke';
  const password = process.env.MAPLOTI_AGENT_PASSWORD || 'Password123!';
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log(`🔐 Authenticated as ${email} (UID: ${cred.user.uid})`);
    return cred.user.uid;
  } catch (err) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`🔐 Created & Authenticated as ${email} (UID: ${cred.user.uid})`);
      return cred.user.uid;
    } catch (e) {
      console.warn(`Could not auth with ${email}: ${e.message}`);
    }
  }
}

const isDryRun = !process.argv.includes('--execute');

function normalizeStr(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractRealPriceAndType(title, desc, currentPrice, currentType) {
  const text = `${title} ${desc}`.toLowerCase();
  let type = currentType;
  let price = Number(currentPrice) || 0;

  // Determine type
  if (/for sale|house for sale|apartment for sale|plots? for sale|villa for sale/i.test(title)) {
    type = 'sale';
  } else if (/to let|for rent|rental/i.test(title)) {
    type = 'rent';
  } else if (/for sale|buy/i.test(desc) && !/to let|for rent/i.test(desc)) {
    type = 'sale';
  } else if (/to let|per month|\/month/i.test(desc)) {
    type = 'rent';
  }

  // If price is micro (<= 500)
  if (price > 0 && price <= 500) {
    // Try extract million from desc: e.g. "3.3 million", "15 million", "2.5m", "1.75M"
    const mMatch = desc.match(/(?:ksh|kes|price:?)?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:m|million)/i);
    if (mMatch) {
      price = Math.round(parseFloat(mMatch[1]) * 1000000);
      type = 'sale';
    } else {
      // Try extract thousand / k from desc: e.g. "@ 150k", "@ 40k", "75k per month", "30k"
      const kMatch = desc.match(/(?:@|at|kes|ksh|price:?)?\s*([0-9]{2,3})\s*(?:k|thousand)/i);
      if (kMatch) {
        price = Math.round(parseFloat(kMatch[1]) * 1000);
        type = 'rent';
      } else {
        // Fallback multiplier
        if (type === 'sale') {
          price = price * 1000000;
        } else {
          price = price * 1000;
        }
      }
    }
  }

  // Ensure high price items (> 1.5M) that have "sale" in title aren't tagged rent
  if (price > 1500000 && /sale|sell/i.test(text)) {
    type = 'sale';
  }

  return { price, type };
}

async function run() {
  console.log(`Starting listings fix (${isDryRun ? 'DRY RUN - No DB changes' : 'LIVE EXECUTION'})...`);
  await ensureAuthenticated();
  const snap = await getDocs(collection(db, 'listings'));
  console.log(`Fetched ${snap.size} listings from Firestore.`);

  const groups = new Map();
  const updates = [];
  const deletions = [];

  // Group for deduplication
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

  // Identify duplicate docs to delete
  for (const [key, items] of groups.entries()) {
    if (items.length > 1) {
      // Sort to keep the best one: prefer doc with tiktokVideo or images or views
      items.sort((a, b) => {
        const aScore = (a.data.tiktokVideo || a.data.tiktok_url ? 50 : 0) +
                       (Array.isArray(a.data.images) ? a.data.images.length * 5 : 0) +
                       (Number(a.data.views) || 0);
        const bScore = (b.data.tiktokVideo || b.data.tiktok_url ? 50 : 0) +
                       (Array.isArray(b.data.images) ? b.data.images.length * 5 : 0) +
                       (Number(b.data.views) || 0);
        return bScore - aScore;
      });

      // Keep items[0], delete items[1..]
      for (let i = 1; i < items.length; i++) {
        deletions.push(items[i].id);
      }
    }
  }

  // Inspect retained documents for price, type, size corrections
  snap.forEach((docSnap) => {
    const id = docSnap.id;
    if (deletions.includes(id)) return; // Skip documents marked for deletion

    const d = docSnap.data();
    const title = d.title || '';
    const desc = d.description || '';
    const currentPrice = d.price;
    const currentType = d.listingType || d.type || 'rent';

    const { price: newPrice, type: newType } = extractRealPriceAndType(title, desc, currentPrice, currentType);

    const docUpdates = {};
    if (newPrice !== currentPrice) {
      docUpdates.price = newPrice;
    }
    if (newType !== currentType) {
      docUpdates.listingType = newType;
      docUpdates.purpose = newType;
    }

    // Fix acre size if applicable
    if (/acre/i.test(title)) {
      let acres = null;
      if (/1\/4\s*(?:th)?\s*acre/i.test(title)) acres = 0.25;
      else if (/1\/2\s*acre|half\s*acre/i.test(title)) acres = 0.5;
      else if (/1\/8\s*(?:th)?\s*acre/i.test(title)) acres = 0.125;
      else if (/3\/4\s*acre/i.test(title)) acres = 0.75;
      else {
        const match = title.match(/([0-9]+(?:\.[0-9]+)?)\s*acres?/i);
        if (match) acres = parseFloat(match[1]);
      }
      if (acres && Number.isFinite(acres) && acres > 0) {
        const calcSqm = Math.round(acres * 4046.86);
        if (d.sizeSqm !== calcSqm || d.area_sqm !== calcSqm) {
          docUpdates.sizeSqm = calcSqm;
          docUpdates.area_sqm = calcSqm;
          docUpdates.size = `${acres} Acre${acres > 1 ? 's' : ''}`;
        }
      }
    }

    if (Object.keys(docUpdates).length > 0) {
      updates.push({ id, title, fromPrice: currentPrice, toPrice: newPrice, fromType: currentType, toType: newType, docUpdates });
    }
  });

  console.log(`\nFound ${deletions.length} redundant duplicate documents to delete.`);
  console.log(`Found ${updates.length} documents requiring price/type/size updates.`);

  console.log('\nSample Deletions (Duplicates):');
  deletions.slice(0, 10).forEach(id => console.log(`  - Delete clone doc ID: ${id}`));

  console.log('\nSample Updates (Price / Type fixes):');
  updates.slice(0, 15).forEach(u => {
    console.log(`  - ${u.id} ("${u.title}"):`);
    if (u.fromPrice !== u.toPrice) console.log(`      Price: ${u.fromPrice} -> Ksh ${u.toPrice.toLocaleString()}`);
    if (u.fromType !== u.toType) console.log(`      Type: ${u.fromType} -> ${u.toType}`);
    if (u.docUpdates.sizeSqm) console.log(`      Size: ${u.docUpdates.size} (${u.docUpdates.sizeSqm} m²)`);
  });

  if (!isDryRun) {
    console.log('\nApplying changes to Firestore...');
    // Delete duplicates
    for (const id of deletions) {
      await deleteDoc(doc(db, 'listings', id));
    }
    console.log(`Deleted ${deletions.length} duplicate documents.`);

    // Apply updates
    for (const u of updates) {
      await updateDoc(doc(db, 'listings', u.id), u.docUpdates);
    }
    console.log(`Updated ${updates.length} documents successfully.`);
  } else {
    console.log('\nTo apply these fixes, run: node client/scripts/fixListingsData.cjs --execute');
  }

  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
