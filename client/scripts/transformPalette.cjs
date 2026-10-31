const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src';

// ==========================================
// 1. UPDATE HomePage.jsx
// ==========================================
const homePagePath = path.join(srcDir, 'routes/homePage/HomePage.jsx');
let home = fs.readFileSync(homePagePath, 'utf8');

// Replace "Popular Areas" gradient text
home = home.replace(
  /Popular\s*\{\' \'\}[^<]*<span className="bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] bg-clip-text text-transparent">\s*Areas\s*<\/span>/g,
  'Popular Areas'
);

// Replace "Explore by Property Type" gradient text
home = home.replace(
  /<span className="bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] bg-clip-text text-transparent">\s*Property Type\s*<\/span>/g,
  'Property Type'
);

// Replace "Why MaplotiKenya" gradient text & tags
home = home.replace(
  /<span className="bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] bg-clip-text text-transparent">/g,
  '<span className="text-white">'
);
home = home.replace(/text-\[#fbbf24\]/g, 'text-white');
home = home.replace(/border-\[#fbbf24\]\/30/g, 'border-white/20');
home = home.replace(/border-\[#fbbf24\]/g, 'border-white/40');
home = home.replace(/hover:border-\[#fbbf24\]\/[0-9]+/g, 'hover:border-white/40');
home = home.replace(/hover:border-\[#fbbf24\]/g, 'hover:border-white/40');
home = home.replace(/bg-\[#fbbf24\]\/[0-9]+/g, 'bg-white/10');

// Replace Criteria tabs in Popular Areas
home = home.replace(
  /'bg-gradient-to-b from-\[#fbbf24\] to-\[#f59e0b\] text-\[#0e1311\] border-transparent shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.55\),0_6px_16px_-6px_rgba\(251,191,36,0\.5\)\]'/g,
  "isDark ? 'bg-white text-black font-semibold border-white shadow-sm' : 'bg-black text-white font-semibold border-black shadow-sm'"
);

// Replace [Browse all areas] button with Smoked Obsidian Glass Pill
home = home.replace(
  /className="inline-flex items-center gap-2 px-7 py-3\.5 rounded-full text-sm font-semibold transition-all duration-300 group\/link bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] text-\[#000000\] hover:shadow-lg hover:shadow-\[#000000\]\/25 hover:scale-105"/g,
  'className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 group/link bg-gradient-to-b from-[#27272a] to-[#141416] text-white border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_12px_rgba(0,0,0,0.3)] hover:border-white/35 hover:scale-105"'
);

// Replace CTA Buttons in HomePage
home = home.replace(
  /className="px-6 py-3 bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] font-medium rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-2"/g,
  'className="px-8 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transform hover:scale-105 transition-all duration-300 flex items-center gap-2 shadow-sm"'
);
home = home.replace(
  /className="px-6 py-3 font-semibold rounded-full transition-all duration-300 flex items-center gap-2 text-\[#0e1311\] bg-gradient-to-b from-\[#fbbf24\] to-\[#f59e0b\] shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.55\),0_8px_20px_-6px_rgba\(251,191,36,0\.45\)\] hover:brightness-110 hover:-translate-y-0\.5"/g,
  'className="px-8 py-3.5 font-semibold rounded-full transition-all duration-300 flex items-center gap-2 text-white bg-gradient-to-b from-[#27272a] to-[#141416] border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_12px_rgba(0,0,0,0.3)] hover:border-white/35 hover:-translate-y-0.5"'
);
home = home.replace(
  /className="group relative flex items-center justify-center px-8 py-4 bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] font-semibold rounded-full overflow-hidden"/g,
  'className="group relative flex items-center justify-center px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 transition-all shadow-sm overflow-hidden"'
);
home = home.replace(
  /className=\{\`flex items-center justify-center px-8 py-4 border-2 border-\[#fbbf24\] rounded-full font-semibold transition-colors duration-300 hover:bg-\[#fbbf24\] hover:text-\[#111\] \$\{isDark \? 'text-white' : 'text-gray-900'\}\`\}/g,
  "className={`flex items-center justify-center px-8 py-4 rounded-full font-semibold transition-all duration-300 bg-gradient-to-b from-[#27272a] to-[#141416] text-white border border-white/20 hover:border-white/40 hover:scale-[1.02]`}"
);

// Clean up any remaining amber gradients in home
home = home.replace(/from-\[#fbbf24\] to-\[#f59e0b\]/g, 'from-[#ffffff] to-[#e4e4e7]');
home = home.replace(/bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\]/g, 'bg-white text-black');
home = home.replace(/bg-gradient-to-b from-\[#fbbf24\] to-\[#f59e0b\]/g, 'bg-white text-black');
home = home.replace(/shadow-\[#fbbf24\]\/[0-9]+/g, 'shadow-black/30');

// Replace green background #0e1311 with clean neutral black #0a0a0a
home = home.replace(/bg-\[#0e1311\]/g, 'bg-[#0a0a0a]');

fs.writeFileSync(homePagePath, home, 'utf8');
console.log('HomePage.jsx transformed');

// ==========================================
// 2. UPDATE Hero.jsx
// ==========================================
const heroPath = path.join(srcDir, 'components/hero/Hero.jsx');
let hero = fs.readFileSync(heroPath, 'utf8');

// Pulse dot
hero = hero.replace(/bg-\[#fbbf24\]/g, 'bg-white');
hero = hero.replace(/text-\[#fbbf24\]/g, 'text-white');
hero = hero.replace(/group-focus-within:text-\[#fcd34d\]/g, 'group-focus-within:text-white');
hero = hero.replace(/focus:border-\[#fbbf24\]\/[0-9]+/g, 'focus:border-white/50');
hero = hero.replace(/hover:border-\[#fbbf24\]\/[0-9]+/g, 'hover:border-white/30');

// Hero search button
hero = hero.replace(
  /className="w-full bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 text-base shadow-xl shadow-\[#fbbf24\]\/25 relative overflow-hidden"/g,
  'className="w-full bg-white text-black font-bold py-4 px-6 rounded-full flex items-center justify-center gap-3 text-base shadow-xl hover:bg-zinc-200 transition-all relative overflow-hidden"'
);

// Browse Properties button (Smoked Obsidian Glass Pill from screenshot)
hero = hero.replace(
  /className="px-8 py-3 bg-gradient-to-br from-\[#000000\] to-\[#303030\] text-white font-bold rounded-full shadow-lg shadow-\[#000000\]\/25 text-lg relative overflow-hidden block"/g,
  'className="px-8 py-3.5 bg-gradient-to-b from-[#27272a] to-[#141416] text-white font-semibold rounded-full border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_12px_rgba(0,0,0,0.35)] hover:border-white/35 transition-all text-base relative overflow-hidden block"'
);

// List Your Property button (High-Luxe Pearl White Pill)
hero = hero.replace(
  /className="px-8 py-3 bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] font-bold rounded-full shadow-lg shadow-\[#fbbf24\]\/25 hover:shadow-xl transition-all duration-300 text-lg relative overflow-hidden block"/g,
  'className="px-8 py-3.5 bg-white text-black font-semibold rounded-full shadow-lg hover:bg-zinc-200 transition-all duration-300 text-base relative overflow-hidden block"'
);

// Stat number gradient
hero = hero.replace(
  /className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\] bg-clip-text text-transparent mb-1"/g,
  'className="text-4xl md:text-5xl font-bold text-white mb-1"'
);

hero = hero.replace(/from-\[#fbbf24\] to-\[#f59e0b\]/g, 'from-white to-zinc-300');
hero = hero.replace(/shadow-\[#fbbf24\]\/[0-9]+/g, 'shadow-black/25');

fs.writeFileSync(heroPath, hero, 'utf8');
console.log('Hero.jsx transformed');

// ==========================================
// 3. UPDATE Navbar.jsx
// ==========================================
const navbarPath = path.join(srcDir, 'components/navbar/Navbar.jsx');
let navbar = fs.readFileSync(navbarPath, 'utf8');

// Sign in button
navbar = navbar.replace(
  /className="px-5 py-2 bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] rounded-full font-medium hover:shadow-lg transition-all duration-300 relative overflow-hidden block"/g,
  'className="px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 shadow-sm transition-all duration-300 relative overflow-hidden block"'
);
navbar = navbar.replace(
  /className="block w-full text-center px-5 py-3 bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] rounded-full font-medium hover:shadow-lg transition-all"/g,
  'className="block w-full text-center px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-zinc-200 shadow-sm transition-all"'
);

navbar = navbar.replace(/text-\[#fbbf24\]/g, 'text-white');
navbar = navbar.replace(/hover:text-\[#fbbf24\]/g, 'hover:text-white');
navbar = navbar.replace(/border-\[#fbbf24\]\/30/g, 'border-white/20');
navbar = navbar.replace(/border-\[#fbbf24\]/g, 'border-white/50');
navbar = navbar.replace(/bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\]/g, 'bg-zinc-800 text-white');
navbar = navbar.replace(/#fbbf24/g, '#ffffff');

fs.writeFileSync(navbarPath, navbar, 'utf8');
console.log('Navbar.jsx transformed');

// ==========================================
// 4. UPDATE StoriesReelsSection.jsx
// ==========================================
const reelsPath = path.join(srcDir, 'components/StoriesReelsSection.jsx');
let reels = fs.readFileSync(reelsPath, 'utf8');

reels = reels.replace(/bg-amber-400/g, 'bg-white');
reels = reels.replace(/text-amber-400\/[0-9]+/g, 'text-white/80');
reels = reels.replace(/text-amber-400/g, 'text-white');
reels = reels.replace(/text-amber-500/g, 'text-white');
reels = reels.replace(/bg-amber-500\/[0-9]+/g, 'bg-white/10');
reels = reels.replace(/border-amber-500\/[0-9]+/g, 'border-white/20');
reels = reels.replace(/hover:text-amber-400/g, 'hover:text-white');

// WhatsApp button in reels -> High Luxe Pearl White or Smoked Obsidian
reels = reels.replace(
  /className="mt-1 w-full py-2\.5 px-4 rounded-xl bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] hover:brightness-110 text-\[#0e1311\] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-\[0_2px_10px_rgba\(251,191,36,0\.3\)\]"/g,
  'className="mt-1 w-full py-3 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"'
);

// Thumbnail ring
reels = reels.replace(
  /bg-gradient-to-tr from-\[#fbbf24\] via-\[#f59e0b\] to-\[#b45309\]/g,
  'bg-gradient-to-tr from-white via-zinc-400 to-zinc-600'
);

fs.writeFileSync(reelsPath, reels, 'utf8');
console.log('StoriesReelsSection.jsx transformed');

// ==========================================
// 5. UPDATE PropertyStreetView.jsx
// ==========================================
const streetViewPath = path.join(srcDir, 'components/PropertyStreetView.jsx');
let psv = fs.readFileSync(streetViewPath, 'utf8');

psv = psv.replace(
  /const activeCls = 'bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] text-\[#0e1311\] font-bold shadow-\[0_2px_10px_rgba\(251,191,36,0\.35\)\]';/g,
  "const activeCls = 'bg-white text-black font-bold shadow-md';"
);

psv = psv.replace(/bg-amber-400/g, 'bg-white');
psv = psv.replace(/text-amber-400/g, 'text-white');
psv = psv.replace(/bg-amber-500\/[0-9]+/g, 'bg-white/10');
psv = psv.replace(/border-amber-500\/[0-9]+/g, 'border-white/20');

// WhatsApp CTA buttons in PropertyStreetView
psv = psv.replace(
  /className="w-full py-2\.5 px-4 rounded-xl bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] hover:brightness-110 text-\[#0e1311\] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-\[0_2px_10px_rgba\(251,191,36,0\.3\)\] cursor-pointer"/g,
  'className="w-full py-3 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"'
);
psv = psv.replace(
  /className="w-full py-2\.5 px-4 rounded-xl bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] hover:brightness-110 text-\[#0e1311\] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-\[0_2px_10px_rgba\(251,191,36,0\.3\)\] cursor-pointer mt-1"/g,
  'className="w-full py-3 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mt-1"'
);

fs.writeFileSync(streetViewPath, psv, 'utf8');
console.log('PropertyStreetView.jsx transformed');

// ==========================================
// 6. UPDATE propertyDetails.jsx
// ==========================================
const detailsPath = path.join(srcDir, 'routes/propertyDetails/propertyDetails.jsx');
let details = fs.readFileSync(detailsPath, 'utf8');

details = details.replace(/bg-gradient-to-b from-\[#fbbf24\] to-\[#f59e0b\] text-\[#0e1311\] shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.55\),0_8px_20px_-6px_rgba\(251,191,36,0\.45\)\] hover:brightness-110/g, 'bg-white text-black font-bold shadow-md hover:bg-zinc-200');
details = details.replace(/border-2 border-\[#fbbf24\] transition-colors hover:bg-\[#fbbf24\] hover:text-\[#111\]/g, 'border border-white/20 text-white hover:bg-white hover:text-black transition-all');
details = details.replace(/bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\]/g, 'bg-white text-black font-semibold');
details = details.replace(/border-\[#fbbf24\]/g, 'border-white/30');
details = details.replace(/text-\[#fbbf24\]/g, 'text-white');
details = details.replace(/bg-\[#fbbf24\]\/[0-9]+/g, 'bg-white/10');
details = details.replace(/bg-\[#fbbf24\]/g, 'bg-white');

fs.writeFileSync(detailsPath, details, 'utf8');
console.log('propertyDetails.jsx transformed');
