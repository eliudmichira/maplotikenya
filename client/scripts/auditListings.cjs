const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  authDomain: "maploti.firebaseapp.com",
  projectId: "maploti",
  storageBucket: "maploti.firebasestorage.app",
  messagingSenderId: "689776477151",
  appId: "1:689776477151:web:29acc07e1e70666edd7a6a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function normalizeStr(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function audit() {
  console.log('Fetching all listings from Firestore...');
  const snap = await getDocs(collection(db, 'listings'));
  console.log(`Total listings in collection: ${snap.size}`);

  const groups = new Map();
  let microPrices = [];
  let saleAsRent = [];
  let flatRentDefaults = [];
  let flatSaleDefaults = [];
  let acreGlitches = [];

  snap.forEach((docSnap) => {
    const d = docSnap.data();
    const id = docSnap.id;
    const title = d.title || '';
    const price = Number(d.price) || 0;
    const area = d.location?.area || d.location?.address || d.area || d.address || '';
    const bedrooms = Number(d.bedrooms) || 0;
    const rawType = String(d.listingType || d.listing_type || d.purpose || d.type || '').toLowerCase();
    const titleNorm = normalizeStr(title);

    // Group for duplicate check
    const dupKey = `${titleNorm}|${normalizeStr(area)}|${price}|${bedrooms}`;
    if (!groups.has(dupKey)) {
      groups.set(dupKey, []);
    }
    groups.get(dupKey).push({ id, title, price, area, bedrooms, data: d });

    // Micro prices
    if (price > 0 && price <= 500) {
      microPrices.push({ id, title, price, area, rawType });
    }

    // Sale misclassified as rent
    if (/sale|sell|buy/.test(titleNorm) && /rent|let/.test(rawType)) {
      saleAsRent.push({ id, title, price, rawType });
    }

    // Flat defaults
    if (price === 85000) flatRentDefaults.push({ id, title, area });
    if (price === 15000000) flatSaleDefaults.push({ id, title, area });

    // Acre glitches
    const sizeStr = String(d.size || d.area_sqm || d.sizeSqm || '');
    if (/acre/i.test(title) && (sizeStr === '1' || sizeStr === '3.5' || sizeStr === '0.25' || Number(sizeStr) < 10)) {
      acreGlitches.push({ id, title, size: sizeStr, areaSqm: d.area_sqm || d.sizeSqm });
    }
  });

  // Calculate duplicates
  let duplicateGroupsCount = 0;
  let totalRedundantDocs = 0;
  for (const [key, list] of groups.entries()) {
    if (list.length > 1) {
      duplicateGroupsCount++;
      totalRedundantDocs += (list.length - 1);
    }
  }

  console.log('\n================ AUDIT RESULTS ================');
  console.log(`Total Docs: ${snap.size}`);
  console.log(`Duplicate Groups: ${duplicateGroupsCount}`);
  console.log(`Total Redundant Duplicate Docs to Remove: ${totalRedundantDocs}`);
  console.log(`Micro-Price Listings (<= 500): ${microPrices.length}`);
  console.log(`Sale Properties Labeled as Rent: ${saleAsRent.length}`);
  console.log(`Listings stuck on 85,000 flat rent: ${flatRentDefaults.length}`);
  console.log(`Listings stuck on 15,000,000 flat sale: ${flatSaleDefaults.length}`);
  console.log(`Acre size glitches: ${acreGlitches.length}`);

  console.log('\nTop Duplicate Clusters:');
  const sortedClusters = [...groups.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 10);
  sortedClusters.forEach(([key, list]) => {
    console.log(`  - "${list[0].title}" (${list[0].area}) @ Ksh ${list[0].price}: ${list.length} copies! (Doc IDs: ${list.map(x => x.id).slice(0, 3).join(', ')}...)`);
  });

  console.log('\nSample Micro-Prices:');
  microPrices.slice(0, 10).forEach(x => {
    console.log(`  - ${x.id}: "${x.title}" -> Ksh ${x.price}`);
  });

  console.log('\nSample Sale Mislabeled as Rent:');
  saleAsRent.slice(0, 5).forEach(x => {
    console.log(`  - ${x.id}: "${x.title}" -> Price: ${x.price}, Type: ${x.rawType}`);
  });

  process.exit(0);
}

audit().catch(e => { console.error(e); process.exit(1); });
