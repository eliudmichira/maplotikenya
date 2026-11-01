/**
 * One-time import of the new Instagram listings into Firestore.
 *
 * Reads client/scripts/data/instagramNewListings.json (26 listings, each
 * checked by hand against its Instagram caption) and creates one Firestore
 * document per listing under listings/<id>, e.g. listings/ig_DPbHW3nCGW8.
 *
 * Safe to run more than once: a listing whose document already exists is
 * skipped, never overwritten, so edits made in the admin panel are kept.
 *
 * Usage (from the server folder):
 *   npm install
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/importInstagramListings.js --dry-run
 *   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json node scripts/importInstagramListings.js
 *
 * The service-account key comes from Firebase console > Project settings >
 * Service accounts > Generate new private key. Never commit it.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, '../../client/scripts/data/instagramNewListings.json');
const dryRun = process.argv.includes('--dry-run');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of a Firebase service-account key.');
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId: 'maploti' });
const db = getFirestore();

const listings = JSON.parse(readFileSync(DATA, 'utf8'));
console.log(`${listings.length} listings in ${DATA}${dryRun ? ' (dry run, nothing will be written)' : ''}\n`);

let created = 0;
let skipped = 0;
let failed = 0;

for (const { id, ...data } of listings) {
  const ref = db.collection('listings').doc(id);
  const label = `${id}  ${data.title}`;
  try {
    const existing = await ref.get();
    if (existing.exists) {
      skipped += 1;
      console.log(`skip    ${label} (already in Firestore)`);
      continue;
    }
    if (dryRun) {
      created += 1;
      console.log(`would create  ${label}`);
      continue;
    }
    await ref.create({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    created += 1;
    console.log(`created ${label}`);
  } catch (error) {
    failed += 1;
    console.error(`FAILED  ${label}: ${error.message}`);
  }
}

console.log(`\n${dryRun ? 'Would create' : 'Created'} ${created}, skipped ${skipped}, failed ${failed}.`);
const review = listings.filter((l) => l.needsReview).map((l) => `  ${l.id}  ${l.title}`);
if (review.length) {
  console.log(`\nThese need a quick check in the admin panel (missing price, rent/sale or area):\n${review.join('\n')}`);
}
process.exit(failed ? 1 : 0);
