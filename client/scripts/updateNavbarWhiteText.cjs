const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/components/navbar/Navbar.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Update navItems
content = content.replace(
  /const navItems = \[\s*\{\s*label:\s*'Properties',\s*to:\s*'\/properties'\s*\},/,
  "const navItems = [\n    { label: 'Properties', to: '/properties' },\n    { label: 'Services', to: '/services' },"
);

// 2. Add useWhiteNavText
content = content.replace(
  'const isHeroTransparent = isHomePage && !isScrolled && !isMenuOpen;',
  'const isHeroTransparent = isHomePage && !isScrolled && !isMenuOpen;\n  const useWhiteNavText = isHeroTransparent || isDark;'
);

// 3. Update Logo
content = content.replace(
  'className={`group-hover:opacity-80 transition-all duration-300 ${isDark ? "text-white" : "text-gray-900"}',
  'className={`group-hover:opacity-80 transition-all duration-300 ${useWhiteNavText ? "text-white" : "text-gray-900"}'
);
content = content.replace(
  /isDark=\{isDark\}\s*responsiveCompact=\{false\}/,
  'isDark={useWhiteNavText}\n                  responsiveCompact={false}'
);

// 4. Update Nav Links text
content = content.replace(
  /className=\{`font-medium transition-all duration-300 relative group \$\{isDark\s*\?\s*"text-white hover:text-white"\s*:\s*"text-gray-600 hover:text-gray-900"\s*\}`\}/,
  'className={`font-medium transition-all duration-300 relative group ${useWhiteNavText ? "text-white hover:text-white" : "text-gray-700 hover:text-gray-900"}`}'
);

// 5. Update bottom indicator line
content = content.replace(
  'className="absolute -bottom-1 left-0 h-0.5 bg-[#000000]"',
  'className={`absolute -bottom-1 left-0 h-0.5 ${useWhiteNavText ? "bg-white" : "bg-black"}`}'
);

// 6. Update theme button text
content = content.replace(
  /isDark\s*\?\s*"text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500\/10 hover:shadow-\[0_4px_16px_rgba\(251,191,36,0\.3\)\]"\s*:\s*"text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-100 hover:bg-gray-200\/50 dark:hover:bg-gray-700\/30 hover:shadow-\[0_4px_16px_rgba\(0,0,0,0\.1\)\]"/,
  'useWhiteNavText ? "text-white hover:text-white/80 hover:bg-white/10" : "text-gray-800 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-100 hover:bg-gray-200/50"'
);

// 7. Update User info text
content = content.replace(
  'className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}',
  'className={`text-sm font-semibold ${useWhiteNavText ? "text-white" : "text-gray-900"}`}'
);
content = content.replace(
  'className={`text-xs ${isDark ? "text-white/60" : "text-gray-500"}`}',
  'className={`text-xs ${useWhiteNavText ? "text-white/70" : "text-gray-500"}`}'
);
content = content.replace(
  "${isDark ? 'text-white/60' : 'text-gray-500'}`}",
  "${useWhiteNavText ? 'text-white/80' : 'text-gray-500'}`}"
);

// 8. Update Sign In button
content = content.replace(
  'className={`${isDark ? "text-white hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors duration-300`}',
  'className={`${useWhiteNavText ? "text-white hover:text-white/80" : "text-gray-700 hover:text-gray-900"} font-medium transition-colors duration-300`}'
);

// 9. Update hamburger button
content = content.replace(
  'className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full transition-colors ${isDark ? \'text-white hover:bg-white/10\' : \'text-gray-900 hover:bg-gray-100\'}`}',
  'className={`lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full transition-colors ${useWhiteNavText ? \'text-white hover:bg-white/10\' : \'text-gray-900 hover:bg-gray-100\'}`}'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Navbar successfully updated with useWhiteNavText and Services link!');
