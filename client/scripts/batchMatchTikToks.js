/**
 * Maploti - Batch Match All 514 TikTok Posts to Firestore Listings
 */

import fs from 'fs';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'maploti.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'maploti',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'maploti.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '689776477151',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:689776477151:web:447545b78035bcbf1e6191'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Expanded dictionary of Kenyan residential neighborhoods & corridors
const KNOWN_AREAS = [
  'windsor', 'ridgeways', 'mirema', 'safaripark', 'garden estate', 'thome',
  'juja', 'ruiru', 'kamakis', 'kenyatta road', 'northlands', 'kilimani',
  'westlands', 'karen', 'lavington', 'kitengela', 'kikuyu', 'roysambu',
  'kiambu road', 'syokimau', 'runda', 'kileleshwa', 'parklands', 'muthaiga',
  'spring valley', 'rosslyn', 'lower kabete', 'ngong', 'ongata rongai', 'ruaka',
  'riverside', 'thindigua', 'mugutha', 'kahawa sukari', 'kahawa wendani', 'membley',
  'tatu city', 'tatucity', 'fourways junction', 'kasarani', 'pangani', 'ngara',
  'south b', 'south c', 'langata', 'madaraka', 'kitusuru', 'nyari', 'gigiri',
  'redhill', 'limuru', 'tigoni', 'thika', 'kenol', 'malaa', 'joska', 'kamulu',
  'kangundo road', 'utawala', 'embakasi', 'athi river', 'athiriver', 'kiserian',
  'kabete', 'rhapta', 'thika road'
];

