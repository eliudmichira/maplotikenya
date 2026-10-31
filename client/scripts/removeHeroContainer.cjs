const fs = require('fs');

const heroFile = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src/components/hero/Hero.jsx';
let content = fs.readFileSync(heroFile, 'utf8').replace(/\r\n/g, '\n');

const oldSectionRegex = /\{\/\* Enhanced Premium Search Section \*\/\}[\s\S]*?\{\/\* Enhanced Stats Section \*\/\}/;

const newFloatingSection = `{/* Enhanced Premium Search Section (Floating Elements — No Outer Box) */}
          <motion.div
            className="mb-8 max-w-6xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            {/* 1. Transaction Intent Tabs (Rent / Buy / Plots & Land) */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1.5 rounded-full bg-black/40 backdrop-blur-2xl border border-white/20 shadow-xl">
                <button
                  type="button"
                  onClick={() => { setDealType('rent'); setSearchForm(p => ({ ...p, priceRange: '' })); }}
                  className={\`px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 \${
                    dealType === 'rent'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-300 hover:text-white'
                  }\`}
                >
                  For Rent
                </button>
                <button
                  type="button"
                  onClick={() => { setDealType('sale'); setSearchForm(p => ({ ...p, priceRange: '' })); }}
                  className={\`px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 \${
                    dealType === 'sale'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-300 hover:text-white'
                  }\`}
                >
                  For Sale
                </button>
                <button
                  type="button"
                  onClick={() => { setDealType('land'); setSearchForm(p => ({ ...p, propertyType: '', bedrooms: '', priceRange: '' })); }}
                  className={\`px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 \${
                    dealType === 'land'
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-300 hover:text-white'
                  }\`}
                >
                  Plots & Land
                </button>
              </div>
            </div>

            {/* 2. Floating Search Elements Grid (No Outer Bounding Container) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">

              {/* Location Input */}
              <div className="relative text-left">
                <label className="block text-sm font-semibold mb-2 text-white">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300" />
                  <input
                    type="text"
                    value={searchForm.location}
                    onFocus={() => setShowLocationDropdown(true)}
                    onChange={(e) => {
                      handleSearchChange('location', e.target.value);
                      setShowLocationDropdown(true);
                    }}
                    placeholder="e.g. Kilimani, Westlands..."
                    className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white placeholder-zinc-400 font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 transition-all hover:border-white/40 shadow-lg"
                  />
                  {searchForm.location && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('location', '')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showLocationDropdown && (
                  <div 
                    className="absolute left-0 right-0 top-full mt-2 bg-zinc-950/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="text-[10px] uppercase font-bold text-zinc-400 px-3 py-1.5 tracking-wider">
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
                          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
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
              <div className="relative text-left">
                <label className="block text-sm font-semibold mb-2 text-white">
                  {dealType === 'land' ? 'Plot Type' : 'Property Type'}
                </label>
                <div className="relative">
                  <Home className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300" />
                  <select
                    value={searchForm.propertyType}
                    onChange={(e) => handleSearchChange('propertyType', e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 appearance-none cursor-pointer transition-all hover:border-white/40 shadow-lg"
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
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Bedrooms / Budget Filter */}
              <div className="relative text-left">
                <label className="block text-sm font-semibold mb-2 text-white">
                  {dealType === 'land' ? 'Budget' : 'Bedrooms'}
                </label>
                <div className="relative">
                  {dealType === 'land' ? (
                    <TrendingUp className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300" />
                  ) : (
                    <Bed className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-300" />
                  )}
                  {dealType === 'land' ? (
                    <select
                      value={searchForm.priceRange}
                      onChange={(e) => handleSearchChange('priceRange', e.target.value)}
                      className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 appearance-none cursor-pointer transition-all hover:border-white/40 shadow-lg"
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
                      className="w-full pl-12 pr-10 py-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl text-white font-medium text-base focus:outline-none focus:border-white focus:bg-black/60 appearance-none cursor-pointer transition-all hover:border-white/40 shadow-lg"
                    >
                      <option value="" className="bg-zinc-900 text-white">Any Bedrooms</option>
                      <option value="studio" className="bg-zinc-900 text-white">Studio / Bedsitter</option>
                      <option value="1" className="bg-zinc-900 text-white">1 Bedroom</option>
                      <option value="2" className="bg-zinc-900 text-white">2 Bedrooms</option>
                      <option value="3" className="bg-zinc-900 text-white">3 Bedrooms</option>
                      <option value="4+" className="bg-zinc-900 text-white">4+ Bedrooms</option>
                    </select>
                  )}
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Results Button (Pearl White Pill) */}
              <div className="flex flex-col justify-end">
                <motion.button
                  onClick={handleSearchSubmit}
                  className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-4 px-6 rounded-full flex items-center justify-center gap-2.5 text-base shadow-xl shadow-black/40 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  <Search className="w-5 h-5 text-black" />
                  <span>
                    {matchingCount > 0
                      ? \`\${matchingCount} Properties\`
                      : 'Search Properties'}
                  </span>
                </motion.button>
              </div>
            </div>

            {/* 3. Floating Quick-Tag Micro Pills Below */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => navigate('/properties?hasVideo=true')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all shadow-sm"
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
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-black/40 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/15 backdrop-blur-md transition-all"
                >
                  {estate}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Stats Section */}`;

if (oldSectionRegex.test(content)) {
  content = content.replace(oldSectionRegex, newFloatingSection);
  fs.writeFileSync(heroFile, content, 'utf8');
  console.log('Successfully removed outer bounding box container from Hero search');
} else {
  console.log('oldSectionRegex did not match');
}
