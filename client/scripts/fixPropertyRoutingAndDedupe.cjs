const fs = require('fs');
const path = require('path');

// 1. Fix propertyUtils.js: restore cleanAndDeduplicateProperties to only process rawList
const propUtilsPath = path.join(__dirname, '../src/utils/propertyUtils.js');
let propUtilsCode = fs.readFileSync(propUtilsPath, 'utf8');

const norm = s => s.replace(/\r\n/g, '\n');

const faultyDedupe = `export function cleanAndDeduplicateProperties(rawList) {
  // Prepend authentic 143 Instagram listings at the top of the catalog
  const fullList = [
    ...(Array.isArray(instagramCatalog) ? instagramCatalog : []),
    ...(Array.isArray(rawList) ? rawList : [])
  ];
  if (!Array.isArray(rawList)) return [];

  const seen = new Set();
  const cleaned = [];

  for (const p of fullList) {`;

const correctedDedupe = `export function cleanAndDeduplicateProperties(rawList) {
  if (!Array.isArray(rawList)) return [];

  const seen = new Set();
  const cleaned = [];

  for (const p of rawList) {`;

if (norm(propUtilsCode).includes(norm(faultyDedupe))) {
  propUtilsCode = norm(propUtilsCode).replace(norm(faultyDedupe), correctedDedupe);
} else {
  console.log('Faulty dedupe block not matched exactly, replacing manually...');
  propUtilsCode = propUtilsCode.replace(
    /export function cleanAndDeduplicateProperties\(rawList\) \{[\s\S]*?for \(const p of (?:fullList|rawList)\) \{/,
    correctedDedupe
  );
}

fs.writeFileSync(propUtilsPath, propUtilsCode, 'utf8');
console.log('Successfully fixed cleanAndDeduplicateProperties in propertyUtils.js');

// 2. In firebaseAPI.js, ensure getAll prepends instagramCatalog, and getById only returns the exact matched property
const fbPath = path.join(__dirname, '../src/lib/firebaseAPI.js');
let fbCode = fs.readFileSync(fbPath, 'utf8');

// Ensure instagramCatalog is imported
if (!fbCode.includes("import instagramCatalog from '../utils/instagramCatalog.json'")) {
  fbCode = "import instagramCatalog from '../utils/instagramCatalog.json';\n" + fbCode;
}

// In getAll:
fbCode = fbCode.replace(
  'const cleaned = cleanAndDeduplicateProperties(properties);',
  `const allCombined = [
        ...(Array.isArray(instagramCatalog) ? instagramCatalog : []),
        ...properties
      ];
      const cleaned = cleanAndDeduplicateProperties(allCombined);`
);

// In getById:
const fixedGetById = `  // Get property by ID
  getById: async (id) => {
    try {
      if (!id) throw new Error('Property ID is required');

      // 1. Direct match in Instagram catalog by exact id or code
      if (Array.isArray(instagramCatalog)) {
        const cleanId = String(id).trim();
        const rawCode = cleanId.replace(/^ig_/, '');
        const igMatch = instagramCatalog.find(
          p => p.id === cleanId || p.code === rawCode || p.id === \`ig_\${rawCode}\`
        );
        if (igMatch) {
          const [cleaned] = cleanAndDeduplicateProperties([igMatch]);
          return cleaned || igMatch;
        }
      }

      // 2. Query Firestore listings
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const [cleaned] = cleanAndDeduplicateProperties([raw]);
        return cleaned || raw;
      }

      throw new Error('Property not found');
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },`;

fbCode = fbCode.replace(
  /getById:\s*async\s*\(id\)\s*=>\s*\{[\s\S]*?throw error;\s*\}\s*\},/,
  fixedGetById
);

fs.writeFileSync(fbPath, fbCode, 'utf8');
console.log('Successfully updated firebaseAPI.js getAll and getById!');
