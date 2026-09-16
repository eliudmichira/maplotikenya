import puppeteer from 'puppeteer';

async function discoverApi() {
  console.log('🔍 Launching browser to intercept Mbanyu network requests (XHR/Fetch/APIs)...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  const interceptedApis = [];

  // Listen to all network responses
  page.on('response', async (res) => {
    const url = res.url();
    const contentType = res.headers()['content-type'] || '';
    const status = res.status();

    if (
      (contentType.includes('application/json') ||
       url.includes('/api/') ||
       url.includes('graphql') ||
       url.includes('properties') ||
       url.includes('listings') ||
       url.includes('supabase') ||
       url.includes('firebase')) &&
      !url.includes('google-analytics') &&
      !url.includes('googletagmanager') &&
      !url.includes('sentry')
    ) {
      try {
        const text = await res.text();
        let parsed = null;
        try {
          parsed = JSON.parse(text);
        } catch (e) {}

        interceptedApis.push({
          url,
          status,
          method: res.request().method(),
          headers: res.request().headers(),
          dataSample: parsed ? JSON.stringify(parsed).slice(0, 500) : text.slice(0, 300),
          isJson: !!parsed,
        });

        console.log(`\n🎯 INTERCEPTED ENDPOINT [${res.request().method()}] ${url} (${status})`);
        if (parsed) {
          console.log(`   Sample Data Keys: ${Object.keys(parsed).join(', ')}`);
        }
      } catch (err) {
        // stream might be closed
      }
    }
  });

  console.log('🌐 Navigating to https://mbanyu.com...');
  await page.goto('https://mbanyu.com', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

  console.log('🌐 Navigating to https://mbanyu.com/list-property...');
  await page.goto('https://mbanyu.com/list-property', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

  // Scroll to trigger any lazy queries
  await page.evaluate(() => window.scrollBy(0, 1500));
  await new Promise((r) => setTimeout(r, 4000));

  console.log('\n================== INTERCEPTION SUMMARY ==================');
  console.log(`Found ${interceptedApis.length} relevant API / JSON requests:`);
  for (const api of interceptedApis) {
    console.log(`\nURL: ${api.url}`);
    console.log(`Method: ${api.method}`);
    console.log(`Data preview: ${api.dataSample}`);
  }

  await browser.close();
}

discoverApi().catch(console.error);
