const fs = require('fs');
const path = require('path');

const configPath = 'C:/Users/User/.config/configstore/firebase-tools.json';
const dataPath = path.join(__dirname, 'data/instagramNewListings.json');

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function getAccessToken() {
  const conf = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const tokens = conf.tokens;
  const now = Date.now();

  // If token is valid for at least 60 more seconds, use it
  if (tokens.access_token && tokens.expires_at && tokens.expires_at > now + 60000) {
    return tokens.access_token;
  }

  // Refresh token using googleapis
  console.log('Refreshing Firebase access token...');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho85qd6.apps.googleusercontent.com',
      client_secret: process.env.FIREBASE_TOKEN_CLIENT_SECRET || '',
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  const data = await res.json();
  if (data.access_token) {
    tokens.access_token = data.access_token;
    tokens.expires_at = now + (data.expires_in * 1000);
    conf.tokens = tokens;
    fs.writeFileSync(configPath, JSON.stringify(conf, null, 2), 'utf8');
    return data.access_token;
  }

  // Fallback to existing access_token
  return tokens.access_token;
}

async function run() {
  const token = await getAccessToken();
  const listings = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${listings.length} listings from ${dataPath}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of listings) {
    const { id, ...data } = item;
    const docUrl = `https://firestore.googleapis.com/v1/projects/maploti/databases/(default)/documents/listings/${id}`;

    // Check if doc already exists
    const checkRes = await fetch(docUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (checkRes.status === 200) {
      skipped++;
      console.log(`skip    ${id}  ${data.title} (already in Firestore)`);
      continue;
    }

    if (checkRes.status !== 404) {
      console.error(`Error checking ${id}: HTTP ${checkRes.status}`);
    }

    // Prepare fields
    const nowIso = new Date().toISOString();
    const docBody = {
      fields: {
        id: { stringValue: id },
        ...toFirestoreValue(data).mapValue.fields,
        createdAt: { timestampValue: nowIso },
        updatedAt: { timestampValue: nowIso }
      }
    };

    // Create document in Firestore
    const createUrl = `https://firestore.googleapis.com/v1/projects/maploti/databases/(default)/documents/listings?documentId=${id}`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(docBody)
    });

    if (createRes.status === 200 || createRes.status === 201) {
      created++;
      console.log(`created ${id}  ${data.title}`);
    } else {
      failed++;
      const errText = await createRes.text();
      console.error(`FAILED  ${id}  ${data.title}: HTTP ${createRes.status} ${errText}`);
    }
  }

  console.log(`\nCreated ${created}, skipped ${skipped}, failed ${failed}.`);
  const review = listings.filter((l) => l.needsReview).map((l) => `  ${l.id}  ${l.title}`);
  if (review.length) {
    console.log(`\nThese need a quick check in the admin panel (missing price, rent/sale or area):\n${review.join('\n')}`);
  }
}

run().catch(err => {
  console.error('Fatal error during import:', err);
  process.exit(1);
});
