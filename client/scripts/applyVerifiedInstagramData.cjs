const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'src', 'utils', 'propertyUtils.js');
let code = fs.readFileSync(targetPath, 'utf8');

const verifiedDict = `
/**
 * Verified Instagram & On-Site Catalog
 * Scraped and matched directly from @maploti.kenya Instagram posts and verified Nairobi market data.
 */
export const VERIFIED_INSTAGRAM_PRICES = {
  // Kenyatta Road
  'Wfv49DThVsGGtMcbbvTm': { price: 53000, title: '3 Bedroom Bungalow To Let in Kenyatta Road', listingType: 'rent', area: 'Kenyatta Road' },
  'AMq2FSf3IpEYxRALHPXu': { price: 53000, title: '3 Bedroom Bungalow To Let in Kenyatta Road', listingType: 'rent', area: 'Kenyatta Road' },
  '2mX7ZS77IcNPH6oEPRrx': { price: 60000, title: '3 Bedroom Villa To Let in Kenyatta Road', listingType: 'rent', area: 'Kenyatta Road' },
  'jl3Khxhw3ABpwWLDYP29': { price: 65000, title: 'House To Let in Kenyatta Road', listingType: 'rent', area: 'Kenyatta Road' },

  // Thome Estate
  '5fRXtNM5MxukibXNJtov': { price: 170000, title: '5 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' },
  'XB1Sa4fB6qY6aBIO7cwI': { price: 180000, title: '4 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' },
  '7mMVXbatoUjMM8kS0Gyc': { price: 85000, title: '3 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' },
  'OhLjn0puUx8NTse5E9o4': { price: 45000, title: '2 Bedroom House To Let in Thome', listingType: 'rent', area: 'Thome' },
  'jR474BQioeTLy4AHz6L1': { price: 40000, title: '2 Bedroom Apartment To Let in Thome', listingType: 'rent', area: 'Thome' },
  'IFVCEOKfIjxMc24lnsfZ': { price: 65000, title: '3 Bedroom Apartment To Let in Thome', listingType: 'rent', area: 'Thome' },
  'ExTrxs1BIUvYjYied3tF': { price: 55000, title: '3 Bedroom Apartment To Let in Thome', listingType: 'rent', area: 'Thome' },
  '4Bg683tZXNjOcT71rEru': { price: 85000, title: 'House To Let in Thome', listingType: 'rent', area: 'Thome' },

  // Garden Estate
  'F2E7E8lwVHiY1BQBUw7x': { price: 16000000, title: '3 Bedroom Apartment in Garden Estate', listingType: 'sale', area: 'Garden Estate' },
  'upv4i6QcgZRkBON8vUiz': { price: 220000, title: '5 Bedroom Villa To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },
  'bsncKnxrPu33iLqLKIO1': { price: 250000, title: '5 Bedroom House To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },
  'HwWi5JlnSmEOXPNMdlRH': { price: 150000, title: 'Commercial Office Space To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },
  '1Clu46tz2SWis4JOqFtV': { price: 120000, title: 'House To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },
  '2tWE2yRZrs9DXQRnx2nj': { price: 75000, title: 'Apartment To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },
  'oecsA2edhICzjOHX8HBu': { price: 65000, title: '2 Bedroom Apartment To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },
  'PW3XqYBIlD7daWZX0mxF': { price: 35000, title: '1 Bedroom House To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' },

  // Northlands
  'lCx5dnbCuMZ55IzrIPVt': { price: 45000, title: '1 Bedroom Apartment To Let in Northlands', listingType: 'rent', area: 'Northlands' },
  '9ts08ZhGpX4vz5NqeULd': { price: 45000, title: '1 Bedroom Apartment To Let in Northlands', listingType: 'rent', area: 'Northlands' },
  'o3xMS1VMhYAGfrxtWi7N': { price: 45000, title: '1 Bedroom Apartment To Let in Northlands', listingType: 'rent', area: 'Northlands' },
  'iLcjvXNGwSSAuiB1RZjS': { price: 65000, title: '2 Bedroom Apartment To Let in Northlands', listingType: 'rent', area: 'Northlands' },
  '5hnSsQw5rX8XaoPRNJ6l': { price: 70000, title: 'Apartment To Let in Northlands', listingType: 'rent', area: 'Northlands' },

  // Juja
  'uLCXaf8oBEK8NtVEqSOV': { price: 38000, title: '3 Bedroom Apartment To Let in Juja', listingType: 'rent', area: 'Juja' },
  'HBDx286SqB9a6OdV3DAZ': { price: 28000, title: '2 Bedroom Apartment To Let in Juja', listingType: 'rent', area: 'Juja' },
  '7r9T0stX5qCToMwdsS0b': { price: 45000, title: '3 Bedroom House To Let in Juja', listingType: 'rent', area: 'Juja' },
  'yvMwInNa5abrPDPc4E0T': { price: 75000, title: '5 Bedroom House To Let in Juja', listingType: 'rent', area: 'Juja' },

  // Safaripark / USIU
  'H9wcqon1rEOle5hPpvgY': { price: 95000, title: '3 Bedroom House To Let in Safaripark', listingType: 'rent', area: 'Safaripark' },
  'DZt87v4LnLCHx9uvzfB1': { price: 140000, title: '4 Bedroom House To Let in Safaripark', listingType: 'rent', area: 'Safaripark' },

  // Mirema
  'FwGi1vMlFChYr1GT9xbA': { price: 150000, title: '5 Bedroom House To Let in Mirema', listingType: 'rent', area: 'Mirema' },
  'F7IScqftsHEMpvnmiBP7': { price: 70000, title: '3 Bedroom House To Let in Mirema', listingType: 'rent', area: 'Mirema' },
  '2aLtLzn5anYO9PXLBZyE': { price: 120000, title: '4 Bedroom House To Let in Mirema', listingType: 'rent', area: 'Mirema' },
  'K78I78pJemIYsCPz8t5b': { price: 110000, title: '4 Bedroom Commercial To Let in Mirema', listingType: 'rent', area: 'Mirema' },
  'MubGdl90nF8zauLhKUG4': { price: 50000, title: '2 Bedroom Apartment To Let in Mirema', listingType: 'rent', area: 'Mirema' },

  // Corridors & Suburbs
  'GuMpcvmsS67RqdpuC4pY': { price: 45000, title: '2 Bedroom Apartment To Let along Thika Road', listingType: 'rent', area: 'Thika Road' },
  'Br0BhaMbj52bCdYGrsBa': { price: 200000, title: '5 Bedroom House To Let in Windsor', listingType: 'rent', area: 'Windsor' },
  'MT9RMyKpFOdIXbH52DIx': { price: 250000, title: 'Villa To Let in Muthaiga', listingType: 'rent', area: 'Muthaiga' },
  'NfiO0QwaKI9pjLfOc94d': { price: 75000, title: '2 Bedroom Apartment To Let in Muthaiga', listingType: 'rent', area: 'Muthaiga' },
  'SssvW3je8cTOnFnIJHBp': { price: 160000, title: 'House To Let in Ridgeways', listingType: 'rent', area: 'Ridgeways' },
  'vAiIuCFUUWTmlf9YmVM7': { price: 140000, title: '3 Bedroom House To Let in Ridgeways', listingType: 'rent', area: 'Ridgeways' },
  'yHMCZe4L5ZB77Urfzgxt': { price: 180000, title: 'Villa To Let in Garden Estate', listingType: 'rent', area: 'Garden Estate' }
};
`;

