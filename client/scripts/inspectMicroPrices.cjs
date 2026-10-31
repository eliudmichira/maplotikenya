const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function inspect() {
  const snap = await getDocs(collection(db, 'listings'));
  snap.forEach(d => {
    const data = d.data();
    const price = Number(data.price) || 0;
    if (price > 0 && price <= 500) {
      console.log(`ID: ${d.id} | Price: ${price} | Title: "${data.title}" | Desc: "${(data.description || '').slice(0, 80)}" | Type: ${data.listingType || data.type}`);
    }
  });
  process.exit(0);
}

inspect();
