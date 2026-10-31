const fs = require('fs');
const file = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src/routes/listPage/listPage_fixed_useLocation.jsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /const urlParams = new URLSearchParams\(location\.search\);[\s\S]*?const maxPrice = urlParams\.get\('maxPrice'\);/;

const replacement = `const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search') || urlParams.get('location');
    const listingType = urlParams.get('listingType') || urlParams.get('dealType');
    const propertyType = urlParams.get('propertyType') || urlParams.get('type');
    const minBeds = urlParams.get('minBeds') || urlParams.get('beds');
    let minPrice = urlParams.get('minPrice');
    let maxPrice = urlParams.get('maxPrice');
    const priceParam = urlParams.get('price');
    if (priceParam && !minPrice && !maxPrice) {
      if (priceParam.includes('-')) {
        const parts = priceParam.split('-');
        minPrice = parts[0] || undefined;
        maxPrice = parts[1] || undefined;
      } else if (priceParam.endsWith('+')) {
        minPrice = priceParam.replace('+', '');
      }
    }`;

if (regex.test(code)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Successfully updated URL param handling in listPage_fixed_useLocation.jsx');
} else {
  console.log('Regex did not match');
}
