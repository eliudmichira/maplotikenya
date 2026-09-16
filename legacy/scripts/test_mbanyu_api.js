import axios from 'axios';

async function testApi() {
  const endpoints = [
    'https://property.mbanyu.com/properties/location',
    'https://property.mbanyu.com/properties',
    'https://property.mbanyu.com/properties/search',
    'https://property.mbanyu.com/properties?page=1&limit=20',
  ];

  for (const url of endpoints) {
    console.log(`\n🔍 Requesting API: ${url}`);
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Origin': 'https://mbanyu.com',
          'Referer': 'https://mbanyu.com/',
        },
        timeout: 15000,
      });

      console.log(`  ✅ Status: ${res.status}`);
      console.log('  DataType:', typeof res.data, Array.isArray(res.data) ? `Array length ${res.data.length}` : Object.keys(res.data || {}));
      if (Array.isArray(res.data) && res.data.length > 0) {
        console.log('  Sample item:', JSON.stringify(res.data[0], null, 2));
      } else if (res.data && typeof res.data === 'object') {
        console.log('  Sample response preview:', JSON.stringify(res.data).slice(0, 500));
      }
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }
}

testApi();
