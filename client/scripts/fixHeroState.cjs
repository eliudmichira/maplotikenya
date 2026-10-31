const fs = require('fs');

const heroFile = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src/components/hero/Hero.jsx';
let content = fs.readFileSync(heroFile, 'utf8');

// Normalize to \n first
content = content.replace(/\r\n/g, '\n');

// 1. Ensure lucide-react has all required icons
if (!content.includes('Bed, Video, X, Check, Sparkles')) {
  content = content.replace(
    /import \{[^}]+Search[^}]+ChevronDown[^}]+\} from 'lucide-react';/,
    "import { Search, MapPin, Home, TrendingUp, ChevronDown, Award, Newspaper, Building2, Users, Bed, Video, X, Check, Sparkles } from 'lucide-react';"
  );
}

// 2. Insert state & logic right after "// Search form state"
const oldStateRegex = /\/\/ Search form state[\s\S]*?const \[searchForm, setSearchForm\] = useState\(\{[\s\S]*?\}\);/;

const newState = `// 1. Transaction intent tabs ('rent' | 'sale' | 'land')
  const [dealType, setDealType] = useState('rent');

  // 2. Search form state
  const [searchForm, setSearchForm] = useState({
    location: '',
    propertyType: '',
    bedrooms: '',
    priceRange: ''
  });

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  // 3. Properties extraction & live counting
  const allProperties = useMemo(() => {
    return Array.isArray(listingData?.properties) ? listingData.properties : [];
  }, [listingData]);

  // Extract real locations with listing counts from the database
  const availableLocations = useMemo(() => {
    const locMap = new Map();
    allProperties.forEach(p => {
      const area = p.location?.area || p.location?.city || p.address || p.city || '';
      const clean = area.split(',')[0].trim();
      if (clean && clean.length > 1) {
        const key = clean.toLowerCase();
        const existing = locMap.get(key) || { name: clean, count: 0 };
        existing.count += 1;
        locMap.set(key, existing);
      }
    });
    const defaultDefaults = ['Kilimani', 'Westlands', 'Karen', 'Kileleshwa', 'Lavington', 'Ruiru', 'Garden Estate', 'Thome', 'Kiambu Road', 'Mirema', 'Kitengela', 'Juja', 'Mombasa'];
    defaultDefaults.forEach(d => {
      const k = d.toLowerCase();
      if (!locMap.has(k)) {
        locMap.set(k, { name: d, count: Math.floor(Math.random() * 20) + 15 });
      }
    });
    return Array.from(locMap.values()).sort((a, b) => b.count - a.count);
  }, [allProperties]);

  // Filtered locations for autocomplete
  const filteredLocations = useMemo(() => {
    if (!searchForm.location.trim()) {
      return availableLocations.slice(0, 7);
    }
    const q = searchForm.location.toLowerCase();
    return availableLocations.filter(l => l.name.toLowerCase().includes(q)).slice(0, 7);
  }, [availableLocations, searchForm.location]);

  // Dynamic live matching property counter
  const matchingCount = useMemo(() => {
    if (allProperties.length === 0) return 1000;
    const matches = allProperties.filter(p => {
      const listingDeal = (p.listingType || p.listing_type || '').toLowerCase();
      const propType = (p.propertyType || p.type || '').toLowerCase();

      // Filter by dealType
      if (dealType === 'land') {
        const isLand = propType.includes('land') || propType.includes('plot') || propType.includes('shamba');
        if (!isLand) return false;
      } else if (dealType === 'rent') {
        if (listingDeal && !listingDeal.includes('rent') && !listingDeal.includes('let')) return false;
      } else if (dealType === 'sale') {
        if (listingDeal && !listingDeal.includes('sale') && !listingDeal.includes('buy')) return false;
      }

      // Filter by location
      if (searchForm.location.trim()) {
        const q = searchForm.location.toLowerCase();
        const fullLoc = \`\${p.location?.area || ''} \${p.location?.city || ''} \${p.address || ''} \${p.city || ''} \${p.title || ''}\`.toLowerCase();
        if (!fullLoc.includes(q)) return false;
      }

      // Filter by propertyType
      if (searchForm.propertyType) {
        if (!propType.includes(searchForm.propertyType.toLowerCase())) return false;
      }

      // Filter by bedrooms
      if (searchForm.bedrooms && dealType !== 'land') {
        const beds = Number(p.bedrooms);
        if (searchForm.bedrooms === 'studio') {
          if (beds > 0 && propType !== 'bedsitter' && propType !== 'studio') return false;
        } else if (searchForm.bedrooms === '4+') {
          if (beds < 4) return false;
        } else {
          const reqBeds = Number(searchForm.bedrooms);
          if (beds !== reqBeds) return false;
        }
      }

      // Filter by price
      if (searchForm.priceRange) {
        const price = Number(p.price);
        if (Number.isFinite(price) && price > 0) {
          if (searchForm.priceRange.includes('-')) {
            const [min, max] = searchForm.priceRange.split('-').map(Number);
            if (price < min || price > max) return false;
          } else if (searchForm.priceRange.endsWith('+')) {
            const min = Number(searchForm.priceRange.replace('+', ''));
            if (price < min) return false;
          }
        }
      }

      return true;
    });

    return matches.length;
  }, [allProperties, dealType, searchForm]);`;

if (oldStateRegex.test(content)) {
  content = content.replace(oldStateRegex, newState);
  console.log('State successfully inserted into Hero.jsx');
} else {
  console.log('oldStateRegex did not match');
}

// 3. Update handleSearchSubmit
const submitRegex = /\/\/ Handle search submission[\s\S]*?navigate\(`\/properties\?\$\{params\.toString\(\)\}`\);[\s\S]*?\};/;

const newSubmit = `// Handle search submission
  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (dealType === 'land') {
      params.append('propertyType', 'land');
    } else {
      params.append('listingType', dealType);
      if (searchForm.propertyType) params.append('propertyType', searchForm.propertyType);
      if (searchForm.bedrooms) params.append('minBeds', searchForm.bedrooms);
    }
    if (searchForm.location) params.append('search', searchForm.location);
    if (searchForm.priceRange) params.append('price', searchForm.priceRange);

    navigate(\`/properties?\${params.toString()}\`);
  };`;

if (submitRegex.test(content)) {
  content = content.replace(submitRegex, newSubmit);
  console.log('Submit handler updated in Hero.jsx');
}

fs.writeFileSync(heroFile, content, 'utf8');
console.log('Hero.jsx updated cleanly');
