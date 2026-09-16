import puppeteer from 'puppeteer';

async function testExtract() {
  console.log('🚀 Launching Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  try {
    console.log('Navigating to https://mbanyu.com...');
    await page.goto('https://mbanyu.com', { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise(r => setTimeout(r, 5000));

    // Scroll down to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 2000));

    // Extract all text, headings, images and links
    const data = await page.evaluate(() => {
      const items = [];
      // Look for cards, list items, containers
      const elements = Array.from(document.querySelectorAll('div, article, section')).filter(el => {
        const text = el.innerText || '';
        return text.includes('KES') || text.includes('Ksh') || text.includes('Bed') || text.includes('Bath') || text.includes('Rent') || text.includes('Sale');
      });

      return elements.slice(0, 15).map(el => ({
        tagName: el.tagName,
        className: el.className,
        text: el.innerText.trim().slice(0, 200),
        images: Array.from(el.querySelectorAll('img')).map(img => img.src),
        links: Array.from(el.querySelectorAll('a')).map(a => a.href),
      }));
    });

    console.log('\n--- EXTRACTED DOM ITEMS WITH PROPERTY CONTENT ---');
    console.log(JSON.stringify(data, null, 2).slice(0, 4000));
  } catch (err) {
    console.error('Extraction error:', err.message);
  } finally {
    await browser.close();
  }
}

testExtract();
