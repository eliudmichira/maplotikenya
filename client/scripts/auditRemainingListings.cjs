const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  authDomain: "maploti.firebaseapp.com",
  projectId: "maploti",
  storageBucket: "maploti.firebasestorage.app",
  messagingSenderId: "689776477151",
  appId: "1:689776477151:web:29acc07e1e70666edd7a6a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Read Instagram scraped catalog
const igPosts = JSON.parse(fs.readFileSync('scripts/instagram_scraped_details.json', 'utf8') || '[]');

async function audit() {
  const snap = await getDocs(collection(db, 'listings'));
  console.log(`Total listings in Firestore: ${snap.size}`);

  const fallback85k = [];
  const fallback15m = [];
  const otherUnverified = [];

  snap.forEach(docSnap => {
    const d = docSnap.data();
    const id = docSnap.id;
    if (d.price === 85000) {
      fallback85k.push({ id, title: d.title, area: d.location?.area || d.area, beds: d.bedrooms, video: d.videoUrl, desc: (d.description || '').slice(0, 100) });
    } else if (d.price === 15000000 && !d.title?.toLowerCase().includes('15m') && !d.description?.toLowerCase().includes('15m') && !d.description?.toLowerCase().includes('15 million')) {
      fallback15m.push({ id, title: d.title, area: d.location?.area || d.area, beds: d.bedrooms, desc: (d.description || '').slice(0, 100) });
    }
  });

  console.log(`\nRemaining listings with fallback 85,000: ${fallback85k.length}`);
  fallback85k.forEach(x => {
    console.log(`- [${x.id}] ${x.title} (${x.area || 'no area'}, ${x.beds} beds) | Video: ${x.video || 'none'}`);
  });

  console.log(`\nRemaining listings with fallback 15,000,000: ${fallback15m.length}`);
  fallback15m.forEach(x => {
    console.log(`- [${x.id}] ${x.title} (${x.area || 'no area'}, ${x.beds} beds)`);
  });
}

audit();
