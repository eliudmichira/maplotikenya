const fs = require('fs');

let nav = fs.readFileSync('src/components/navbar/Navbar.jsx', 'utf8');

// Ensure className on Logo uses useWhiteNavText
nav = nav.replace(
  '${isDark ? "text-white" : "text-gray-900"\n                    } text-2xl',
  '${useWhiteNavText ? "text-white" : "text-gray-900"\n                    } text-2xl'
);
nav = nav.replace(
  '${isDark ? "text-white" : "text-gray-900"\r\n                    } text-2xl',
  '${useWhiteNavText ? "text-white" : "text-gray-900"\r\n                    } text-2xl'
);

// Verify navItems has Services
if (!nav.includes("{ label: 'Services', to: '/services' }")) {
  nav = nav.replace(
    "{ label: 'Properties', to: '/properties' },",
    "{ label: 'Properties', to: '/properties' },\n    { label: 'Services', to: '/services' },"
  );
}

fs.writeFileSync('src/components/navbar/Navbar.jsx', nav, 'utf8');
console.log('Verified Navbar.jsx');
