const fs = require('fs');

// 1. UserDashboard.jsx
let userCode = fs.readFileSync('src/routes/dashboard/UserDashboard.jsx', 'utf8');
userCode = userCode.replace(
  '<Button size="sm" asChild><Link to="/desktop/properties"><Search />Browse listings</Link></Button>',
  '<Button size="sm" asChild className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold shadow-sm"><Link to="/desktop/properties"><Search />Browse listings</Link></Button>'
);
fs.writeFileSync('src/routes/dashboard/UserDashboard.jsx', userCode, 'utf8');
console.log('Updated UserDashboard.jsx');

// 2. AgentDashboard.jsx
let agentCode = fs.readFileSync('src/routes/dashboard/AgentDashboard.jsx', 'utf8');
agentCode = agentCode.replace(
  '<Button size="sm" asChild><Link to="/properties/add"><Plus />Add listing</Link></Button>',
  '<Button size="sm" asChild className="bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold shadow-sm"><Link to="/properties/add"><Plus />Add listing</Link></Button>'
);
agentCode = agentCode.replace(
  "<Button size=\"sm\" onClick={() => setBookingStatus(b, 'confirmed')} disabled={isBusy}>",
  "<Button size=\"sm\" className=\"bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-semibold shadow-sm\" onClick={() => setBookingStatus(b, 'confirmed')} disabled={isBusy}>"
);
fs.writeFileSync('src/routes/dashboard/AgentDashboard.jsx', agentCode, 'utf8');
console.log('Updated AgentDashboard.jsx');
