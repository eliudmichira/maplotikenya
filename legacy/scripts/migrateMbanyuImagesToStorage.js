/**
 * Migrate Mbanyu listing images from assets.mbanyu.com into Firebase
 * Storage so they load in Flutter Web.
 *
 * Why: assets.mbanyu.com serves images with HTTP 200 but WITHOUT an
 * Access-Control-Allow-Origin header. Flutter Web loads images via
 * XHR/fetch, and the browser blocks any cross-origin response missing
 * that header → every listing shows a placeholder. Firebase Storage
 * download URLs DO send CORS headers, so re-hosting fixes web (Android/
 * iOS were already fine).
 *
 * Plan per listing:
 *   1. Read Firestore doc (listings where source == 'mbanyu').
 *   2. For each image URL on assets.mbanyu.com, download the bytes and
 *      upload to storage: property_images/{listingId}/{basename}.
 *   3. Repoint doc.images to the Firebase Storage download URLs.
 *
 * Safe by default — dry-run unless RUN=1. Skips docs whose images are
 * already Firebase Storage URLs (idempotent / resumable).
 *
 * Usage:
 *   node scripts/migrateMbanyuImagesToStorage.js           # dry-run report
 *   RUN=1 node scripts/migrateMbanyuImagesToStorage.js     # migrate
 *   LIMIT=5 RUN=1 node scripts/migrateMbanyuImagesToStorage.js
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

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
const storage = getStorage(app);
const auth = getAuth(app);

const MBANYU_HOST = 'assets.mbanyu.com';
const STORAGE_HOST = 'firebasestorage.googleapis.com';

const RUN = process.env.RUN === '1';
const LIMIT = parseInt(process.env.LIMIT || '0', 10);

function isMbanyuUrl(u) {
  try {
    return new URL(u).hostname === MBANYU_HOST;
  } catch (_) {
    return false;
  }
}

function basename(url) {
  try {
    const path = new URL(url).pathname;
    const name = path.split('/').filter(Boolean).pop() || 'image.webp';
    // sanitize: keep alnum, dash, underscore, dot
    return name.replace(/[^a-zA-Z0-9._-]/g, '_');
  } catch (_) {
    return 'image.webp';
  }
}

async function downloadBytes(url) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });
  return new Uint8Array(res.data);
}

async function uploadToStorage(listingId, url) {
  const name = basename(url);
  const storageRef = ref(storage, `property_images/${listingId}/${name}`);
  const bytes = await downloadBytes(url);
  await uploadBytes(storageRef, bytes, {
    contentType: 'image/webp',
  });
  return getDownloadURL(storageRef);
}

async function main() {
  console.log(`🔑 Authenticating agent account...`);
  const email = 'agent@maploti.co.ke';
  const password = 'Password123!';
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (_) {
    await createUserWithEmailAndPassword(auth, email, password);
  }
  console.log('  ✅ Authenticated UID:', auth.currentUser?.uid);

  console.log('\n🔎 Loading mbanyu listings...');
  const snap = await getDocs(query(collection(db, 'listings'), where('source', '==', 'mbanyu')));
  const listings = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
  console.log(`   ${listings.length} mbanyu listings`);

  const toMigrate = listings.filter((l) =>
    (l.data.images || []).some(isMbanyuUrl)
  );
  console.log(`   ${toMigrate.length} need image migration (others already on Storage)`);

  const slice = LIMIT > 0 ? toMigrate.slice(0, LIMIT) : toMigrate;
  if (!RUN) {
    console.log(`\nℹ️  DRY RUN — nothing uploaded or written. Re-run with RUN=1 to migrate.`);
    const totalImages = slice.reduce((acc, l) => acc + (l.data.images || []).filter(isMbanyuUrl).length, 0);
    console.log(`   Would migrate ${slice.length} listings / ${totalImages} images.`);
    process.exit(0);
  }

  console.log(`\n🚀 Migrating ${slice.length} listings...`);
  let ok = 0, failed = 0;
  for (let i = 0; i < slice.length; i++) {
    const { id, data } = slice[i];
    const oldImages = data.images || [];
    try {
      const newImages = [];
      for (const u of oldImages) {
        if (!isMbanyuUrl(u)) {
          newImages.push(u); // already CORS-safe, keep
          continue;
        }
        const storageUrl = await uploadToStorage(id, u);
        newImages.push(storageUrl);
      }
      await updateDoc(doc(db, 'listings', id), { images: newImages });
      ok++;
    } catch (e) {
      failed++;
      console.error(`\n   ❌ ${id} (${data.title || ''}): ${e.message?.slice(0, 120)}`);
    }
    if ((i + 1) % 10 === 0 || i === slice.length - 1) {
      process.stdout.write(`\r   ${i + 1}/${slice.length} migrated | ✅ ${ok} | ❌ ${failed}`);
    }
  }
  console.log(`\n\n🎉 Done! ${ok} listings migrated, ${failed} failed.`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
