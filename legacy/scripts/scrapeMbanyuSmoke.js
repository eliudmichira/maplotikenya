/**
 * Mbanyu smoke test — scrape a limited number of pages and dump JSON.
 * No Firestore writes, no auth needed.
 *
 *   node scripts/scrapeMbanyuSmoke.js
 *   PAGES=2 node scripts/scrapeMbanyuSmoke.js          # 2 pages per contract
 *   WITH_DETAILS=0 node scripts/scrapeMbanyuSmoke.js   # list-only (fast)
 */
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrapeMbanyu } from './scrape/sites/mbanyu.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const pagesArg = process.env.PAGES || '1';
  const pages = pagesArg === 'all' ? null : parseInt(pagesArg, 10);
  const withDetails = process.env.WITH_DETAILS !== '0';

  console.log('🕷️  Mbanyu smoke test');
  console.log(`   pages=${pagesArg} withDetails=${withDetails}`);

  const listings = await scrapeMbanyu({
    pages,
    contracts: ['rent', 'sale'],
    withDetails,
    detailConcurrency: 4,
  });

  const outPath = join(__dirname, '..', 'mbanyu-scrape.json');
  writeFileSync(outPath, JSON.stringify(listings, null, 2));

  // Stats
  const withImages = listings.filter((l) => l.images && l.images.length).length;
  const withPrice = listings.filter((l) => l.price).length;
  const withAddress = listings.filter((l) => l.address).length;
  const withBeds = listings.filter((l) => l.bedrooms != null).length;
  const withDesc = listings.filter((l) => l.description).length;
  const withAgent = listings.filter((l) => l.agent?.name).length;

  console.log(`\n📊 Scraped ${listings.length} listings`);
  console.log(`   with images:  ${withImages}`);
  console.log(`   with price:   ${withPrice}`);
  console.log(`   with address: ${withAddress}`);
  console.log(`   with beds:    ${withBeds}`);
  console.log(`   with desc:    ${withDesc}`);
  console.log(`   with agent:   ${withAgent}`);
  console.log(`\n💾 Saved to ${outPath}`);

  if (listings.length > 0) {
    console.log('\n📝 First listing:');
    console.log(JSON.stringify(listings[0], null, 2).slice(0, 2500));
  }
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
