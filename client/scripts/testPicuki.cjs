const fs = require('fs');

async function checkPicuki() {
  const res = await fetch('https://www.picuki.com/profile/maploti.kenya', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  console.log('Picuki HTML length:', html.length);
  
  // Extract photo/video descriptions and shortcodes
  const regex = /<div class="photo-description">\s*([\s\S]*?)\s*<\/div>/g;
  let match;
  let count = 0;
  while ((match = regex.exec(html)) !== null) {
    count++;
    if (count <= 5) {
      console.log(`[${count}]`, match[1].replace(/<[^>]+>/g, '').trim().substring(0, 100));
    }
  }
  console.log('Total descriptions matched in this page:', count);

  // Check for pagination or "load more" token
  const loadMore = html.match(/data-next-url="([^"]+)"/) || html.match(/load-more-btn[^\>]+data-cursor="([^"]+)"/);
  console.log('Load more match:', loadMore ? loadMore[1] : 'None');
}

checkPicuki();
