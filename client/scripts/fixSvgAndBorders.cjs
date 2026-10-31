const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/routes/propertyDetails/propertyDetails.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Fix SVG template literal
content = content.replace(
  /<circle cx="75" cy="75" r="75" fill="\$\{bg\}"/>`[\r\n\s]*<text/,
  '<circle cx="75" cy="75" r="75" fill="${bg}"/>\n  <text'
);

// Replace any remaining rgba(251,191,36 borders
content = content.split('border-[rgba(251,191,36,0.2)]').join('border-white/10');
content = content.split('border-[rgba(251,191,36,0.1)]').join('border-white/10');
content = content.split('hover:border-[rgba(251,191,36,0.3)]').join('hover:border-white/20');
content = content.split('bg-[rgba(251,191,36,0.1)]').join('bg-white/5');

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Fixed SVG syntax and borders successfully!');
