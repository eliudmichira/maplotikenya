const fs = require('fs');

// 1. Update propertyDetails.jsx
let code = fs.readFileSync('src/routes/propertyDetails/propertyDetails.jsx', 'utf8');

if (!code.includes('cleanAndDeduplicateProperties')) {
  code = code.replace(
    /import\s*\{\s*useProperty\s*\}\s*from\s*['"]\.\.\/\.\.\/hooks\/useProperties['"];/,
    "import { cleanAndDeduplicateProperties } from '../../utils/propertyUtils';\nimport { useProperty } from '../../hooks/useProperties';"
  );
}

code = code.replace(
  /if\s*\(\s*data\s*\)\s*\{\s*setProperty\s*\(\s*data\s*\);/g,
  "if (data) {\n      const [cleaned] = cleanAndDeduplicateProperties([data]);\n      const finalProp = cleaned || data;\n      setProperty(finalProp);"
);

code = code.replace(
  /trackPropertyView\s*\(\s*data\s*\);/g,
  "trackPropertyView(cleaned || data);"
);

fs.writeFileSync('src/routes/propertyDetails/propertyDetails.jsx', code, 'utf8');
console.log('Updated propertyDetails.jsx');

// 2. Update MobilePropertyDetails.jsx
let mobileCode = fs.readFileSync('src/mobile/pages/MobilePropertyDetails.jsx', 'utf8');

if (!mobileCode.includes('cleanAndDeduplicateProperties')) {
  mobileCode = mobileCode.replace(
    /import\s*\{\s*useProperty,\s*useProperties\s*\}\s*from\s*['"]\.\.\/\.\.\/hooks\/useProperties['"];/,
    "import { cleanAndDeduplicateProperties } from '../../utils/propertyUtils';\nimport { useProperty, useProperties } from '../../hooks/useProperties';"
  );
}

mobileCode = mobileCode.replace(
  /const property = propertyData;/g,
  "const property = propertyData ? (cleanAndDeduplicateProperties([propertyData])[0] || propertyData) : null;"
);

fs.writeFileSync('src/mobile/pages/MobilePropertyDetails.jsx', mobileCode, 'utf8');
console.log('Updated MobilePropertyDetails.jsx');
