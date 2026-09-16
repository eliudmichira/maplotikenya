import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  authDomain: "maploti.firebaseapp.com",
  projectId: "maploti",
  storageBucket: "maploti.firebasestorage.app",
  messagingSenderId: "689776477151",
  appId: "1:689776477151:web:29acc07e1e70666edd7a6a",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testRead() {
  console.log('Testing unauthenticated client read on listings collection...');
  const snapshot = await getDocs(collection(db, 'listings'));
  console.log(`✅ Success! Retrieved ${snapshot.docs.length} listings from Firestore as unauthenticated guest.`);
  snapshot.docs.forEach(doc => {
    console.log(` - [${doc.id}]: ${doc.data().title} (KES ${doc.data().price})`);
  });
  process.exit(0);
}

testRead().catch(err => {
  console.error('❌ Error reading listings:', err);
  process.exit(1);
});
