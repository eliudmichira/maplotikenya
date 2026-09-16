/* ══════════════════════════════════════════════════════════════
   MAPLOTI — shared listings data (listings.html & property.html)
   Loads the SAME `listings` collection as the Maploti app from
   Firestore. Falls back to a small demo set only when Firestore
   is unreachable (offline preview / SDK blocked), with a flag so
   pages can show a "live data unavailable" notice.
   All prices are KES. `per` is '' for sales, '/mo' for rentals.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const u = (id) =>
    'https://images.unsplash.com/' + id + '?q=80&w=1200&auto=format&fit=crop';

  /* ── Offline fallback only ────────────────────────────────── */
  window.MAPLOTI_DEMO = [
    {
      id: 'sunset-ridge-villa',
      title: 'Sunset Ridge Villa',
      deal: 'sale',
      type: 'Villa',
      county: 'Nairobi',
      area: 'Karen',
      price: 48500000,
      per: '',
      beds: 5,
      baths: 6,
      size: 780,
      featured: true,
      added: '2026-07-28',
      image: u('photo-1600596542815-ffad4c1539a9'),
      gallery: [
        u('photo-1600596542815-ffad4c1539a9'),
        u('photo-1512917774080-9991f1c4c750'),
        u('photo-1564013799919-ab600027ffc6'),
      ],
      summary:
        'A gated modern villa on a half-acre plot in leafy Karen. Open-plan living, a resort-style pool and uninterrupted views over the Ngong hills.',
      tags: ['Gated community', 'Resort pool', 'Maids quarters', 'Double garage', 'Solar water heater', 'Borehole'],
      agent: { name: 'Jane Wanjiru', role: 'Verified Agent', phone: '+254 712 345 678', wa: '254712345678' },
    },
    {
      id: 'westlands-sky-apartment',
      title: 'Westlands Sky Apartment',
      deal: 'rent',
      type: 'Apartment',
      county: 'Nairobi',
      area: 'Westlands',
      price: 95000,
      per: '/mo',
      beds: 2,
      baths: 2,
      size: 120,
      featured: true,
      added: '2026-07-30',
      image: u('photo-1522708323590-d24dbb6b0267'),
      gallery: [
        u('photo-1522708323590-d24dbb6b0267'),
        u('photo-1493809842364-78817add7ffb'),
        u('photo-1502005229762-cf1b2da7c5d6'),
      ],
      summary:
        'Sunlit 16th-floor apartment with skyline views, two parking slots and a residents\u2019 gym. Walking distance to Westlands malls and offices.',
      tags: ['Skyline views', '2 parking slots', 'Residents gym', '24hr security', 'Backup generator', 'Fibre ready'],
      agent: { name: 'Brian Otieno', role: 'Rentals Desk', phone: '+254 722 901 234', wa: '254722901234' },
    },
    {
      id: 'nyali-beachfront-plot',
      title: 'Nyali Beachfront Plot',
      deal: 'sale',
      type: 'Plot',
      county: 'Mombasa',
      area: 'Nyali',
      price: 12000000,
      per: '',
      beds: 0,
      baths: 0,
      size: 1012,
      featured: true,
      added: '2026-07-22',
      image: u('photo-1507525428034-b723cf961d3e'),
      gallery: [
        u('photo-1507525428034-b723cf961d3e'),
        u('photo-1506929562872-bb421503ef21'),
        u('photo-1540541338287-41700207dee6'),
      ],
      summary:
        'Prime beachfront land with a freehold title deed, perfect for a boutique resort or private villa. 40m of direct ocean frontage.',
      tags: ['Freehold title', '40m ocean frontage', 'Beach access', 'Ready for construction', 'Tittle search done'],
      agent: { name: 'Amina Hassan', role: 'Land Specialist', phone: '+254 733 118 556', wa: '254733118556' },
    },
    {
      id: 'golf-view-estate-house',
      title: 'Golf View Estate House',
      deal: 'sale',
      type: 'House',
      county: 'Uasin Gishu',
      area: 'Eldoret',
      price: 6200000,
      per: '',
      beds: 4,
      baths: 3,
      size: 260,
      featured: true,
      added: '2026-07-18',
      image: u('photo-1570129477492-45c003edd2be'),
      gallery: [
        u('photo-1570129477492-45c003edd2be'),
        u('photo-1580587771525-78b9dba3b914'),
        u('photo-1568605114967-8130f3a36994'),
      ],
      summary:
        'A neat four-bedroom family home in a quiet Eldoret estate, minutes from the airport and golf club. Finished with granite floors and a spacious garden.',
      tags: ['Granite floors', 'Spacious garden', 'DSQ', 'Borehole', 'Perimeter wall', 'Near airport'],
      agent: { name: 'Daniel Kiprop', role: 'Property Advisor', phone: '+254 727 645 902', wa: '254727645902' },
    },
  ];

  /* ── Firestore → site shape ───────────────────────────────── */
  const TYPE_LABELS = {
    apartment: 'Apartment',
    house: 'House',
    villa: 'Villa',
    plot: 'Plot',
    penthouse: 'Penthouse',
    townhouse: 'Townhouse',
    mansion: 'Mansion',
    studio: 'Studio',
    bungalow: 'Bungalow',
    commercial: 'Commercial',
    land: 'Plot',
  };
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
  const pad2 = (n) => String(n).padStart(2, '0');

  function mapDoc(doc) {
    const d = doc.data ? doc.data() : doc;
    const loc = d.location || {};
    // Firestore GeoPoint drives the website map. Docs can expose it as
    // { latitude, longitude } (SDK GeoPoint) or { lat, lng } (REST import),
    // so accept both — same tolerance the Flutter app's model has.
    const gp = loc.geoPoint || {};
    const lat =
      typeof gp.latitude === 'number'
        ? gp.latitude
        : typeof gp.lat === 'number'
          ? gp.lat
          : parseFloat(gp.latitude ?? gp.lat) || 0;
    const lng =
      typeof gp.longitude === 'number'
        ? gp.longitude
        : typeof gp.lng === 'number'
          ? gp.lng
          : parseFloat(gp.longitude ?? gp.lng) || 0;
    const rawType = String(d.propertyType || '').toLowerCase();
    const listingType = String(d.listingType || 'rent').toLowerCase().includes('sale') ? 'sale' : 'rent';
    const created = d.createdAt
      ? new Date(d.createdAt.seconds ? d.createdAt.seconds * 1000 : d.createdAt)
      : new Date();
    const added =
      created.getFullYear() + '-' + pad2(created.getMonth() + 1) + '-' + pad2(created.getDate());
    // Only absolute URLs resolve on the website; relative paths like
    // `assets/images/properties/…` are Flutter-bundle assets → drop them.
    const images =
      (Array.isArray(d.images) ? d.images : []).filter((i) => /^https?:\/\//i.test(String(i)));

    return {
      id: doc.id || d.id || '',
      lat,
      lng,
      title: d.title || 'Untitled listing',
      deal: listingType,
      type: TYPE_LABELS[rawType] || cap(rawType) || 'Property',
      county: loc.county || '',
      area: loc.area || '',
      price: typeof d.price === 'number' ? d.price : parseFloat(d.price) || 0,
      per: listingType === 'rent' ? '/mo' : '',
      beds: Number(d.bedrooms) || 0,
      baths: Number(d.bathrooms) || 0,
      size: Number(d.sizeSqm) || 0,
      featured: !!d.featured,
      verified: !!d.verified || /verified/i.test(d.title || ''),
      added,
      image: images[0] || '',
      gallery: images,
      summary: d.description || '',
      tags: Array.isArray(d.amenities) ? d.amenities.map((t) => String(t).replace(/_/g, ' ')) : [],
      ownerId: d.ownerId || '',
      agent: d.agent || null,
    };
  }

  /* ── Loader (cached) ──────────────────────────────────────── */
  let cache = null;
  let loading = null;

  async function loadFromFirestore() {
    const db = window.MAPLOTI_DB;
    if (!db) throw new Error('no db');
    const snap = await db
      .collection('listings')
      .where('status', '==', 'active')
      .get();
    return snap.docs.map(mapDoc);
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (loading) return loading;
    loading = loadFromFirestore()
      .then((list) => {
        list.sort((a, b) => Number(b.featured) - Number(a.featured) || (a.added < b.added ? 1 : -1));
        cache = list;
        window.MAPLOTI_LISTINGS = list;
        return list;
      })
      .catch((err) => {
        console.warn('Maploti: Firestore unavailable, using demo data.', err);
        cache = (window.MAPLOTI_DEMO || []).slice();
        window.MAPLOTI_LISTINGS = cache;
        window.MAPLOTI_USING_DEMO = true;
        return cache;
      });
    return loading;
  }

  /* ── Card markup shared by listings.html and the homepage ─────
       The exact card design used on listings.html — the homepage's
       Featured section renders the same cards, so both surfaces
       build them from this one helper. */
  const HEART =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';
  const PIN =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  const VERIFIED =
    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="m12 2 2.4 2.4 3.4-.5.5 3.4L21 9.7l-1.7 3 1.7 3-2.7 2.4-.5 3.4-3.4-.5L12 23l-2.4-2.4-3.4.5-.5-3.4L3 15.7l1.7-3L3 9.7l2.7-2.4.5-3.4 3.4.5L12 2Zm-1.2 13.2 5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3Z"/></svg>';

  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function cardHTML(l, opts) {
    const o = opts || {};
    const cls = o.cls || 'prop reveal';
    const M = window.MAPLOTI;
    const href = 'property.html?id=' + encodeURIComponent(l.id);
    const parts = [];
    if (l.beds > 0) parts.push('<span>\u{1F6CF} ' + l.beds + '</span>');
    if (l.baths > 0) parts.push('<span>\u{1F6C1} ' + l.baths + '</span>');
    parts.push('<span>\u25A6 ' + l.size.toLocaleString('en-US') + ' m\u00B2</span>');

    return (
      '<article class="' + cls + '" data-id="' + esc(l.id) + '">' +
      '  <div class="prop__img">' +
      '    <a class="prop__img-link" href="' + href + '" tabindex="-1" aria-hidden="true"></a>' +
      (l.image ? '<img src="' + esc(l.image) + '" alt="' + esc(l.title) + '" loading="' + (o.eager ? 'eager' : 'lazy') + '" onerror="this.closest(\'.prop__img\').classList.add(\'has-placeholder\')" />' : '') +
      '    <span class="tag tag--price">' + M.priceCompact(l) + '</span>' +
      '    <span class="tag ' + M.dealClass(l) + '">' + M.dealLabel(l) + '</span>' +
      (l.verified ? '    <span class="tag tag--verified">' + VERIFIED + ' VERIFIED</span>' : '') +
      '    <button class="prop__fav" data-listing-id="' + esc(l.id) + '" data-listing-title="' + esc(l.title) + '" aria-label="Save ' + esc(l.title) + '" aria-pressed="false">' + HEART + '</button>' +
      '  </div>' +
      '  <div class="prop__body">' +
      '    <h3 class="prop__title"><a href="' + href + '">' + esc(l.title) + '</a></h3>' +
      '    <p class="prop__loc">' + PIN + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</p>' +
      '    <div class="prop__specs">' + parts.join('') + '</div>' +
      '  </div>' +
      '</article>'
    );
  }

  /* ── Helpers shared by listings.js / property.js ───────────── */
  window.MAPLOTI = {
    usingDemo: false,

    cardHTML,

    ready: load,

    /* ── Live stats snapshot (shared by homepage + login panels) ──
         One computation, consumed by every surface that shows
         "live" numbers, so they can never drift apart as data
         grows. `median` is the median SALE price only — mixing
         rental prices in would make the figure misleading. */
    liveStats(list) {
      const all = list || [];
      const areas = new Set(all.map((l) => (l.area || '').trim()).filter(Boolean)).size;
      // Top areas by listing count — the honest "where the inventory is"
      // signal (the county field is degenerate in the current data, so
      // areas replace the old "47 counties" claim).
      const byArea = {};
      all.forEach((l) => {
        const a = (l.area || '').trim();
        if (a) byArea[a] = (byArea[a] || 0) + 1;
      });
      const topAreas = Object.keys(byArea)
        .sort((a, b) => byArea[b] - byArea[a])
        .slice(0, 3);
      const prices = all
        .filter((l) => l.deal !== 'rent' && l.price > 0)
        .map((l) => l.price)
        .sort((a, b) => a - b);
      return {
        listings: all.length,
        areas,
        topAreas,
        median: prices.length ? prices[Math.floor(prices.length / 2)] : 0,
      };
    },

    byId(id) {
      return (window.MAPLOTI_LISTINGS || []).find((l) => l.id === id) || null;
    },

    priceFull(l) {
      if (!l.price) return 'Price on request';
      return 'KES ' + l.price.toLocaleString('en-US') + (l.per || '');
    },

    priceCompact(l) {
      if (!l.price) return 'POA';
      if (l.per) {
        return 'KES ' + (l.price >= 1000 ? (l.price / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }) : l.price) + 'K/mo';
      }
      if (l.price >= 1000000) {
        return 'KES ' + (l.price / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
      }
      return 'KES ' + l.price.toLocaleString('en-US');
    },

    dealLabel(l) {
      return l.deal === 'sale' ? 'FOR SALE' : 'FOR RENT';
    },

    dealClass(l) {
      return l.deal === 'sale' ? 'tag--sale' : 'tag--rent';
    },
  };

  // Reflect the demo flag on the helper once load settles.
  window.MAPLOTI.ready().then(() => {
    window.MAPLOTI.usingDemo = !!window.MAPLOTI_USING_DEMO;
  });
})();
