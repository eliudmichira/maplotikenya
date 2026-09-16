/**
 * Robust scraper for Mbanyu Real Estate (https://mbanyu.com).
 *
 * This is a rewrite of the fragile DOM-sniffing version, modeled on the
 * jiji.js scraper's two-phase design:
 *   1. Phase 1 (LIST)  — hit the site's own JSON API with Basic Auth
 *      (GET https://property.mbanyu.com/properties/listings/contract)
 *      → fast, paginated, structured list data.
 *   2. Phase 2 (DETAIL) — fetch each property-view page (Angular SSR
 *      embeds the FULL listing JSON in a <script type="application/json">)
 *      → description, all photos, amenities, utilities, contact info.
 *
 * No DOM text-sniffing, no heavy `*`-element scans — like jiji.js this
 * targets the site's real data layer and is far more reliable.
 *
 * Auth note: the frontend sends HTTP Basic auth with embedded credentials.
 * Credentials are copied verbatim from the site's own main-*.js bundle.
 */

import axios from 'axios';

const API_BASE = 'https://property.mbanyu.com';
const SITE_BASE = 'https://mbanyu.com';

// Credentials the site's own frontend sends (from main-*.js).
const AUTH_BASIC =
  'Basic ' + Buffer.from('admin@mbanyu.com:Password1!').toString('base64');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const apiHeaders = {
  Authorization: AUTH_BASIC,
  Accept: 'application/json, text/plain, */*',
  Origin: SITE_BASE,
  Referer: SITE_BASE + '/',
  'User-Agent': UA,
};

const pageHeaders = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

// ── Contracts (site enum values) ──────────────────────────────────────────────
export const CONTRACTS = {
  rent: { contract: 'FOR_RENT', listingType: 'rent' },
  sale: { contract: 'FOR_SALE', listingType: 'sale' },
};

// ── Property type mapping: Mbanyu enum → Maploti enum ────────────────────────
const PROPERTY_TYPE_MAP = {
  APARTMENT: 'apartment',
  STUDIO_APARTMENT: 'apartment',
  CONDOMINIUM: 'apartment',
  BUNGALOW: 'house',
  TOWNHOUSE: 'house',
  MAISONETTE: 'house',
  PENTHOUSE: 'house',
  MANSION: 'villa',
  VILLA: 'villa',
  LAND: 'plot',
};

export function mapPropertyType(enumVal) {
  if (!enumVal) return 'apartment';
  return PROPERTY_TYPE_MAP[String(enumVal).toUpperCase()] || 'apartment';
}

// ── Phase 1: List API ────────────────────────────────────────────────────────

/**
 * Fetch one page of the contract-listing API.
 * Returns the Spring-Data page object { content, totalElements, totalPages, ... }.
 */
export async function fetchListingPage({
  contract = 'FOR_RENT',
  page = 0,
  size = 24,
} = {}) {
  const res = await axios.get(`${API_BASE}/properties/listings/contract`, {
    params: { page, contract, size },
    headers: apiHeaders,
    timeout: 25000,
  });
  const body = res.data;
  // Response shape: { data: { data: { content, totalElements, totalPages } } }
  return body?.data?.data || body?.data || body;
}

/**
 * Scrape a full contract (rent or sale), paging until exhausted.
 * Returns array of list-level items (no details yet).
 */
