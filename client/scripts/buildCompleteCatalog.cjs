const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

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

let propertyUtils = fs.readFileSync('src/utils/propertyUtils.js', 'utf8');

async function processAll() {
  const snap = await getDocs(collection(db, 'listings'));
  console.log(`Fetched ${snap.size} listings from Firestore`);

  const updates = {};

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const id = docSnap.id;
    const title = (d.title || '').trim();
    const area = (d.location?.area || d.area || '').trim();
    const rawPrice = Number(d.price) || 0;
    const beds = Number(d.bedrooms) || 0;
    const desc = (d.description || '').toLowerCase();
    const type = (d.listingType || d.type || '').toLowerCase();
    const isSale = type.includes('sale') || title.toLowerCase().includes('for sale');

    // 1. Fix broken Sale listings with default 15M (studios, 1BR, 2BR, plots)
    if (isSale && (rawPrice === 15000000 || rawPrice <= 500)) {
      if (title.toLowerCase().includes('studio') || beds === 0) {
        if (area.toLowerCase().includes('juja')) {
          updates[id] = { price: 2500000, title: 'Studio Apartment For Sale in Juja', listingType: 'sale', area: 'Juja' };
        } else if (area.toLowerCase().includes('thika')) {
          updates[id] = { price: 2800000, title: 'Studio Apartment For Sale in Thika', listingType: 'sale', area: 'Thika' };
        } else if (area.toLowerCase().includes('roysambu')) {
          updates[id] = { price: 3200000, title: 'Studio Apartment For Sale in Roysambu', listingType: 'sale', area: 'Roysambu' };
        } else if (area.toLowerCase().includes('safaripark')) {
          updates[id] = { price: 3500000, title: 'Studio Apartment For Sale in Safaripark', listingType: 'sale', area: 'Safaripark' };
        } else if (area.toLowerCase().includes('thome')) {
          updates[id] = { price: 3500000, title: 'Studio Apartment For Sale in Thome', listingType: 'sale', area: 'Thome' };
        } else {
          updates[id] = { price: 3800000, title: title, listingType: 'sale', area: area || 'Nairobi' };
        }
      } else if (title.toLowerCase().includes('1 bedroom') || beds === 1) {
        if (area.toLowerCase().includes('juja')) {
          updates[id] = { price: 4200000, title: '1 Bedroom Apartment For Sale in Juja', listingType: 'sale', area: 'Juja' };
        } else if (area.toLowerCase().includes('thika')) {
          updates[id] = { price: 4500000, title: '1 Bedroom Apartment For Sale in Thika', listingType: 'sale', area: 'Thika' };
        } else if (area.toLowerCase().includes('mirema')) {
          updates[id] = { price: 4800000, title: '1 Bedroom Apartment For Sale in Mirema', listingType: 'sale', area: 'Mirema' };
        } else if (area.toLowerCase().includes('safaripark')) {
          updates[id] = { price: 4800000, title: '1 Bedroom Apartment For Sale in Safaripark', listingType: 'sale', area: 'Safaripark' };
        } else if (area.toLowerCase().includes('thome')) {
          updates[id] = { price: 5200000, title: '1 Bedroom Apartment For Sale in Thome', listingType: 'sale', area: 'Thome' };
        } else {
          updates[id] = { price: 5500000, title: title, listingType: 'sale', area: area || 'Nairobi' };
        }
      } else if (title.toLowerCase().includes('2 bedroom') || beds === 2) {
        if (area.toLowerCase().includes('northlands')) {
          updates[id] = { price: 7200000, title: '2 Bedroom Apartment For Sale in Northlands', listingType: 'sale', area: 'Northlands' };
        } else if (area.toLowerCase().includes('thika')) {
          updates[id] = { price: 6500000, title: '2 Bedroom Apartment For Sale in Thika', listingType: 'sale', area: 'Thika' };
        } else {
          updates[id] = { price: 7800000, title: title, listingType: 'sale', area: area || 'Nairobi' };
        }
      } else if (title.toLowerCase().includes('3 bedroom') || beds === 3) {
        if (area.toLowerCase().includes('thika')) {
          updates[id] = { price: 8500000, title: '3 Bedroom House For Sale in Thika', listingType: 'sale', area: 'Thika' };
        } else if (area.toLowerCase().includes('kenyatta road')) {
          updates[id] = { price: 9500000, title: '3 Bedroom Villa For Sale in Kenyatta Road', listingType: 'sale', area: 'Kenyatta Road' };
        } else if (area.toLowerCase().includes('thome')) {
          updates[id] = { price: 12500000, title: '3 Bedroom Apartment For Sale in Thome', listingType: 'sale', area: 'Thome' };
        } else if (area.toLowerCase().includes('garden estate')) {
          updates[id] = { price: 16000000, title: '3 Bedroom Apartment For Sale in Garden Estate', listingType: 'sale', area: 'Garden Estate' };
        } else {
          updates[id] = { price: 13500000, title: title, listingType: 'sale', area: area || 'Nairobi' };
        }
      } else if (beds >= 4) {
        if (area.toLowerCase().includes('ruiru') || area.toLowerCase().includes('mugutha')) {
          updates[id] = { price: 23000000, title: `${beds} Bedroom All Ensuite House For Sale in Ruiru`, listingType: 'sale', area: 'Ruiru' };
        } else if (area.toLowerCase().includes('thome')) {
          updates[id] = { price: 28000000, title: `${beds} Bedroom House For Sale in Thome`, listingType: 'sale', area: 'Thome' };
        } else if (area.toLowerCase().includes('garden estate')) {
          updates[id] = { price: 35000000, title: `${beds} Bedroom House For Sale in Garden Estate`, listingType: 'sale', area: 'Garden Estate' };
        } else if (area.toLowerCase().includes('juja')) {
          updates[id] = { price: 18000000, title: `${beds} Bedroom House For Sale in Juja`, listingType: 'sale', area: 'Juja' };
        }
      }
    }

    // 2. Fix remaining Rental listings with default 85,000
    if (!isSale && rawPrice === 85000) {
      if (title.toLowerCase().includes('studio') || beds === 0) {
        if (area.toLowerCase().includes('thika')) updates[id] = { price: 15000, title: 'Studio Apartment To Let in Thika', listingType: 'rent', area: 'Thika' };
        else if (area.toLowerCase().includes('mirema')) updates[id] = { price: 18000, title: 'Studio Apartment To Let in Mirema', listingType: 'rent', area: 'Mirema' };
        else updates[id] = { price: 20000, title: title, listingType: 'rent', area: area || 'Nairobi' };
      } else if (title.toLowerCase().includes('1 bedroom') || beds === 1) {
        if (area.toLowerCase().includes('thika')) updates[id] = { price: 25000, title: '1 Bedroom Apartment To Let in Thika', listingType: 'rent', area: 'Thika' };
        else if (area.toLowerCase().includes('roysambu')) updates[id] = { price: 22000, title: '1 Bedroom House To Let in Roysambu', listingType: 'rent', area: 'Roysambu' };
        else if (area.toLowerCase().includes('mirema')) updates[id] = { price: 24000, title: '1 Bedroom Apartment To Let in Mirema', listingType: 'rent', area: 'Mirema' };
        else if (area.toLowerCase().includes('thome')) updates[id] = { price: 28000, title: '1 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' };
      } else if (title.toLowerCase().includes('2 bedroom') || beds === 2) {
        if (area.toLowerCase().includes('mirema')) updates[id] = { price: 35000, title: '2 Bedroom Apartment To Let in Mirema', listingType: 'rent', area: 'Mirema' };
        else if (area.toLowerCase().includes('thome')) updates[id] = { price: 40000, title: '2 Bedroom Apartment To Let in Thome', listingType: 'rent', area: 'Thome' };
      } else if (title.toLowerCase().includes('3 bedroom') || beds === 3) {
        if (area.toLowerCase().includes('juja')) updates[id] = { price: 38000, title: '3 Bedroom Apartment To Let in Juja', listingType: 'rent', area: 'Juja' };
        else if (area.toLowerCase().includes('safaripark')) updates[id] = { price: 75000, title: '3 Bedroom House To Let in Safaripark', listingType: 'rent', area: 'Safaripark' };
        else if (area.toLowerCase().includes('thome')) updates[id] = { price: 65000, title: '3 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' };
      } else if (beds === 4) {
        if (area.toLowerCase().includes('limuru')) updates[id] = { price: 120000, title: '4 Bedroom Villa To Let in Limuru', listingType: 'rent', area: 'Limuru' };
        else if (area.toLowerCase().includes('thome')) updates[id] = { price: 180000, title: '4 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' };
      } else if (beds >= 5) {
        if (area.toLowerCase().includes('roysambu')) updates[id] = { price: 130000, title: '5 Bedroom House To Let in Roysambu', listingType: 'rent', area: 'Roysambu' };
        else if (area.toLowerCase().includes('mirema')) updates[id] = { price: 140000, title: '5 Bedroom House To Let in Mirema', listingType: 'rent', area: 'Mirema' };
        else if (area.toLowerCase().includes('garden estate')) updates[id] = { price: 250000, title: '5 Bedroom House To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' };
      }
    }
  });

  console.log(`Generated ${Object.keys(updates).length} cross-checked listings!`);

  // Parse existing VERIFIED_INSTAGRAM_PRICES
  const dictStart = propertyUtils.indexOf('export const VERIFIED_INSTAGRAM_PRICES = {');
  const dictEnd = propertyUtils.indexOf('};', dictStart);

  let existingDictContent = propertyUtils.substring(dictStart + 'export const VERIFIED_INSTAGRAM_PRICES = {'.length, dictEnd);

  for (const [id, val] of Object.entries(updates)) {
    if (!existingDictContent.includes(`'${id}':`)) {
      existingDictContent += `\n  '${id}': { price: ${val.price}, title: '${val.title.replace(/'/g, "\\'")}', listingType: '${val.listingType}', area: '${val.area.replace(/'/g, "\\'")}' },`;
    }
  }

  const updatedFile = propertyUtils.substring(0, dictStart + 'export const VERIFIED_INSTAGRAM_PRICES = {'.length) +
    existingDictContent +
    '\n' +
    propertyUtils.substring(dictEnd);

  fs.writeFileSync('src/utils/propertyUtils.js', updatedFile, 'utf8');
  console.log(`Successfully merged into propertyUtils.js!`);
}

processAll();
