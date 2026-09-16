import puppeteer from 'puppeteer';

async function inspect() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📡 Intercepting API & fetch requests from https://mbanyu.com...');
  const apiUrls = [];

  page.on('response', response => {
    const url = response.url();
    if (!url.includes('google') && !url.includes('.css') && !url.includes('.js') && !url.includes('.png') && !url.includes('.jpg') && !url.includes('.svg') && !url.includes('woff')) {
      console.log('  🎯 Network Response:', response.status(), url);
      apiUrls.push(url);
    }
  });

  try {
    await page.goto('https://mbanyu.com', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 3000));

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => ({ text: a.innerText.trim(), href: a.href }))
        .filter(l => l.href.includes('mbanyu.com') || l.href.startsWith('/'));
    });

    console.log('\n--- FOUND NAVIGATION LINKS ---');
    console.log(JSON.stringify(links.slice(0, 30), null, 2));

    console.log('\n--- CAPTURED API ENDPOINTS ---');
    console.log(apiUrls);
  } catch (err) {
    console.error('Inspection error:', err.message);
  } finally {
    await browser.close();
  }
}

inspect();
