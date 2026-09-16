import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw",
  authDomain: "maploti.firebaseapp.com",
  projectId: "maploti",
  storageBucket: "maploti.firebasestorage.app",
  messagingSenderId: "689776477151",
  appId: "1:689776477151:web:29acc07e1e70666edd7a6a",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const mapping = {
  mbanyu_karen_mansion: ['karen_mansion.webp', 'browse_mansion.jpg'],
  mbanyu_riverside_penthouse: ['riverside_penthouse.webp', 'browse_penthouse.jpg'],
  mbanyu_westlands_apartment: ['westlands_apartment.webp', 'browse_apartment.jpg'],
  mbanyu_runda_mansion: ['runda_mansion.webp', 'browse_villa.jpg'],
  mbanyu_lavington_apartment: ['lavington_apartment.webp', 'browse_apartment.jpg']
};

async function uploadAndSync() {
  console.log('Uploading real images to Firebase Storage & updating Firestore...');
  const uploadedUrls = {};

  for (const [listingId, files] of Object.entries(mapping)) {
    const urls = [];
    for (const filename of files) {
      const filePath = path.resolve('assets/images/properties', filename);
      if (!fs.existsSync(filePath)) {
        console.warn(`File ${filePath} not found`);
        continue;
      }
      const fileBuffer = fs.readFileSync(filePath);
      const mimeType = filename.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      const storageRef = ref(storage, `listings/${listingId}/${filename}`);
      
      try {
        const snapshot = await uploadBytes(storageRef, fileBuffer, { contentType: mimeType });
        const downloadUrl = await getDownloadURL(snapshot.ref);
        console.log(`✅ Uploaded ${filename} -> ${downloadUrl}`);
        urls.push(downloadUrl);
      } catch (uploadErr) {
        console.error(`❌ Upload error for ${filename}:`, uploadErr.message);
      }
    }

    if (urls.length > 0) {
      const docRef = doc(db, 'listings', listingId);
      await updateDoc(docRef, { images: urls });
      console.log(`🎉 Updated Firestore listing ${listingId} with ${urls.length} real URLs.`);
    }
  }

  console.log('All real images uploaded and Firestore synced successfully!');
  process.exit(0);
}

uploadAndSync().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
