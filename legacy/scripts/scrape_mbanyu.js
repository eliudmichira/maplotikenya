import puppeteer from 'puppeteer';
import { load } from 'cheerio';
import fs from 'fs';
import path from 'path';

/**
 * Web Scraper for Mbanyu Real Estate (https://mbanyu.com)
 * Supports dynamic Angular client rendering via Puppeteer + Cheerio parsing.
 */
export async function scrapeMbanyu({
  maxPages = 3,
  headless = 'new',
  outputFile = 'mbanyu_listings.json',
} = {}) {
  console.log('🚀 Starting Mbanyu scraper...');
  
  const browser = await puppeteer.launch({
    headless: headless,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const listings = [];
  const seenUrls = new Set();

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Intercept network requests to block fonts/media for faster rendering
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'media', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const targetCategories = [
      { name: 'Rent', url: 'https://mbanyu.com/property-list?type=rent' },
      { name: 'Sale', url: 'https://mbanyu.com/property-list?type=sale' },
    ];

    for (const cat of targetCategories) {
      for (let p = 1; p <= maxPages; p++) {
        const pageUrl = p === 1 ? cat.url : `${cat.url}&page=${p}`;
        console.log(`\n🔍 Scraping [${cat.name}] Page ${p}: ${pageUrl}`);

        try {
          await page.goto(pageUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });

          // Wait for property card elements or Angular view to settle
          await page.waitForSelector('app-property-card, .property-card, .card', {
            timeout: 10000,
          }).catch(() => {
            console.log('  ⚠️ Selector timeout, proceeding with current DOM state...');
          });

          // Extract HTML content
          const html = await page.content();
          const $ = load(html);

          // Select property cards
          const cards = $('app-property-card, .property-card, .card-item');

          console.log(`  Found ${cards.length} card elements.`);

          cards.each((_, el) => {
            const card = $(el);

            const title =
              card.find('.title, .property-title, h2, h3, h4').first().text().trim() ||
              card.find('a').first().text().trim();

            const priceRaw = card.find('.price, .property-price').first().text().trim();
            const priceClean = priceRaw.replace(/[^0-9]/g, '');
            const price = priceClean ? parseInt(priceClean, 10) : null;

            const location = card.find('.location, .address, .property-address').first().text().trim();

            const href = card.find('a[href]').first().attr('href');
            const link = href
              ? href.startsWith('http')
                ? href
                : `https://mbanyu.com${href}`
              : null;

            const bedroomsRaw = card.find('.beds, .bedrooms, [data-icon="bed"]').first().text().trim();
            const bedrooms = parseInt(bedroomsRaw.replace(/[^0-9]/g, ''), 10) || 0;

            const bathroomsRaw = card.find('.baths, .bathrooms, [data-icon="bath"]').first().text().trim();
            const bathrooms = parseInt(bathroomsRaw.replace(/[^0-9]/g, ''), 10) || 0;

            if (title && link && !seenUrls.has(link)) {
              seenUrls.add(link);
              listings.push({
                id: `mbanyu_${listings.length + 1}`,
                title,
                price,
                location: {
                  displayName: location || 'Nairobi, Kenya',
                  county: 'Nairobi',
                },
                listingType: cat.name.toLowerCase(),
                bedrooms,
                bathrooms,
                link,
                source: 'mbanyu.com',
                scrapedAt: new Date().toISOString(),
              });
            }
          });
        } catch (err) {
          console.error(`  ❌ Error scraping ${pageUrl}:`, err.message);
        }
      }
    }

    console.log(`\n✅ Scraped ${listings.length} total listings from Mbanyu.`);

    // Save to JSON output file
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(listings, null, 2), 'utf-8');
    console.log(`💾 Saved listings to: ${outputPath}`);

    return listings;
  } finally {
    await browser.close().catch(() => {});
  }
}

// Execute standalone if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeMbanyu({ maxPages: 2, outputFile: 'mbanyu_listings.json' });
}