// Insert dictionary if not already there
if (!code.includes('VERIFIED_INSTAGRAM_PRICES')) {
  code = verifiedDict + '\n' + code;
}

// Hook into deriveListingType
if (!code.includes('VERIFIED_INSTAGRAM_PRICES[p.id]?.listingType')) {
  code = code.replace(
    'export function deriveListingType(p) {\n  if (!p) return \'rent\';',
    'export function deriveListingType(p) {\n  if (!p) return \'rent\';\n  if (p.id && VERIFIED_INSTAGRAM_PRICES[p.id]?.listingType) {\n    return VERIFIED_INSTAGRAM_PRICES[p.id].listingType;\n  }'
  );
}

// Hook into sanitizePrice
if (!code.includes('VERIFIED_INSTAGRAM_PRICES[p.id]?.price')) {
  code = code.replace(
    'export function sanitizePrice(p) {\n  if (!p) return 0;',
    'export function sanitizePrice(p) {\n  if (!p) return 0;\n  if (p.id && VERIFIED_INSTAGRAM_PRICES[p.id]?.price) {\n    return VERIFIED_INSTAGRAM_PRICES[p.id].price;\n  }'
  );
}

// Hook into cleanAndDeduplicateProperties
if (!code.includes('VERIFIED_INSTAGRAM_PRICES[p.id]')) {
  code = code.replace(
    '    const desc = String(p.description || \'\');',
    `    const desc = String(p.description || '');
    if (p.id && VERIFIED_INSTAGRAM_PRICES[p.id]) {
      const v = VERIFIED_INSTAGRAM_PRICES[p.id];
      if (v.title) title = v.title;
      if (v.area) area = v.area;
    }`
  );
}

fs.writeFileSync(targetPath, code, 'utf8');
console.log('Successfully embedded verified Instagram catalog into propertyUtils.js!');
