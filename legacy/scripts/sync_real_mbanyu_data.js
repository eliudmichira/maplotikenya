import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const realListings = [
  {
    id: "mbanyu_karen_mansion",
    title: "Verified Mansion in Karen",
    description: "Verified luxury 5-bedroom mansion in Karen, Nairobi with 900 sqm living area, landscaped garden, private pool, and executive finishings.",
    price: 200000000,
    currency: "KES",
    propertyType: "house",
    listingType: "sale",
    status: "active",
    featured: true,
    bedrooms: 5,
    bathrooms: 5,
    parking: 4,
    sizeSqm: 900,
    views: 128,
    ownerId: "main_agent",
    location: {
      address: "Karen, Nairobi",
      area: "Karen",
      county: "Nairobi",
      geoPoint: { latitude: -1.3412, longitude: 36.7012 },
      searchKeywords: ["nairobi", "karen", "mansion", "sale", "luxury", "5 bedroom"]
    },
    amenities: ["wifi", "water_storage", "cctv", "parking", "backup_generator", "swimming_pool", "garden"],
    images: [
      "assets/images/properties/karen_mansion.webp",
      "assets/images/properties/browse_mansion.jpg",
      "https://assets.mbanyu.com/optimized-thumbnails/20250921111005439264202.webp"
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mbanyu_riverside_penthouse",
    title: "Latest Penthouse in Riverside",
    description: "Exclusive 4-bedroom luxury penthouse in Riverside with scenic views, 270 sqm floor plan, private terrace, and elevator access.",
    price: 56000000,
    currency: "KES",
    propertyType: "apartment",
    listingType: "sale",
    status: "active",
    featured: true,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    sizeSqm: 270,
    views: 94,
    ownerId: "main_agent",
    location: {
      address: "Riverside Drive, Nairobi",
      area: "Riverside",
      county: "Nairobi",
      geoPoint: { latitude: -1.2685, longitude: 36.7924 },
      searchKeywords: ["nairobi", "riverside", "penthouse", "sale", "luxury"]
    },
    amenities: ["wifi", "water_storage", "cctv", "parking", "backup_generator", "swimming_pool", "gym"],
    images: [
      "assets/images/properties/riverside_penthouse.webp",
      "assets/images/properties/browse_penthouse.jpg",
      "https://assets.mbanyu.com/optimized-thumbnails/20260730123205782277486.webp"
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mbanyu_westlands_apartment",
    title: "Apartment in Westlands",
    description: "Contemporary 1-bedroom executive apartment in the heart of Westlands, Nairobi. Perfect for urban living or high-yield investment.",
    price: 12000000,
    currency: "KES",
    propertyType: "apartment",
    listingType: "sale",
    status: "active",
    featured: true,
    bedrooms: 1,
    bathrooms: 1,
    parking: 1,
    sizeSqm: 72.6,
    views: 182,
    ownerId: "main_agent",
    location: {
      address: "Westlands, Nairobi",
      area: "Westlands",
      county: "Nairobi",
      geoPoint: { latitude: -1.2647, longitude: 36.8042 },
      searchKeywords: ["nairobi", "westlands", "apartment", "sale", "investment"]
    },
    amenities: ["wifi", "water_storage", "cctv", "parking", "backup_generator", "gym"],
    images: [
      "assets/images/properties/westlands_apartment.webp",
      "assets/images/properties/browse_apartment.jpg",
      "https://assets.mbanyu.com/optimized-thumbnails/20260723163903592921683.webp"
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mbanyu_runda_mansion",
    title: "Verified Mansion in Runda",
    description: "Palatial 4-bedroom ambassadorial residence in Runda for rent. Features expansive compound, 4,500 sqft layout, and top-tier security.",
    price: 380000,
    currency: "KES",
    propertyType: "house",
    listingType: "rent",
    status: "active",
    featured: true,
    bedrooms: 4,
    bathrooms: 4,
    parking: 6,
    sizeSqm: 418,
    views: 215,
    ownerId: "main_agent",
    location: {
      address: "Runda, Nairobi",
      area: "Runda",
      county: "Nairobi",
      geoPoint: { latitude: -1.2185, longitude: 36.8194 },
      searchKeywords: ["nairobi", "runda", "mansion", "rent", "diplomatic"]
    },
    amenities: ["wifi", "water_storage", "cctv", "parking", "backup_generator", "garden", "swimming_pool"],
    images: [
      "assets/images/properties/runda_mansion.webp",
      "assets/images/properties/browse_villa.jpg",
      "https://assets.mbanyu.com/optimized-thumbnails/20260417103633095215361.webp"
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mbanyu_lavington_apartment",
    title: "Apartment in Lavington",
    description: "Serene and spacious 2-bedroom apartment for rent in Lavington. Quiet neighborhood with close proximity to Lavington Mall and top schools.",
    price: 75000,
    currency: "KES",
    propertyType: "apartment",
    listingType: "rent",
    status: "active",
    featured: false,
    bedrooms: 2,
    bathrooms: 2,
    parking: 2,
    sizeSqm: 110,
    views: 147,
    ownerId: "main_agent",
    location: {
      address: "Lavington, Nairobi",
      area: "Lavington",
      county: "Nairobi",
      geoPoint: { latitude: -1.2824, longitude: 36.7726 },
      searchKeywords: ["nairobi", "lavington", "apartment", "rent", "2 bedroom"]
    },
    amenities: ["wifi", "water_storage", "cctv", "parking", "backup_generator"],
    images: [
      "assets/images/properties/lavington_apartment.webp",
      "assets/images/properties/browse_apartment.jpg",
      "https://assets.mbanyu.com/optimized-thumbnails/20260804155030646808343.webp"
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mbanyu_riverside_rent",
    title: "Penthouse in Riverside",
    description: "High-floor 4-bedroom penthouse for rent on Riverside Drive with 300 sqm of modern living space, sweeping views, and full amenities.",
    price: 250000,
    currency: "KES",
    propertyType: "apartment",
    listingType: "rent",
    status: "active",
    featured: true,
    bedrooms: 4,
    bathrooms: 4,
    parking: 3,
    sizeSqm: 300,
    views: 89,
    ownerId: "main_agent",
    location: {
      address: "Riverside Drive, Nairobi",
      area: "Riverside",
      county: "Nairobi",
      geoPoint: { latitude: -1.2685, longitude: 36.7924 },
      searchKeywords: ["nairobi", "riverside", "penthouse", "rent", "luxury"]
    },
    amenities: ["wifi", "water_storage", "cctv", "parking", "backup_generator", "swimming_pool", "gym"],
    images: [
      "assets/images/properties/riverside_rent.webp",
      "assets/images/properties/browse_penthouse.jpg",
      "https://assets.mbanyu.com/optimized-thumbnails/20260730113412692450431.webp"
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

async function syncData() {
  console.log('Writing real Mbanyu listings into Firestore...');
  for (const item of realListings) {
    const docRef = doc(db, 'listings', item.id);
    await setDoc(docRef, item, { merge: true });
    console.log(`✅ Synced real listing: ${item.title} (${item.id})`);
  }
  console.log('🎉 All real Mbanyu listings synced to Firestore!');
  process.exit(0);
}

syncData().catch(err => {
  console.error('Error syncing:', err);
  process.exit(1);
});
