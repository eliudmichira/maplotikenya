const fs = require('fs');
const path = require('path');

const srcDir = 'c:/Users/User/Documents/GitHub/Maploti-new/client/src';

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
console.log(`Scanning ${allFiles.length} files...`);

let updatedCount = 0;

allFiles.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // 1. SPECIFIC COMPONENT REPLACEMENTS
  if (filePath.endsWith('Preloader.jsx')) {
    // Spinner & ring borders
    content = content.replace(/border-\[#fbbf24\]\/20/g, 'border-white/20');
    content = content.replace(/border-t-\[#fbbf24\]/g, 'border-t-white');
    content = content.replace(/bg-\[#fbbf24\]/g, 'bg-white');
    content = content.replace(/bg-\[#fbbf24\]\/40/g, 'bg-white/30');
    content = content.replace(/from-\[#fbbf24\] to-\[#f59e0b\]/g, 'from-white to-zinc-300');
    content = content.replace(/border-\[#fbbf24\]/g, 'border-white/30');
  }

  if (filePath.endsWith('listPage_fixed_useLocation.jsx')) {
    // Floating Watch Site Tours button (matches the smoked obsidian pill from user screenshot)
    content = content.replace(
      /'bg-gradient-to-b from-\[#fbbf24\] to-\[#f59e0b\] text-\[#0e1311\] shadow-\[inset_0_1px_0_rgba\(255,255,255,0\.55\),0_8px_20px_-6px_rgba\(251,191,36,0\.45\)\] hover:brightness-110 hover:-translate-y-0\.5'/g,
      "'bg-gradient-to-b from-[#27272a] to-[#141416] text-white border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_4px_12px_rgba(0,0,0,0.35)] hover:border-white/35 hover:-translate-y-0.5'"
    );

    // Site Walkthroughs banner
    content = content.replace(
      /className="hidden lg:flex mt-2 w-full items-center gap-2 px-3 py-2 rounded-lg text-\[11px\] font-medium bg-amber-500\/10 text-amber-400 border border-amber-500\/20 hover:bg-amber-500\/20 transition-colors cursor-pointer"/g,
      'className="hidden lg:flex mt-2 w-full items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium bg-white/5 text-white/90 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"'
    );

    // Get Started button in listPage header
    content = content.replace(
      /className="px-6 py-2\.5 bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] text-\[#111\] rounded-full text-base font-semibold hover:shadow-lg hover:shadow-\[#000000\]\/30 transition-all duration-300"/g,
      'className="px-6 py-2.5 bg-white text-black rounded-full text-base font-semibold hover:bg-zinc-200 shadow-sm transition-all duration-300"'
    );

    // Market Insights icon
    content = content.replace(
      /bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\] rounded-full flex items-center justify-center/g,
      'bg-zinc-800 text-white border border-white/20 rounded-full flex items-center justify-center'
    );
  }

  // 2. GENERAL AMBER & ACCENT STRIPPING ACROSS ENTIRE CODEBASE
  // High-priority button gradients -> Pearl White or Smoked Obsidian
  content = content.replace(/bg-gradient-to-r from-\[#fbbf24\] to-\[#f59e0b\]/g, 'bg-white text-black font-semibold');
  content = content.replace(/bg-gradient-to-br from-\[#fbbf24\] to-\[#f59e0b\]/g, 'bg-white text-black font-semibold');
  content = content.replace(/bg-gradient-to-b from-\[#fbbf24\] to-\[#f59e0b\]/g, 'bg-white text-black font-semibold');
  content = content.replace(/from-\[#fbbf24\] to-\[#f59e0b\]/g, 'from-white to-zinc-300');
  content = content.replace(/from-\[#fbbf24\] via-\[#f59e0b\]/g, 'from-white via-zinc-400');

  // Amber shadows
  content = content.replace(/shadow-\[#fbbf24\]\/[0-9]+/g, 'shadow-black/20');
  content = content.replace(/shadow-\[0_8px_20px_-6px_rgba\(251,191,36,0\.45\)\]/g, 'shadow-md');
  content = content.replace(/shadow-\[0_2px_10px_rgba\(251,191,36,0\.3\)\]/g, 'shadow-sm');

  // Amber text and fills
  content = content.replace(/text-\[#fbbf24\]/g, 'text-white');
  content = content.replace(/text-\[#f59e0b\]/g, 'text-white/80');
  content = content.replace(/text-amber-400\/[0-9]+/g, 'text-white/70');
  content = content.replace(/text-amber-400/g, 'text-white');
  content = content.replace(/text-amber-500/g, 'text-white');
  content = content.replace(/text-amber-600/g, 'text-zinc-300');
  content = content.replace(/hover:text-amber-400/g, 'hover:text-white');
  content = content.replace(/hover:text-\[#fbbf24\]/g, 'hover:text-white');
  content = content.replace(/hover:text-\[#fcd34d\]/g, 'hover:text-white');

  // Amber backgrounds and chips
  content = content.replace(/bg-amber-400/g, 'bg-white');
  content = content.replace(/bg-amber-500\/[0-9]+/g, 'bg-white/10');
  content = content.replace(/bg-amber-500/g, 'bg-zinc-800');
  content = content.replace(/bg-amber-100/g, 'bg-zinc-800');
  content = content.replace(/bg-amber-50/g, 'bg-white/5');
  content = content.replace(/bg-\[#fbbf24\]\/[0-9]+/g, 'bg-white/10');
  content = content.replace(/bg-\[#fbbf24\]/g, 'bg-white');

  // Amber borders
  content = content.replace(/border-amber-500\/[0-9]+/g, 'border-white/15');
  content = content.replace(/border-amber-500/g, 'border-white/20');
  content = content.replace(/border-amber-200/g, 'border-white/15');
  content = content.replace(/border-\[#fbbf24\]\/[0-9]+/g, 'border-white/15');
  content = content.replace(/border-\[#fbbf24\]/g, 'border-white/30');
  content = content.replace(/hover:border-\[#fbbf24\]\/[0-9]+/g, 'hover:border-white/30');
  content = content.replace(/hover:border-\[#fbbf24\]/g, 'hover:border-white/40');
  content = content.replace(/focus:border-\[#fbbf24\]\/[0-9]+/g, 'focus:border-white/40');
  content = content.replace(/focus:border-\[#fbbf24\]/g, 'focus:border-white/50');

  // Old green #0e1311 background in dark mode -> pure obsidian #0a0a0a / #000000
  content = content.replace(/bg-\[#0e1311\]\/80/g, 'bg-black/80');
  content = content.replace(/bg-\[#0e1311\]/g, 'bg-[#0a0a0a]');
  content = content.replace(/text-\[#0e1311\]/g, 'text-black');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedCount++;
    console.log(`Updated: ${path.relative(srcDir, filePath)}`);
  }
});

console.log(`\nSuccessfully updated ${updatedCount} files across the entire application.`);
