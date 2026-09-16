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
  const snapshot = await getDocs(collection(db, 'listings'));
  console.log(`Total listings in collection: ${snapshot.docs.length}`);
  snapshot.docs.forEach(doc => {
    console.log(JSON.stringify({ id: doc.id, ...doc.data() }, null, 2));
  });
  process.exit(0);
}

testRead();
