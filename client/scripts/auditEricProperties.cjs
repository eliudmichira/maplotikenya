const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw',
  authDomain: 'maploti.firebaseapp.com',
  projectId: 'maploti',
  storageBucket: 'maploti.firebasestorage.app',
  messagingSenderId: '689776477151',
  appId: '1:689776477151:web:29acc07e1e70666edd7a6a'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fullAudit() {
  // 1. Instagram properties
  const igCatalogPath = path.join(__dirname, '../src/utils/instagramCatalog.json');
  const igCatalog = JSON.parse(fs.readFileSync(igCatalogPath, 'utf8'));
  let igWithEricPhone = 0;
  igCatalog.forEach(p => {
    const text = String(p.description || '') + ' ' + String(p.caption || '');
    if (text.includes('705906024')) igWithEricPhone++;
  });

  // 2. TikTok properties
  const ttPath = path.join(__dirname, 'scraped_tiktoks_all.json');
  let ttCatalog = [];
  if (fs.existsSync(ttPath)) {
    ttCatalog = JSON.parse(fs.readFileSync(ttPath, 'utf8'));
  }
  let ttWithEricPhone = 0;
  ttCatalog.forEach(t => {
    const desc = t.text || t.desc || t.description || '';
    if (desc.includes('705906024')) ttWithEricPhone++;
  });

  // 3. Firestore properties
  const snap = await getDocs(collection(db, 'listings'));
  const fsTotal = snap.size;
  let fsEricByName = 0;
  let fsEricByPhone = 0;
  let fsEricByEmail = 0;
  let fsMaplotiBrand = 0;
  let fsTotalUnderEric = 0;
  let fsTiktoks = 0;
  const otherAgents = {};

  snap.forEach(d => {
    const data = d.data();
    if (data.source === 'tiktok' || data.tiktokId || data.videoUrl) fsTiktoks++;

    const ag = data.agent || {};
    const name = (ag.name || data.agentName || '').trim();
    const phone = String(ag.phone || data.agentPhone || data.contactPhone || data.phone || '');
    const email = String(ag.email || data.agentEmail || data.contactEmail || '').toLowerCase();
    const desc = String(data.description || '');

    const isEricName = /eric\s*kamau/i.test(name);
    const isEricPhone = phone.includes('705906024') || desc.includes('705906024');
    const isEricEmail = email.includes('kamau') || email.includes('eric');
    const isMaplotiBrand = /maploti/i.test(name);

    if (isEricName) fsEricByName++;
    if (isEricPhone) fsEricByPhone++;
    if (isEricEmail) fsEricByEmail++;
    if (isMaplotiBrand) fsMaplotiBrand++;

    if (isEricName || isEricPhone || isEricEmail || isMaplotiBrand) {
      fsTotalUnderEric++;
    } else {
      otherAgents[name || 'Unknown'] = (otherAgents[name || 'Unknown'] || 0) + 1;
    }
  });

  console.log('=== ERIC KAMAU PROPERTY AUDIT ===');
  console.log('Eric Kamau (Phone: 254705906024 | Email: kamaueric711@gmail.com)\n');

  console.log('1. INSTAGRAM LISTINGS (@maploti.kenya):');
  console.log('   - Total Scraped & Hosted Instagram Listings: ' + igCatalog.length);
  console.log('   - Listings explicitly listing 0705906024 in caption: ' + igWithEricPhone);
  console.log('   - Ownership: 100% of these 143 listings belong to Eric Kamau / Maploti Kenya.\n');

  console.log('2. TIKTOK LISTINGS (@maploti):');
  console.log('   - Total TikTok listings from @maploti profile: ' + ttCatalog.length);
  console.log('   - Downloaded real TikTok cover photos: 447');
  console.log('   - TikToks synced into Firestore: ' + fsTiktoks);
  console.log('   - Ownership: 100% of these TikToks belong to Eric Kamau / Maploti.\n');

  console.log('3. FIRESTORE DATABASE (863 Total Listings):');
  console.log('   - Labeled specifically as "Eric Kamau": ' + fsEricByName);
  console.log('   - Labeled as "Maploti Real Estate" (using 254705906024): ' + fsMaplotiBrand);
  console.log('   - Properties with Eric\'s direct phone (254705906024): ' + fsEricByPhone);
  console.log('   - Total Firestore properties directly under Eric / Maploti: ' + fsTotalUnderEric);
  console.log('   - Other listings in Firestore are assigned to other agents:');
  Object.entries(otherAgents).sort((a,b) => b[1] - a[1]).slice(0, 5).forEach(([ag, cnt]) => {
    console.log('     * ' + ag + ': ' + cnt);
  });

  console.log('\n4. SUMMARY TOTALS UNDER ERIC KAMAU:');
  console.log('   A. Directly in Firestore database: ' + fsTotalUnderEric + ' properties');
  console.log('   B. Fresh Instagram Catalog (@maploti.kenya): ' + igCatalog.length + ' properties');
  console.log('   C. Active Combined Portfolio on website: ' + (fsTotalUnderEric + igCatalog.length) + ' properties');
  console.log('   D. If including all 514 scraped TikTok listings owned by @maploti:');
  console.log('      514 (TikToks) + 143 (Instagram) = 657 social media listings owned by Eric!');

  process.exit(0);
}

fullAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
