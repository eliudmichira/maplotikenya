const fs = require('fs');

let code = fs.readFileSync('src/routes/accountDashboard/AccountDashboard.jsx', 'utf8');

code = code.replace(/border-\[rgba\(251,191,36,0\.2\)\]/g, 'border-white/10');
code = code.replace(/from-yellow-500 to-yellow-600/g, 'from-zinc-800 to-zinc-900 border border-white/10');
code = code.replace(/text-\[\#111\]/g, '');

fs.writeFileSync('src/routes/accountDashboard/AccountDashboard.jsx', code, 'utf8');
console.log('Updated AccountDashboard.jsx');
