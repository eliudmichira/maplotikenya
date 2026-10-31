const fs = require('fs');
const path = require('path');

// 1. Update firebaseAPI.js to import instagramCatalog and resolve getById
const firebaseApiPath = path.join(__dirname, '../src/lib/firebaseAPI.js');
let fbCode = fs.readFileSync(firebaseApiPath, 'utf8');

if (!fbCode.includes("import instagramCatalog from '../utils/instagramCatalog.json'")) {
  fbCode = "import instagramCatalog from '../utils/instagramCatalog.json';\n" + fbCode;
}

const oldGetById = `  // Get property by ID
  getById: async (id) => {
    try {
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const [cleaned] = cleanAndDeduplicateProperties([raw]);
        return cleaned || raw;
      } else {
        throw new Error('Property not found');
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },`;

const newGetById = `  // Get property by ID (supports Firestore documents, Instagram listings, and TikToks)
  getById: async (id) => {
    try {
      if (!id) throw new Error('Property ID is required');

      // 1. Check Instagram catalog
      if (Array.isArray(instagramCatalog)) {
        const igMatch = instagramCatalog.find(
          p => p.id === id || p.code === id || p.id === \`ig_\${id}\` || p.code === id.replace('ig_', '')
        );
        if (igMatch) {
          const [cleaned] = cleanAndDeduplicateProperties([igMatch]);
          return cleaned || igMatch;
        }
      }

      // 2. Query Firestore listings
      const docRef = doc(db, 'listings', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const raw = { id: docSnap.id, ...docSnap.data() };
        const [cleaned] = cleanAndDeduplicateProperties([raw]);
        return cleaned || raw;
      }

      // 3. Fallback: loose matching by title in Instagram catalog
      if (Array.isArray(instagramCatalog)) {
        const looseMatch = instagramCatalog.find(
          p => p.title?.toLowerCase().includes(String(id).toLowerCase())
        );
        if (looseMatch) {
          const [cleaned] = cleanAndDeduplicateProperties([looseMatch]);
          return cleaned || looseMatch;
        }
      }

      throw new Error('Property not found');
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },`;

const norm = s => s.replace(/\r\n/g, '\n');
if (norm(fbCode).includes(norm(oldGetById))) {
  fbCode = norm(fbCode).replace(norm(oldGetById), norm(newGetById));
  fs.writeFileSync(firebaseApiPath, fbCode, 'utf8');
  console.log('Successfully updated propertiesAPI.getById in firebaseAPI.js');
} else {
  console.log('getById pattern not matched, checking manual replace...');
  fbCode = fbCode.replace(/getById:\s*async\s*\(id\)\s*=>\s*\{[\s\S]*?throw error;\s*\}\s*\},/, newGetById);
  fs.writeFileSync(firebaseApiPath, fbCode, 'utf8');
  console.log('Replaced getById with regex');
}

// 2. Update propertyDetails.jsx with PropertyDetailsSkeleton
const detailsPath = path.join(__dirname, '../src/routes/propertyDetails/propertyDetails.jsx');
let detailsCode = fs.readFileSync(detailsPath, 'utf8');

