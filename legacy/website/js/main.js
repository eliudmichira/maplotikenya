/* ══════════════════════════════════════════════════════════════
   MAPLOTI — landing page extras (index.html only)
   animated counters · map pin pulses
   (nav, menu, reveals & hearts live in js/site.js — shared)
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const M = window.MAPLOTI;
  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const PIN =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  const VERIFIED =
    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="m12 2 2.4 2.4 3.4-.5.5 3.4L21 9.7l-1.7 3 1.7 3-2.7 2.4-.5 3.4-3.4-.5L12 23l-2.4-2.4-3.4.5-.5-3.4L3 15.7l1.7-3L3 9.7l2.7-2.4.5-3.4 3.4.5L12 2Zm-1.2 13.2 5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3Z"/></svg>';

  /* ── Animated counters ─────────────────────────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const animate = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 1400;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const value = Math.round(target * eased);
        el.textContent = value.toLocaleString('en-US') + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            cio.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ── Map pins pulse (visual flourish) ──────────────────────── */
  function addPulse(pin, i) {
    const pulse = document.createElement('span');
    pulse.className = 'map__pulse';
    pulse.style.animationDelay = i * 0.7 + 's';
    pin.appendChild(pulse);
  }
  document.querySelectorAll('.map__pin').forEach((pin, i) => addPulse(pin, i));

  /* ── Map showcase pins: real county/area hotspots ──────────────
       Groups live listings by county, plots the top counties at their
       true centroid (projected onto the stylized Kenya canvas) and
       deep-links each pin to the real map filtered to that area.
       Falls back to neighbourhoods when every listing shares a single
       county (the current dataset is 100% "Nairobi" while areas like
       Westlands / Kilimani / Mombasa have distinct real coordinates).
       Static pins in the HTML stay as the offline fallback. */
  const KENYA = { latMin: -4.7, latMax: 4.7, lngMin: 33.9, lngMax: 41.9 };

  function initMapPins(list) {
    const canvas = document.getElementById('mapShowcase');
    if (!canvas || M.usingDemo) return; // keep static fallback pins

    const key = (l) => (l.county || '').trim();
    const byKey = {};
    list.forEach((l) => {
      if (!l.lat || !l.lng) return;
      const k = key(l);
      (byKey[k] = byKey[k] || []).push(l);
    });
    const counties = Object.keys(byKey).filter(Boolean);
    // When the county field is degenerate (today it's 100% "Nairobi") fall
    // back to neighbourhoods — but bucket each listing by whichever key it
    // actually has, so mixed/partial data never silently undercounts.
    const useAreas = counties.length <= 1;
    const labelOf = (l) => {
      const c = key(l);
      if (useAreas) return (l.area || '').trim() || c;
      return c || (l.area || '').trim();
    };

    const byGroup = {};
    list.forEach((l) => {
      if (!l.lat || !l.lng) return;
      const g = labelOf(l);
      if (!g) return;
      (byGroup[g] = byGroup[g] || []).push(l);
    });

    const hotspots = Object.keys(byGroup)
      .map((name) => {
        const group = byGroup[name];
        return {
          name,
          count: group.length,
          lat: group.reduce((s, l) => s + l.lat, 0) / group.length,
          lng: group.reduce((s, l) => s + l.lng, 0) / group.length,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    if (hotspots.length === 0) return;

    // Project to canvas %, then nudge overlapping hotspots apart so
    // several Nairobi-metro neighbourhoods don't stack into one dot.
    const placed = hotspots.map((h) => {
      const x = Math.min(84, Math.max(12, ((h.lng - KENYA.lngMin) / (KENYA.lngMax - KENYA.lngMin)) * 100));
      const y = Math.min(78, Math.max(14, ((KENYA.latMax - h.lat) / (KENYA.latMax - KENYA.latMin)) * 100));
      return { ...h, x, y };
    });
    for (let pass = 0; pass < 2; pass++) {
      placed.forEach((a, i) => {
        placed.forEach((b, j) => {
          if (i >= j) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < 7) {
            const push = (7 - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            a.x -= ux * push; a.y -= uy * push;
            b.x += ux * push; b.y += uy * push;
          }
        });
      });
    }

    // Replace the static demo pins with live hotspots
    canvas
      .querySelectorAll('.map__pin--1, .map__pin--2, .map__pin--3, .map__pin--4, .map__pin--5')
      .forEach((p) => p.remove());

    placed.forEach((h, i) => {
      const x = Math.min(84, Math.max(12, h.x));
      const y = Math.min(78, Math.max(14, h.y));

      const pin = document.createElement('div');
      pin.className = 'map__pin map__pin--live';
      pin.style.left = x + '%';
      pin.style.top = y + '%';
      pin.setAttribute('role', 'link');
      pin.setAttribute('tabindex', '0');
      pin.setAttribute('aria-label', h.name + ' · ' + h.count + ' listing' + (h.count === 1 ? '' : 's'));

      const dot = document.createElement('i');
      const tip = document.createElement('span');
      tip.className = 'map__tooltip';
      tip.textContent = h.name + ' · ' + h.count + (h.count === 1 ? ' listing' : ' listings');
      pin.appendChild(dot);
      pin.appendChild(tip);
      addPulse(pin, i);

      pin.addEventListener('click', () => {
        window.location.href = 'map.html?county=' + encodeURIComponent(h.name);
      });
      pin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pin.click();
        }
      });
      canvas.appendChild(pin);
    });
  }

  /* ── Phone mockup cards: top real featured listings ─────────────
       Same ph-card markup, real listings. Static cards in the HTML
       stay as the offline fallback. */
  function phoneCardHTML(l) {
    const specs = [];
    if (l.beds > 0) specs.push('\u{1F6CF} ' + l.beds);
    if (l.baths > 0) specs.push('\u{1F6C1} ' + l.baths);
    if (l.size > 0) specs.push('\u25A6 ' + l.size.toLocaleString('en-US'));
    if (specs.length === 0) specs.push('—');
    return (
      '<div class="ph-card">' +
      '  <div class="ph-card__img">' +
      (l.image ? '<img src="' + esc(l.image) + '" alt="" loading="lazy" />' : '') +
      '    <span class="ph-card__price">' + M.priceCompact(l) + '</span>' +
      '    <span class="ph-card__badge' + (l.deal === 'rent' ? ' ph-card__badge--rent' : '') + '">' + M.dealLabel(l) + '</span>' +
      '  </div>' +
      '  <div class="ph-card__body">' +
      '    <p class="ph-card__title">' + esc(l.title) + '</p>' +
      '    <p class="ph-card__loc">▣ ' + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</p>' +
      '    <p class="ph-card__specs">' + specs.join('&ensp;') + '</p>' +
      '  </div>' +
      '</div>'
    );
  }

  function initPhoneCards(list) {
    const cards = document.getElementById('phoneCards');
    if (!cards || M.usingDemo) return; // keep static fallback cards
    const pool = list.filter((l) => l.image).slice(0, 2);
    if (pool.length === 0) return;
    cards.innerHTML = pool.map(phoneCardHTML).join('');
  }

  /* ── Hero showcase: auto-rotating real listings ────────────────
       Renders the top featured listings into the hero card and
       crossfades between them. Falls back to the static card in the
       HTML when Firestore is unreachable. */
  function heroSlideHTML(l) {
    const href = 'property.html?id=' + encodeURIComponent(l.id);
    const stats = [];
    if (l.beds > 0) stats.push('<span>\u{1F6CF} ' + l.beds + ' Beds</span>');
    if (l.baths > 0) stats.push('<span>\u{1F6C1} ' + l.baths + ' Baths</span>');
    if (l.size > 0) stats.push('<span>\u25A6 ' + l.size.toLocaleString('en-US') + ' m\u00B2</span>');

    return (
      '<a class="hero-slide" href="' + href + '">' +
      '  <div class="hero-card__img">' +
      '    <img src="' + esc(l.image) + '" alt="' + esc(l.title) + '" loading="' + (l._first ? 'eager' : 'lazy') + '" onerror="this.closest(\'.hero-card__img\').classList.add(\'has-error\')" />' +
      '    <div class="hero-card__shade"></div>' +
      '    <span class="tag tag--price">' + M.priceFull(l) + '</span>' +
      '    <span class="tag ' + M.dealClass(l) + '">' + M.dealLabel(l) + '</span>' +
      (l.verified ? '    <span class="tag tag--verified">' + VERIFIED + ' VERIFIED</span>' : '') +
      '  </div>' +
      '  <div class="hero-card__body">' +
      '    <div class="hero-card__title">' + esc(l.title) + '</div>' +
      '    <div class="hero-card__loc">' + PIN + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</div>' +
      '    <div class="hero-card__stats">' + stats.join('') + '</div>' +
      '  </div>' +
      '</a>'
    );
  }

  function initHeroShowcase(list) {
    const slidesEl = document.getElementById('heroSlides');
    const controls = document.getElementById('heroControls');
    const dotsEl = document.getElementById('heroDots');
    if (!slidesEl || !controls || !dotsEl) return;

    // Top featured listings that have a photo (loader already sorts
    // featured-first, then newest). When Firestore is unreachable we
    // keep the static card (it already shows the demo content).
    if (M.usingDemo) return;
    const pool = list.filter((l) => l.image).slice(0, 5);
    if (pool.length === 0) return; // keep the static fallback card

    slidesEl.innerHTML = pool.map((l, i) => heroSlideHTML({ ...l, _first: i === 0 })).join('');
    const items = slidesEl.querySelectorAll('.hero-slide');
    let current = 0;

    // Dot indicators (plain buttons — no tablist role, which would
    // promise arrow-key navigation we don't implement)
    const dots = pool.map((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hero-card__dot' + (i === 0 ? ' is-active' : '');
      b.setAttribute('aria-label', 'Show property ' + (i + 1) + ' of ' + pool.length);
      if (i === 0) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => show(i));
      dotsEl.appendChild(b);
      return b;
    });

    function show(i) {
      current = (i + pool.length) % pool.length;
      items.forEach((el, idx) => {
        const active = idx === current;
        el.classList.toggle('is-active', active);
        el.setAttribute('aria-hidden', String(!active));
        el.tabIndex = active ? 0 : -1;
      });
      dots.forEach((d, idx) => {
        d.classList.toggle('is-active', idx === current);
        if (idx === current) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
    }

    const next = () => show(current + 1);
    const prev = () => show(current - 1);

    document.getElementById('heroPrev').addEventListener('click', () => { restart(); prev(); });
    document.getElementById('heroNext').addEventListener('click', () => { restart(); next(); });

    // Auto-rotate: pause on hover, respect reduced motion
    let timer = null;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = () => {
      if (pool.length < 2 || reduced) return;
      stop();
      timer = setInterval(next, 5000);
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const restart = () => { stop(); start(); };
    // Pause while hovering or focusing the card OR its controls (they're
    // siblings, so both need the handlers)
    const card = document.getElementById('heroShowcase');
    [card, controls].forEach((el) => {
      if (!el) return;
      el.addEventListener('mouseenter', stop);
      el.addEventListener('mouseleave', restart);
      el.addEventListener('focusin', stop);
      el.addEventListener('focusout', restart);
    });

    controls.hidden = pool.length < 2;
    show(0);
    start();
  }

  /* ── Featured grid: top 4 real listings, same cards as listings.html ──
       Renders into #featuredGrid. The static cards in the HTML are kept
       as the offline / no-JS fallback (and match the demo data exactly). */
  function initFeatured(list) {
    const grid = document.getElementById('featuredGrid');
    if (!grid) return;
    if (M.usingDemo) return; // static cards already show the demo content

    const pool = list.filter((l) => l.image).slice(0, 4);
    if (pool.length === 0) return;

    grid.innerHTML = pool
      .map((l, i) =>
        M.cardHTML(l, {
          cls: 'prop reveal' + (i ? ' reveal--delay-' + i : ''),
          eager: i === 0,
        })
      )
      .join('');

    grid.querySelectorAll('.reveal').forEach((el) => window.MAPLOTI_SITE.reveal(el));
    if (window.MAPLOTI_USER) window.MAPLOTI_USER.syncHearts();
  }

  /* ── Real listing count from Firestore (same data as the app) ─
       All numbers come from the shared M.liveStats() helper so the
       homepage, login panel and any future surface stay in sync. */
  (async function liveCount() {
    try {
      const list = await M.ready();
      const s = M.liveStats(list);
      const formatted = s.listings.toLocaleString('en-US');

      const hero = document.getElementById('heroListings');
      if (hero) {
        hero.dataset.count = String(s.listings);
        hero.textContent = formatted + '+';
      }
      const chip = document.getElementById('chipListings');
      if (chip) chip.textContent = formatted + ' live listings';
      const chipAreas = document.getElementById('chipAreas');
      if (chipAreas && s.topAreas.length) chipAreas.textContent = s.topAreas.join(' · ');
      const badge = document.getElementById('mapBadge');
      if (badge) badge.textContent = '● ' + formatted + ' live listings';

      // Real neighbourhood count (distinct areas in the live data)
      const areas = document.getElementById('statAreas');
      if (areas) areas.textContent = s.areas ? s.areas.toLocaleString('en-US') : '—';

      // Top areas (where the inventory actually is) — replaces the old
      // "47 counties" claim while the county field stays degenerate.
      const topAreas = document.getElementById('statTopAreas');
      if (topAreas) topAreas.textContent = s.topAreas.length ? s.topAreas.join(' · ') : '—';

      // Real median SALE price (KES) — rent prices are excluded inside
      // liveStats() so the figure is never skewed by monthly rents.
      const median = document.getElementById('statMedian');
      if (median && s.median) median.textContent = M.priceCompact({ price: s.median });

      // Real counts on the Browse-by-type tiles
      const tiles = document.getElementById('typeTiles');
      if (tiles) {
        const counts = {};
        list.forEach((l) => {
          const t = l.type;
          counts[t] = (counts[t] || 0) + 1;
        });
        tiles.querySelectorAll('.type-tile').forEach((tile) => {
          const key = tile.getAttribute('data-type');
          if (!key) return;
          const countEl = tile.querySelector('.type-tile__count');
          const n = counts[key] || 0;
          if (countEl) {
            if (n > 0) countEl.textContent = n + (n === 1 ? ' listing' : ' listings');
            else {
              countEl.textContent = 'No listings yet';
              tile.classList.add('is-dim');
            }
          }
        });
      }

      // Live hero showcase (real featured listings)
      initHeroShowcase(list);
      // Live featured grid (real listings, same cards as listings.html)
      initFeatured(list);
      // Live map showcase pins (real county hotspots)
      initMapPins(list);
      // Live phone mockup cards (real featured listings)
      initPhoneCards(list);
    } catch (_) { /* keep static fallback numbers + cards */ }
  })();

  /* ── Hero search: sale/rent toggle drives the hidden deal field ─ */
  const heroSearch = document.getElementById('heroSearch');
  if (heroSearch) {
    const dealInput = document.getElementById('hsDeal');
    heroSearch.querySelectorAll('.hs__seg').forEach((btn) => {
      btn.addEventListener('click', () => {
        heroSearch.querySelectorAll('.hs__seg').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        if (dealInput) dealInput.value = btn.dataset.hsDeal;
      });
    });
  }
})();