export async function scrapeContract(contractKey, { maxPages = null } = {}) {
  const { contract, listingType } = CONTRACTS[contractKey];
  if (!contract) throw new Error(`Unknown mbanyu contract: ${contractKey}`);

  const results = [];
  const seen = new Set();
  let page = 0;

  console.log(`  📄 ${contract} (paging…)`);
  for (;;) {
    let p;
    // Per-page error isolation with retry (transient 429/5xx/network blips
    // shouldn't abort the whole run).
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        p = await fetchListingPage({ contract, page, size: 24 });
        break;
      } catch (e) {
        if (attempt === 2) {
          console.log(`  ⚠️  page ${page + 1} failed after 3 attempts: ${e.message?.slice(0, 80)}`);
          p = null;
        } else {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        }
      }
    }
    if (!p) break;

    const content = p?.content || [];
    const totalPages = p?.totalPages ?? page + 1;

    for (const item of content) {
      const id = item.propertyId;
      if (!id || seen.has(id)) continue;
      seen.add(id);
      results.push({
        source: 'mbanyu',
        propertyId: id,
        url: `${SITE_BASE}/property-view/${id}`,
        listingType,
        propertyType: mapPropertyType(item.listingType),
        title: [item.listingType, listingType, item.locationNeighbourhood]
          .filter(Boolean)
          .join(' '),
    // Neighborhood as a human string (kept in address/city; area stays numeric).
        price: item.propertyAmount ?? 0,
        priceRaw: item.propertyAmount != null ? `KES ${item.propertyAmount}` : null,
        address: item.locationNeighbourhood || null,
        city: item.locationNeighbourhood || null,
        county: null,
        description: null,
        bedrooms: item.featureBedrooms ?? null,
        bathrooms: item.featureBathrooms ?? null,
        area: item.propertySize ?? null,
        sizeUnit: item.sizeUnit || 'sqm',
        images: item.coverPhotoUrl ? [item.coverPhotoUrl] : [],
        coverPhoto: item.coverPhotoUrl || null,
        createdAtRaw: item.creationDate || null,
        status: item.status || null,
        raw: item,
      });
    }

    console.log(`     page ${page + 1}/${totalPages} → ${results.length} unique`);

    if (page + 1 >= totalPages || (maxPages && page + 1 >= maxPages)) break;
    if (content.length === 0) break;
    page++;
  }
  return results;
}

// ── Phase 2: Detail enrichment via SSR JSON ──────────────────────────────────

/**
 * Fetch a property-view page and parse the embedded SSR JSON state.
 * Returns the full detail object or null.
 */
export async function fetchPropertyDetail(propertyId) {
  const url = `${SITE_BASE}/property-view/${propertyId}`;
  const res = await axios.get(url, { headers: pageHeaders, timeout: 25000 });
  const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

  const m = html.match(
    /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  try {
    const state = JSON.parse(m[1]);
    const key = Object.keys(state)[0];
    return state?.[key]?.b?.data?.data || null;
  } catch (_) {
    return null;
  }
}

/**
 * Merge detail data into a list item (detail wins).
 */
function mergeDetail(listing, d) {
  if (!d) return listing;
  return {
    ...listing,
    title: d.propertyTitle?.trim() || listing.title,
    description: d.propertyDescription || null,
    county: d.locationCounty || listing.county,
    city: d.locationCity || d.locationNeighbourhood || listing.city,
    address: d.locationNeighbourhood || d.locationCity || listing.address,
    bedrooms: d.featureBedrooms ?? listing.bedrooms,
    bathrooms: d.featureBathrooms ?? listing.bathrooms,
    area: d.featureTotalSize ?? listing.area,
    sizeUnit: d.sizeUnit || listing.sizeUnit,
    price: d.propertyAmount ?? listing.price,
    priceRaw: d.propertyAmount != null ? `KES ${d.propertyAmount}` : listing.priceRaw,
    listingType: (d.propertyListingType === 'FOR_SALE' ? 'sale' : 'rent'),
    propertyType: mapPropertyType(d.propertyType),
    images: (d.photos && d.photos.length ? d.photos : d.coverPhoto ? [d.coverPhoto] : listing.images),
    coverPhoto: d.coverPhoto || listing.coverPhoto,
    amenities: buildAmenities(d),
    utilities: buildUtilities(d),
    agent: {
      name: d.contactInformationName || d.businessName || null,
      phone: d.contactInformationPhoneNumber || null,
      email: d.contactInformationEmailAddress || null,
      business: d.businessName || null,
    },
    availability: d.availabilityStatus || null,
    condition: d.featurePropertyCondition || null,
    // featureParkingAvailability is a string ("Garage"/"Open") — expose it
    // as a boolean-ish flag; the numeric parking count is a Maploti UI field
    // and stays 0 (details carry the real info in parkingText).
    parking: 0,
    parkingText: d.featureParkingAvailability || null,
    yearBuilt: d.featureYearBuilt || null,
    isVerified: !!d.isVerified,
    rawDetail: d,
  };
}

function buildAmenities(d) {
  const out = new Set();
  const map = {
    amenitiesSwimmingPool: 'swimming_pool',
    amenitiesGatedCommunity: 'gated_community',
    amenitiesPerimeterWall: 'perimeter_wall',
    amenitiesAlarmSystem: 'alarm_system',
    amenitiesCctv: 'cctv',
    amenitiesSolarPanels: 'solar_panels',
    amenitiesLedLighting: 'led_lighting',
    amenitiesLargeWindows: 'large_windows',
    amenitiesWalkInCloset: 'walk_in_closet',
    amenitiesBathtub: 'bathtub',
    amenitiesFirePlace: 'fireplace',
  };
  for (const [key, label] of Object.entries(map)) {
    if (d[key]) out.add(label);
  }
  if (d.interiorFeaturesDishwasher) out.add('dishwasher');
  if (d.interiorFeaturesWaterHeater) out.add('water_heater');
  if (d.interiorFeaturesMicrowave) out.add('microwave');
  if (d.interiorFeaturesRefrigeration) out.add('refrigeration');
  if (d.interiorFeatureCooker) out.add('cooker');
  if (d.exteriorFeaturesOutdoorSpaces) out.add('outdoor_space');
  return [...out];
}

function buildUtilities(d) {
  const out = new Set();
  if (d.utilitiesWaterSupply) out.add(`water_${String(d.utilitiesWaterSupply).toLowerCase().replace(/\s+/g, '_')}`);
  if (d.utilitiesWaterStorage) out.add(`water_storage_${String(d.utilitiesWaterStorage).toLowerCase().replace(/\s+/g, '_')}`);
  if (d.utilitiesSewerSystem) out.add(`sewer_${String(d.utilitiesSewerSystem).toLowerCase().replace(/\s+/g, '_')}`);
  if (d.utilitiesElectricitySource) out.add(`electricity_${String(d.utilitiesElectricitySource).toLowerCase().replace(/\s+/g, '_')}`);
  if (String(d.utilitiesInternet || '').toLowerCase() === 'yes') out.add('internet');
  return [...out];
}

/**
 * Enrich list items with detail data, bounded concurrency (like jiji.js
 * enrichWithDetails). onPage/onError callbacks for progress reporting.
 */
export async function enrichWithDetails(listings, {
  concurrency = 4,
  onPage = null,
  onError = null,
} = {}) {
  if (!listings.length) return listings;
  console.log(`\n🔍 Fetching ${listings.length} detail pages (concurrency=${concurrency})...`);

  let next = 0;
  let done = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= listings.length) return;
      const listing = listings[i];
      try {
        const d = await fetchPropertyDetail(listing.propertyId);
        if (d) listings[i] = mergeDetail(listing, d);
      } catch (e) {
        if (onError) onError(listing, e);
      }
      done++;
      if (onPage) onPage(listing, done, listings.length);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, listings.length) }, worker));
  return listings;
}

