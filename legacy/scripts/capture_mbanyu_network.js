import puppeteer from 'puppeteer';

async function capture() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('📡 Intercepting requests on https://mbanyu.com/list-property...');

  page.on('request', req => {
    const url = req.url();
    if (url.includes('property.mbanyu.com') || url.includes('api')) {
      console.log('\n--- REQUEST ---');
      console.log('URL:', url);
      console.log('Method:', req.method());
      console.log('Headers:', req.headers());
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('property.mbanyu.com') || url.includes('api')) {
      console.log('\n--- RESPONSE ---');
      console.log('URL:', url);
      console.log('Status:', res.status());
      try {
        const text = await res.text();
        console.log('Body:', text.slice(0, 1000));
      } catch (_) {}
    }
  });

  try {
    await page.goto('https://mbanyu.com/list-property', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise(r => setTimeout(r, 4000));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

capture();
