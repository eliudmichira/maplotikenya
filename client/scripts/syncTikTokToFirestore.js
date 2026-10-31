/**
 * Maploti - TikTok Property Sync & Embed Tool
 * 
 * Extracts video embed data from TikTok URLs, parses Kenyan real estate
 * details (price, size, area, title, features), and writes/updates listings
 * in Firebase Firestore.
 * 
 * Usage:
 *   node scripts/syncTikTokToFirestore.js --url "<tiktok_url>" --attach "<property_id_or_keyword>"
 *   node scripts/syncTikTokToFirestore.js --url "<tiktok_url>" --new --caption "<optional_caption>"
 *   node scripts/syncTikTokToFirestore.js (Interactive mode)
 */

import readline from 'readline';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  addDoc,
  query,
  limit,
  serverTimestamp
} from 'firebase/firestore';

// Firebase configuration for Maploti project
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'maploti.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'maploti',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'maploti.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '689776477151',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:689776477151:web:29acc07e1e70666edd7a6a'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Authenticate as Agent before Firestore operations
let currentUserId = null;
async function ensureAuthenticated() {
  if (currentUserId) return currentUserId;
  const email = process.env.MAPLOTI_AGENT_EMAIL || 'agent@maploti.co.ke';
  const password = process.env.MAPLOTI_AGENT_PASSWORD || 'Password123!';
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    currentUserId = cred.user.uid;
    console.log(`🔐 Authenticated Agent (${email}) UID: ${currentUserId}`);
    return currentUserId;
  } catch (_) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    currentUserId = cred.user.uid;
    console.log(`🔐 Created & Authenticated Agent (${email}) UID: ${currentUserId}`);
    return currentUserId;
  }
}

// Common Kenyan towns & counties for auto-tagging
const KENYAN_TOWNS = [
  { area: 'Ruiru', county: 'Kiambu' },
  { area: 'Juja', county: 'Kiambu' },
  { area: 'Kamulu', county: 'Nairobi' },
  { area: 'Kitengela', county: 'Kajiado' },
  { area: 'Naivasha', county: 'Nakuru' },
  { area: 'Kilimani', county: 'Nairobi' },
  { area: 'Westlands', county: 'Nairobi' },
  { area: 'Lavington', county: 'Nairobi' },
  { area: 'Karen', county: 'Nairobi' },
  { area: 'Syokimau', county: 'Machakos' },
  { area: 'Athi River', county: 'Machakos' },
  { area: 'Utawala', county: 'Nairobi' },
  { area: 'Thika', county: 'Kiambu' },
  { area: 'Kikuyu', county: 'Kiambu' },
  { area: 'Ngong', county: 'Kajiado' },
  { area: 'Malindi', county: 'Kilifi' },
  { area: 'Diani', county: 'Kwale' },
  { area: 'Mombasa', county: 'Mombasa' },
];

/**
 * Fetch TikTok embed info via official TikTok oEmbed API
 */
