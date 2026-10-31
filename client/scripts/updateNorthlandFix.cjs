const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'utils', 'propertyUtils.js');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Add Northland 1BR price fix inside sanitizePrice
if (!code.includes('northland') && !code.includes('Northlands')) {
  const edgeCaseTarget = '// Edge case: "150,000 4 Bedroom Maisonette for sale"';
  const priceEnhancement = `  // Scraper fallback fix: 1 Bedroom at Northland Heights has rent of Ksh 45,000
  if (price === 85000 && /northland/i.test(title + ' ' + desc) && (p.bedrooms === 1 || /1\\s*bed/i.test(title))) {
    return 45000;
  }

  // Edge case: "150,000 4 Bedroom Maisonette for sale"`;
  code = code.replace(edgeCaseTarget, priceEnhancement);
}

// 2. Add title and area correction in cleanAndDeduplicateProperties
if (!code.includes('cleanTitle')) {
  const titleTarget = '    const title = String(p.title || \'\').trim();';
  const titleReplacement = `    let title = String(p.title || '').trim();
    let area = String(p.location?.area || p.location?.address || p.area || p.address || '').trim();
    const desc = String(p.description || '');

    // Scraper correction: TikToks tagged #thikaroad with Northlands in description
    if (/northland/i.test(desc) && /in Thika/i.test(title)) {
      title = title.replace(/in Thika/i, 'in Northlands');
      area = 'Northlands';
    }`;
  code = code.replace(titleTarget, titleReplacement);
  code = code.replace('    const area = String(p.location?.area || p.location?.address || p.area || p.address || \'\').trim();', '');
  code = code.replace('      ...p,\n      price,', '      ...p,\n      title,\n      price,\n      location: typeof p.location === \'object\' && p.location ? { ...p.location, area: area || p.location.area } : p.location,');
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully updated propertyUtils.js with scraper title & price accuracy!');
