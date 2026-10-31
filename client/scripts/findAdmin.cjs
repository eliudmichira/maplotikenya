const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  projectId: "maploti"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function find() {
  const snap = await getDocs(collection(db, 'users'));
  console.log(`Found ${snap.size} users.`);
  snap.forEach(d => {
    const data = d.data();
    if (data.role === 'admin' || data.email?.includes('admin')) {
      console.log(`Admin user: ${d.id} | Email: ${data.email} | Role: ${data.role}`);
    }
  });
  process.exit(0);
}

find();
