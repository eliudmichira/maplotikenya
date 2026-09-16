/* ══════════════════════════════════════════════════════════════
   MAPLOTI — interactive map (map.html only)
   Desktop-web layout: filter toolbar + results sidebar + Leaflet
   map. Pins cluster like the app; picking a pin opens the bottom
   card AND highlights its row in the sidebar (and vice-versa).
   Same `listings` data as the app (data.js).
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const M = window.MAPLOTI;
  const $ = (id) => document.getElementById(id);

  const mapEl = $('mapCanvas');
  if (!mapEl || !window.L) return;

  /* ── Elements ──────────────────────────────────────────────── */
  const listEl = $('mapList');
  const countText = $('mapCountText');
  const loadingPill = $('mapLoading');
  const demoNotice = $('mapDemo');
  const filterDot = $('filterDot');
  const searchInput = $('mapSearch');
  const searchClear = $('mapSearchClear');
  const sheetEl = $('mapSheet');
  const filterBackdrop = $('filterBackdrop');
  const filterSheetEl = $('filterSheet');
  const chipPrice = $('chipPrice');
  const sidebar = $('mapSidebar');
  const sidebarToggle = $('sidebarToggle');
  const mapLayout = $('mapLayout');
  const resetBtn = $('mapResetBtn');

  /* ── State (mirrors the app's _MapScreenState) ─────────────── */
  const state = {
    q: '',
    bed: 0, // 0 = any, else exact bedrooms (1, 2, 3) or 4 = 4+
    deal: 'all', // all | sale | rent
    minPrice: null,
    maxPrice: null,
    sort: 'none', // none | lowToHigh | highToLow
  };
  const sortLabels = { none: 'Price', lowToHigh: 'Price ↑', highToLow: 'Price ↓' };

  const LIST_PAGE = 24; // sidebar results per page
  let visibleCount = LIST_PAGE;

  let map = null;
  let clusterGroup = null;
  let userMarker = null;
  let geoListings = []; // all listings that carry coordinates
  let selected = null; // currently open listing
  let isLocating = false;
  let userInteracted = false;

  const NAIROBI = [-1.2921, 36.8219];
  const LABEL_ZOOM = 13; // show area labels on pins at/above this zoom

  /* ── Filtering (mirrors _filterListings + map_filters.dart) ── */
  function filtered() {
    let res = geoListings;
    const q = state.q.trim().toLowerCase();
    if (q) {
      res = res.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          (l.area + ' ' + l.county).toLowerCase().includes(q)
      );
    }
    if (state.bed === 4) res = res.filter((l) => l.beds >= 4);
    else if (state.bed > 0) res = res.filter((l) => l.beds === state.bed);
    if (state.deal !== 'all') res = res.filter((l) => l.deal === state.deal);
    if (state.minPrice != null) res = res.filter((l) => l.price >= state.minPrice);
    if (state.maxPrice != null) res = res.filter((l) => l.price <= state.maxPrice);
    if (state.sort === 'lowToHigh') res = [...res].sort((a, b) => a.price - b.price);
    else if (state.sort === 'highToLow') res = [...res].sort((a, b) => b.price - a.price);
    return res;
  }

  function hasActiveFilters() {
    return (
      state.q.trim() !== '' ||
      state.bed > 0 ||
      state.deal !== 'all' ||
      state.minPrice != null ||
      state.maxPrice != null ||
      state.sort !== 'none'
    );
  }

  /* ── Sidebar results (reuses the site's property card) ──────── */
  function renderList() {
    const list = filtered();
    const shown = list.slice(0, visibleCount);

    countText.textContent =
      list.length === 0 && !M.usingDemo
        ? 'No properties match your filters'
        : (list.length === 1 ? '1 property' : list.length + ' properties') + ' on map';

    if (shown.length === 0) {
      listEl.innerHTML =
        '<p class="map-sidebar__empty">No properties match your filters.<br/>Try widening the search.</p>';
      return;
    }

    const rows = shown.map((l) => {
      const href = 'property.html?id=' + encodeURIComponent(l.id);
      return (
        '<article class="map-row' + (selected && selected.id === l.id ? ' is-selected' : '') + '" data-id="' + esc(l.id) + '" tabindex="0" role="button" aria-label="Show ' + esc(l.title) + ' on the map">' +
        (l.image
          ? '<img class="map-row__img" src="' + esc(l.image) + '" alt="" loading="lazy" onerror="this.closest(\'.map-row\').classList.add(\'has-placeholder\')" />'
          : '<div class="map-row__img map-row__img--placeholder" aria-hidden="true"></div>') +
        '  <div class="map-row__body">' +
        '    <div class="map-row__top">' +
        '      <span class="tag ' + M.dealClass(l) + ' map-row__tag">' + M.dealLabel(l) + '</span>' +
        '      <span class="map-row__price">' + M.priceCompact(l) + '</span>' +
        '    </div>' +
        '    <h3 class="map-row__title"><a href="' + href + '">' + esc(l.title) + '</a></h3>' +
        '    <p class="map-row__loc">' + PIN + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</p>' +
        '    <div class="map-row__specs">' + rowSpecs(l) + '</div>' +
        '  </div>' +
        '</article>'
      );
    }).join('');

    listEl.innerHTML = rows +
      (list.length > visibleCount
        ? '<button type="button" class="btn btn--outline map-row__more" id="listMore">Show more (' + (list.length - visibleCount) + ' more)</button>'
        : '');
    const more = $('listMore');
    if (more) more.addEventListener('click', () => { visibleCount += LIST_PAGE; renderList(); });
  }

  function rowSpecs(l) {
    const parts = [];
    if (l.beds > 0) parts.push('<span>\u{1F6CF} ' + l.beds + '</span>');
    if (l.baths > 0) parts.push('<span>\u{1F6C1} ' + l.baths + '</span>');
    if (l.size > 0) parts.push('<span>\u25A6 ' + l.size.toLocaleString('en-US') + ' m\u00B2</span>');
    return parts.join('');
  }

  function highlightRow(id) {
    listEl.querySelectorAll('.map-row').forEach((r) => {
      r.classList.toggle('is-selected', r.dataset.id === id);
    });
    const row = listEl.querySelector('.map-row.is-selected');
    if (row && row.scrollIntoView) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ── Markers & clustering ───────────────────────────────────── */
  function jitterDuplicates(list) {
    const seen = {};
    return list.map((l) => {
      const key = l.lat.toFixed(5) + ',' + l.lng.toFixed(5);
      const n = (seen[key] = (seen[key] || 0) + 1);
      if (n === 1) return l;
      const step = (n - 1) * 0.00045;
      return { ...l, lat: l.lat + step, lng: l.lng + step };
    });
  }

  function buildMarker(l) {
    const isSel = selected && selected.id === l.id;
    const icon = L.divIcon({
      className: 'map-pin',
      iconSize: [0, 0],
      html:
        '<div class="map-pin__pill' +
        (isSel ? ' is-selected' : '') +
        (l.deal === 'sale' ? ' is-sale' : ' is-rent') +
        '">' +
        '<span class="map-pin__dot" aria-hidden="true"></span>' +
        (l.area
          ? '<span class="map-pin__label">' + esc(l.area) + '</span>'
          : '') +
        '<span class="map-pin__price">' + M.priceCompact(l) + '</span>' +
        '</div>',
    });
    const marker = L.marker([l.lat, l.lng], { icon });
    marker.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      selectListing(l);
    });
    return marker;
  }

  function rebuildMarkers() {
    if (!clusterGroup) return;
    clusterGroup.clearLayers();
    const list = jitterDuplicates(filtered());
    list.forEach((l) => clusterGroup.addLayer(buildMarker(l)));
    renderList();
    if (selected && !list.some((l) => l.id === selected.id)) {
      closeSheet();
    }
  }

  function selectListing(l) {
    selected = l;
    renderSheet(l);
    rebuildMarkers();
    highlightRow(l.id);
    if (map) map.flyTo([l.lat, l.lng], Math.max(map.getZoom(), 14), { duration: 0.5 });
  }

  /* ── Bottom property card (mobile quick view / desktop detail) ─ */
  function renderSheet(l) {
    const href = 'property.html?id=' + encodeURIComponent(l.id);
    const dealClass = l.deal === 'sale' ? 'tag--sale' : 'tag--rent';
    const img = l.image
      ? '<img src="' + esc(l.image) + '" alt="" loading="lazy" onerror="this.parentElement.classList.add(\'has-placeholder\')" />'
      : '';
    sheetEl.innerHTML =
      '<div class="map-sheet__card">' +
      '  <div class="map-sheet__thumb' + (img ? '' : ' has-placeholder') + '">' + img + '</div>' +
      '  <div class="map-sheet__body">' +
      '    <span class="tag ' + dealClass + ' map-sheet__tag">' + M.dealLabel(l) + '</span>' +
      '    <h3 class="map-sheet__title"><a href="' + href + '">' + esc(l.title) + '</a></h3>' +
      '    <p class="map-sheet__loc">' + PIN + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</p>' +
      '    <p class="map-sheet__price">' + M.priceFull(l) + '</p>' +
      '  </div>' +
      '  <div class="map-sheet__actions">' +
      '    <button type="button" class="btn btn--outline map-sheet__close" id="sheetClose">Close</button>' +
      '    <a href="' + href + '" class="btn btn--accent map-sheet__view">View Details</a>' +
      '  </div>' +
      '</div>';
    sheetEl.hidden = false;
    $('mapLocate').classList.add('is-lifted');
    const closeBtn = $('sheetClose');
    if (closeBtn) closeBtn.addEventListener('click', closeSheet);
  }

  function closeSheet() {
    selected = null;
    sheetEl.hidden = true;
    $('mapLocate').classList.remove('is-lifted');
    rebuildMarkers();
  }

  /* ── GPS recenter ───────────────────────────────────────────── */
  function showToast(msg, isError) {
    const t = document.createElement('div');
    t.className = 'map-toast' + (isError ? ' is-error' : '');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('is-in'));
    setTimeout(() => {
      t.classList.remove('is-in');
      setTimeout(() => t.remove(), 300);
    }, 2600);
  }

  function locateUser({ move = false } = {}) {
    if (isLocating || !('geolocation' in navigator)) {
      if (move) showToast('Location not available in this browser.', true);
      return;
    }
    isLocating = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isLocating = false;
        const latlng = [pos.coords.latitude, pos.coords.longitude];
        if (userMarker) userMarker.remove();
        userMarker = L.marker(latlng, {
          icon: L.divIcon({ className: 'map-user', iconSize: [26, 26], html: '<span></span>' }),
          zIndexOffset: 1000,
        }).addTo(map);
        if (move) {
          map.flyTo(latlng, 14.5, { duration: 1.2 });
          showToast('Centered to your live location 📍');
        }
      },
      (err) => {
        isLocating = false;
        if (move) {
          showToast(
            err.code === 1 ? 'Location permission denied.' : 'Could not get your location.',
            true
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  /* ── Filter dialog ──────────────────────────────────────────── */
  function openFilterSheet() {
    $('filterMin').value = state.minPrice != null ? state.minPrice : '';
    $('filterMax').value = state.maxPrice != null ? state.maxPrice : '';
    document.querySelectorAll('.filter-sheet__sorts .map-chip--sort').forEach((b) => {
      const active = b.dataset.sortopt === state.sort;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-checked', String(active));
    });
    filterSheetEl.hidden = false;
    filterBackdrop.hidden = false;
    document.body.classList.add('is-locked');
    $('filterMin').focus();
  }

  function closeFilterSheet() {
    filterSheetEl.hidden = true;
    filterBackdrop.hidden = true;
    document.body.classList.remove('is-locked');
  }

  function applyFilterSheet() {
    const min = parseFloat($('filterMin').value);
    const max = parseFloat($('filterMax').value);
    if (min && max && min > max) {
      showToast("Min price can't be greater than max price.", true);
      return;
    }
    state.minPrice = isNaN(min) ? null : min;
    state.maxPrice = isNaN(max) ? null : max;
    state.sort = document.querySelector('.filter-sheet__sorts .map-chip--sort.is-active').dataset.sortopt;
    closeFilterSheet();
    refresh();
  }

  function resetAll() {
    state.q = '';
    state.bed = 0;
    state.deal = 'all';
    state.minPrice = null;
    state.maxPrice = null;
    state.sort = 'none';
    visibleCount = LIST_PAGE;
    searchInput.value = '';
    searchClear.hidden = true;
    document.querySelectorAll('#mapChips .map-chip').forEach((c) => c.classList.remove('is-active'));
    document.querySelectorAll('#mapFilters .seg [data-deal]').forEach((b, i) => {
      b.classList.toggle('is-active', i === 0);
      b.setAttribute('aria-pressed', String(i === 0));
    });
    // Single rebuild: drop selection + sheet, then refresh() once.
    selected = null;
    sheetEl.hidden = true;
    $('mapLocate').classList.remove('is-lifted');
    closeFilterSheet();
    refresh();
  }

  /* ── Refresh everything after a filter change ──────────────── */
  function refresh() {
    filterDot.hidden = !hasActiveFilters();
    chipPrice.textContent = sortLabels[state.sort];
    chipPrice.setAttribute('aria-pressed', String(state.sort !== 'none'));
    visibleCount = LIST_PAGE;
    rebuildMarkers();
  }

  /* ── Toolbar wiring ─────────────────────────────────────────── */
  function wireToolbar() {
    // Deal segmented control
    document.querySelectorAll('#mapFilters .seg [data-deal]').forEach((b) => {
      b.addEventListener('click', () => {
        state.deal = b.dataset.deal;
        document.querySelectorAll('#mapFilters .seg [data-deal]').forEach((x) => {
          x.classList.toggle('is-active', x === b);
          x.setAttribute('aria-pressed', String(x === b));
        });
        refresh();
      });
    });

    // Bed chips
    document.querySelectorAll('#mapChips .map-chip[data-bed]').forEach((c) => {
      c.addEventListener('click', () => {
        const v = parseInt(c.dataset.bed, 10);
        state.bed = state.bed === v ? 0 : v;
        document.querySelectorAll('#mapChips .map-chip[data-bed]').forEach((x) => {
          x.classList.toggle('is-active', state.bed === parseInt(x.dataset.bed, 10));
        });
        refresh();
      });
    });

    // Price chip cycles: off → cheapest → priciest → off (like the app)
    chipPrice.addEventListener('click', () => {
      state.sort =
        state.sort === 'none'
          ? 'lowToHigh'
          : state.sort === 'lowToHigh'
            ? 'highToLow'
            : 'none';
      refresh();
    });

    $('mapFilterBtn').addEventListener('click', openFilterSheet);
    filterBackdrop.addEventListener('click', closeFilterSheet);
    $('filterApply').addEventListener('click', applyFilterSheet);
    $('filterReset').addEventListener('click', resetAll);
    $('filterLocate').addEventListener('click', () => {
      closeFilterSheet();
      locateUser({ move: true });
    });
    $('mapLocate').addEventListener('click', () => locateUser({ move: true }));
    resetBtn.addEventListener('click', resetAll);
    document.querySelectorAll('.filter-sheet__sorts .map-chip--sort').forEach((b) => {
      b.addEventListener('click', () => {
        document.querySelectorAll('.filter-sheet__sorts .map-chip--sort').forEach((x) => {
          x.classList.toggle('is-active', x === b);
          x.setAttribute('aria-checked', String(x === b));
        });
      });
    });

    // Search
    searchInput.addEventListener('input', onSearch);
    searchInput.addEventListener('search', onSearch);
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      onSearch();
      searchInput.focus();
    });

    // Sidebar toggle (collapse list on desktop)
    sidebarToggle.addEventListener('click', () => {
      const collapsed = mapLayout.classList.toggle('is-collapsed');
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
      sidebarToggle.textContent = collapsed ? 'Show list' : 'Hide list';
      setTimeout(() => map.invalidateSize(), 320);
    });

    // Esc closes sheets
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!filterSheetEl.hidden) closeFilterSheet();
        else if (!sheetEl.hidden) closeSheet();
      }
    });

    // Clicking a sidebar row (not its link) selects the pin
    listEl.addEventListener('click', (e) => {
      const row = e.target.closest('.map-row');
      if (!row) return;
      if (e.target.closest('a')) return; // let the title link navigate
      const l = geoListings.find((x) => x.id === row.dataset.id);
      if (l) selectListing(l);
    });

    // Keyboard access: rows are focusable; Enter/Space selects the pin
    listEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('a')) return; // let the title link handle it
      const row = e.target.closest('.map-row');
      if (!row) return;
      const l = geoListings.find((x) => x.id === row.dataset.id);
      if (l) {
        e.preventDefault();
        selectListing(l);
      }
    });
  }

  let searchTimer = null;
  function onSearch() {
    state.q = searchInput.value;
    searchClear.hidden = searchInput.value === '';
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(refresh, 250); // debounce full rebuild per keystroke
  }

  /* ── Map init (CartoDB dark tiles — matches the app dark mode) ─ */
  function initMap() {
    map = L.map(mapEl, {
      center: NAIROBI,
      zoom: 11.5,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false, // added below, top-right (clear of the floating results panel)
      attributionControl: true,
    });
    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 72,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) => {
        const n = cluster.getChildCount();
        return L.divIcon({
          className: 'map-cluster',
          iconSize: [44, 44],
          html: '<span>' + n + '</span>',
        });
      },
    });
    map.addLayer(clusterGroup);

    map.on('click', () => {
      userInteracted = true;
      if (!filterSheetEl.hidden) closeFilterSheet();
      else closeSheet();
    });
    map.on('dragstart', () => { userInteracted = true; });
    map.on('zoomstart', () => { userInteracted = true; });

    // Area labels appear once zoomed into a neighbourhood (no rebuild —
    // just toggles a class the CSS keys off)
    map.on('zoomend', () => {
      mapEl.classList.toggle('is-zoomed', map.getZoom() >= LABEL_ZOOM);
    });
  }

  /* ── Boot ───────────────────────────────────────────────────── */
  async function boot() {
    initMap();
    wireToolbar();

    // Deep links: map.html?county=X / ?q=Y / ?area=Z pre-fill search
    const params = new URLSearchParams(window.location.search);
    const deepQ = params.get('county') || params.get('q') || params.get('area');
    if (deepQ) {
      state.q = deepQ;
      searchInput.value = deepQ;
      searchClear.hidden = false;
      filterDot.hidden = false;
    }

    // Gentle: recenter on user once at start, but don't move the camera
    locateUser({ move: false });

    try {
      const list = await M.ready();
      geoListings = list.filter((l) => l.lat && l.lng);
      if (demoNotice && M.usingDemo) demoNotice.hidden = false;
      loadingPill.hidden = true;
      rebuildMarkers();
      if (geoListings.length > 0 && !userInteracted) {
        map.fitBounds(
          L.latLngBounds(geoListings.map((l) => [l.lat, l.lng])).pad(0.15),
          { maxZoom: 12 }
        );
      }
      mapEl.classList.toggle('is-zoomed', map.getZoom() >= LABEL_ZOOM);
    } catch (_) {
      loadingPill.hidden = true;
      countText.textContent = 'Could not load listings';
      showToast('Could not load live listings.', true);
    }
  }

  /* ── Shared helpers ─────────────────────────────────────────── */
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const PIN =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