// ── Main entry (compatible with old callers: scrapeMbanyu({ pages })) ────────

/**
 * Scrape Mbanyu listings.
 *
 * @param {object} opts
 * @param {number} [opts.pages=1]  max pages per contract (backwards compat)
 * @param {string[]} [opts.contracts=['rent','sale']]  contracts to scrape
 * @param {boolean} [opts.withDetails=true]  enrich with detail pages
 * @param {number} [opts.detailConcurrency=4]
 * @param {(done,total)=>void} [opts.onDetailProgress]
 */
export async function scrapeMbanyu({
  pages = 1,
  contracts = ['rent', 'sale'],
  withDetails = true,
  detailConcurrency = 4,
  onDetailProgress = null,
} = {}) {
  const all = [];
  for (const key of contracts) {
    if (!CONTRACTS[key]) continue;
    console.log(`\n🏠 ${CONTRACTS[key].contract} (max ${pages} page(s) per contract)`);
    const items = await scrapeContract(key, { maxPages: pages });
    all.push(...items);
    console.log(`  → ${items.length} unique listings`);
  }

  if (withDetails && all.length) {
    await enrichWithDetails(all, {
      concurrency: detailConcurrency,
      onPage: (_l, done, total) => {
        if (onDetailProgress) {
          onDetailProgress(done, total);
        } else if (done % 5 === 0 || done === total) {
          process.stdout.write(`\r   ${done}/${total} enriched`);
        }
      },
      onError: (l, e) => console.log(`\n   ⚠️  detail fail ${l.propertyId}: ${e.message?.slice(0, 80)}`),
    });
    console.log('');
  }
  return all;
}
