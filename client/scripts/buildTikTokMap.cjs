const fs = require('fs');
const path = require('path');

const coversDir = path.join(__dirname, '../public/tiktok-covers');
const existingCovers = new Set(fs.readdirSync(coversDir).map(f => f.replace('.jpg', '')));
console.log('Available cover files:', existingCovers.size);

const scrapedAll = require('./scraped_tiktoks_all.json');
const fresh480 = require('./fresh_tiktoks_480.json');

// Build storage key map -> tiktok ID
// E.g., URL contains "tos-alisg-p-0037/oQAXyZBmQHI8oi8sqr1TCYBIaEMDaAFywiIPa"
const storageKeyToTiktokId = {};
for (const item of scrapedAll) {
  if (item.coverSrc && item.id && existingCovers.has(item.id)) {
    const match = item.coverSrc.match(/tos-[^/]+\/[^~?]+/);
    if (match) {
      storageKeyToTiktokId[match[0]] = item.id;
    }
  }
}
for (const item of fresh480) {
  if (item.imgSrc && item.id && existingCovers.has(item.id)) {
    const match = item.imgSrc.match(/tos-[^/]+\/[^~?]+/);
    if (match) {
      storageKeyToTiktokId[match[0]] = item.id;
    }
  }
}

console.log('Storage keys mapped to TikTok IDs:', Object.keys(storageKeyToTiktokId).length);

// Also map by video ID
const videoIdSet = Array.from(existingCovers);

fs.writeFileSync(
  path.join(__dirname, '../src/utils/tiktokMap.json'),
  JSON.stringify({
    availableIds: videoIdSet,
    storageKeyToId: storageKeyToTiktokId
  }, null, 2),
  'utf8'
);

console.log('Saved mapping to src/utils/tiktokMap.json');
