import puppeteer from 'puppeteer';

async function scrapeMbanyuDOM() {
  console.log('🚀 Launching Puppeteer to scrape Mbanyu properties...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('Navigating to https://mbanyu.com...');
    await page.goto('https://mbanyu.com', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 4000));

    // Scroll down to load all listings on page
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 300;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight || totalHeight > 5000) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    await new Promise(r => setTimeout(r, 2000));

    // Extract property cards
    const listings = await page.evaluate(() => {
      const items = [];
      const cards = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.innerText || '';
        const hasPrice = text.includes('KES') || text.includes('Ksh');
        const hasType = text.includes('For Sale') || text.includes('For Rent');
        return hasPrice && hasType && el.children.length > 2 && el.children.length < 15;
      });

      const processedText = new Set();

      cards.forEach(card => {
        const fullText = card.innerText.trim();
        if (processedText.has(fullText)) return;
        processedText.add(fullText);

        const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

        // Find main image
        const img = card.querySelector('img[src*="assets.mbanyu.com"], img[src*="optimized"]');
        const imageUrl = img ? img.src : null;

        // Find price
        const priceLine = lines.find(l => l.includes('KES') || l.includes('Ksh'));
        const priceNum = priceLine ? parseInt(priceLine.replace(/[^0-9]/g, ''), 10) : 0;

        // Find title / category / location line
        const headerLine = lines.find(l => l.includes('|')) || lines[0] || '';

        // Find beds / baths
        let beds = 0;
        let baths = 0;
        lines.forEach((line, idx) => {
          if (line.toLowerCase().includes('bed')) {
            const prev = lines[idx - 1];
            beds = parseInt(prev || line, 10) || 0;
          }
          if (line.toLowerCase().includes('ba')) {
            const prev = lines[idx - 1];
            baths = parseInt(prev || line, 10) || 0;
          }
        });

        // Determine listing type
        const isRent = fullText.toLowerCase().includes('rent');
        const listingType = isRent ? 'rent' : 'sale';

        // Extract location and property type from headerLine (e.g., "Mansion | For Sale | Karen")
        const parts = headerLine.split('|').map(p => p.trim());
        const rawPropType = parts[0] || 'Property';
        const area = parts[2] || parts[1] || 'Nairobi';

        let propertyType = 'apartment';
        const typeLower = rawPropType.toLowerCase();
        if (typeLower.includes('mansion') || typeLower.includes('villa')) propertyType = 'villa';
        else if (typeLower.includes('house') || typeLower.includes('bungalow') || typeLower.includes('townhouse')) propertyType = 'house';
        else if (typeLower.includes('plot') || typeLower.includes('land')) propertyType = 'plot';

        if (priceNum > 0 && imageUrl) {
          items.push({
            title: `${rawPropType} in ${area}`,
            price: priceNum,
            bedrooms: beds,
            bathrooms: baths,
            area,
            listingType,
            propertyType,
            images: [imageUrl],
            rawHeader: headerLine,
          });
        }
      });

      return items;
    });

    console.log(`\n✅ SUCCESSFULLY SCRAPED ${listings.length} LISTINGS FROM MBANYU!`);
    console.log(JSON.stringify(listings, null, 2));
    return listings;
  } catch (err) {
    console.error('DOM Scraping error:', err.message);
  } finally {
    await browser.close();
  }
}

scrapeMbanyuDOM();
