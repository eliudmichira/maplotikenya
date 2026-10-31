async function test() {
  const url = 'https://www.tiktok.com/@maploti.kenya/video/7686574196121521428';
  const res = await fetch(url, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
  const t = await res.text();
  const match = t.match(/<meta property="og:image" content="([^"]+)"/);
  console.log('OG image:', match ? match[1] : 'not found');
  if (match) {
    const imgRes = await fetch(match[1]);
    console.log('Fresh image status:', imgRes.status);
    console.log('Content-Type:', imgRes.headers.get('content-type'));
  }
}
test();
