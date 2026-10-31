const urls = [
  'https://www.instagram.com/p/Dey7HWVjnZX/',
  'https://www.instagram.com/reel/Db7bz5jIBP6/',
  'https://www.instagram.com/p/DcBB3MKtxxh/',
  'https://www.instagram.com/maploti.africa/p/DbTFS-FnIkB/'
];

async function check() {
  for (const u of urls) {
    const r = await fetch(u, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
    const text = await r.text();
    const titleMatch = text.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["'](.*?)["']/is);
    const descMatch = text.match(/<meta\s+(?:property|name)=["'](?:og:description|description)["']\s+content=["'](.*?)["']/is);
    console.log('=== ' + u + ' ===');
    console.log('Title:', titleMatch ? titleMatch[1].slice(0, 150) : '');
    console.log('Desc:', descMatch ? descMatch[1].slice(0, 300) : '');
  }
}
check();
