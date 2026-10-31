const fs = require('fs');
const path = require('path');

const clientDir = path.resolve(__dirname, '..');

// 1. Update index.css
const indexCssPath = path.join(clientDir, 'src', 'index.css');
if (fs.existsSync(indexCssPath)) {
  let css = fs.readFileSync(indexCssPath, 'utf8');
  
  // Replace --ui-primary and --ui-ring in :root and html.dark
  css = css.replace(
    /--ui-primary:\s*251\s+191\s+36;/g,
    (match, offset) => {
      // Check if inside :root or html.dark
      const before = css.substring(0, offset);
      if (before.lastIndexOf('html.dark') > before.lastIndexOf(':root')) {
        return '--ui-primary: 255 255 255;';
      }
      return '--ui-primary: 0 0 0;';
    }
  );

  css = css.replace(
    /--ui-primary-foreground:\s*17\s+17\s+17;/g,
    (match, offset) => {
      const before = css.substring(0, offset);
      if (before.lastIndexOf('html.dark') > before.lastIndexOf(':root')) {
        return '--ui-primary-foreground: 10 10 10;';
      }
      return '--ui-primary-foreground: 255 255 255;';
    }
  );

  css = css.replace(
    /--ui-ring:\s*251\s+191\s+36;/g,
    (match, offset) => {
      const before = css.substring(0, offset);
      if (before.lastIndexOf('html.dark') > before.lastIndexOf(':root')) {
        return '--ui-ring: 255 255 255;';
      }
      return '--ui-ring: 24 24 27;';
    }
  );

  // Replace residual amber glow in .btn-mono and .hero-highlight
  css = css.replace(/rgba\(251,\s*191,\s*36,\s*0\.45\)/g, 'rgba(0, 0, 0, 0.2)');
  css = css.replace(/rgba\(251,\s*191,\s*36,\s*0\.6\)/g, 'rgba(0, 0, 0, 0.3)');
  css = css.replace(/rgba\(251,\s*191,\s*36,\s*0\.35\)/g, 'rgba(255, 255, 255, 0.2)');
  css = css.replace(/rgba\(251,\s*191,\s*36,\s*0\.25\)/g, 'rgba(255, 255, 255, 0.15)');

  fs.writeFileSync(indexCssPath, css, 'utf8');
  console.log('Updated index.css successfully');
}

// 2. Update tailwind.config.js
const tailwindConfigPath = path.join(clientDir, 'tailwind.config.js');
if (fs.existsSync(tailwindConfigPath)) {
  let tw = fs.readFileSync(tailwindConfigPath, 'utf8');
  tw = tw.replace(/accent:\s*\{[^}]*400:\s*'#fbbf24'[^}]*\}/s, `accent: {
          400: '#ffffff',
          500: '#ffffff',
          DEFAULT: '#ffffff',
        }`);
  fs.writeFileSync(tailwindConfigPath, tw, 'utf8');
  console.log('Updated tailwind.config.js successfully');
}

// 3. Update AgentDashboard.jsx
const agentDashboardPath = path.join(clientDir, 'src', 'routes', 'dashboard', 'AgentDashboard.jsx');
if (fs.existsSync(agentDashboardPath)) {
  let code = fs.readFileSync(agentDashboardPath, 'utf8');
  // Gradient on Leads Radar card
  code = code.replace(
    'bg-gradient-to-r from-amber-500/10 via-background to-background',
    'bg-gradient-to-r from-muted/50 via-background to-background'
  );
  // Button hover on Leads Radar card
  code = code.replace(
    'className="bg-white text-black font-semibold hover:bg-[#f59e0b] shrink-0"',
    'className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold shrink-0"'
  );
  // Bar chart views fill
  code = code.replace(
    '<Bar dataKey="views" fill="#fbbf24"',
    '<Bar dataKey="views" fill={isDark ? "#ffffff" : "#18181b"}'
  );
  // Legend color for inquiries
  code = code.replace(
    "legend={[{ label: 'Inquiries', color: '#fbbf24' }",
    "legend={[{ label: 'Inquiries', color: isDark ? '#ffffff' : '#18181b' }"
  );
  // Bar chart inquiries fill
  code = code.replace(
    '<Bar dataKey="inquiries" name="Inquiries" fill="#fbbf24"',
    '<Bar dataKey="inquiries" name="Inquiries" fill={isDark ? "#ffffff" : "#18181b"}'
  );
  fs.writeFileSync(agentDashboardPath, code, 'utf8');
  console.log('Updated AgentDashboard.jsx successfully');
}

// 4. Update LeadsSection.jsx
const leadsSectionPath = path.join(clientDir, 'src', 'routes', 'dashboard', 'sections', 'LeadsSection.jsx');
if (fs.existsSync(leadsSectionPath)) {
  let code = fs.readFileSync(leadsSectionPath, 'utf8');
  code = code.replace(/className="bg-white text-black font-semibold hover:bg-\[#f59e0b\]"/g, 'className="bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold"');
  code = code.replace(/focus:ring-\[#fbbf24\]/g, 'focus:ring-ring');
  fs.writeFileSync(leadsSectionPath, code, 'utf8');
  console.log('Updated LeadsSection.jsx successfully');
}

// 5. Update TrendChart.jsx
const trendChartPath = path.join(clientDir, 'src', 'routes', 'dashboard', 'components', 'TrendChart.jsx');
if (fs.existsSync(trendChartPath)) {
  let code = fs.readFileSync(trendChartPath, 'utf8');
  code = code.replace(
    "const colors = ['#fbbf24', '#10b981', '#F59E0B', '#EF4444', '#8b5cf6', '#3b82f6'];",
    "const colors = ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a', '#52525b', '#3f3f46'];"
  );
  fs.writeFileSync(trendChartPath, code, 'utf8');
  console.log('Updated TrendChart.jsx successfully');
}

// 6. Update FloatingDashboardNav.jsx
const floatingNavPath = path.join(clientDir, 'src', 'components', 'FloatingDashboardNav.jsx');
if (fs.existsSync(floatingNavPath)) {
  let code = fs.readFileSync(floatingNavPath, 'utf8');
  code = code.replace(
    'bg-gradient-to-r from-[#fbbf24]/10 to-[#f59e0b]/10',
    'bg-gradient-to-r from-muted/40 to-muted/20'
  );
  fs.writeFileSync(floatingNavPath, code, 'utf8');
  console.log('Updated FloatingDashboardNav.jsx successfully');
}

// 7. Update EnhancedThemeContext.jsx
const themeContextPath = path.join(clientDir, 'src', 'context', 'EnhancedThemeContext.jsx');
if (fs.existsSync(themeContextPath)) {
  let code = fs.readFileSync(themeContextPath, 'utf8');
  code = code.replace(/secondary:\s*'#fbbf24'/g, "secondary: '#ffffff'");
  fs.writeFileSync(themeContextPath, code, 'utf8');
  console.log('Updated EnhancedThemeContext.jsx successfully');
}

console.log('All monochrome token updates completed!');