export async function getTikTokEmbedData(tiktokUrl) {
  try {
    const idMatch = tiktokUrl.match(/video\/(\d+)/);
    let videoId = idMatch ? idMatch[1] : null;

    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`;
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (res.ok) {
      const data = await res.json();
      videoId = videoId || data.embed_product_id;
      return {
        success: true,
        videoId: videoId,
        author: data.author_name || 'Maploti Kenya',
        embedUrl: `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&muted=0&description=0`,
        rawOembed: data
      };
    }

    if (videoId) {
      return {
        success: true,
        videoId,
        author: 'Maploti Kenya',
        embedUrl: `https://www.tiktok.com/player/v1/${videoId}?autoplay=1&muted=0&description=0`
      };
    }

    return { success: false, error: 'Could not extract TikTok video ID' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Parse caption into structured Kenyan real estate data
 */
export function parsePropertyCaption(caption) {
  const result = {
    title: '',
    price: 0,
    formattedPrice: '',
    size: '50x100',
    propertyType: 'plot',
    area: 'Ruiru',
    county: 'Kiambu',
    features: [],
    phone: '25474790261858'
  };

  if (!caption) return result;

  // Price Extraction
  const priceMatch = caption.match(/(?:kes|ksh|price:?|going for|at)?\s*([0-9]+(?:\.[0-9]+)?)\s*(m|million|k|thousand)/i) ||
                     caption.match(/(?:kes|ksh)\s*([0-9,]{4,})/i);
  if (priceMatch) {
    let val = parseFloat(priceMatch[1].replace(/,/g, ''));
    let unit = (priceMatch[2] || '').toLowerCase();
    if (unit.startsWith('m')) val = val * 1000000;
    else if (unit.startsWith('k')) val = val * 1000;
    result.price = val;
    result.formattedPrice = 'KES ' + (val >= 1000000 ? (val / 1000000).toFixed(1).replace('.0', '') + 'M' : (val / 1000) + 'K');
  }

  // Size Extraction
  const sizeMatch = caption.match(/(50\s*[xX*byBY]+\s*100|40\s*[xX*byBY]+\s*80|1\/8(?:th)?\s*acre|1\/4(?:th)?\s*acre|half\s*acre|1\s*acre|[0-9]+\s*acres?)/i);
  if (sizeMatch) result.size = sizeMatch[1].replace(/\s+/g, ' ');

  // Location Extraction
  for (const town of KENYAN_TOWNS) {
    if (new RegExp('\\b' + town.area + '\\b', 'i').test(caption)) {
      result.area = town.area;
      result.county = town.county;
      break;
    }
  }

  // Features
  if (/title\s*deed|ready\s*title/i.test(caption)) result.features.push('Ready Title Deed');
  if (/water/i.test(caption)) result.features.push('Water on Site');
  if (/electricity|power/i.test(caption)) result.features.push('Electricity Connected');
  if (/gated|estate/i.test(caption)) result.features.push('Gated Community');
  if (/tarmac|bypass/i.test(caption)) result.features.push('Near Tarmac / Bypass');
  if (/red\s*soil/i.test(caption)) result.features.push('Prime Red Soil');
  if (/fenced|beacon/i.test(caption)) result.features.push('Beacons in Place');

  // Phone Extraction
  const phoneMatch = caption.match(/(?:07|01|\+2547|\+2541|2547|2541)[0-9]{8}/);
  if (phoneMatch) {
    let raw = phoneMatch[0].replace('+', '');
    if (raw.startsWith('0')) raw = '254' + raw.slice(1);
    result.phone = raw;
  }

  // Property Type
  if (/apartment|flat/i.test(caption)) result.propertyType = 'apartment';
  else if (/house|villa|mansion/i.test(caption)) result.propertyType = 'house';
  else if (/commercial/i.test(caption)) result.propertyType = 'commercial';
  else result.propertyType = 'plot';

  result.title = `${result.size} ${result.propertyType === 'plot' ? 'Plot' : result.propertyType} in ${result.area}`;

  return result;
}

/**
 * Attach TikTok video to existing property in Firestore
 */
export async function attachVideoToProperty(propertyIdOrKeyword, tiktokUrl) {
  await ensureAuthenticated();

  const embedData = await getTikTokEmbedData(tiktokUrl);
  if (!embedData.success) {
    console.error('❌ Failed:', embedData.error);
    return false;
  }

  let targetDocRef = null;
  let targetDocData = null;

  // Check if direct ID
  const directSnap = await getDoc(doc(db, 'listings', propertyIdOrKeyword));
  if (directSnap.exists()) {
    targetDocRef = directSnap.ref;
    targetDocData = directSnap.data();
  } else {
    // Search by title or area keyword
    console.log(`🔍 Searching listings matching "${propertyIdOrKeyword}"...`);
    const q = query(collection(db, 'listings'), limit(30));
    const snap = await getDocs(q);
    const matches = snap.docs.filter(d => {
      const data = d.data();
      const str = `${data.title} ${data.location?.area || ''} ${data.description || ''}`.toLowerCase();
      return str.includes(propertyIdOrKeyword.toLowerCase());
    });

    if (matches.length > 0) {
      targetDocRef = matches[0].ref;
      targetDocData = matches[0].data();
      console.log(`✅ Matched property: "${targetDocData.title}" (${targetDocRef.id})`);
    }
  }

  if (!targetDocRef) {
    console.error(`❌ No property found in Firestore matching "${propertyIdOrKeyword}".`);
    return false;
  }

  await updateDoc(targetDocRef, {
    videoUrl: tiktokUrl,
    tiktokId: embedData.videoId,
    embedUrl: embedData.embedUrl,
    hasVideo: true,
    videoPlatform: 'tiktok',
    updatedAt: serverTimestamp()
  });

  console.log(`\n🎉 Successfully embedded TikTok video into property:`);
  console.log(`   Property ID: ${targetDocRef.id}`);
  console.log(`   Title:       ${targetDocData.title}`);
  console.log(`   TikTok ID:   ${embedData.videoId}`);
  console.log(`   Embed URL:   ${embedData.embedUrl}`);
  console.log(`   View live:   http://localhost:5173/properties\n`);
  return true;
}

/**
 * Create a new property listing from TikTok video & caption
 */
export async function createPropertyFromTikTok(tiktokUrl, caption = '', imageUrl = null) {
  const userId = await ensureAuthenticated();

  const embedData = await getTikTokEmbedData(tiktokUrl);
  if (!embedData.success) {
    console.error('❌ Failed:', embedData.error);
    return null;
  }

  const parsed = parsePropertyCaption(caption);

  const fallbackImage = imageUrl || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1200&auto=format&fit=crop';

  const newListing = {
    title: parsed.title,
    description: caption || `Prime ${parsed.size} in ${parsed.area}. Watch the live site walkthrough video for terrain and road access details. Contact agent to book a guided site visit.`,
    price: parsed.price || 1500000,
    formattedPrice: parsed.formattedPrice || 'KES 1.5M',
    propertyType: parsed.propertyType,
    listingType: 'sale',
    status: 'available',
    featured: true,
    hasVideo: true,
    videoUrl: tiktokUrl,
    tiktokId: embedData.videoId,
    embedUrl: embedData.embedUrl,
    images: [fallbackImage],
    amenities: parsed.features,
    location: {
      area: parsed.area,
      county: parsed.county,
      address: `${parsed.area}, ${parsed.county}`,
      searchKeywords: [parsed.area.toLowerCase(), parsed.county.toLowerCase(), parsed.propertyType, 'sale', 'plot']
    },
    userId: userId,
    agent: {
      name: 'Karlmax Osore',
      phone: parsed.phone,
      email: 'karlmaxosore@gmail.com'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(collection(db, 'listings'), newListing);
  console.log(`\n🎉 Successfully created NEW listing in Firestore from TikTok!`);
  console.log(`   Document ID: ${docRef.id}`);
  console.log(`   Title:       ${newListing.title}`);
  console.log(`   Price:       ${newListing.formattedPrice}`);
  console.log(`   Area:        ${newListing.location.area}`);
  console.log(`   TikTok ID:   ${embedData.videoId}`);
  console.log(`   View live:   http://localhost:5173/properties\n`);
  return docRef.id;
}

// Interactive CLI runner
async function runCLI() {
  const args = process.argv.slice(2);
  const urlIdx = args.indexOf('--url');
  const attachIdx = args.indexOf('--attach');
  const newIdx = args.indexOf('--new');
  const captionIdx = args.indexOf('--caption');

  if (urlIdx !== -1 && attachIdx !== -1) {
    const url = args[urlIdx + 1];
    const target = args[attachIdx + 1];
    await attachVideoToProperty(target, url);
    process.exit(0);
  }

  if (urlIdx !== -1 && newIdx !== -1) {
    const url = args[urlIdx + 1];
    const caption = captionIdx !== -1 ? args[captionIdx + 1] : '';
    await createPropertyFromTikTok(url, caption);
    process.exit(0);
  }

  // Interactive Prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (q) => new Promise(res => rl.question(q, res));

  console.log('\n===============================================');
  console.log('  MAPLOTI - TIKTOK VIDEO & PROPERTY SYNC TOOL  ');
  console.log('===============================================\n');

  console.log('1. Embed TikTok video into an EXISTING property');
  console.log('2. Create a NEW property from TikTok video link & caption');
  console.log('3. Exit\n');

  const choice = await question('Select option (1/2/3): ');

  if (choice.trim() === '1') {
    const tiktokUrl = await question('\nEnter TikTok Video URL (or ID): ');
    const searchTarget = await question('Enter Property ID or Area/Title keyword (e.g. "Ruiru" or "Kilimani"): ');
    rl.close();
    await attachVideoToProperty(searchTarget.trim(), tiktokUrl.trim());
  } else if (choice.trim() === '2') {
    const tiktokUrl = await question('\nEnter TikTok Video URL (or ID): ');
    const caption = await question('Enter Video Caption / Notes (e.g. "50x100 Ruiru 1.8M ready title"): ');
    rl.close();
    await createPropertyFromTikTok(tiktokUrl.trim(), caption.trim());
  } else {
    console.log('Exiting.');
    rl.close();
  }
}

// Execute CLI when run directly
runCLI().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
