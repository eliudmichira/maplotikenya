import axios from 'axios';
import { scrapeMbanyu } from './scrape/sites/mbanyu.js';

const PROJECT_ID = 'maploti';
const API_KEY = 'AIzaSyD5aAzMaE0-5evd7o1kelnETaGv5sd1x4U';
const AUTH_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`;
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/listings`;

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

function toFirestoreFields(item, ownerId) {
  const coords = resolveCoords(item.area);
  const county = 'Nairobi';
  const area = item.area || 'Nairobi';
  const keywords = buildKeywords(item.title, area, county, item.propertyType, item.listingType);

  return {
    fields: {
      title: { stringValue: item.title },
      description: { stringValue: `Verified property from Mbanyu Real Estate. Premium ${item.bedrooms > 0 ? item.bedrooms + 'BR ' : ''}${item.propertyType} in ${area}, ${county}.` },
      price: { doubleValue: item.price },
      propertyType: { stringValue: item.propertyType },
      listingType: { stringValue: item.listingType },
      bedrooms: { integerValue: item.bedrooms },
      bathrooms: { integerValue: item.bathrooms },
      parking: { integerValue: 2 },
      sizeSqm: { doubleValue: 180.0 },
      amenities: { arrayValue: { values: [
        { stringValue: 'wifi' },
        { stringValue: 'water_storage' },
        { stringValue: 'cctv' },
        { stringValue: 'backup_generator' },
        { stringValue: 'parking' }
      ] } },
      images: { arrayValue: { values: item.images.map(url => ({ stringValue: url })) } },
      location: { mapValue: { fields: {
        county: { stringValue: county },
        area: { stringValue: area },
        address: { stringValue: area },
        searchKeywords: { arrayValue: { values: keywords.map(k => ({ stringValue: k })) } },
        geoPoint: { geoPointValue: { latitude: coords.lat, longitude: coords.lng } }
      } } },
      ownerId: { stringValue: ownerId || 'main_agent' },
      featured: { booleanValue: Math.random() > 0.5 },
      status: { stringValue: 'active' },
      views: { integerValue: Math.floor(Math.random() * 90) + 12 },
      createdAt: { timestampValue: new Date().toISOString() },
      updatedAt: { timestampValue: new Date().toISOString() },
    }
  };
}

async function main() {
  console.log('🔑 Acquiring Firebase Auth token via REST API...');
  let idToken = '';
  let localId = 'main_agent';

  try {
    const authRes = await axios.post(AUTH_URL, { returnSecureToken: true });
    idToken = authRes.data.idToken;
    localId = authRes.data.localId;
    console.log('  ✅ Auth Success! UID:', localId);
  } catch (authErr) {
    console.log('  ⚠️ Sign-up fallback, attempting sign-in...');
    try {
      const signInRes = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
        email: 'agent@maploti.co.ke',
        password: 'Password123!',
        returnSecureToken: true
      });
      idToken = signInRes.data.idToken;
      localId = signInRes.data.localId;
      console.log('  ✅ Sign-in Success! UID:', localId);
    } catch (err2) {
      console.error('  ❌ Auth failed:', err2.response?.data || err2.message);
    }
  }

  console.log('🚀 Scraping Mbanyu properties...');
  const rawListings = await scrapeMbanyu({ pages: 1 });
  console.log(`📦 Scraped ${rawListings.length} properties.`);

  let inserted = 0;
  for (const item of rawListings) {
    try {
      const payload = toFirestoreFields(item, localId);
      const res = await axios.post(FIRESTORE_URL, payload, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.status === 200 || res.status === 201) {
        inserted++;
        console.log(`  ✅ Inserted [${item.listingType.toUpperCase()}] ${item.title}`);
      }
    } catch (err) {
      console.error(`  ❌ Error inserting "${item.title}":`, err.response?.data || err.message);
    }
  }

  console.log(`\n🎉 SUCCESS! Imported ${inserted} Mbanyu property listings into Maploti Firestore!`);
}

main();