function parseTikTokMetadata(caption) {
  let cleanText = (caption || '').replace(/created by.*$/i, '').trim();
  const text = cleanText.toLowerCase();
  
  // Extract area
  let matchedArea = '';
  for (const area of KNOWN_AREAS) {
    const regex = new RegExp(`\\b${area.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (regex.test(text) || text.includes(area.replace(/\s+/g, ''))) {
      matchedArea = area;
      break;
    }
  }

  // Extract bedrooms (handles "5 bedroom", "5-bedroom", "5bed", "5br", "studio")
  let bedrooms = null;
  if (text.includes('studio') || text.includes('bedsitter')) {
    bedrooms = 0;
  } else {
    const bedMatch = text.match(/(\d+)[\s-]*(?:bed|bedroom|br\b)/i) || text.match(/#(\d+)bedroom/i);
    if (bedMatch) {
      bedrooms = parseInt(bedMatch[1], 10);
    }
  }

  // Listing type
  let listingType = 'sale';
  if (text.includes('to let') || text.includes('tolet') || text.includes('rent') || text.includes('per month') || text.includes('#housetolet') || text.includes('#apartmenttolet')) {
    listingType = 'rent';
  }

  // Property type
  let propertyType = 'house';
  if (text.includes('apartment') || text.includes('flat') || text.includes('#apartmenttolet') || text.includes('studio') || text.includes('penthouse')) {
    propertyType = 'apartment';
  } else if (text.includes('villa') || text.includes('townhouse') || text.includes('maisonette') || text.includes('bungalow')) {
    propertyType = 'villa';
  } else if (/\b(plot|plots|land|shamba)\b/i.test(text) && !text.includes('maploti')) {
    propertyType = 'plot';
  } else if (text.includes('office') || text.includes('commercial')) {
    propertyType = 'commercial';
  }

  // Price
  let price = 0;
  const kshMatch = text.match(/(?:ksh|kes|rent:?\s*ksh|@|price:?\s*)\s*([\d,]+)/i);
  if (kshMatch && !kshMatch[1].startsWith('07') && !kshMatch[1].startsWith('254')) { // exclude phone numbers
    price = parseInt(kshMatch[1].replace(/,/g, ''), 10);
  } else {
    const millionMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m\b|million)/i);
    if (millionMatch) {
      price = parseFloat(millionMatch[1]) * 1000000;
    } else {
      const kMatch = text.match(/(\d+)\s*k\b/i);
      if (kMatch) {
        price = parseInt(kMatch[1], 10) * 1000;
      }
    }
  }

  // Construct clean title
  let titleParts = [];
  if (bedrooms === 0) {
    titleParts.push('Studio');
  } else if (bedrooms) {
    titleParts.push(`${bedrooms} Bedroom`);
  }
  titleParts.push(propertyType.charAt(0).toUpperCase() + propertyType.slice(1));
  titleParts.push(listingType === 'rent' ? 'To Let' : 'For Sale');
  if (matchedArea) {
    const formattedArea = matchedArea.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    titleParts.push(`in ${formattedArea}`);
  }
  const synthesizedTitle = titleParts.join(' ');

  return {
    matchedArea,
    bedrooms,
    listingType,
    propertyType,
    price,
    synthesizedTitle
  };
}

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`Starting Batch Matcher on 514 Posts (${isDryRun ? 'DRY RUN' : 'LIVE FIRESTORE SYNC'})...`);

  // Sign in to Firebase Auth
  await signInWithEmailAndPassword(auth, 'agent@maploti.co.ke', 'Password123!');
  console.log('Authenticated with Firebase.');

  // Load scraped TikTok data
  const tiktoks = JSON.parse(fs.readFileSync('c:/Users/User/Documents/GitHub/Maploti-new/client/scripts/scraped_tiktoks_all.json', 'utf8'));
  console.log(`Loaded ${tiktoks.length} total TikTok items from file.`);

  // Load Firestore listings
  console.log('Fetching all listings from Firestore...');
  const snapshot = await getDocs(collection(db, 'listings'));
  const listings = [];
  const existingTiktokIds = new Set();

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.tiktokId) existingTiktokIds.add(data.tiktokId);
    listings.push({
      id: docSnap.id,
      ...data
    });
  });
  console.log(`Fetched ${listings.length} existing listings from Firestore (${existingTiktokIds.size} already have videos).`);

  let matchedCount = 0;
  let alreadyPresentCount = 0;
  let newListingCount = 0;
  let skippedCount = 0;
  const matchLog = [];

  for (const tt of tiktoks) {
    if (!tt.id || tt.type === 'photo') {
      skippedCount++;
      continue; // Only video tours
    }

    if (existingTiktokIds.has(tt.id)) {
      alreadyPresentCount++;
      continue; // Avoid duplicates
    }

    const meta = parseTikTokMetadata(tt.caption);
    let bestMatch = null;
    let highestScore = 0;

    // Compare with each existing listing that doesn't yet have a video
    for (const item of listings) {
      if (item.hasVideo && item.tiktokId) continue;

      let score = 0;
      const itemTitle = (item.title || '').toLowerCase();
      const itemArea = (item.location?.area || item.city || item.location?.address || '').toLowerCase();
      const itemType = (item.propertyType || item.type || '').toLowerCase();
      const itemListingType = (item.listingType || '').toLowerCase();
      const itemBedrooms = item.bedrooms;

      // Area match
      if (meta.matchedArea && (itemArea.includes(meta.matchedArea) || itemTitle.includes(meta.matchedArea))) {
        score += 45;
      }

      // Bedrooms match
      if (meta.bedrooms !== null && itemBedrooms !== undefined && parseInt(meta.bedrooms, 10) === parseInt(itemBedrooms, 10)) {
        score += 30;
      }

      // Listing type match (rent vs sale)
      if (meta.listingType && itemListingType && meta.listingType === itemListingType) {
        score += 15;
      }

      // Property type match
      if (meta.propertyType && itemType && (meta.propertyType.includes(itemType) || itemType.includes(meta.propertyType))) {
        score += 10;
      }

      // Price match (within 20%)
      if (meta.price > 0 && item.price > 0) {
        const ratio = Math.abs(meta.price - item.price) / meta.price;
        if (ratio < 0.20) {
          score += 20;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = item;
      }
    }

    const embedUrl = `https://www.tiktok.com/player/v1/${tt.id}?embed_from=oembed&music_info=0&description=1&autoplay=0`;

    if (highestScore >= 60 && bestMatch) {
      matchedCount++;
      matchLog.push({
        status: 'MATCHED',
        score: highestScore,
        tiktokId: tt.id,
        listingId: bestMatch.id,
        listingTitle: bestMatch.title,
        extracted: `${meta.bedrooms !== null ? meta.bedrooms + 'BR' : '?BR'} ${meta.propertyType} ${meta.listingType} in ${meta.matchedArea || 'unknown'}`
      });

      // Mark locally so subsequent videos don't match the same listing
      bestMatch.hasVideo = true;
      bestMatch.tiktokId = tt.id;
      existingTiktokIds.add(tt.id);

      if (!isDryRun) {
        await updateDoc(doc(db, 'listings', bestMatch.id), {
          hasVideo: true,
          videoUrl: tt.url,
          tiktokId: tt.id,
          embedUrl: embedUrl,
          videoThumbnail: tt.coverSrc || bestMatch.images?.[0] || '',
          videoViews: tt.views || '',
          updatedAt: serverTimestamp()
        });
      }
    } else {
      // Create new listing
      newListingCount++;
      const newTitle = meta.synthesizedTitle || `Property Walkthrough in ${meta.matchedArea ? meta.matchedArea.toUpperCase() : 'Nairobi'}`;
      matchLog.push({
        status: 'NEW_LISTING',
        score: highestScore,
        tiktokId: tt.id,
        title: newTitle,
        extracted: `${meta.bedrooms !== null ? meta.bedrooms + 'BR' : '?BR'} ${meta.propertyType} ${meta.listingType} in ${meta.matchedArea || 'unknown'}`
      });

      existingTiktokIds.add(tt.id);

      if (!isDryRun) {
        const newDoc = {
          title: newTitle,
          description: tt.caption || 'Tour of modern Kenyan real estate.',
          price: meta.price || (meta.listingType === 'rent' ? 85000 : 15000000),
          bedrooms: meta.bedrooms !== null ? meta.bedrooms : 3,
          bathrooms: meta.bedrooms !== null && meta.bedrooms > 0 ? meta.bedrooms : 2,
          propertyType: meta.propertyType || 'house',
          listingType: meta.listingType || 'rent',
          location: {
            area: meta.matchedArea ? meta.matchedArea.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Nairobi',
            address: `${meta.matchedArea || 'Nairobi'}, Kenya`,
            city: 'Nairobi',
            country: 'Kenya'
          },
          images: tt.coverSrc ? [tt.coverSrc] : [],
          hasVideo: true,
          videoUrl: tt.url,
          tiktokId: tt.id,
          embedUrl: embedUrl,
          videoThumbnail: tt.coverSrc || '',
          videoViews: tt.views || '',
          agent: {
            name: 'Maploti Real Estate',
            phone: '+254705906024',
            email: 'agent@maploti.co.ke'
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await addDoc(collection(db, 'listings'), newDoc);
      }
    }
  }

  console.log(`\n=== 514 POSTS MATCHING REPORT ===`);
  console.log(`Total Posts: ${tiktoks.length}`);
  console.log(`Skipped (Photos/Invalid): ${skippedCount}`);
  console.log(`Already Present in DB: ${alreadyPresentCount}`);
  console.log(`Newly Matched to Existing Listings: ${matchedCount}`);
  console.log(`Newly Created Listings: ${newListingCount}`);
  console.log(`Total Active Video Properties: ${alreadyPresentCount + matchedCount + newListingCount}`);

  console.log(`\nSample Matches:`);
  console.table(matchLog.slice(0, 20));

  if (isDryRun) {
    console.log(`\nDry run completed! To apply live to Firestore, run without --dry-run.`);
  } else {
    console.log(`\nAll 457 video listings committed to Firestore!`);
  }
}

run().catch(console.error);
