const fs = require('fs');
const path = require('path');

const clientDir = path.resolve(__dirname, '..');

// 1. Update firebaseAPI.js
const firebaseApiPath = path.join(clientDir, 'src', 'lib', 'firebaseAPI.js');
if (fs.existsSync(firebaseApiPath)) {
  let code = fs.readFileSync(firebaseApiPath, 'utf8');

  if (!code.includes("import { cleanAndDeduplicateProperties } from '../utils/propertyUtils';")) {
    code = code.replace(
      "import { getCountyFromCoords, getGeohash } from '../utils/locationUtils';",
      "import { getCountyFromCoords, getGeohash } from '../utils/locationUtils';\nimport { cleanAndDeduplicateProperties } from '../utils/propertyUtils';"
    );
  }

  // Update getAll return
  code = code.replace(
    /devLog\('✅ Properties fetched successfully:',\s*\{[^}]*\}\);\s*return\s*\{\s*properties,\s*pagination:\s*\{[^}]*\}\s*\};/s,
    `const cleaned = cleanAndDeduplicateProperties(properties);
      devLog('✅ Properties fetched successfully:', {
        count: cleaned.length,
        firstProperty: cleaned[0] ? cleaned[0].title || cleaned[0].name : 'No properties'
      });
      return {
        properties: cleaned,
        pagination: {
          page,
          limit: pageSize,
          total: cleaned.length,
          pages: Math.ceil(cleaned.length / pageSize)
        }
      };`
  );

  // Update fallback return in getAll
  code = code.replace(
    /return\s*\{\s*properties,\s*pagination:\s*\{\s*page:\s*1,\s*limit:\s*properties\.length,\s*total:\s*properties\.length,\s*pages:\s*1\s*\}\s*\};/s,
    `const cleanedFallback = cleanAndDeduplicateProperties(properties);
        return {
          properties: cleanedFallback,
          pagination: {
            page: 1,
            limit: cleanedFallback.length,
            total: cleanedFallback.length,
            pages: 1
          }
        };`
  );

  // Update getFeatured
  code = code.replace(
    /const selected = properties\.slice\(0, limitCount\);/g,
    `const cleanedFeatured = cleanAndDeduplicateProperties(properties);
      const selected = cleanedFeatured.slice(0, limitCount);`
  );

  // Update getById
  code = code.replace(
    /if \(docSnap\.exists\(\)\) \{\s*return \{\s*id: docSnap\.id,\s*\.\.\.docSnap\.data\(\)\s*\};\s*\}/s,
    `if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const [cleaned] = cleanAndDeduplicateProperties([raw]);
        return cleaned || raw;
      }`
  );

  fs.writeFileSync(firebaseApiPath, code, 'utf8');
  console.log('Updated firebaseAPI.js successfully');
}

// 2. Update ListingCard.jsx
const listingCardPath = path.join(clientDir, 'src', 'components', 'listing', 'ListingCard.jsx');
if (fs.existsSync(listingCardPath)) {
  let cardCode = fs.readFileSync(listingCardPath, 'utf8');

  // Import utils
  if (!cardCode.includes("import { deriveListingType, sanitizePrice, formatPropertyArea } from '../../utils/propertyUtils';")) {
    cardCode = cardCode.replace(
      "import { cn } from '@/lib/utils';",
      "import { cn } from '@/lib/utils';\nimport { deriveListingType, sanitizePrice, formatPropertyArea } from '../../utils/propertyUtils';"
    );
  }

  // Replace listingKind
  cardCode = cardCode.replace(
    /const listingKind = \(p\) => \{[^}]*\};/s,
    `const listingKind = (p) => deriveListingType(p);`
  );

  // Replace formatKsh
  cardCode = cardCode.replace(
    /const formatKsh = \(v\) => \{[^}]*\};/s,
    `const formatKsh = (p) => {
  const n = sanitizePrice(p);
  return n > 0 ? \`Ksh \${n.toLocaleString()}\` : 'Price on request';
};`
  );

  // Replace price and month display
  cardCode = cardCode.replace(
    /\{formatKsh\(property\.price\)\}\s*\{kind === 'rent' && Number\(property\.price\) > 0 && <span className="text-xs font-normal text-muted-foreground">\/month<\/span>\}/s,
    `{formatKsh(property)}
          {kind === 'rent' && sanitizePrice(property) > 0 && <span className="text-xs font-normal text-muted-foreground">/month</span>}`
  );

  // Replace bed/bath/sqm display to include clean "bed" / "bath" labels
  cardCode = cardCode.replace(
    /\{Number\(property\.bedrooms\) > 0 && <span className="flex shrink-0 items-center gap-1 tabular-nums"><Bed className="h-3\.5 w-3\.5" \/>\{property\.bedrooms\}<\/span>\}\s*\{Number\(property\.bathrooms\) > 0 && <span className="flex shrink-0 items-center gap-1 tabular-nums"><Bath className="h-3\.5 w-3\.5" \/>\{property\.bathrooms\}<\/span>\}\s*\{sqm > 0 && <span className="hidden shrink-0 items-center gap-1 tabular-nums sm:flex"><Ruler className="h-3\.5 w-3\.5" \/>\{sqm\.toLocaleString\(\)\} m²<\/span>\}/s,
    `{Number(property.bedrooms) > 0 && (
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              <Bed className="h-3.5 w-3.5" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}</span>
            </span>
          )}
          {Number(property.bathrooms) > 0 && (
            <span className="flex shrink-0 items-center gap-1 tabular-nums">
              <Bath className="h-3.5 w-3.5" />
              <span>{property.bathrooms} {property.bathrooms === 1 ? 'bath' : 'baths'}</span>
            </span>
          )}
          {formatPropertyArea(property) && (
            <span className="hidden shrink-0 items-center gap-1 tabular-nums sm:flex">
              <Ruler className="h-3.5 w-3.5" />
              <span>{formatPropertyArea(property)}</span>
            </span>
          )}`
  );

  fs.writeFileSync(listingCardPath, cardCode, 'utf8');
  console.log('Updated ListingCard.jsx successfully');
}

console.log('All frontend fixes applied!');
