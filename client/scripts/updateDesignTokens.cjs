const fs = require('fs');

// 1. Fix src/index.css
let indexCss = fs.readFileSync('c:/Users/User/Documents/GitHub/Maploti-new/client/src/index.css', 'utf8');

indexCss = indexCss.replace(/--cta:\s*#fbbf24;[^\n]*/g, '--cta:             #000000;');
indexCss = indexCss.replace(/html\.dark\s*\{[^}]*--cta:\s*#[a-fA-F0-9]+;/g, (m) => m.replace(/--cta:\s*#[a-fA-F0-9]+;/, '--cta:             #ffffff;'));
indexCss = indexCss.replace(/rgba\(255, 255, 255, 0\.2\);/g, '--cta-glow:        rgba(255, 255, 255, 0.2);');

if (!indexCss.includes('.btn-obsidian')) {
  indexCss += `
/* ── Smoked Obsidian Pill (matches architectural preview screenshot) ── */
.btn-obsidian {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  background: linear-gradient(180deg, #27272a 0%, #141416 100%);
  color: #ffffff;
  font-weight: 600;
  font-size: 0.9375rem;
  letter-spacing: -0.01em;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 2px 4px rgba(0, 0, 0, 0.35),
    0 8px 20px -6px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: transform 220ms cubic-bezier(0.16,1,0.3,1),
              box-shadow 220ms cubic-bezier(0.16,1,0.3,1),
              border-color 220ms ease;
}
.btn-obsidian:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.35);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.45);
}
`;
}
fs.writeFileSync('c:/Users/User/Documents/GitHub/Maploti-new/client/src/index.css', indexCss, 'utf8');
console.log('index.css updated');

// 2. Update src/styles/design-system.css
let dsCss = fs.readFileSync('c:/Users/User/Documents/GitHub/Maploti-new/client/src/styles/design-system.css', 'utf8');
dsCss = dsCss.replace(/--primary-green:\s*#fbbf24;/g, '--primary-green: #ffffff;');
dsCss = dsCss.replace(/--primary-gold:\s*#f59e0b;/g, '--primary-gold:  #e4e4e7;');
dsCss = dsCss.replace(/--gradient-primary:\s*linear-gradient\(180deg,\s*#fbbf24\s*0%,\s*#f59e0b\s*100%\);/g, '--gradient-primary: linear-gradient(180deg, #ffffff 0%, #e4e4e7 100%);');
dsCss = dsCss.replace(/--gradient-primary-br:\s*linear-gradient\(135deg,\s*#fbbf24\s*0%,\s*#f59e0b\s*100%\);/g, '--gradient-primary-br: linear-gradient(135deg, #ffffff 0%, #d4d4d8 100%);');
dsCss = dsCss.replace(/rgba\(251,\s*191,\s*36,\s*[\d\.]+\)/g, 'rgba(255, 255, 255, 0.15)');
dsCss = dsCss.replace(/rgba\(245,\s*158,\s*11,\s*[\d\.]+\)/g, 'rgba(255, 255, 255, 0.08)');
dsCss = dsCss.replace(/background:\s*linear-gradient\(180deg,\s*#fbbf24\s*0%,\s*#f59e0b\s*100%\);/g, 'background: #ffffff;');
dsCss = dsCss.replace(/color:\s*#0e1311;/g, 'color: #000000;');

fs.writeFileSync('c:/Users/User/Documents/GitHub/Maploti-new/client/src/styles/design-system.css', dsCss, 'utf8');
console.log('design-system.css updated');
