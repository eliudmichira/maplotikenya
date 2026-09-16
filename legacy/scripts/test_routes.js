import puppeteer from 'puppeteer';

async function testAllRoutes() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const routes = [
    'https://mbanyu.com',
    'https://mbanyu.com/properties',
    'https://mbanyu.com/buy',
    'https://mbanyu.com/rent',
    'https://mbanyu.com/list-property',
  ];

  for (const url of routes) {
    try {
      console.log(`\n🔎 Testing: ${url}`);
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
      const currentUrl = page.url();
      const title = await page.title();
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href'));
      });
      const uniqueLinks = Array.from(new Set(links)).filter(l => l && !l.startsWith('#') && !l.startsWith('tel') && !l.startsWith('mailto'));
      console.log(`   Final URL: ${currentUrl} | Page Title: "${title}"`);
      console.log(`   Internal / External Links (${uniqueLinks.length}):`, uniqueLinks.slice(0, 10));
    } catch (err) {
      console.log(`   ❌ Error loading ${url}: ${err.message}`);
    }
  }

  await browser.close();
}

testAllRoutes();
