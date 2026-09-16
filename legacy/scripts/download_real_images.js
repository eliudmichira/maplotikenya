import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

const realImages = [
  {
    id: 'karen_mansion',
    url: 'https://assets.mbanyu.com/optimized-thumbnails/20250921111005439264202.webp',
    filename: 'karen_mansion.webp'
  },
  {
    id: 'riverside_penthouse',
    url: 'https://assets.mbanyu.com/optimized-thumbnails/20260730123205782277486.webp',
    filename: 'riverside_penthouse.webp'
  },
  {
    id: 'westlands_apartment',
    url: 'https://assets.mbanyu.com/optimized-thumbnails/20260723163903592921683.webp',
    filename: 'westlands_apartment.webp'
  },
  {
    id: 'runda_mansion',
    url: 'https://assets.mbanyu.com/optimized-thumbnails/20260417103633095215361.webp',
    filename: 'runda_mansion.webp'
  },
  {
    id: 'lavington_apartment',
    url: 'https://assets.mbanyu.com/optimized-thumbnails/20260804155030646808343.webp',
    filename: 'lavington_apartment.webp'
  },
  {
    id: 'riverside_rent',
    url: 'https://assets.mbanyu.com/optimized-thumbnails/20260730113412692450431.webp',
    filename: 'riverside_rent.webp'
  },
  {
    id: 'browse_apartment',
    url: 'https://mbanyu.com/assets/images/browse-by-type-images/Apartment.jpg',
    filename: 'browse_apartment.jpg'
  },
  {
    id: 'browse_mansion',
    url: 'https://mbanyu.com/assets/images/browse-by-type-images/Masion.jpg',
    filename: 'browse_mansion.jpg'
  },
  {
    id: 'browse_penthouse',
    url: 'https://mbanyu.com/assets/images/browse-by-type-images/Penthouse.jpg',
    filename: 'browse_penthouse.jpg'
  },
  {
    id: 'browse_villa',
    url: 'https://mbanyu.com/assets/images/browse-by-type-images/Villa.jpg',
    filename: 'browse_villa.jpg'
  }
];

const outDir = path.resolve('assets/images/properties');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://mbanyu.com/'
      }
    }, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          const stats = fs.statSync(dest);
          console.log(`✅ Downloaded ${path.basename(dest)} (${stats.size} bytes) from ${url}`);
          resolve(stats.size);
        });
      } else {
        reject(new Error(`Failed to download ${url}: HTTP ${res.statusCode}`));
      }
    });
    req.on('error', reject);
  });
}

async function run() {
  console.log(`Downloading ${realImages.length} real property images from Mbanyu into ${outDir}...`);
  for (const item of realImages) {
    const dest = path.join(outDir, item.filename);
    try {
      await downloadImage(item.url, dest);
    } catch (e) {
      console.error(`❌ Error downloading ${item.id}:`, e.message);
    }
  }
  console.log('Done downloading images!');
  process.exit(0);
}

run();
