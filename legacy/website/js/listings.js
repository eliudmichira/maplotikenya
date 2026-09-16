/* ══════════════════════════════════════════════════════════════
   MAPLOTI — listings page (listings.html only)
   renders the grid from Firestore (via data.js) · deal/type/
   county/beds/price filters · search · sort · pagination
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const M = window.MAPLOTI;
  const $ = (id) => document.getElementById(id);

  const grid = $('resultsGrid');
  const count = $('count');
  const empty = $('emptyState');
  const resetBtn = $('resetBtn');
  const loadMoreBtn = $('loadMore');
  const demoNotice = $('demoNotice');

  const PAGE_SIZE = 24;

  let LISTINGS = [];
  let visibleCount = PAGE_SIZE;

  const state = {
    deal: 'all',
    type: 'all',
    county: 'all',
    beds: 0,
    maxPrice: Infinity,
    q: '',
    sort: 'featured',
  };

  const PRICE_OPTIONS = {
    sale: [
      ['all', 'Any price'],
      ['5000000', '\u2264 KES 5M'],
      ['10000000', '\u2264 KES 10M'],
      ['25000000', '\u2264 KES 25M'],
      ['50000000', '\u2264 KES 50M'],
      ['120000000', '\u2264 KES 120M'],
    ],
    rent: [
      ['all', 'Any rent'],
      ['30000', '\u2264 KES 30K/mo'],
      ['60000', '\u2264 KES 60K/mo'],
      ['100000', '\u2264 KES 100K/mo'],
      ['200000', '\u2264 KES 200K/mo'],
    ],
  };

  /* ── URL deep-links (hero search + type tiles on the homepage) ──
       listings.html?deal=sale&q=Westlands&price=25000000&type=Apartment */
  function readQuery() {
    const p = new URLSearchParams(window.location.search);
    const deal = p.get('deal');
    const type = p.get('type');
    const q = p.get('q');
    const price = p.get('price');
    if (deal === 'sale' || deal === 'rent') state.deal = deal;
    if (type) state.type = type;
    if (q) state.q = q.trim().toLowerCase();
    const n = parseInt(price, 10);
    if (!isNaN(n) && n > 0) state.maxPrice = n;
    return p;
  }

  /* ── Select population (dynamic from real data) ───────────── */
  const typeSel = $('fType');
  const countySel = $('fCounty');
  const priceSel = $('fPrice');

  function fillSelect(sel, values, labelFor) {
    values.forEach((v) => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = labelFor(v);
      sel.appendChild(opt);
    });
  }

  function populateSelects() {
    const types = [...new Set(LISTINGS.map((l) => l.type).filter(Boolean))].sort();
    const counties = [...new Set(LISTINGS.map((l) => l.county).filter(Boolean))].sort();

    typeSel.innerHTML = '<option value="all">All types</option>';
    fillSelect(typeSel, types, (t) => t + 's');
    countySel.innerHTML = '<option value="all">All counties</option>';
    fillSelect(countySel, counties, (c) => c);
  }

  function setPriceOptions(deal) {
    const opts = PRICE_OPTIONS[deal === 'rent' ? 'rent' : 'sale'];
    priceSel.innerHTML = opts
      .map(([v, label]) => '<option value="' + v + '">' + label + '</option>')
      .join('');
  }
  setPriceOptions('all');

  /* ── Filtering & sorting ───────────────────────────────────── */
  function matches(l) {
    if (state.deal !== 'all' && l.deal !== state.deal) return false;
    if (state.type !== 'all' && l.type !== state.type) return false;
    if (state.county !== 'all' && l.county !== state.county) return false;
    if (state.beds > 0 && l.beds < state.beds) return false;
    if (l.price > state.maxPrice) return false;
    if (state.q) {
      const hay = (l.title + ' ' + l.area + ' ' + l.county + ' ' + l.type + ' ' + l.deal).toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }

  const NEWEST = (a, b) => (a.added < b.added ? 1 : -1);

  function sorted(list) {
    const copy = list.slice();
    switch (state.sort) {
      case 'price-asc':
        copy.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        copy.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        copy.sort(NEWEST);
        break;
      default:
        copy.sort((a, b) => Number(b.featured) - Number(a.featured) || NEWEST(a, b));
    }
    return copy;
  }

  function isDefault() {
    return (
      state.deal === 'all' && state.type === 'all' && state.county === 'all' &&
      state.beds === 0 && state.maxPrice === Infinity && state.q === ''
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  function render() {
    const results = sorted(LISTINGS.filter(matches));
    const shown = results.slice(0, visibleCount);
    grid.innerHTML = shown.map((l) => M.cardHTML(l)).join('');

    const from = results.length ? 1 : 0;
    count.innerHTML =
      'Showing <strong>' + from + '\u2013' + shown.length + '</strong> of ' +
      results.length + (results.length === 1 ? ' property' : ' properties');

    empty.hidden = results.length > 0;
    resetBtn.classList.toggle('is-visible', !isDefault());

    if (loadMoreBtn) {
      loadMoreBtn.hidden = shown.length >= results.length || results.length <= PAGE_SIZE;
    }

    // Wire up scroll reveals for freshly rendered cards
    grid.querySelectorAll('.reveal').forEach((el) => window.MAPLOTI_SITE.reveal(el));

    // Reflect the signed-in user's saved state on the new hearts
    if (window.MAPLOTI_USER) window.MAPLOTI_USER.syncHearts();
  }

  /* ── Loading state ──────────────────────────────────────────── */
  function showLoading() {
    count.innerHTML = 'Loading live listings…';
    grid.innerHTML = Array.from({ length: 6 }, () =>
      '<article class="prop prop--skeleton"><div class="prop__img"></div><div class="prop__body"><div class="sk sk--t"></div><div class="sk sk--l"></div><div class="sk sk--s"></div></div></article>'
    ).join('');
  }

  function showError() {
    count.innerHTML = 'Showing <strong>0</strong> listings';
    empty.hidden = false;
    empty.querySelector('h3').textContent = 'Couldn\u2019t load listings';
    empty.querySelector('p').textContent =
      'We had trouble reaching the live listings. Check your connection and try again.';
    empty.querySelector('button').hidden = true;
  }

  /* ── Events ─────────────────────────────────────────────────── */
  document.querySelectorAll('.seg [data-deal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.seg [data-deal]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      state.deal = btn.dataset.deal;
      setPriceOptions(state.deal);
      priceSel.value = 'all';
      state.maxPrice = Infinity;
      visibleCount = PAGE_SIZE;
      render();
    });
  });

  typeSel.addEventListener('change', () => { state.type = typeSel.value; visibleCount = PAGE_SIZE; render(); });
  countySel.addEventListener('change', () => { state.county = countySel.value; visibleCount = PAGE_SIZE; render(); });
  $('fBeds').addEventListener('change', (e) => { state.beds = parseInt(e.target.value, 10); visibleCount = PAGE_SIZE; render(); });
  priceSel.addEventListener('change', () => {
    state.maxPrice = priceSel.value === 'all' ? Infinity : parseInt(priceSel.value, 10);
    visibleCount = PAGE_SIZE;
    render();
  });
  $('fQ').addEventListener('input', (e) => {
    state.q = e.target.value.trim().toLowerCase();
    visibleCount = PAGE_SIZE;
    render();
  });
  $('sort').addEventListener('change', (e) => { state.sort = e.target.value; visibleCount = PAGE_SIZE; render(); });

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      visibleCount += PAGE_SIZE;
      render();
      loadMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function resetAll() {
    state.deal = 'all';
    state.type = 'all';
    state.county = 'all';
    state.beds = 0;
    state.maxPrice = Infinity;
    state.q = '';
    state.sort = 'featured';
    visibleCount = PAGE_SIZE;

    document.querySelectorAll('.seg [data-deal]').forEach((b, i) => {
      b.classList.toggle('is-active', i === 0);
      b.setAttribute('aria-pressed', String(i === 0));
    });
    typeSel.value = 'all';
    countySel.value = 'all';
    $('fBeds').value = '0';
    setPriceOptions('all');
    priceSel.value = 'all';
    $('fQ').value = '';
    $('sort').value = 'featured';
    render();
  }

  resetBtn.addEventListener('click', resetAll);
  $('emptyReset').addEventListener('click', resetAll);

  /* ── Init ───────────────────────────────────────────────────── */
  const query = readQuery();
  showLoading();
  M.ready()
    .then((list) => {
      LISTINGS = list;
      populateSelects();
      // Reflect any deep-linked filters onto the controls
      const segs = document.querySelectorAll('.seg [data-deal]');
      segs.forEach((b) => {
        const on = b.dataset.deal === state.deal || (b.dataset.deal === 'all' && state.deal === 'all');
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      // The price option list depends on the deal — rebuild it for the
      // deep-linked deal before matching the value.
      if (state.deal !== 'all') setPriceOptions(state.deal);
      // Only apply the deep-linked type if it actually exists in the live
      // data — a bogus ?type=xyz must not silently filter to 0 results.
      if (state.type !== 'all') {
        if ([...typeSel.options].some((o) => o.value === state.type)) typeSel.value = state.type;
        else state.type = 'all';
      }
      // Reflect the applied price cap even when the URL value isn't in the
      // standard option list (e.g. a sale price with deal=rent): add a
      // custom option so the control never lies about the active filter.
      const urlPrice = query.get('price');
      if (urlPrice && Number(urlPrice) > 0) {
        if (![...priceSel.options].some((o) => o.value === urlPrice)) {
          const opt = document.createElement('option');
          opt.value = urlPrice;
          opt.textContent = '≤ KES ' + Number(urlPrice).toLocaleString('en-US');
          priceSel.appendChild(opt);
        }
        priceSel.value = urlPrice;
      }
      if (state.q) $('fQ').value = state.q;
      if (demoNotice && M.usingDemo) demoNotice.hidden = false;
      render();
    })
    .catch(() => showError());
})();
