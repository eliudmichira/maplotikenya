import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

const propertyImages = {
  mbanyu_karen_mansion: [
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80'
  ],
  mbanyu_lavington_apartment: [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
  ],
  mbanyu_riverside_penthouse: [
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80'
  ],
  mbanyu_runda_mansion: [
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80'
  ],
  mbanyu_westlands_apartment: [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1502005229762-ee152da92e06?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'
  ]
};

async function updateImages() {
  console.log('Updating listing images with high-res CORS-friendly assets...');
  for (const [id, images] of Object.entries(propertyImages)) {
    const docRef = doc(db, 'listings', id);
    await updateDoc(docRef, { images });
    console.log(`✅ Updated ${id} with ${images.length} images`);
  }
  console.log('🎉 All listings updated successfully!');
  process.exit(0);
}

updateImages().catch(err => {
  console.error('Error updating images:', err);
  process.exit(1);
});
