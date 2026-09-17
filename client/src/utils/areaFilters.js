// Mirrors normalizeListingType in the listings page without importing that
// (very large) module into the area directory bundle.
const normalizeListingType = (p) => {
  const raw = String(p?.listing_type || p?.listingType || p?.purpose || p?.type || '').toLowerCase();
  if (/rent|let/.test(raw)) return 'rent';
  if (/sale|sell|buy/.test(raw)) return 'sale';
  const title = String(p?.title || '').toLowerCase();
  if (/to let|for rent|rental/.test(title)) return 'rent';
  if (/for sale/.test(title)) return 'sale';
  return raw;
};

// Filters for the area directory. They are applied to individual listings
// first, and the surviving listings are then grouped into areas, so every
// count on an area card is "listings here that match what you asked for".

export const LISTING_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'sale', label: 'For sale' },
  { value: 'rent', label: 'For rent' },
];

export const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'house', label: 'House' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
];

export const BEDROOM_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
  { value: '5', label: '5+' },
];

// Price presets differ by intent: monthly rent vs. purchase price.
export const PRICE_PRESETS = {
  rent: [
    { value: '', label: 'Any rent' },
    { value: '0-50000', label: 'Under Ksh 50k' },
    { value: '50000-100000', label: 'Ksh 50k – 100k' },
    { value: '100000-200000', label: 'Ksh 100k – 200k' },
    { value: '200000-400000', label: 'Ksh 200k – 400k' },
    { value: '400000-', label: 'Ksh 400k+' },
  ],
  sale: [
    { value: '', label: 'Any price' },
    { value: '0-5000000', label: 'Under Ksh 5M' },
    { value: '5000000-15000000', label: 'Ksh 5M – 15M' },
    { value: '15000000-40000000', label: 'Ksh 15M – 40M' },
    { value: '40000000-100000000', label: 'Ksh 40M – 100M' },
    { value: '100000000-', label: 'Ksh 100M+' },
  ],
};

export const SORT_OPTIONS = [
  { value: 'count', label: 'Most listings' },
  { value: 'az', label: 'A – Z' },
  { value: 'cheapest', label: 'Lowest avg price' },
  { value: 'priciest', label: 'Highest avg price' },
  { value: 'views', label: 'Most viewed' },
];

export const DEFAULT_FILTERS = {
  q: '',
  listingType: 'all',
  propertyType: '',
  minBeds: '',
  price: '',
  sort: 'count',
};

export const parsePriceRange = (preset) => {
  if (!preset) return { min: 0, max: Infinity };
  const [lo, hi] = String(preset).split('-');
  return { min: Number(lo) || 0, max: hi === '' || hi === undefined ? Infinity : Number(hi) };
};

export const propertyTypeOf = (p) =>
  String(p?.propertyType || p?.property_type || p?.type || '').toLowerCase();

export const bedroomsOf = (p) => {
  const n = parseInt(p?.bedrooms, 10);
  return Number.isFinite(n) ? n : null;
};

export const matchesAreaFilters = (p, f) => {
  if (f.listingType && f.listingType !== 'all' && normalizeListingType(p) !== f.listingType) return false;
  if (f.propertyType && !propertyTypeOf(p).includes(f.propertyType)) return false;
  if (f.minBeds) {
    const beds = bedroomsOf(p);
    if (beds === null || beds < Number(f.minBeds)) return false;
  }
  if (f.price) {
    const { min, max } = parsePriceRange(f.price);
    const price = Number(p?.price);
    if (!Number.isFinite(price) || price < min || price > max) return false;
  }
  return true;
};

export const countActiveFilters = (f) =>
  ['listingType', 'propertyType', 'minBeds', 'price'].filter((k) => f[k] && f[k] !== 'all').length;

// Read filters from the URL so back/forward and shared links keep state.
export const filtersFromParams = (params) => ({
  q: params.get('q') || '',
  listingType: LISTING_TYPES.some((t) => t.value === params.get('type')) ? params.get('type') : 'all',
  propertyType: PROPERTY_TYPES.some((t) => t.value === params.get('property')) ? params.get('property') : '',
  minBeds: BEDROOM_OPTIONS.some((b) => b.value === params.get('beds')) ? params.get('beds') : '',
  price: params.get('price') || '',
  sort: SORT_OPTIONS.some((s) => s.value === params.get('sort')) ? params.get('sort') : 'count',
});

export const paramsFromFilters = (f) => {
  const params = {};
  if (f.q) params.q = f.q;
  if (f.listingType && f.listingType !== 'all') params.type = f.listingType;
  if (f.propertyType) params.property = f.propertyType;
  if (f.minBeds) params.beds = f.minBeds;
  if (f.price) params.price = f.price;
  if (f.sort && f.sort !== 'count') params.sort = f.sort;
  return params;
};

// Deep link into the listings page carrying the same filters.
export const listingsUrlFor = (areaName, f) => {
  const params = new URLSearchParams({ search: areaName });
  if (f.listingType && f.listingType !== 'all') params.set('listingType', f.listingType);
  if (f.propertyType) params.set('propertyType', f.propertyType);
  if (f.minBeds) params.set('minBeds', f.minBeds);
  if (f.price) {
    const { min, max } = parsePriceRange(f.price);
    if (min > 0) params.set('minPrice', String(min));
    if (Number.isFinite(max)) params.set('maxPrice', String(max));
  }
  return `/properties?${params.toString()}`;
};

export const formatKshShort = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return null;
  if (v >= 1e9) return `Ksh ${(v / 1e9).toFixed(v % 1e9 === 0 ? 0 : 1)}B`;
  if (v >= 1e6) return `Ksh ${(v / 1e6).toFixed(v % 1e6 === 0 ? 0 : 1)}M`;
  if (v >= 1e3) return `Ksh ${Math.round(v / 1e3)}k`;
  return `Ksh ${v.toLocaleString()}`;
};
