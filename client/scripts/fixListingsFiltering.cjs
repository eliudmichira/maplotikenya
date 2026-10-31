const fs = require('fs');

// 1. UPDATE listPage_fixed_useLocation.jsx
const desktopFile = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src/routes/listPage/listPage_fixed_useLocation.jsx';
let code = fs.readFileSync(desktopFile, 'utf8').replace(/\r\n/g, '\n');

// Replace the filter logic in useEffect
const oldFilterRegex = /\/\/ Apply filters\s*useEffect\(\(\) => \{[\s\S]*?if \(filters\.maxYear\)/;

const newFilterCode = `// Apply filters
  useEffect(() => {
    let filtered = Array.isArray(propertyData) ? [...propertyData] : []

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase().trim();
      const searchWords = searchTerm.split(/[\\s,]+/).filter(Boolean);

      filtered = filtered.filter(property => {
        const searchableFields = [
          property.title || '',
          property.description || '',
          property.address || '',
          property.city || '',
          property.location?.area || '',
          property.location?.address || '',
          property.location?.city || '',
          property.location?.neighborhood || '',
          property.location?.estate || '',
          (typeof property.neighborhood === 'string' ? property.neighborhood : property.neighborhood?.name) || '',
          property.estate || '',
          property.propertyType || '',
          property.property_type || '',
          property.listingType || '',
          property.listing_type || '',
          property.type || '',
          property.county || ''
        ].join(' ').toLowerCase();

        return searchWords.every(word => searchableFields.includes(word));
      });
    }

    // Apply listingType filter (For Rent / For Sale)
    if (filters.listingType && filters.listingType !== 'all') {
      filtered = filtered.filter(p => {
        const t = String(p.listingType || p.listing_type || p.type || p.title || '').toLowerCase();
        const isRent = t.includes('rent') || t.includes('let') || t.includes('rental');
        return filters.listingType === 'rent' ? isRent : !isRent;
      });
    }

    if (filters.minPrice) {
      filtered = filtered.filter(property => {
        const price = parseFloat(property.price) || 0;
        return price >= parseFloat(filters.minPrice);
      });
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(property => {
        const price = parseFloat(property.price) || 0;
        return price <= parseFloat(filters.maxPrice);
      });
    }

    if (filters.minBeds) {
      filtered = filtered.filter(property => {
        const beds = parseInt(property.bedrooms) || 0;
        const pt = String(property.propertyType || property.property_type || property.type || property.title || '').toLowerCase();
        if (filters.minBeds === 'studio') {
          return beds === 0 || pt.includes('studio') || pt.includes('bedsitter');
        }
        if (filters.minBeds === '4+') {
          return beds >= 4;
        }
        const req = parseInt(filters.minBeds);
        return isNaN(req) ? true : beds >= req;
      });
    }

    if (filters.minBaths) {
      filtered = filtered.filter(property => {
        const baths = parseInt(property.bathrooms) || 0;
        return baths >= parseInt(filters.minBaths);
      });
    }

    if (filters.propertyType) {
      const reqType = filters.propertyType.toLowerCase();
      filtered = filtered.filter(property => {
        const pt = String(property.propertyType || property.property_type || property.type || property.title || '').toLowerCase();
        if (reqType === 'land' || reqType === 'plot') {
          return pt.includes('land') || pt.includes('plot') || pt.includes('shamba');
        }
        return pt.includes(reqType);
      });
    }

    if (filters.homeTypes && filters.homeTypes.length > 0) {
      filtered = filtered.filter(property => {
        const propertyType = property.propertyType || property.property_type || property.type || '';
        return filters.homeTypes.some(type =>
          propertyType.toLowerCase().includes(type.toLowerCase())
        );
      });
    }

    if (filters.minSqft) {
      filtered = filtered.filter(property => {
        const sqft = parseFloat(property.square_feet) || 0;
        return sqft >= parseFloat(filters.minSqft);
      });
    }

    if (filters.maxSqft) {
      filtered = filtered.filter(property => {
        const sqft = parseFloat(property.square_feet) || 0;
        return sqft <= parseFloat(filters.maxSqft);
      });
    }

    if (filters.minYear) {
      filtered = filtered.filter(property => {
        const year = parseInt(property.year_built) || 0;
        return year >= parseInt(filters.minYear);
      });
    }

    if (filters.maxYear)`;

if (oldFilterRegex.test(code)) {
  code = code.replace(oldFilterRegex, newFilterCode);
  fs.writeFileSync(desktopFile, code, 'utf8');
  console.log('Successfully updated filter application in listPage_fixed_useLocation.jsx');
} else {
  console.log('oldFilterRegex did not match');
}

// 2. UPDATE MobilePropertyList.jsx
const mobileFile = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src/mobile/pages/MobilePropertyList.jsx';
let mobileCode = fs.readFileSync(mobileFile, 'utf8').replace(/\r\n/g, '\n');

// Fix deep link params in MobilePropertyList
const oldMobileUrlRegex = /useEffect\(\(\) => \{\s*const params = new URLSearchParams\(window\.location\.search\);[\s\S]*?\}, \[\]\);/;

const newMobileUrlCode = `useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search') || params.get('location');
    if (searchParam) setSearchQuery(decodeURIComponent(searchParam));
    const typeParam = params.get('propertyType') || params.get('type');
    const dealParam = params.get('listingType') || params.get('dealType');
    const bedParam = params.get('minBeds') || params.get('beds');
    let minP = params.get('minPrice');
    let maxP = params.get('maxPrice');
    const pParam = params.get('price');
    if (pParam && !minP && !maxP) {
      if (pParam.includes('-')) {
        const parts = pParam.split('-');
        minP = parts[0] || '';
        maxP = parts[1] || '';
      } else if (pParam.endsWith('+')) {
        minP = pParam.replace('+', '');
      }
    }
    setFilters(prev => ({
      ...prev,
      ...(typeParam ? { propertyType: typeParam.toLowerCase() } : {}),
      ...(dealParam ? { status: dealParam === 'sale' ? 'for-sale' : 'for-rent' } : {}),
      ...(bedParam ? { minBedrooms: bedParam } : {}),
      ...(minP ? { minPrice: minP } : {}),
      ...(maxP ? { maxPrice: maxP } : {})
    }));
  }, [window.location.search]);`;

if (oldMobileUrlRegex.test(mobileCode)) {
  mobileCode = mobileCode.replace(oldMobileUrlRegex, newMobileUrlCode);
}

// Fix search filter in MobilePropertyList
mobileCode = mobileCode.replace(
  /property\.location\?\.city\?\.toLowerCase\(\)\.includes\(searchQuery\.toLowerCase\(\)\)/,
  `property.location?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location?.area?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.description?.toLowerCase().includes(searchQuery.toLowerCase())`
);

fs.writeFileSync(mobileFile, mobileCode, 'utf8');
console.log('Successfully updated MobilePropertyList.jsx');
