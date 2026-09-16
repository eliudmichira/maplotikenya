/**
 * Audits listings for dead / CORS-blocked Mbanyu CDN image URLs
 * (https://assets.mbanyu.com/...) and replaces them with CORS-friendly
 * Unsplash images.
 *
 * Why: scraped listings hotlink Mbanyu's CDN thumbnails, which (a) now
 * return 404 and (b) don't send Access-Control-Allow-Origin, so Flutter
 * Web can never load them. This script repoints those listings to images
 * that actually load on web, mobile, and desktop.
 *
 * Usage:
 *   node scripts/fix_dead_listing_images.js          # dry-run: report only
 *   node scripts/fix_dead_listing_images.js --apply  # write to Firestore
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

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

// Pool of known-good, CORS-friendly images (same ones used in
// update_listing_images.js). Cycled through so listings don't all
// show the same photo.
const REPLACEMENT_POOL = [
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
];

// Domains that are known to be dead or CORS-blocked for Flutter Web.
const DEAD_PATTERNS = [
  /assets\.mbanyu\.com/,
];

function isDead(url) {
  try {
    const parsed = new URL(url);
    return DEAD_PATTERNS.some((re) => re.test(parsed.hostname + parsed.pathname));
  } catch (_) {
    return true; // unparseable URL counts as broken
  }
}

function replacementFor(listing, index) {
  const poolIndex = index % REPLACEMENT_POOL.length;
  // Prefer keeping a unique-ish photo per listing: offset by a hash of the id.
  const offset = Array.from(listing.id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const url = REPLACEMENT_POOL[(poolIndex + offset) % REPLACEMENT_POOL.length];
  // Keep the first image position; drop the rest of the dead ones.
  return [url];
}

async function main() {
  const apply = process.argv.includes('--apply');

  const snapshot = await getDocs(collection(db, 'listings'));
  console.log(`Total listings in collection: ${snapshot.docs.length}`);
  console.log(`Mode: ${apply ? 'APPLY (writing to Firestore)' : 'DRY-RUN (reporting only)'}\n`);

  let affected = 0;
  let totalDeadImages = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const images = Array.isArray(data.images) ? data.images : [];
    const dead = images.filter(isDead);

    if (dead.length === 0) continue;

    affected++;
    totalDeadImages += dead.length;
    console.log(`❌ ${doc.id} — "${data.title ?? '(untitled)'}"`);
    console.log(`   Dead: ${dead.length}/${images.length} image(s)`);
    dead.forEach((u) => console.log(`     - ${u}`));

    if (apply) {
      const fixed = replacementFor({ id: doc.id, title: data.title ?? '' }, affected);
      await updateDoc(doc.ref, { images: fixed });
      console.log(`   ✅ Replaced with: ${fixed[0]}`);
    }
  }

  console.log(
    `\n${apply ? '🎉 Fix complete.' : 'ℹ️ Dry run complete. Nothing was written.'} ` +
    `${affected} listing(s) affected, ${totalDeadImages} dead image URL(s) found.`
  );
  console.log(apply
    ? 'Run without --apply for a report-only pass next time.'
    : 'Re-run with --apply to write the replacements to Firestore.'
  );

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
