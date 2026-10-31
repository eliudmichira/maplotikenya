const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/routes/propertyDetails/propertyDetails.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Fix buildSvgAvatar to monochrome
content = content.replace(
  /const bg = '#fbbf24';\s*const fg = '#0e1311';\s*const svg = `<\?xml version="1.0" encoding="UTF-8"\?>\s*<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="150" height="150" viewBox="0 0 150 150">\s*<rect width="150" height="150" rx="16" fill="\$\{bg\}"\/>/,
  `const bg = isDark ? '#ffffff' : '#18181b';
    const fg = isDark ? '#000000' : '#ffffff';
    const svg = \`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
  <circle cx="75" cy="75" r="75" fill="\${bg}"/>\`
`
);

// 2. Fix AgentContactCard container border
content = content.replace(
  "border-[rgba(251,191,36,0.2)]",
  "border-white/10"
);

// 3. Fix call button in AgentContactCard
content = content.replace(
  /className=\{`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-outfit font-medium transition-all duration-200 \$\{isDark\s*\?\s*'bg-black text-white dark:bg-white dark:text-black hover:bg-\[#45e595\]'\s*:\s*'bg-emerald-600 text-white hover:bg-emerald-700'\s*\}`\}/,
  "className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full font-outfit font-bold transition-all duration-200 ${isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'} shadow-md`}"
);

// 4. Fix Send Message & Send Email buttons in AgentContactCard
content = content.replace(
  /isDark\s*\?\s*'border border-white\/30 text-white hover:bg-\[rgba\(251,191,36,0\.1\)\]'\s*:\s*'border border-white\/30 text-\[#b45309\] hover:bg-\[rgba\(251,191,36,0\.08\)\]'/g,
  "isDark ? 'border border-white/20 text-white hover:bg-white/10' : 'border border-zinc-300 text-zinc-900 hover:bg-zinc-100'"
);

// 5. Fix listingLabel badge at line 974
content = content.replace(
  "bg-zinc-800 text-amber-800",
  "bg-zinc-100 text-zinc-900 border border-zinc-200"
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('propertyDetails.jsx successfully updated to clean monochrome!');
