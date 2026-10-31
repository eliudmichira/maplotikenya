const fs = require('fs');

let code = fs.readFileSync('src/utils/imageUtils.js', 'utf8');

const architecturalPool = `
// Curated high-resolution modern architectural photography fallbacks
// Mapped deterministically by property ID/title so each home gets a distinct, stunning cover
export const ARCHITECTURAL_FALLBACKS = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&fit=crop',
  'https://images.unsplash.com/photo-1502005229762-ee1b2b814660?w=800&q=80&fit=crop'
];

export const getPropertyFallbackImage = (property) => {
  const seed = String(property?.id || property?.title || 'maploti');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % ARCHITECTURAL_FALLBACKS.length;
  return ARCHITECTURAL_FALLBACKS[index];
};
`;

if (!code.includes('ARCHITECTURAL_FALLBACKS')) {
  code = code.replace(
    "const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';",
    "const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&fit=crop';" + architecturalPool
  );

  code = code.replace(
    '// Return placeholder\n  return PLACEHOLDER_IMAGE;',
    '// Return contextual architectural photo\n  return getPropertyFallbackImage(property);'
  );

  code = code.replace(
    'return [PLACEHOLDER_IMAGE];',
    'return [getPropertyFallbackImage(property)];'
  );

  code = code.replace(
    '// Use default placeholder\n  img.src = PLACEHOLDER_IMAGE;',
    '// Use contextual architectural photo\n  img.src = getPropertyFallbackImage(property);'
  );

  fs.writeFileSync('src/utils/imageUtils.js', code, 'utf8');
  console.log('Successfully upgraded imageUtils.js with curated architectural photography!');
} else {
  console.log('Already upgraded imageUtils.js');
}
