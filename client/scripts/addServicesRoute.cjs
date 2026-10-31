const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../src/App.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Add lazy import
content = content.replace(
  /const Blog = lazy\(\(\) => import\('\.\/routes\/blog\/Blog'\)\);/,
  "const Blog = lazy(() => import('./routes/blog/Blog'));\nconst ServicesPage = lazy(() => import('./routes/services/ServicesPage'));"
);

// 2. Add /services route before desktop routes
const servicesRoute = `        <Route path="/services" element={
          <ResponsiveComponent
            desktopComponent={
              <Layout>
                <ServicesPage />
              </Layout>
            }
            mobileComponent={
              <MobileLayoutWrapper title="Services"><ServicesPage /></MobileLayoutWrapper>
            }
          />
        } />\n`;

content = content.replace(
  '        {/* Desktop routes WITH layout (navbar + footer) */}',
  servicesRoute + '        {/* Desktop routes WITH layout (navbar + footer) */}'
);

// 3. Add desktop sub-route
content = content.replace(
  '<Route path="rentakenya" element={<RentBuyKenyaPage />} />',
  '<Route path="services" element={<ServicesPage />} />\n          <Route path="rentakenya" element={<RentBuyKenyaPage />} />'
);

fs.writeFileSync(targetPath, content, 'utf8');
console.log('App.jsx successfully updated with ServicesPage routes!');
