import axios from 'axios';

async function fetchLocationData() {
  try {
    const res = await axios.get('https://property.mbanyu.com/properties/location', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://mbanyu.com',
        'Referer': 'https://mbanyu.com/',
      },
    });

    console.log('Status:', res.status);
    console.log('Data type:', Array.isArray(res.data) ? `Array[${res.data.length}]` : typeof res.data);
    console.log('Sample Data (first 3 items):');
    console.log(JSON.stringify(res.data.slice ? res.data.slice(0, 3) : res.data, null, 2).slice(0, 3000));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fetchLocationData();
