const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../src/utils/instagramCatalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const priceFixes = {
  'ig_DWZbjVdl6Dx': { price: 2500000, title: 'Studio Apartment For Sale on Thika Road (Safari Park Area)', propertyType: 'apartment', listingType: 'sale', area: 'Thika Road' },
  'ig_DeYlcSPiGZM': { price: 3900000, title: 'Studio Apartment For Sale in Syokimau', propertyType: 'apartment', listingType: 'sale' },
  'ig_DampckPCEFg': { price: 3000000, title: 'Studio Apartment For Sale in Kilimani', propertyType: 'apartment', listingType: 'sale' },
  'ig_DWD5Gt3jjX5': { price: 10500000, title: '2 Bedroom Apartment For Sale in Kiambu Road', propertyType: 'apartment', listingType: 'sale' },
  'ig_DWD42OdF4JX': { price: 10500000, title: '2 Bedroom Apartment For Sale in Kiambu Road', propertyType: 'apartment', listingType: 'sale' },
  'ig_DVp1NCEF0DF': { price: 8100000, title: '1 Bedroom Serviced Apartment For Sale in Westlands', propertyType: 'apartment', listingType: 'sale' },
  'ig_DVSy0vgDGBq': { price: 6200000, title: 'Studio Apartment For Sale in Westlands', propertyType: 'apartment', listingType: 'sale' },
  'ig_DUqaljmjASP': { price: 6900000, title: '1 Bedroom Apartment For Sale in Kilimani', propertyType: 'apartment', listingType: 'sale' },
  'ig_DT7U6REjGbT': { price: 6600000, title: '1 Bedroom Apartment For Sale in Kilimani', propertyType: 'apartment', listingType: 'sale' },
  'ig_DTuXPj1DCbe': { price: 5000000, title: '1 Bedroom Apartment For Sale in Kitisuru', propertyType: 'apartment', listingType: 'sale' },
  'ig_DTsFq5IDMHF': { price: 5800000, title: 'Studio Apartment For Sale in Westlands', propertyType: 'apartment', listingType: 'sale' },
  'ig_DS4Q0VLDIPf': { price: 6500000, title: '1 Bedroom Duplex For Sale in Westlands', propertyType: 'apartment', listingType: 'sale' },
  'ig_DSj-Kc8jCwt': { price: 18500000, title: '2 Bedroom Apartment For Sale in Westlands', propertyType: 'apartment', listingType: 'sale' },
  'ig_DSSfO4JjOoc': { price: 2500000, title: 'Studio Apartment For Sale on Thika Road (Safari Park Area)', propertyType: 'apartment', listingType: 'sale', area: 'Thika Road' },
  'ig_DSSVXxMDBZw': { price: 2500000, title: 'Studio Apartment For Sale on Thika Road (Safari Park Area)', propertyType: 'apartment', listingType: 'sale', area: 'Thika Road' },
  'ig_DRuCbgbDGNn': { price: 6830000, title: '1 Bedroom Apartment For Sale in Westlands', propertyType: 'apartment', listingType: 'sale' },
  'ig_DRmH6W-jMbr': { price: 2500000, title: 'Studio Apartment For Sale in New Kitisuru', propertyType: 'apartment', listingType: 'sale' },
  'ig_DQq-Vj2DHKQ': { price: 85000000, title: '4 Bedroom Townhouse For Sale in Kileleshwa', propertyType: 'townhouse', listingType: 'sale' },
  'ig_DPeph8qCL7N': { price: 155000000, title: '5 Bedroom House with DSQ For Sale in Lavington', propertyType: 'house', listingType: 'sale' }
};

let count = 0;
catalog.forEach(p => {
  if (priceFixes[p.id]) {
    const f = priceFixes[p.id];
    Object.assign(p, f);
    if (f.area) {
      p.location = {
        ...p.location,
        area: f.area,
        address: `${f.area}, Nairobi`
      };
    }
    count++;
  }
});

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Fixed ' + count + ' catalog items in instagramCatalog.json');
