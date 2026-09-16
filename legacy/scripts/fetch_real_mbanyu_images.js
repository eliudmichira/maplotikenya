import puppeteer from 'puppeteer';
import https from 'https';
import fs from 'fs';
import path from 'path';

async function fetchImages() {
  console.log('🌐 Launching puppeteer to inspect mbanyu.com and extract real property images...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const imagesFound = [];

  page.on('response', async (res) => {
    const url = res.url();
    const headers = res.headers();
    const contentType = headers['content-type'] || '';
    if (contentType.startsWith('image/') || url.includes('assets.mbanyu.com') || url.includes('.webp') || url.includes('.jpg') || url.includes('.png')) {
      console.log(`[Network Image] Status: ${res.status()} - URL: ${url}`);
    }
  });

  await page.goto('https://mbanyu.com', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 4000));

  const pageData = await page.evaluate(() => {
    const imgEls = Array.from(document.querySelectorAll('img'));
    return imgEls.map(img => ({
      src: img.src,
      currentSrc: img.currentSrc,
      alt: img.alt,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      parentText: (img.closest('a') || img.parentElement?.parentElement)?.innerText || ''
    }));
  });

  console.log('📸 Total image tags on page:', pageData.length);
  pageData.forEach((d, i) => {
    console.log(`[${i}] src: ${d.src} | size: ${d.width}x${d.height} | alt: ${d.alt} | text: ${d.parentText.slice(0, 50).replace(/\n/g, ' ')}`);
  });

  // Let's also check individual listing cards / links on mbanyu.com
  const listingLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href*="/property/"], a[href*="/listing/"], a[href*="/view/"]'))
      .map(a => a.href);
  });

  console.log('🔗 Listing links found:', listingLinks);

  await browser.close();
  process.exit(0);
}

fetchImages().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
