const fs = require('fs');
const path = require('path');

// 1. Update imageUtils.js
const imageUtilsPath = path.join(__dirname, '../src/utils/imageUtils.js');
let imageUtilsCode = fs.readFileSync(imageUtilsPath, 'utf8');

const updatedImageUtils = `/**
 * Utility functions for handling real property images from Instagram and TikTok
 */
import tiktokMap from './tiktokMap.json';
import instagramCatalog from './instagramCatalog.json';

const AVAILABLE_TIKTOK_IDS = tiktokMap.availableIds || [];
const STORAGE_KEY_TO_ID = tiktokMap.storageKeyToId || {};
const AVAILABLE_IG_CODES = new Set(instagramCatalog.map(p => p.code).filter(Boolean));

// Combined pool of 590 real Kenyan listing photos (Instagram + TikTok)
const REAL_KENYAN_PHOTOS = [
  ...instagramCatalog.map(p => p.image).filter(Boolean),
  ...AVAILABLE_TIKTOK_IDS.map(id => \`/tiktok-covers/\${id}.jpg\`)
];

/**
 * Resolves a real, locally-hosted photo from Instagram or TikTok
 */
export const getRealPropertyPhoto = (input) => {
  if (!input) return null;

  // Property object
  if (typeof input === 'object') {
    // 1. Instagram code or image
    if (input.code && AVAILABLE_IG_CODES.has(input.code)) {
      return \`/instagram-photos/\${input.code}.jpg\`;
    }
    if (input.instagramUrl) {
      const match = String(input.instagramUrl).match(/\\/(p|reel)\\/([^/]+)/);
      if (match && AVAILABLE_IG_CODES.has(match[2])) {
        return \`/instagram-photos/\${match[2]}.jpg\`;
      }
    }
    // 2. TikTok ID
    if (input.tiktokId && AVAILABLE_TIKTOK_IDS.includes(String(input.tiktokId))) {
      return \`/tiktok-covers/\${input.tiktokId}.jpg\`;
    }
    const videoUrl = input.videoUrl || input.video_url || input.tiktok_url || '';
    if (videoUrl) {
      const match = String(videoUrl).match(/video\\/(\\d+)/);
      if (match && AVAILABLE_TIKTOK_IDS.includes(match[1])) {
        return \`/tiktok-covers/\${match[1]}.jpg\`;
      }
    }
    // 3. Inspect existing image fields
    if (Array.isArray(input.images)) {
      for (const img of input.images) {
        const resolved = getRealPropertyPhoto(img);
        if (resolved) return resolved;
      }
    }
    if (input.image || input.coverPhoto || input.coverPhotoUrl || input.videoThumbnail) {
      const resolved = getRealPropertyPhoto(input.image || input.coverPhoto || input.coverPhotoUrl || input.videoThumbnail);
      if (resolved) return resolved;
    }
    return null;
  }

  // String URL or path
  if (typeof input === 'string') {
    if (input.startsWith('/instagram-photos/') || input.startsWith('/tiktok-covers/')) {
      return input;
    }

    const igMatch = input.match(/\\/(p|reel)\\/([^/]+)/);
    if (igMatch && AVAILABLE_IG_CODES.has(igMatch[2])) {
      return \`/instagram-photos/\${igMatch[2]}.jpg\`;
    }

    const ttMatch = input.match(/video\\/(\\d+)/);
    if (ttMatch && AVAILABLE_TIKTOK_IDS.includes(ttMatch[1])) {
      return \`/tiktok-covers/\${ttMatch[1]}.jpg\`;
    }

    const keyMatch = input.match(/tos-[^/]+\\/[^~?]+/);
    if (keyMatch && STORAGE_KEY_TO_ID[keyMatch[0]]) {
      return \`/tiktok-covers/\${STORAGE_KEY_TO_ID[keyMatch[0]]}.jpg\`;
    }
  }

  return null;
};

// Aliased for backwards compatibility
export const getRealTikTokCover = getRealPropertyPhoto;

/**
 * Deterministically returns a genuine Maploti photo from the 590-photo verified pool.
 * NO stock photography or foreign images are ever used.
 */
export const getPropertyFallbackImage = (property) => {
  const direct = getRealPropertyPhoto(property);
  if (direct) return direct;

  if (REAL_KENYAN_PHOTOS.length > 0) {
    const seed = String(property?.id || property?.title || 'maploti');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % REAL_KENYAN_PHOTOS.length;
    return REAL_KENYAN_PHOTOS[index];
  }

  return '/tiktok-covers/7686574196121521428.jpg';
};

const STOCK_IMAGE_HOSTS = ['images.unsplash.com', 'unsplash.com', 'source.unsplash.com', 'picsum.photos', 'placehold.co', 'via.placeholder.com'];

export const isPlaceholderImage = (url) => {
  if (!url || typeof url !== 'string') return true;
  try {
    const host = new URL(url).hostname;
    return STOCK_IMAGE_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
};

export const hasRealPhoto = (property) => !isPlaceholderImage(getPropertyImage(property));

export const isLoadableImageUrl = (url) =>
  typeof url === 'string' && /^(https?:\\/\\/|\\/\\/|\\/(?!\\/)|data:image\\/|blob:)/.test(url.trim());

const loadableImages = (list) => (Array.isArray(list) ? list : []).filter(isLoadableImageUrl);

export const getPropertyCoords = (property) => {
  if (!property) return null;
  const lat =
    property.latitude ??
    property.lat ??
    property.location?.coordinates?.lat ??
    property.location?.lat ??
    property.coordinates?.lat;
  const lng =
    property.longitude ??
    property.lng ??
    property.location?.coordinates?.lng ??
    property.location?.lng ??
    property.coordinates?.lng;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  if (latNum === 0 && lngNum === 0) return null;
  return [latNum, lngNum];
};

export const transformImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  // Check if it's a real Instagram or TikTok link
  const realPhoto = getRealPropertyPhoto(imageUrl);
  if (realPhoto) {
    return realPhoto;
  }

  if (imageUrl.includes('makao-648bd.firebasestorage.app')) {
    return imageUrl.replace('makao-648bd.firebasestorage.app', 'maploti.firebasestorage.app');
  }

  return imageUrl;
};

export const transformImageUrls = (images) => {
  if (!Array.isArray(images)) return images;
  return images.map(transformImageUrl);
};

export const getPropertyImage = (property) => {
  if (!property) return getPropertyFallbackImage(null);

  const directRealPhoto = getRealPropertyPhoto(property);
  if (directRealPhoto) {
    return directRealPhoto;
  }

  const candidates = [
    ...loadableImages(property?.images),
    property?.image,
    property?.coverPhoto,
    property?.coverPhotoUrl,
    property?.videoThumbnail,
    ...loadableImages(property?.photos),
    ...loadableImages(property?.gallery),
  ].filter(isLoadableImageUrl);

  for (const c of candidates) {
    const transformed = transformImageUrl(c);
    if (transformed && !isPlaceholderImage(transformed)) {
      return transformed;
    }
  }

  if (candidates.length > 0) {
    return transformImageUrl(candidates[0]);
  }

  return getPropertyFallbackImage(property);
};

export const getPropertyImages = (property) => {
  if (!property) return [getPropertyFallbackImage(null)];

  const images = [];

  const directRealPhoto = getRealPropertyPhoto(property);
  if (directRealPhoto) {
    images.push(directRealPhoto);
  }

  images.push(...transformImageUrls(loadableImages(property?.images)));
  [property?.image, property?.coverPhoto, property?.coverPhotoUrl, property?.videoThumbnail].forEach((u) => {
    if (isLoadableImageUrl(u)) images.push(transformImageUrl(u));
  });
  images.push(...transformImageUrls(loadableImages(property?.photos)));
  images.push(...transformImageUrls(loadableImages(property?.gallery)));

  const uniqueImages = [...new Set(images)].filter(img => img && typeof img === 'string');

  // Filter out any external stock placeholder images in favor of real Kenyan photos
  const filteredImages = uniqueImages.filter(img => !isPlaceholderImage(img));

  if (filteredImages.length > 0) return filteredImages;

  return [getPropertyFallbackImage(property)];
};

export const handleImageError = (event, fallbackUrl = null, property = null) => {
  const img = event?.target;
  if (!img) return;

  img.onerror = null;

  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }

  img.src = getPropertyFallbackImage(property);
};

export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = transformImageUrl(src);
  });
};

export const preloadImages = (imageUrls) => {
  return Promise.allSettled(
    imageUrls.map(url => preloadImage(url))
  );
};
`;

