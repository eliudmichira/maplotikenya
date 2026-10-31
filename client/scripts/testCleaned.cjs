const fs = require('fs');

const file = fs.readFileSync('src/utils/propertyUtils.js', 'utf8');
eval(file.replace(/export /g, ''));

const testSample = [
  { id: 'Wfv49DThVsGGtMcbbvTm', title: '3 Bedroom Villa To Let in Kenyatta Road', price: 85000 },
  { id: '5fRXtNM5MxukibXNJtov', title: '5 Bedroom House To Let in Thome', price: 85000 },
  { id: 'F2E7E8lwVHiY1BQBUw7x', title: '3 Bedroom Apartment To Let in Garden Estate', price: 85000 },
  { id: 'lCx5dnbCuMZ55IzrIPVt', title: '1 Bedroom Apartment To Let in Thika', price: 85000 },
  { id: 'HBDx286SqB9a6OdV3DAZ', title: '2 Bedroom Apartment To Let in Juja', price: 85000 }
];

const cleaned = cleanAndDeduplicateProperties(testSample);
cleaned.forEach(p => {
  console.log(`${p.id} -> Title: "${p.title}" | Price: Ksh ${p.price.toLocaleString()} | Type: ${p.listingType}`);
});
