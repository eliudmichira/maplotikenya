const fs = require('fs');
const path = require('path');

// 1. Update Hero.jsx
const heroPath = path.join(__dirname, '../src/components/hero/Hero.jsx');
let heroContent = fs.readFileSync(heroPath, 'utf8');

// Update handleSearchSubmit in Hero.jsx
const oldSearchSubmit = `  // Handle search submission
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

const newSearchSubmit = `  // Handle search submission
  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const params = new URLSearchParams();
    if (dealType === 'land') {
      params.append('propertyType', 'land');
    } else {
      if (dealType) params.append('listingType', dealType);
      if (searchForm.propertyType) params.append('propertyType', searchForm.propertyType);
      if (searchForm.bedrooms) params.append('minBeds', searchForm.bedrooms);
    }
    if (searchForm.location && searchForm.location.trim()) {
      params.append('search', searchForm.location.trim());
    }
    if (searchForm.priceRange) params.append('price', searchForm.priceRange);

    const query = params.toString();
    navigate(query ? \`/properties?\${query}\` : '/properties');
  };`;

if (heroContent.includes(oldSearchSubmit)) {
  heroContent = heroContent.replace(oldSearchSubmit, newSearchSubmit);
  console.log('Updated handleSearchSubmit in Hero.jsx');
} else {
  console.warn('Could not find oldSearchSubmit in Hero.jsx - checking regex');
  heroContent = heroContent.replace(
    /const handleSearchSubmit = \(\) => {[\s\S]*?navigate\(`\/properties\?\$\{params\.toString\(\)\}`\);\s*};/,
    newSearchSubmit.trim()
  );
}

// Wrap search elements grid in <form onSubmit={handleSearchSubmit}> and add onKeyDown to Location input
const oldFormArea = `{/* 2. Floating Search Elements Grid (No Outer Bounding Container) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">`;

const newFormArea = `{/* 2. Floating Search Elements Grid (No Outer Bounding Container) */}
            <form 
              onSubmit={handleSearchSubmit}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
            >`;

if (heroContent.includes(oldFormArea)) {
  heroContent = heroContent.replace(oldFormArea, newFormArea);
  // Also replace closing </div> of that grid
  heroContent = heroContent.replace(
    /({\/\* Dynamic Results Button \(Pearl White Pill\) \}[\s\S]*?<\/motion\.button>\s*<\/div>\s*)<\/div>/,
    '$1</form>'
  );
  console.log('Wrapped Hero search controls in <form onSubmit={handleSearchSubmit}>');
}

// Ensure button has type="submit"
heroContent = heroContent.replace(
  /<motion\.button\s+onClick=\{handleSearchSubmit\}/,
  '<motion.button\n                  type="submit"'
);

// Ensure input has onKeyDown
if (!heroContent.includes("if (e.key === 'Enter')")) {
  heroContent = heroContent.replace(
    /onFocus=\{\(\) => setShowLocationDropdown\(true\)\}/,
    `onFocus={() => setShowLocationDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setShowLocationDropdown(false);
                        handleSearchSubmit(e);
                      }
                    }}`
  );
  console.log('Added Enter key handling to Hero location input');
}

fs.writeFileSync(heroPath, heroContent, 'utf8');

// 2. Update listPage_fixed_useLocation.jsx
const listPagePath = path.join(__dirname, '../src/routes/listPage/listPage_fixed_useLocation.jsx');
let listPageContent = fs.readFileSync(listPagePath, 'utf8');

// Initialize searchQuery from window.location.search
const oldSearchState = "const [searchQuery, setSearchQuery] = useState('');";
const newSearchState = `const [searchQuery, setSearchQuery] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const s = urlParams.get('search') || urlParams.get('location') || urlParams.get('q');
      return s ? decodeURIComponent(s) : '';
    } catch (_) {
      return '';
    }
  });`;

if (listPageContent.includes(oldSearchState)) {
  listPageContent = listPageContent.replace(oldSearchState, newSearchState);
  console.log('Updated searchQuery initial state in listPage');
}

// Update URL params effect in listPage
const oldUrlEffectRegex = /\/\/ Handle URL search parameters\s*useEffect\(\(\) => {[\s\S]*?}, \[location\.search\]\);/;
const newUrlEffect = `// Handle URL search parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search') || urlParams.get('location') || urlParams.get('q');
    setSearchQuery(searchParam ? decodeURIComponent(searchParam) : '');

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
    }

    setFilters((prev) => ({
      ...prev,
      ...(listingType && ['rent', 'sale', 'all', 'for-rent', 'for-sale'].includes(listingType.toLowerCase())
        ? { listingType: listingType.toLowerCase().includes('rent') ? 'rent' : (listingType.toLowerCase().includes('sale') ? 'sale' : 'all') }
        : {}),
      ...(propertyType ? { propertyType: propertyType.toLowerCase() } : {}),
      ...(minBeds ? { minBeds } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
    }));
  }, [location.search]);`;

if (oldUrlEffectRegex.test(listPageContent)) {
  listPageContent = listPageContent.replace(oldUrlEffectRegex, newUrlEffect);
  console.log('Updated location.search useEffect in listPage');
} else {
  console.warn('Could not find location.search useEffect in listPage');
}

// Also support hasVideo URL parameter in filtering
if (!listPageContent.includes("urlParams.get('hasVideo')") && !listPageContent.includes("hasVideoFilter")) {
  listPageContent = listPageContent.replace(
    /if \(searchQuery\) {/,
    `const urlParamsCheck = new URLSearchParams(location.search);
    if (urlParamsCheck.get('hasVideo') === 'true') {
      filtered = filtered.filter(p => p.tiktok_url || p.video_url || p.videoUrl || p.hasVideo || (Array.isArray(p.media) && p.media.some(m => m.type === 'video')));
    }

    if (searchQuery) {`
  );
  console.log('Added hasVideo support to listPage filtering');
}

fs.writeFileSync(listPagePath, listPageContent, 'utf8');

// 3. Update MobilePropertyList.jsx
const mobileListPath = path.join(__dirname, '../src/mobile/pages/MobilePropertyList.jsx');
let mobileContent = fs.readFileSync(mobileListPath, 'utf8');

// Ensure useLocation is imported
if (!mobileContent.includes('useLocation')) {
  mobileContent = mobileContent.replace(
    /import { useNavigate } from ["']react-router-dom["'];/,
    "import { useNavigate, useLocation } from 'react-router-dom';"
  );
  console.log('Added useLocation import to MobilePropertyList.jsx');
}

// Add const location = useLocation();
if (!mobileContent.includes('const location = useLocation();')) {
  mobileContent = mobileContent.replace(
    /const navigate = useNavigate\(\);/,
    'const navigate = useNavigate();\n  const location = useLocation();'
  );
  console.log('Added location = useLocation() in MobilePropertyList.jsx');
}

// Update searchQuery initial state in MobilePropertyList.jsx
mobileContent = mobileContent.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  `const [searchQuery, setSearchQuery] = useState(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('search') || p.get('location') || p.get('q');
      return s ? decodeURIComponent(s) : '';
    } catch (_) {
      return '';
    }
  });`
);

// Update effect in MobilePropertyList.jsx to listen to location.search
mobileContent = mobileContent.replace(
  /useEffect\(\(\) => {[\s\S]*?}, \[window\.location\.search\]\);/,
  `useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search') || params.get('location') || params.get('q');
    setSearchQuery(searchParam ? decodeURIComponent(searchParam) : '');

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
      ...(dealParam ? { status: dealParam.includes('sale') ? 'for-sale' : 'for-rent' } : {}),
      ...(bedParam ? { minBedrooms: bedParam } : {}),
      ...(minP ? { minPrice: minP } : {}),
      ...(maxP ? { maxPrice: maxP } : {})
    }));
  }, [location.search]);`
);

fs.writeFileSync(mobileListPath, mobileContent, 'utf8');

console.log('All search porting updates successfully applied!');
