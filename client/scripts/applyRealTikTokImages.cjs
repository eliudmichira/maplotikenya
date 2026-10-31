const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../src/utils/imageUtils.js');

const newCode = `/**
 * Utility functions for handling real property images and TikTok video covers
 */
import tiktokMap from './tiktokMap.json';

const AVAILABLE_TIKTOK_IDS = tiktokMap.availableIds || [];
const STORAGE_KEY_TO_ID = tiktokMap.storageKeyToId || {};

/**
 * Resolves a real, locally-hosted TikTok property cover from a property or URL string.
 */
export const getRealTikTokCover = (input) => {
  if (!input) return null;

  // If input is a property object
  if (typeof input === 'object') {
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
    if (Array.isArray(input.images)) {
      for (const img of input.images) {
        const resolved = getRealTikTokCover(img);
        if (resolved) return resolved;
      }
    }
    if (input.coverPhoto || input.coverPhotoUrl || input.videoThumbnail) {
      const resolved = getRealTikTokCover(input.coverPhoto || input.coverPhotoUrl || input.videoThumbnail);
      if (resolved) return resolved;
    }
    return null;
  }

  // If input is a URL string
  if (typeof input === 'string') {
    // Check for direct TikTok video URL
    const match = input.match(/video\\/(\\d+)/);
    if (match && AVAILABLE_TIKTOK_IDS.includes(match[1])) {
      return \`/tiktok-covers/\${match[1]}.jpg\`;
    }

    // Check for TikTok CDN storage keys (e.g., tos-alisg-p-0037/oQAXyZBmQHI8oi8sqr1TCYBIaEMDaAFywiIPa)
    const keyMatch = input.match(/tos-[^/]+\\/[^~?]+/);
    if (keyMatch && STORAGE_KEY_TO_ID[keyMatch[0]]) {
      return \`/tiktok-covers/\${STORAGE_KEY_TO_ID[keyMatch[0]]}.jpg\`;
    }
  }

  return null;
};

/**
 * Deterministically select a REAL Maploti TikTok property photo.
 * Ensures every listing without an exact photo gets an authentic Kenyan property tour photo.
 */
export const getPropertyFallbackImage = (property) => {
  const direct = getRealTikTokCover(property);
  if (direct) return direct;

  if (AVAILABLE_TIKTOK_IDS.length > 0) {
    const seed = String(property?.id || property?.title || 'maploti');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const index = Math.abs(hash) % AVAILABLE_TIKTOK_IDS.length;
    return \`/tiktok-covers/\${AVAILABLE_TIKTOK_IDS[index]}.jpg\`;
  }

  return '/tiktok-covers/7686574196121521428.jpg';
};

// Stock hosts check (for distinguishing user uploads from Unsplash)
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

/**
 * Transforms external or storage URLs. TikTok CDN URLs are mapped directly to local permanent files.
 */
export const transformImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return imageUrl;
  }

  // Intercept any TikTok CDN URLs and map to real local permanent files
  const realCover = getRealTikTokCover(imageUrl);
  if (realCover) {
    return realCover;
  }

  // Replace old Firebase Storage bucket with current bucket
  if (imageUrl.includes('makao-648bd.firebasestorage.app')) {
    return imageUrl.replace('makao-648bd.firebasestorage.app', 'maploti.firebasestorage.app');
  }

  return imageUrl;
};

export const transformImageUrls = (images) => {
  if (!Array.isArray(images)) return images;
  return images.map(transformImageUrl);
};

/**
 * Returns the primary image for a property.
 * Prioritizes real TikTok tour covers over stock or fallback images.
 */
export const getPropertyImage = (property) => {
  if (!property) return getPropertyFallbackImage(null);

  // Check direct real TikTok match first
  const realTikTokCover = getRealTikTokCover(property);
  if (realTikTokCover) {
    return realTikTokCover;
  }

  // Gather existing image candidates
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
    // If it transformed to a real cover or is a non-stock photo, use it
    if (transformed && !isPlaceholderImage(transformed)) {
      return transformed;
    }
  }

  if (candidates.length > 0) {
    return transformImageUrl(candidates[0]);
  }

  return getPropertyFallbackImage(property);
};

/**
 * Returns all valid images for a property.
 */
export const getPropertyImages = (property) => {
  if (!property) return [getPropertyFallbackImage(null)];

  const images = [];

  const realTikTokCover = getRealTikTokCover(property);
  if (realTikTokCover) {
    images.push(realTikTokCover);
  }

  // Collect other images
  images.push(...transformImageUrls(loadableImages(property?.images)));
  [property?.image, property?.coverPhoto, property?.coverPhotoUrl, property?.videoThumbnail].forEach((u) => {
    if (isLoadableImageUrl(u)) images.push(transformImageUrl(u));
  });
  images.push(...transformImageUrls(loadableImages(property?.photos)));
  images.push(...transformImageUrls(loadableImages(property?.gallery)));

  // Remove duplicates and empty values
  const uniqueImages = [...new Set(images)].filter(img => img && typeof img === 'string');

  if (uniqueImages.length > 0) return uniqueImages;

  return [getPropertyFallbackImage(property)];
};

/**
 * Image error handler. Swaps broken images with real Maploti TikTok covers.
 */
export const handleImageError = (event, fallbackUrl = null, property = null) => {
  const img = event?.target;
  if (!img) return;

  // Prevent infinite loops if error fires again
  img.onerror = null;

  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }

  // Fallback to authentic Maploti TikTok property photo
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

fs.writeFileSync(targetPath, newCode, 'utf8');
console.log('Successfully wrote real TikTok image resolution engine to imageUtils.js');
