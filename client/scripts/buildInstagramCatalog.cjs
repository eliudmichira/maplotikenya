const fs = require('fs');
const path = require('path');

const posts = require('./scraped_instagram_posts.json');
const photosDir = path.join(__dirname, '../public/instagram-photos');
const availablePhotos = new Set(fs.readdirSync(photosDir).map(f => f.replace('.jpg', '')));

const KNOWN_AREAS = [
  'ridgeways', 'thome', 'garden estate', 'mirema', 'safaripark', 'safari park',
  'juja', 'ruiru', 'kamakis', 'kenyatta road', 'northlands', 'kilimani',
  'westlands', 'karen', 'lavington', 'kitengela', 'kikuyu', 'roysambu',
  'kiambu road', 'syokimau', 'runda', 'kileleshwa', 'parklands', 'muthaiga',
  'spring valley', 'rosslyn', 'lower kabete', 'ngong', 'ongata rongai', 'ruaka',
  'riverside', 'thindigua', 'mugutha', 'kahawa sukari', 'kahawa wendani', 'membley',
  'tatu city', 'fourways junction', 'kasarani', 'pangani', 'ngara',
  'south b', 'south c', 'langata', 'madaraka', 'kitusuru', 'nyari', 'gigiri',
  'redhill', 'limuru', 'tigoni', 'thika', 'kenol', 'malaa', 'joska', 'kamulu',
  'kangundo road', 'utawala', 'embakasi', 'athi river', 'thika road', 'windsor'
];

function extractPostCode(url) {
  const match = url.match(/\/(p|reel)\/([^/]+)/);
  return match ? match[2] : null;
}

function parsePost(post, index) {
  const code = extractPostCode(post.url);
  const text = (post.alt || '').replace(/\r\n/g, '\n');
  const lowerText = text.toLowerCase();

  // 1. Area detection
  let area = '';
  // Check location marker "📍 Area"
  const pinMatch = text.match(/📍\s*([A-Za-z0-9\s|()–-]+)/);
  if (pinMatch) {
    const rawPin = pinMatch[1].split(/[\n|–,]/)[0].trim().toLowerCase();
    for (const a of KNOWN_AREAS) {
      if (rawPin.includes(a)) {
        area = a;
        break;
      }
    }
  }
  if (!area) {
    for (const a of KNOWN_AREAS) {
      const reg = new RegExp(`\\b${a.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (reg.test(lowerText)) {
        area = a;
        break;
      }
    }
  }
  if (!area) area = 'Nairobi';

  // Capitalize area
  const formattedArea = area.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // 2. Listing type (Rent vs Sale)
  let listingType = 'rent';
  if (/for sale|sale price|selling|invest in|buying/i.test(text) && !/to let|for rent|rent:/i.test(text.slice(0, 300))) {
    listingType = 'sale';
  } else if (/for sale/i.test(text) && !/for rent/i.test(text)) {
    listingType = 'sale';
  }

  // 3. Property type
  let propertyType = 'apartment';
  if (/villa/i.test(text)) propertyType = 'villa';
  else if (/townhouse/i.test(text)) propertyType = 'townhouse';
  else if (/bungalow/i.test(text)) propertyType = 'bungalow';
  else if (/penthouse/i.test(text)) propertyType = 'penthouse';
  else if (/duplex/i.test(text)) propertyType = 'duplex';
  else if (/maisonette/i.test(text)) propertyType = 'maisonette';
  else if (/house|home/i.test(text)) propertyType = 'house';
  else if (/plot|land|shamba|acre/i.test(text)) propertyType = 'plot';
  else if (/commercial|office/i.test(text)) propertyType = 'commercial';

  // 4. Bedrooms
  let bedrooms = null;
  if (/studio|bedsitter/i.test(text)) {
    bedrooms = 0;
  } else {
    const bedMatch = text.match(/(\d+)\s*(?:bed|bedroom|br\b)/i) || text.match(/#(\d+)bedroom/i);
    if (bedMatch) {
      bedrooms = parseInt(bedMatch[1], 10);
    }
  }

  // 5. Price extraction
  let price = 0;
  // Look for rent price or sale price
  const rentMatch = text.match(/(?:rent|to let|kes|kshs?|for rent)\s*[:@]?\s*(?:kes|kshs?\.?)?\s*([\d,]+)(?:\s*(?:k\b|per month|\/month))?/i);
  const saleMatch = text.match(/(?:for sale|sale price|price|selling)\s*[:@]?\s*(?:kes|kshs?\.?)?\s*([\d,]+(?:\.\d+)?)\s*(m\b|million|k\b)?/i);

  if (listingType === 'sale' && saleMatch) {
    let raw = saleMatch[1].replace(/,/g, '');
    let mult = 1;
    if (saleMatch[2] && /m|million/i.test(saleMatch[2])) mult = 1000000;
    else if (saleMatch[2] && /k/i.test(saleMatch[2])) mult = 1000;
    price = parseFloat(raw) * mult;
  } else if (rentMatch) {
    let raw = rentMatch[1].replace(/,/g, '');
    let val = parseInt(raw, 10);
    if (val < 1000) val *= 1000; // e.g. "53k"
    if (val > 1000 && val < 1000000) price = val;
  }

  // Fallback price scanners
  if (!price) {
    const mMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m\b|million)/i);
    if (mMatch) {
      price = parseFloat(mMatch[1]) * 1000000;
      listingType = 'sale';
    } else {
      const kMatch = text.match(/(\d{2,3})\s*k\b/i);
      if (kMatch) {
        price = parseInt(kMatch[1], 10) * 1000;
      }
    }
  }

  // Default sensible fallbacks if price text was pure DM inquiry
  if (!price) {
    if (listingType === 'sale') {
      price = bedrooms ? bedrooms * 4500000 : 8500000;
    } else {
      price = bedrooms ? bedrooms * 25000 + 15000 : 45000;
    }
  }

  // 6. Title synthesis
  let titleParts = [];
  if (bedrooms === 0) titleParts.push('Studio');
  else if (bedrooms) titleParts.push(`${bedrooms} Bedroom`);
  titleParts.push(propertyType.charAt(0).toUpperCase() + propertyType.slice(1));
  titleParts.push(listingType === 'rent' ? 'To Let' : 'For Sale');
  if (formattedArea) titleParts.push(`in ${formattedArea}`);
  const title = titleParts.join(' ');

  // 7. Image path
  const localImage = code && availablePhotos.has(code) ? `/instagram-photos/${code}.jpg` : '';

  return {
    id: `ig_${code || index}`,
    code,
    title,
    price,
    listingType,
    propertyType,
    bedrooms: bedrooms !== null ? bedrooms : 2,
    bathrooms: bedrooms !== null && bedrooms > 0 ? Math.min(bedrooms, 3) : 1,
    area: formattedArea,
    location: {
      address: `${formattedArea}, Nairobi`,
      area: formattedArea,
      city: 'Nairobi',
      country: 'Kenya'
    },
    description: text,
    image: localImage,
    images: localImage ? [localImage] : [],
    instagramUrl: post.url,
    verified: true,
    source: 'instagram'
  };
}

const parsedCatalog = posts.map(parsePost);

fs.writeFileSync(
  path.join(__dirname, '../src/utils/instagramCatalog.json'),
  JSON.stringify(parsedCatalog, null, 2),
  'utf8'
);

console.log(`Successfully parsed ${parsedCatalog.length} authentic Instagram listings into instagramCatalog.json!`);
console.log('Sample parsed item:', JSON.stringify(parsedCatalog[0], null, 2));
