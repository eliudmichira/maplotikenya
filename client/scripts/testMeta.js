async function testRehydration() {
  const url = 'https://www.tiktok.com/@maploti.kenya/video/7686574196121521428';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
    }
  });
  const html = await res.text();
  const m = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/);
  if (m) {
    try {
      const data = JSON.parse(m[1]);
      const item = data['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.['itemInfo']?.['itemStruct'];
      console.log('Video Caption/Desc:', item?.desc);
      console.log('Location Tag:', item?.poi);
      console.log('Author Nickname:', item?.author?.nickname);
    } catch (e) {
      console.log('JSON parse error:', e.message);
    }
  } else {
    // Check if SIGI_STATE exists
    const m2 = html.match(/<script id="SIGI_STATE" type="application\/json">([\s\S]*?)<\/script>/);
    if (m2) {
      console.log('Found SIGI_STATE!');
    } else {
      console.log('Rehydration script not found. HTML length:', html.length);
    }
  }
}
testRehydration();
