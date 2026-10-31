const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/tiktok-covers');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const data = require('./fresh_tiktoks_480.json');
const items = data.filter(d => d.id && d.imgSrc && d.imgSrc.startsWith('http'));

console.log(`Starting download of ${items.length} real TikTok cover images to ${targetDir}...`);

async function downloadWithRetry(item, retries = 3) {
  const filePath = path.join(targetDir, `${item.id}.jpg`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    return true; // Already downloaded
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(item.imgSrc, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 500) throw new Error('File too small');
      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (err) {
      if (i === retries - 1) {
        console.error(`Failed ${item.id}:`, err.message);
        return false;
      }
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

// Concurrency pool
async function runPool(concurrency = 12) {
  let index = 0;
  let completed = 0;
  let successful = 0;

  async function worker() {
    while (index < items.length) {
      const current = items[index++];
      const ok = await downloadWithRetry(current);
      if (ok) successful++;
      completed++;
      if (completed % 50 === 0 || completed === items.length) {
        console.log(`Progress: ${completed}/${items.length} downloaded (${successful} successful)`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.log(`Download complete! Successfully saved ${successful}/${items.length} real TikTok covers.`);
}

runPool();
