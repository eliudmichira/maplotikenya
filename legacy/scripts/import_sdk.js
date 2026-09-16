import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { scrapeMbanyu } from './scrape/sites/mbanyu.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD5aAzMaE0-5evd7o1kelnETaGv5sd1x4U',
  appId: '1:689776477151:android:5ce8ad8b4011584add7a6a',
  messagingSenderId: '689776477151',
  projectId: 'maploti',
  storageBucket: 'maploti.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const AREA_COORDS = {
  'westlands': { lat: -1.2676, lng: 36.8011 },
  'kilimani': { lat: -1.2915, lng: 36.7844 },
  'lavington': { lat: -1.2824, lng: 36.7726 },
  'karen': { lat: -1.3412, lng: 36.7012 },
  'kileleshwa': { lat: -1.2789, lng: 36.7746 },
  'parklands': { lat: -1.2579, lng: 36.8189 },
  'runda': { lat: -1.2156, lng: 36.8234 },
  'ruiru': { lat: -1.1456, lng: 36.9612 },
  'kiambu': { lat: -1.1714, lng: 36.8356 },
  'mombasa': { lat: -4.0435, lng: 39.6682 },
  'nairobi': { lat: -1.2921, lng: 36.8219 },
};

function resolveCoords(locationStr) {
  const loc = (locationStr || '').toLowerCase();
  for (const [key, coords] of Object.entries(AREA_COORDS)) {
    if (loc.includes(key)) {
      return {
        lat: coords.lat + (Math.random() - 0.5) * 0.01,
        lng: coords.lng + (Math.random() - 0.5) * 0.01,
      };
    }
  }
  return {
    lat: -1.2921 + (Math.random() - 0.5) * 0.05,
    lng: 36.8219 + (Math.random() - 0.5) * 0.05,
  };
}

function buildKeywords(title, area, county, propType, listType) {
  const set = new Set([
    county.toLowerCase(),
    area.toLowerCase(),
    propType.toLowerCase(),
    listType.toLowerCase(),
  ]);
  title.toLowerCase().split(/\s+/).forEach(w => {
    if (w.length > 2) set.add(w);
  });
  return Array.from(set);
}

async function main() {
  console.log('🔑 Authenticating agent account with Firebase Auth...');
  const email = 'agent@maploti.co.ke';
  const password = 'Password123!';
  
  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    user = cred.user;
  } catch (_) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    user = cred.user;
  }
  
  console.log('  ✅ Authenticated Agent UID:', user.uid);

  console.log('🚀 Scraping Mbanyu property listings...');
  const rawListings = await scrapeMbanyu({ pages: 1 });
  console.log(`📦 Scraped ${rawListings.length} raw listings.`);

  const listingsCol = collection(db, 'listings');
  let inserted = 0;

  for (const item of rawListings) {
    try {
      const coords = resolveCoords(item.area);
      const county = 'Nairobi';
      const area = item.area || 'Nairobi';
      const keywords = buildKeywords(item.title, area, county, item.propertyType, item.listingType);

      const firestoreDoc = {
        title: item.title,
        description: `Verified listing from Mbanyu Real Estate. Premium ${item.bedrooms > 0 ? item.bedrooms + 'BR ' : ''}${item.propertyType} in ${area}, ${county}.`,
        price: item.price,
        propertyType: item.propertyType,
        listingType: item.listingType,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        parking: 2,
        sizeSqm: 180.0,
        amenities: ['wifi', 'water_storage', 'cctv', 'backup_generator', 'parking'],
        images: item.images.length > 0
          ? item.images
          : ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80'],
        location: {
          county,
          area,
          address: item.address || area,
          searchKeywords: keywords,
          geoPoint: coords,
        },
        ownerId: user.uid,
        featured: Math.random() > 0.5,
        status: 'active',
        views: Math.floor(Math.random() * 90) + 12,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(listingsCol, firestoreDoc);
      inserted++;
      console.log(`  ✅ Inserted [${item.listingType.toUpperCase()}] ${item.title}`);
    } catch (e) {
      console.error(`  ❌ Failed inserting listing "${item.title}":`, e.message);
    }
  }

  console.log(`\n🎉 SUCCESS! Inserted ${inserted} Mbanyu property listings into Maploti Firestore under Agent UID: ${user.uid}`);
  process.exit(0);
}

main().catch(console.error);
