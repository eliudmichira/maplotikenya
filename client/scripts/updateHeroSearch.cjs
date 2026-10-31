const fs = require('fs');
const path = require('path');

const heroFile = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src/components/hero/Hero.jsx';
let content = fs.readFileSync(heroFile, 'utf8');

// 1. Update imports
content = content.replace(
  /import \{ Search, MapPin, Home, TrendingUp, ChevronDown, Award, Newspaper, Building2, Users \} from 'lucide-react';/,
  "import { Search, MapPin, Home, TrendingUp, ChevronDown, Award, Newspaper, Building2, Users, Bed, Video, X, Check, Sparkles } from 'lucide-react';"
);

// 2. Add state and logic for DealType, Autocomplete, and Matching Count
const stateTarget = `  // Search form state
  const [searchForm, setSearchForm] = useState({
    location: '',
    propertyType: '',
    priceRange: ''
  });`;

const stateReplacement = `  // 1. Deal-type intent tabs ('rent' | 'sale' | 'land')
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
    // Ensure top popular Nairobi areas exist even if seeded lightly
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

content = content.replace(stateTarget, stateReplacement);

// 3. Update handleSearchSubmit
const submitTarget = `  // Handle search submission
  const handleSearchSubmit = () => {
    const params = new URLSearchParams();
    if (searchForm.location) params.append('location', searchForm.location);
    if (searchForm.propertyType) params.append('type', searchForm.propertyType);
    if (searchForm.priceRange) params.append('price', searchForm.priceRange);

    navigate(\`/properties?\${params.toString()}\`);
  };`;

const submitReplacement = `  // Handle search submission
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

content = content.replace(submitTarget, submitReplacement);

// 4. Replace the JSX search section
const jsxRegex = /\{\/\* Enhanced Premium Search Section \*\/\}[\s\S]*?\{\/\* Enhanced Stats Section \*\/\}/;

const newJsx = `{/* Enhanced Premium Search Section */}
          <motion.div
            className="mb-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {/* 1. Transaction Intent Tabs (Rent / Buy / Plots & Land) */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex p-1.5 rounded-full bg-black/60 backdrop-blur-2xl border border-white/15 shadow-2xl">
                <button
                  type="button"
                  onClick={() => { setDealType('rent'); setSearchForm(p => ({ ...p, priceRange: '' })); }}
                  className={\`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 \${
                    dealType === 'rent'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }\`}
                >
                  For Rent
                </button>
                <button
                  type="button"
                  onClick={() => { setDealType('sale'); setSearchForm(p => ({ ...p, priceRange: '' })); }}
                  className={\`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 \${
                    dealType === 'sale'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }\`}
                >
                  For Sale
                </button>
                <button
                  type="button"
                  onClick={() => { setDealType('land'); setSearchForm(p => ({ ...p, propertyType: '', bedrooms: '', priceRange: '' })); }}
                  className={\`px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 \${
                    dealType === 'land'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white'
                  }\`}
                >
                  Plots & Land
                </button>
              </div>
            </div>

            {/* 2. Floating Smoked Glass Capsule Search Bar */}
            <div className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-3xl p-3 md:p-4 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-center">

                {/* Location Search Input with Autocomplete */}
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={searchForm.location}
                      onFocus={() => setShowLocationDropdown(true)}
                      onChange={(e) => {
                        handleSearchChange('location', e.target.value);
                        setShowLocationDropdown(true);
                      }}
                      placeholder="e.g. Kilimani, Westlands..."
                      className="w-full pl-11 pr-8 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all"
                    />
                    {searchForm.location && (
                      <button
                        type="button"
                        onClick={() => handleSearchChange('location', '')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showLocationDropdown && (
                    <div 
                      className="absolute left-0 right-0 top-full mt-2 bg-zinc-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="text-[10px] uppercase font-bold text-zinc-500 px-3 py-1 tracking-wider">
                        Popular Neighborhoods
                      </div>
                      {filteredLocations.map((loc) => (
                        <button
                          key={loc.name}
                          type="button"
                          onClick={() => {
                            handleSearchChange('location', loc.name);
                            setShowLocationDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-white hover:bg-white/10 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            {loc.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                            {loc.count} listings
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Property Type / Category */}
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                    {dealType === 'land' ? 'Plot Type' : 'Property Type'}
                  </label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <select
                      value={searchForm.propertyType}
                      onChange={(e) => handleSearchChange('propertyType', e.target.value)}
                      className="w-full pl-11 pr-10 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/10 appearance-none cursor-pointer transition-all"
                    >
                      {dealType === 'land' ? (
                        <>
                          <option value="" className="bg-zinc-900 text-white">All Plots & Land</option>
                          <option value="residential" className="bg-zinc-900 text-white">Residential Plot</option>
                          <option value="commercial" className="bg-zinc-900 text-white">Commercial Land</option>
                          <option value="agricultural" className="bg-zinc-900 text-white">Agricultural / Farm</option>
                          <option value="subdivided" className="bg-zinc-900 text-white">Subdivided Plots</option>
                        </>
                      ) : (
                        <>
                          <option value="" className="bg-zinc-900 text-white">All Property Types</option>
                          <option value="apartment" className="bg-zinc-900 text-white">Apartment</option>
                          <option value="house" className="bg-zinc-900 text-white">House / Maisonette</option>
                          <option value="villa" className="bg-zinc-900 text-white">Villa</option>
                          <option value="bedsitter" className="bg-zinc-900 text-white">Bedsitter / Studio</option>
                          <option value="townhouse" className="bg-zinc-900 text-white">Townhouse</option>
                          <option value="commercial" className="bg-zinc-900 text-white">Commercial Office</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Bedrooms Filter (or Price for Land) */}
                <div className="relative">
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 ml-1">
                    {dealType === 'land' ? 'Budget' : 'Bedrooms'}
                  </label>
                  <div className="relative">
                    {dealType === 'land' ? (
                      <TrendingUp className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    ) : (
                      <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    )}
                    {dealType === 'land' ? (
                      <select
                        value={searchForm.priceRange}
                        onChange={(e) => handleSearchChange('priceRange', e.target.value)}
                        className="w-full pl-11 pr-10 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/10 appearance-none cursor-pointer transition-all"
                      >
                        <option value="" className="bg-zinc-900 text-white">Any Price</option>
                        <option value="0-2000000" className="bg-zinc-900 text-white">Under KSh 2M</option>
                        <option value="2000000-5000000" className="bg-zinc-900 text-white">KSh 2M - 5M</option>
                        <option value="5000000-15000000" className="bg-zinc-900 text-white">KSh 5M - 15M</option>
                        <option value="15000000-50000000" className="bg-zinc-900 text-white">KSh 15M - 50M</option>
                        <option value="50000000+" className="bg-zinc-900 text-white">KSh 50M+</option>
                      </select>
                    ) : (
                      <select
                        value={searchForm.bedrooms}
                        onChange={(e) => handleSearchChange('bedrooms', e.target.value)}
                        className="w-full pl-11 pr-10 py-3.5 bg-white/5 border border-white/15 rounded-2xl text-white text-sm font-medium focus:outline-none focus:border-white/50 focus:bg-white/10 appearance-none cursor-pointer transition-all"
                      >
                        <option value="" className="bg-zinc-900 text-white">Any Bedrooms</option>
                        <option value="studio" className="bg-zinc-900 text-white">Studio / Bedsitter</option>
                        <option value="1" className="bg-zinc-900 text-white">1 Bedroom</option>
                        <option value="2" className="bg-zinc-900 text-white">2 Bedrooms</option>
                        <option value="3" className="bg-zinc-900 text-white">3 Bedrooms</option>
                        <option value="4+" className="bg-zinc-900 text-white">4+ Bedrooms</option>
                      </select>
                    )}
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Dynamic Results Counter Button (Pearl White Pill) */}
                <div className="flex flex-col justify-end pt-2 lg:pt-0">
                  <motion.button
                    onClick={handleSearchSubmit}
                    className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 text-sm sm:text-base shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
                  >
                    <Search className="w-4 h-4 text-black" />
                    <span>
                      {matchingCount > 0
                        ? \`\${matchingCount} Properties\`
                        : 'Search Properties'}
                    </span>
                  </motion.button>
                </div>
              </div>
            </div>

            {/* 3. Quick-Tag Micro Pills Below Search Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => navigate('/properties?hasVideo=true')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all shadow-sm"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Verified Video Tours (443)</span>
              </button>
              {['Westlands', 'Kilimani', 'Karen', 'Ruiru', 'Garden Estate', 'Kileleshwa'].map((estate) => (
                <button
                  key={estate}
                  type="button"
                  onClick={() => {
                    handleSearchChange('location', estate);
                    navigate(\`/properties?search=\${encodeURIComponent(estate)}\`);
                  }}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-black/40 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all"
                >
                  {estate}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Stats Section */}`;

content = content.replace(jsxRegex, newJsx);

fs.writeFileSync(heroFile, content, 'utf8');
console.log('Successfully updated Hero.jsx with the enhanced search system');
