const fs = require('fs');

async function checkPicuki() {
  const res = await fetch('https://www.picuki.com/profile/maploti.kenya', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  console.log(html.substring(0, 1500));
}

checkPicuki();
