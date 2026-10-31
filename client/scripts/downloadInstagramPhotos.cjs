const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../public/instagram-photos');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const posts = require('./scraped_instagram_posts.json');

console.log(`Downloading ${posts.length} Instagram listing photos to ${targetDir}...`);

function extractPostCode(url) {
  const match = url.match(/\/(p|reel)\/([^/]+)/);
  return match ? match[2] : null;
}

async function downloadWithRetry(post, retries = 3) {
  const code = extractPostCode(post.url);
  if (!code || !post.imgSrc) return false;

  const filePath = path.join(targetDir, `${code}.jpg`);
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
    return true; // Already downloaded
  }

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(post.imgSrc, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      if (buffer.length < 500) throw new Error('Too small');
      fs.writeFileSync(filePath, buffer);
      return true;
    } catch (err) {
      if (i === retries - 1) {
        console.error(`Failed ${code}:`, err.message);
        return false;
      }
      await new Promise(r => setTimeout(r, 600));
    }
  }
  return false;
}

async function runPool(concurrency = 8) {
  let index = 0;
  let completed = 0;
  let successful = 0;

  async function worker() {
    while (index < posts.length) {
      const post = posts[index++];
      const ok = await downloadWithRetry(post);
      if (ok) successful++;
      completed++;
      if (completed % 25 === 0 || completed === posts.length) {
        console.log(`Progress: ${completed}/${posts.length} downloaded (${successful} successful)`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  console.log(`Finished downloading Instagram photos! ${successful}/${posts.length} successful.`);
}

runPool();
