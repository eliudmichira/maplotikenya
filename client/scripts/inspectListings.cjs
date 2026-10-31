const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

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

async function test() {
  try {
    const snap = await getDocs(query(collection(db, 'listings'), limit(20)));
    console.log(`Successfully connected! Found ${snap.size} sample docs in listings.`);
    snap.docs.slice(0, 5).forEach((d) => {
      const data = d.data();
      console.log(`- ID: ${d.id} | Title: "${data.title}" | Price: ${data.price} | Type: ${data.listingType || data.type} | Loc: ${JSON.stringify(data.location || data.address || '')}`);
    });
  } catch (err) {
    console.error('Error connecting to Firestore:', err);
  }
}

test();
