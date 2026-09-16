/* ══════════════════════════════════════════════════════════════
   MAPLOTI — saved page (saved.html only)
   lists the signed-in user's savedProperties as property cards,
   each with a remove control. Re-renders live from the shared
   MAPLOTI_USER state (auth + saved set streamed from Firestore),
   so un-saving anywhere on the site updates this page instantly.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const M = window.MAPLOTI;
  const U = window.MAPLOTI_USER;
  const $ = (id) => document.getElementById(id);

  const grid = $('savedGrid');
  const count = $('savedCount');
  const empty = $('savedEmpty');
  const area = $('savedArea');
  const prompt = $('signedOut');
  const demoNotice = $('demoNotice');

  const HEART =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';
  const PIN =
    '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
  const VERIFIED =
    '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true"><path d="m12 2 2.4 2.4 3.4-.5.5 3.4L21 9.7l-1.7 3 1.7 3-2.7 2.4-.5 3.4-3.4-.5L12 23l-2.4-2.4-3.4.5-.5-3.4L3 15.7l1.7-3L3 9.7l2.7-2.4.5-3.4 3.4.5L12 2Zm-1.2 13.2 5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3Z"/></svg>';
  const TRASH =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>';

  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let LISTINGS = [];
  let dataLoaded = false;

  /* ── Card markup (same cards as the listings grid, + Remove) ── */
  function specsHTML(l) {
    const parts = [];
    if (l.beds > 0) parts.push('<span>\u{1F6CF} ' + l.beds + '</span>');
    if (l.baths > 0) parts.push('<span>\u{1F6C1} ' + l.baths + '</span>');
    parts.push('<span>\u25A6 ' + l.size.toLocaleString('en-US') + ' m\u00B2</span>');
    return parts.join('');
  }

  function cardHTML(l) {
    const href = 'property.html?id=' + encodeURIComponent(l.id);
    return (
      '<article class="prop reveal" data-id="' + esc(l.id) + '">' +
      '  <div class="prop__img">' +
      '    <a class="prop__img-link" href="' + href + '" tabindex="-1" aria-hidden="true"></a>' +
      (l.image ? '<img src="' + esc(l.image) + '" alt="' + esc(l.title) + '" loading="lazy" onerror="this.closest(\'.prop__img\').classList.add(\'has-placeholder\')" />' : '') +
      '    <span class="tag tag--price">' + M.priceCompact(l) + '</span>' +
      '    <span class="tag ' + M.dealClass(l) + '">' + M.dealLabel(l) + '</span>' +
      (l.verified ? '    <span class="tag tag--verified">' + VERIFIED + ' VERIFIED</span>' : '') +
      '    <button class="prop__fav" data-listing-id="' + esc(l.id) + '" data-listing-title="' + esc(l.title) + '" aria-label="Unsave ' + esc(l.title) + '" aria-pressed="true">' + HEART + '</button>' +
      '  </div>' +
      '  <div class="prop__body">' +
      '    <h3 class="prop__title"><a href="' + href + '">' + esc(l.title) + '</a></h3>' +
      '    <p class="prop__loc">' + PIN + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</p>' +
      '    <div class="prop__specs">' + specsHTML(l) + '</div>' +
      '    <button type="button" class="saved__remove" data-listing-id="' + esc(l.id) + '">' + TRASH + ' Remove</button>' +
      '  </div>' +
      '</article>'
    );
  }

  /* ── Render ─────────────────────────────────────────────────── */
  function skeleton() {
    return Array.from({ length: 6 }, () =>
      '<article class="prop prop--skeleton"><div class="prop__img"></div><div class="prop__body"><div class="sk sk--t"></div><div class="sk sk--l"></div><div class="sk sk--s"></div></div></article>'
    ).join('');
  }

  function render() {
    if (!U) return;

    // Auth or the listings data is still resolving — keep the skeleton
    // so signed-in users never see a flash of the "sign in" prompt or
    // a false "0 saved" empty state before their data arrives.
    if (!U.ready || !dataLoaded) {
      prompt.hidden = true;
      area.hidden = false;
      empty.hidden = true;
      count.innerHTML = 'Loading your saved properties…';
      grid.innerHTML = skeleton();
      return;
    }

    if (!U.user) {
      prompt.hidden = false;
      area.hidden = true;
      return;
    }

    prompt.hidden = true;
    area.hidden = false;

    const savedIds = new Set([...U.saved].map(String));
    const saved = LISTINGS
      .filter((l) => savedIds.has(String(l.id)))
      .sort((a, b) => (a.added < b.added ? 1 : -1));

    count.innerHTML =
      saved.length === 1
        ? 'Showing <strong>1</strong> saved property'
        : 'Showing <strong>' + saved.length + '</strong> saved properties';

    if (saved.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }

    empty.hidden = true;
    grid.innerHTML = saved.map(cardHTML).join('');

    // Wire scroll reveals + reflect the live saved state on hearts
    grid.querySelectorAll('.reveal').forEach((el) => window.MAPLOTI_SITE.reveal(el));
    U.syncHearts();
  }

  /* ── Remove button (heart is handled by site.js delegation) ─── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.saved__remove');
    if (!btn || !btn.dataset.listingId) return;
    e.preventDefault();
    if (U) U.toggleSave(btn.dataset.listingId);
  });

  /* ── Init ───────────────────────────────────────────────────── */
  M.ready()
    .then((list) => {
      LISTINGS = list;
      dataLoaded = true;
      if (demoNotice && M.usingDemo) demoNotice.hidden = false;
      render();
    })
    .catch(() => {
      dataLoaded = true;
      if (U && U.user) {
        count.innerHTML = 'Showing <strong>0</strong> saved properties';
        empty.hidden = false;
        empty.querySelector('h3').textContent = 'Couldn\u2019t load listings';
        empty.querySelector('p').textContent = 'We had trouble reaching the live listings. Check your connection and try again.';
        const retry = empty.querySelector('a');
        retry.textContent = 'Try Again';
        retry.href = '#';
        retry.addEventListener('click', (e) => {
          e.preventDefault();
          location.reload();
        });
      }
    });

  // Re-render on every auth / saved-set change (fires immediately too)
  if (U) U.onChange(render);
})();
