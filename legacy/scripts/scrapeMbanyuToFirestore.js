/**
 * Scrape ALL Mbanyu real estate listings and import them into Maploti
 * Firestore. Uses the new two-phase scraper (JSON list API + SSR detail).
 *
 * Usage:
 *   node scripts/scrapeMbanyuToFirestore.js                 # DRY RUN (no writes)
 *   DRY_RUN=0 node scripts/scrapeMbanyuToFirestore.js       # write to Firestore
 *   PAGES=3 node scripts/scrapeMbanyuToFirestore.js         # limit pages/contract
 *   PAGES=all node scripts/scrapeMbanyuToFirestore.js       # everything
 *   WITH_DETAILS=0 node scripts/scrapeMbanyuToFirestore.js  # list-only (fast)
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { scrapeMbanyu } from './scrape/sites/mbanyu.js';

// Firebase configuration from maploti (web app)
const firebaseConfig = {
  apiKey: 'AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw',
  authDomain: 'maploti.firebaseapp.com',
  projectId: 'maploti',
  storageBucket: 'maploti.firebasestorage.app',
  messagingSenderId: '689776477151',
  appId: '1:689776477151:web:29acc07e1e70666edd7a6a',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Area coordinates lookup table for Nairobi & surrounding Kenya towns
const AREA_COORDS = {
  'westlands': { lat: -1.2676, lng: 36.8011 },
  'kilimani': { lat: -1.2915, lng: 36.7844 },
  'lavington': { lat: -1.2824, lng: 36.7726 },
  'karen': { lat: -1.3412, lng: 36.7012 },
  'kileleshwa': { lat: -1.2789, lng: 36.7746 },
  'parklands': { lat: -1.2579, lng: 36.8189 },
  'runda': { lat: -1.2156, lng: 36.8234 },
  'riverside': { lat: -1.2721, lng: 36.7896 },
  'muthaiga': { lat: -1.2456, lng: 36.8312 },
  'spring valley': { lat: -1.2534, lng: 36.7812 },
  'gigiri': { lat: -1.2312, lng: 36.8034 },
  'rosslyn': { lat: -1.2234, lng: 36.8156 },
  'general mathenge': { lat: -1.2512, lng: 36.7934 },
  'langata': { lat: -1.3589, lng: 36.7456 },
  'south b': { lat: -1.3056, lng: 36.8267 },
  'south c': { lat: -1.3123, lng: 36.8156 },
  'embakasi': { lat: -1.3189, lng: 36.9012 },
  'donholm': { lat: -1.2975, lng: 36.8912 },
  'upperhill': { lat: -1.2956, lng: 36.8189 },
  'hurlingham': { lat: -1.2934, lng: 36.7956 },
  'adams arcade': { lat: -1.3012, lng: 36.7756 },
  'ngong road': { lat: -1.3012, lng: 36.7612 },
  'ngong': { lat: -1.3540, lng: 36.6552 },
  'ruaka': { lat: -1.2083, lng: 36.7819 },
  'ruiru': { lat: -1.1456, lng: 36.9612 },
  'thika road': { lat: -1.2234, lng: 36.8912 },
  'thika': { lat: -1.0388, lng: 37.0834 },
  'kahawa west': { lat: -1.1815, lng: 36.9189 },
  'kasarani': { lat: -1.2204, lng: 36.8964 },
  'roysambu': { lat: -1.2204, lng: 36.8867 },
  'kitengela': { lat: -1.4738, lng: 36.9572 },
  'ongata rongai': { lat: -1.3958, lng: 36.7456 },
  'kiserian': { lat: -1.4192, lng: 36.6884 },
  'syokimau': { lat: -1.3653, lng: 36.9381 },
  'juja': { lat: -1.1019, lng: 37.0144 },
  'valley arcade': { lat: -1.2924, lng: 36.7780 },
  'nyali': { lat: -4.0234, lng: 39.7012 },
  'mombasa': { lat: -4.0435, lng: 39.6682 },
  'kisumu': { lat: -0.0917, lng: 34.7680 },
  'nakuru': { lat: -0.3031, lng: 36.0800 },
  'eldoret': { lat: 0.5143, lng: 35.2698 },
  'kajiado': { lat: -1.8521, lng: 36.7820 },
  'kiambu': { lat: -1.1714, lng: 36.8356 },
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
    (county || 'nairobi').toLowerCase(),
    (area || 'nairobi').toLowerCase(),
    (propType || '').toLowerCase(),
    (listType || '').toLowerCase(),
  ]);
  (title || '').toLowerCase().split(/\s+/).forEach((w) => {
    if (w.length > 2) set.add(w);
  });
  return Array.from(set);
}

function parseMbanyuDate(raw) {
  // "2026-08-04 12:49:58" → Date
  if (!raw) return null;
  const d = new Date(raw.replace(' ', 'T') + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

function toListingDoc(listing, coords, ownerId) {
  const orig = parseMbanyuDate(listing.createdAtRaw);
  const now = Timestamp.now();
  const county = listing.county || 'Nairobi';
  const area = listing.address || listing.city || 'Nairobi';

  return {
    title: listing.title || `${listing.propertyType} in ${area}`,
    description: listing.description
      || `Listed on Mbanyu Real Estate. ${listing.bedrooms > 0 ? listing.bedrooms + 'BR ' : ''}${listing.propertyType} in ${area}, ${county}.`,
    price: listing.price || 0,
    currency: 'KES',
    propertyType: listing.propertyType || 'apartment',
    listingType: listing.listingType || 'rent',
    status: 'active',
    location: {
      county,
      area,
      address: listing.address || area,
      searchKeywords: buildKeywords(listing.title, area, county, listing.propertyType, listing.listingType),
      geoPoint: coords,
    },
    bedrooms: listing.bedrooms ?? 0,
    bathrooms: listing.bathrooms ?? 0,
    parking: listing.parking == null ? 0 : listing.parking,
    sizeSqm: listing.area ?? 0,
    amenities: [...new Set([
      ...(listing.amenities || []),
      ...(listing.utilities || []),
      'secure_compound',
      'reliable_water',
    ])],
    images: listing.images && listing.images.length ? listing.images : [],
    ownerId,
    featured: listing.isVerified === true,
    views: 0,
    createdAt: orig ? Timestamp.fromDate(orig) : now,
    updatedAt: now,
    sourceUrl: listing.url,
    source: 'mbanyu',
    mbanyuId: listing.propertyId,
    agent: listing.agent || null,
  };
}

async function loadExistingSourceUrls() {
  console.log('🔎 Loading existing mbanyu sourceUrls for dedupe...');
  // Fetch all listings that look like mbanyu imports: tagged with
  // source='mbanyu', OR carrying a mbanyuId, OR a sourceUrl pointing at
  // mbanyu.com (covers older imports written before the source tag existed).
  const snap = await getDocs(collection(db, 'listings'));
  const set = new Set();
  const count = { tagged: 0, untagged: 0 };
  snap.forEach((d) => {
    const source = d.get('source');
    const mbanyuId = d.get('mbanyuId');
    const sourceUrl = d.get('sourceUrl') || '';
    if (source === 'mbanyu' || mbanyuId || sourceUrl.includes('mbanyu.com')) {
      const key = sourceUrl || mbanyuId;
      if (key) set.add(key);
      count[source === 'mbanyu' ? 'tagged' : 'untagged']++;
    }
  });
  console.log(`   ${set.size} existing mbanyu listings on Maploti (${count.tagged} tagged, ${count.untagged} legacy)`);
  return set;
}

async function main() {
  const dryRun = process.env.DRY_RUN !== '0';
  const pagesArg = process.env.PAGES || '1';
  const pages = pagesArg === 'all' ? null : parseInt(pagesArg, 10);
  const withDetails = process.env.WITH_DETAILS !== '0';

  console.log(`\n🕷️  Scraping Mbanyu  |  pages=${pagesArg}  |  withDetails=${withDetails}  |  dryRun=${dryRun}`);

  console.log('🔑 Authenticating agent account with Firebase...');
  const email = 'agent@maploti.co.ke';
  const password = 'Password123!';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (_) {
    await createUserWithEmailAndPassword(auth, email, password);
  }
  console.log('  ✅ Authenticated UID:', auth.currentUser?.uid);
  const ownerId = auth.currentUser?.uid || 'main_agent';

  // Phase 1 + 2: scrape. pages=null (PAGES=all) → no page cap per contract.
  const listings = await scrapeMbanyu({
    pages,
    contracts: ['rent', 'sale'],
    withDetails,
    detailConcurrency: 4,
  });
  console.log(`\n📦 ${listings.length} unique listings scraped`);

  if (listings.length === 0) {
    console.log('Nothing to seed.');
    process.exit(0);
  }

  const existing = dryRun ? new Set() : await loadExistingSourceUrls();

  let added = 0, skipped = 0, failed = 0;
  const logEvery = Math.max(1, Math.floor(listings.length / 40));

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];
    const dedupeKey = listing.url || listing.propertyId;
    if (existing.has(dedupeKey)) { skipped++; continue; }

    try {
      const coords = resolveCoords(listing.address || listing.city);
      const doc = toListingDoc(listing, coords, ownerId);
      if (dryRun) {
        added++;
      } else {
        await addDoc(collection(db, 'listings'), doc);
        added++;
        existing.add(dedupeKey);
      }
      if (added % logEvery === 0 || i === listings.length - 1) {
        process.stdout.write(`\r  ✅ ${added} added | ⏭️  ${skipped} skipped | ❌ ${failed} failed`);
      }
    } catch (e) {
      failed++;
      console.error(`\n   ❌ ${listing.url}: ${e.message}`);
    }
  }

  console.log(`\n\n🎉 Done!`);
  console.log(`   ✅ Added:   ${added}${dryRun ? ' (DRY RUN — not written)' : ''}`);
  console.log(`   ⏭️  Skipped: ${skipped} (already in Firestore)`);
  console.log(`   ❌ Failed:  ${failed}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