const skeletonComponent = `
function PropertyDetailsSkeleton({ isDark }) {
  return (
    <div className={\`min-h-screen pt-28 pb-16 \${isDark ? 'bg-[#000000]' : 'bg-gray-50'}\`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between mb-6 animate-pulse">
          <div className={\`h-8 w-32 rounded-lg \${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}\`}></div>
          <div className="flex items-center gap-3">
            <div className={\`h-9 w-9 rounded-lg \${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}\`}></div>
            <div className={\`h-9 w-9 rounded-lg \${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}\`}></div>
            <div className={\`h-9 w-9 rounded-full \${isDark ? 'bg-zinc-800/80' : 'bg-gray-200'}\`}></div>
          </div>
        </div>

        {/* Two-column layout matching the real page */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Photo Gallery skeleton */}
            <div className={\`relative rounded-3xl overflow-hidden aspect-[16/10] sm:aspect-[16/9] border \${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-gray-200 border-gray-300'}\`}>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
              {/* Center Brand Spinner */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative flex items-center justify-center mb-3">
                  <div className="w-14 h-14 rounded-full border-2 border-white/10 border-t-white animate-spin"></div>
                  <div className="absolute w-8 h-8 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>
                  </div>
                </div>
                <div className="text-center">
                  <span className={\`text-xs font-semibold tracking-wider uppercase \${isDark ? 'text-zinc-300' : 'text-gray-700'}\`}>
                    Loading Property Details...
                  </span>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Fetching verified listing & tour media</div>
                </div>
              </div>
              {/* Badges placeholder */}
              <div className="absolute top-4 left-4 flex gap-2">
                <div className={\`h-6 w-20 rounded-md \${isDark ? 'bg-zinc-800/90' : 'bg-white/80'}\`}></div>
                <div className={\`h-6 w-16 rounded-md \${isDark ? 'bg-zinc-800/90' : 'bg-white/80'}\`}></div>
              </div>
            </div>

            {/* Thumbnail strip skeleton */}
            <div className="flex gap-2.5 overflow-hidden animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={\`h-16 w-20 rounded-xl flex-shrink-0 \${isDark ? 'bg-zinc-800/60' : 'bg-gray-200'}\`}></div>
              ))}
            </div>

            {/* Title & Price Card skeleton */}
            <div className={\`rounded-2xl p-6 border \${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-4 animate-pulse\`}>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-2 flex-1">
                  <div className={\`h-7 w-3/4 rounded-lg \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
                  <div className={\`h-4 w-1/3 rounded-md \${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}\`}></div>
                </div>
                <div className={\`h-8 w-36 rounded-lg \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
              </div>

              {/* 4 Feature stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={\`h-20 rounded-xl \${isDark ? 'bg-zinc-900/60' : 'bg-gray-100'}\`}></div>
                ))}
              </div>
            </div>

            {/* Description Card skeleton */}
            <div className={\`rounded-2xl p-6 border \${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-3 animate-pulse\`}>
              <div className={\`h-5 w-28 rounded \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
              <div className={\`h-4 w-full rounded \${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}\`}></div>
              <div className={\`h-4 w-5/6 rounded \${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}\`}></div>
              <div className={\`h-4 w-3/4 rounded \${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}\`}></div>
            </div>
          </div>

          {/* Right column: Sticky Agent Card skeleton */}
          <div className="space-y-6">
            <div className={\`rounded-2xl p-6 border \${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-4 text-center animate-pulse\`}>
              <div className={\`w-20 h-20 rounded-full mx-auto \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
              <div className={\`h-5 w-32 rounded mx-auto \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
              <div className={\`h-3 w-40 rounded mx-auto \${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}\`}></div>
              <div className="space-y-2.5 pt-2">
                <div className={\`h-11 w-full rounded-full \${isDark ? 'bg-zinc-800' : 'bg-gray-300'}\`}></div>
                <div className={\`h-11 w-full rounded-full \${isDark ? 'bg-zinc-800/60' : 'bg-gray-200'}\`}></div>
                <div className={\`h-11 w-full rounded-full \${isDark ? 'bg-zinc-800/60' : 'bg-gray-200'}\`}></div>
              </div>
            </div>

            <div className={\`rounded-2xl p-6 border \${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-gray-200'} space-y-3 animate-pulse\`}>
              <div className={\`h-5 w-32 rounded \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex justify-between items-center py-1.5">
                  <div className={\`h-3.5 w-20 rounded \${isDark ? 'bg-zinc-800/60' : 'bg-gray-100'}\`}></div>
                  <div className={\`h-3.5 w-16 rounded \${isDark ? 'bg-zinc-800' : 'bg-gray-200'}\`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

const oldLoaderBlock = `  if (!property) {
    return (
      <div className={\`min-h-screen pt-32 pb-8 overflow-y-auto \${isDark ? 'bg-[#000000]' : 'bg-gray-50'}\`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className={\`w-16 h-16 \${isDark ? 'bg-[#0a0a0a]' : 'bg-gray-200'} rounded-full mx-auto mb-4 animate-pulse\`}></div>
            <div className={isDark ? 'text-[#ccc]' : 'text-gray-500'}>Loading property details...</div>
          </div>
        </div>
      </div>
    );
  }`;

const newLoaderBlock = `  if (!property) {
    return <PropertyDetailsSkeleton isDark={isDark} />;
  }`;

if (norm(detailsCode).includes(norm(oldLoaderBlock))) {
  detailsCode = norm(detailsCode).replace(norm(oldLoaderBlock), newLoaderBlock);
  detailsCode = skeletonComponent + '\n' + detailsCode;
  fs.writeFileSync(detailsPath, detailsCode, 'utf8');
  console.log('Successfully replaced old dreary loader with luxury PropertyDetailsSkeleton!');
} else {
  console.log('Old loader block not matched via exact string, using regex...');
  detailsCode = detailsCode.replace(
    /if\s*\(!property\)\s*\{\s*return\s*\([\s\S]*?Loading property details\.\.\.[\s\S]*?\);\s*\}/,
    newLoaderBlock
  );
  detailsCode = skeletonComponent + '\n' + detailsCode;
  fs.writeFileSync(detailsPath, detailsCode, 'utf8');
  console.log('Replaced with regex');
}
