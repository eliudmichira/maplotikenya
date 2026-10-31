const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, updateDoc, collection, getDocs, writeBatch } = require('firebase/firestore');

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

const ERIC_USER_ID = 'mZDSsIrn9DgnFfDYymRgyUPlwem1';
const ERIC_AGENT = {
  id: ERIC_USER_ID,
  userId: ERIC_USER_ID,
  name: 'Eric Kamau',
  fullName: 'Eric Kamau',
  email: 'kamaueric711@gmail.com',
  phone: '+254705906024',
  phoneNumber: '+254705906024',
  company: 'Maploti Real Estate',
  agency: 'Maploti Real Estate',
  verified: true,
  status: 'verified',
  avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIi53wSeH2LJ-9clfTiFfJZHDqj2QsSU41UDf25W-XmA7-kzw=s96-c',
  image: 'https://lh3.googleusercontent.com/a/ACg8ocIi53wSeH2LJ-9clfTiFfJZHDqj2QsSU41UDf25W-XmA7-kzw=s96-c',
  photo: 'https://lh3.googleusercontent.com/a/ACg8ocIi53wSeH2LJ-9clfTiFfJZHDqj2QsSU41UDf25W-XmA7-kzw=s96-c',
  bio: 'Founder and Principal at Maploti Real Estate. Specializing in verified residential, commercial, and land properties across Nairobi, Kiambu, and the greater Nairobi Metropolitan Area.',
  specialization: 'Residential & Commercial Sales & Lettings'
};

async function execute() {
  console.log('🚀 Step 1: Updating 143 Instagram Catalog Listings in JSON...');
  const igCatalogPath = path.join(__dirname, '../src/utils/instagramCatalog.json');
  const igCatalog = JSON.parse(fs.readFileSync(igCatalogPath, 'utf8'));

  for (const item of igCatalog) {
    item.agent = { ...ERIC_AGENT };
    item.agentId = ERIC_USER_ID;
    item.agentName = 'Eric Kamau';
    item.agentEmail = 'kamaueric711@gmail.com';
    item.agentPhone = '+254705906024';
  }
  fs.writeFileSync(igCatalogPath, JSON.stringify(igCatalog, null, 2), 'utf8');
  console.log(`✅ Updated all ${igCatalog.length} Instagram listings in instagramCatalog.json!`);

  console.log('\n🚀 Step 2: Creating / Updating Eric Kamau in Firestore "agents" collection...');
  await setDoc(doc(db, 'agents', ERIC_USER_ID), ERIC_AGENT, { merge: true });
  await setDoc(doc(doc(db, 'agents', 'eric_kamau')), ERIC_AGENT, { merge: true });
  console.log('✅ Created Eric Kamau as verified agent in Firestore "agents" collection!');

  console.log('\n🚀 Step 3: Updating Eric Kamau in Firestore "users" collection...');
  await setDoc(doc(db, 'users', ERIC_USER_ID), {
    phone: '+254705906024',
    email: 'kamaueric711@gmail.com',
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log('✅ Updated Eric Kamau in "users" collection!');

  console.log('\n🚀 Step 4: Batch updating Firestore "listings" for all TikTok, Maploti & Eric properties...');
  const listingsSnap = await getDocs(collection(db, 'listings'));
  console.log(`Scanning ${listingsSnap.size} listings in Firestore...`);

  let updatedCount = 0;
  let batch = writeBatch(db);
  let batchOps = 0;

  for (const docSnap of listingsSnap.docs) {
    const data = docSnap.data();
    const ag = data.agent || {};
    const name = (ag.name || data.agentName || '').trim();
    const phone = String(ag.phone || data.agentPhone || data.contactPhone || data.phone || '');
    const isTikTok = data.source === 'tiktok' || !!data.tiktokId || (typeof data.videoUrl === 'string' && data.videoUrl.includes('tiktok'));
    const isEricName = /eric\s*kamau/i.test(name);
    const isEricPhone = phone.includes('705906024');
    const isMaplotiBrand = /maploti/i.test(name) || /maploti/i.test(ag.company || '');
    const hasNoAgent = !name || name === 'NO_AGENT' || name === 'Unknown';

    if (isTikTok || isEricName || isEricPhone || isMaplotiBrand || hasNoAgent) {
      batch.update(docSnap.ref, {
        agent: ERIC_AGENT,
        agentId: ERIC_USER_ID,
        agentName: 'Eric Kamau',
        agentEmail: 'kamaueric711@gmail.com',
        agentPhone: '+254705906024'
      });
      batchOps++;
      updatedCount++;

      if (batchOps >= 450) {
        console.log(`Writing batch of ${batchOps} updates to Firestore...`);
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
      }
    }
  }

  if (batchOps > 0) {
    console.log(`Writing final batch of ${batchOps} updates to Firestore...`);
    await batch.commit();
  }

  console.log(`\n🎉 Successfully updated ${updatedCount} listings in Firestore under Eric Kamau!`);
  console.log(`Summary:`);
  console.log(`- Instagram Listings: 143 under Eric Kamau`);
  console.log(`- Firestore Database Listings: ${updatedCount} under Eric Kamau`);
  console.log(`- Total properties now under Eric Kamau: ${143 + updatedCount}`);

  process.exit(0);
}

execute().catch(err => {
  console.error('❌ Error executing update:', err);
  process.exit(1);
});
