const fs = require('fs');

const testUrls = [
  'https://www.instagram.com/p/DeYlcSPiGZM/',
  'https://www.instagram.com/p/DPLMFuaiJHg/',
  'https://www.instagram.com/reel/DWZbjVdl6Dx/',
  'https://www.instagram.com/reel/DV3JTujFRpv/',
  'https://www.instagram.com/p/Dcdwc86l5K0/',
  'https://www.instagram.com/p/Dbam-L0l41o/',
  'https://www.instagram.com/p/DbC5eENF-r3/',
  'https://www.instagram.com/p/DbC3OO7FzH5/',
  'https://www.instagram.com/p/DampckPCEFg/',
  'https://www.instagram.com/p/Damn8JFDUfg/',
  'https://www.instagram.com/reel/DaFIayDsUh2/',
  'https://www.instagram.com/p/DaDqC11l_fm/',
  'https://www.instagram.com/reel/DZu8XT3hRhN/',
  'https://www.instagram.com/reel/DZhKYPXOUrh/',
  'https://www.instagram.com/reel/DZenMXwiUEV/',
  'https://www.instagram.com/reel/DWOJVKGjj46/',
  'https://www.instagram.com/reel/DWD5Gt3jjX5/',
  'https://www.instagram.com/reel/DV7t27UCK_9/',
  'https://www.instagram.com/reel/DViGjVqDYAA/',
  'https://www.instagram.com/reel/DVbqvYwjI6h/',
  'https://www.instagram.com/reel/DVSy0vgDGBq/'
];

async function run() {
  const results = [];
  for (const url of testUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
        }
      });
      const html = await res.text();
      const titleMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["'](.*?)["']/is) ||
                         html.match(/<title>(.*?)<\/title>/is);
      const descMatch = html.match(/<meta\s+(?:property|name)=["'](?:og:description|description)["']\s+content=["'](.*?)["']/is);

      const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';
      const desc = descMatch ? descMatch[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"') : '';

      console.log(`\n=============================`);
      console.log(`URL: ${url}`);
      console.log(`Title: ${title.slice(0, 100)}`);
      console.log(`Caption: ${desc.slice(0, 250)}...`);

      results.push({ url, title, desc });
    } catch (e) {
      console.error(`Error fetching ${url}:`, e.message);
    }
  }

  fs.writeFileSync('scripts/instagram_scraped_details.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`\nSaved ${results.length} posts to scripts/instagram_scraped_details.json`);
}

run();
