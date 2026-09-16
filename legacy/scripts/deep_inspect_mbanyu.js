import puppeteer from 'puppeteer';
import https from 'https';

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', (err) => resolve({ status: 0, error: err.message }));
  });
}

async function runDeepInspection() {
  console.log('====================================================');
  console.log('1. CHECKING ROBOTS.TXT & SITEMAP');
  console.log('====================================================');
  const robots = await fetchUrl('https://mbanyu.com/robots.txt');
  console.log(`HTTP robots.txt Status: ${robots.status}`);
  console.log('Robots.txt Content:\n' + (robots.body || robots.error));

  const sitemap = await fetchUrl('https://mbanyu.com/sitemap.xml');
  console.log(`\nHTTP sitemap.xml Status: ${sitemap.status}`);
  if (sitemap.body && sitemap.body.length < 2000) {
    console.log('Sitemap.xml:\n' + sitemap.body);
  } else {
    console.log(`Sitemap length: ${sitemap.body?.length || 0} bytes`);
  }

  console.log('\n====================================================');
  console.log('2. LAUNCHING CHROME WITH CDP (WEBSOCKET & NETWORK LOGGING)');
  console.log('====================================================');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1080 });

  const client = await page.target().createCDPSession();
  await client.send('Network.enable');

  const wsConnections = [];
  const wsFrames = [];
  const allHttpRequests = [];

  client.on('Network.webSocketCreated', (params) => {
    wsConnections.push(params.url);
    console.log(`📡 [WebSocket Opened]: ${params.url}`);
  });

  client.on('Network.webSocketFrameReceived', (params) => {
    wsFrames.push({ type: 'received', payload: params.response.payloadData });
    console.log(`📥 [WebSocket Frame Received]:`, params.response.payloadData.slice(0, 200));
  });

  client.on('Network.webSocketFrameSent', (params) => {
    wsFrames.push({ type: 'sent', payload: params.response.payloadData });
    console.log(`📤 [WebSocket Frame Sent]:`, params.response.payloadData.slice(0, 200));
  });

  page.on('request', (req) => {
    const url = req.url();
    if (!url.includes('google-analytics') && !url.includes('googletagmanager')) {
      allHttpRequests.push({ url, method: req.method(), resourceType: req.resourceType() });
    }
  });

  console.log('\nNavigating to https://mbanyu.com...');
  await page.goto('https://mbanyu.com', { waitUntil: 'networkidle2', timeout: 35000 });

  // Let it settle
  await new Promise(r => setTimeout(r, 4000));

  // Scroll down multiple times to trigger infinite scroll / dynamic lazy loading
  for (let i = 0; i < 6; i++) {
    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\n====================================================');
  console.log('3. LIVE DOM INSPECTION & CARD COUNTING');
  console.log('====================================================');

  const pageAnalysis = await page.evaluate(() => {
    const allText = document.body.innerText;
    
    // Look for all interactive buttons and tabs
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const links = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })).filter(l => l.text || l.href);
    
    // Find all images
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      classes: img.className
    }));

    // Find all elements containing currency (KES / Ksh / /mo / Millions)
    const allElements = Array.from(document.querySelectorAll('*'));
    const priceNodes = [];
    for (const el of allElements) {
      if (el.children.length === 0) { // leaf node
        const t = el.innerText || '';
        if (/(?:kes|ksh|kES|\/mo|\/month|million|m|k)/i.test(t) && /\d/.test(t)) {
          priceNodes.push({
            text: t.trim(),
            parentClass: el.parentElement?.className,
            tag: el.tagName
          });
        }
      }
    }

    return {
      title: document.title,
      buttons,
      links,
      imageCount: images.length,
      imagesSample: images.slice(0, 10),
      priceNodes,
      bodyTextLength: allText.length,
      first1000Text: allText.slice(0, 1500)
    };
  });

  console.log(`Page Title: "${pageAnalysis.title}"`);
  console.log(`Total Image Elements on Page: ${pageAnalysis.imageCount}`);
  console.log(`Leaf nodes with Price / Currency patterns (${pageAnalysis.priceNodes.length}):`, pageAnalysis.priceNodes);
  console.log(`\nButtons found (${pageAnalysis.buttons.length}):`, pageAnalysis.buttons);
  console.log(`\nLinks found (${pageAnalysis.links.length}):`, pageAnalysis.links);
  console.log(`\nFirst 1500 chars of page text:\n----------------------------------------\n${pageAnalysis.first1000Text}\n----------------------------------------`);

  console.log('\n====================================================');
  console.log('4. WEBSOCKET & NETWORK SUMMARY');
  console.log('====================================================');
  console.log(`Total WebSocket connections: ${wsConnections.length}`);
  if (wsConnections.length > 0) {
    console.log('WS URLs:', wsConnections);
  }
  console.log(`Total WebSocket frames: ${wsFrames.length}`);
  console.log(`Total Non-Analytics HTTP requests: ${allHttpRequests.length}`);

  await browser.close();
}

runDeepInspection().catch(console.error);