fs.writeFileSync(imageUtilsPath, updatedImageUtils, 'utf8');
console.log('Updated imageUtils.js with 590-photo authentic Instagram & TikTok pool!');

// 2. Update propertyUtils.js to prepend the 143 Instagram listings
const propertyUtilsPath = path.join(__dirname, '../src/utils/propertyUtils.js');
let propUtilsCode = fs.readFileSync(propertyUtilsPath, 'utf8');

if (!propUtilsCode.includes("import instagramCatalog from './instagramCatalog.json'")) {
  propUtilsCode = "import instagramCatalog from './instagramCatalog.json';\n" + propUtilsCode;
}

const targetDedupe = "export function cleanAndDeduplicateProperties(rawList) {";
const replacementDedupe = `export function cleanAndDeduplicateProperties(rawList) {
  // Prepend authentic 143 Instagram listings at the top of the catalog
  const fullList = [
    ...(Array.isArray(instagramCatalog) ? instagramCatalog : []),
    ...(Array.isArray(rawList) ? rawList : [])
  ];`;

propUtilsCode = propUtilsCode.replace(targetDedupe, replacementDedupe);
propUtilsCode = propUtilsCode.replace("for (const p of rawList) {", "for (const p of fullList) {");

fs.writeFileSync(propertyUtilsPath, propUtilsCode, 'utf8');
console.log('Updated propertyUtils.js to include all 143 verified Instagram listings!');
