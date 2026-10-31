const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/utils/imageUtils.js');
let code = fs.readFileSync(filePath, 'utf8');

const oldFunc = `export const handleImageError = (event, fallbackUrl = null, property = null) => {
  const img = event.target;

  // Try fallback URL first
  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }

  // Try Street View if we have property coords
  if (property) {
    const sv = getStreetViewForProperty(property);
    if (sv && img.src !== sv) {
      img.src = sv;
      return;
    }
  }

  // Use contextual architectural photo
  img.src = getPropertyFallbackImage(property);
};`;

const newFunc = `export const handleImageError = (event, fallbackUrl = null, property = null) => {
  const img = event?.target;
  if (!img) return;
  img.onerror = null;

  // Try fallback URL first
  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }

  // Immediate, high-resolution modern architectural photo fallback
  img.src = getPropertyFallbackImage(property);
};`;

const norm = s => s.replace(/\r\n/g, '\n');
if (norm(code).includes(norm(oldFunc))) {
  code = norm(code).replace(norm(oldFunc), norm(newFunc));
  fs.writeFileSync(filePath, code, 'utf8');
  console.log('Successfully updated handleImageError in imageUtils.js');
} else {
  console.log('Function pattern not matched, checking existing code...');
}
