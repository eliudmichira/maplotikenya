/* ══════════════════════════════════════════════════════════════
   MAPLOTI — property detail page (property.html only)
   reads ?id= → loads the SAME listing from Firestore (data.js) →
   renders gallery, sidebar, specs, agent, similar · rich share
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const M = window.MAPLOTI;
  const $ = (id) => document.getElementById(id);

  const root = $('pdRoot');
  const crumbTitle = $('pdCrumbTitle');
  const id = new URLSearchParams(location.search).get('id');
  let listing = M.byId(id);

  const esc = (s) =>
    String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const ICONS = {
    bed: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 17V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M2 13h20M2 17v3M22 17v3M6 9V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/></svg>',
    bath: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16v1a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-1Z"/><path d="M6 12V6a2 2 0 0 1 2-2c.8 0 1.4.3 2 .8M7 21l1-3M17 21l-1-3"/></svg>',
    size: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    home: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
    wa: '<svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.4-3c-.3-.4 0-.5.1-.7l.4-.5c.1-.2.2-.3.3-.5v-.5c0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.1s.9 2.5 1 2.6c.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.4.5.6.2 1.1.2 1.6.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z"/></svg>',
    call: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    verified: '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="m12 2 2.4 2.4 3.4-.5.5 3.4L21 9.7l-1.7 3 1.7 3-2.7 2.4-.5 3.4-3.4-.5L12 23l-2.4-2.4-3.4.5-.5-3.4L3 15.7l1.7-3L3 9.7l2.7-2.4.5-3.4 3.4.5L12 2Zm-1.2 13.2 5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3Z"/></svg>',
  };

  /* ── Share helpers ─────────────────────────────────────────── */
  function shareURL(l) {
    return location.origin + location.pathname + '?id=' + encodeURIComponent(l.id);
  }
  function shareText(l) {
    return l.title + ' — ' + M.priceFull(l) + ' in ' + l.area + ', ' + l.county + ' · Maploti';
  }

  /* ── Small card (similar listings) ─────────────────────────── */
  function cardHTML(l) {
    const href = 'property.html?id=' + encodeURIComponent(l.id);
    const specs = [];
    if (l.beds > 0) specs.push('<span>\u{1F6CF} ' + l.beds + '</span>');
    if (l.baths > 0) specs.push('<span>\u{1F6C1} ' + l.baths + '</span>');
    specs.push('<span>\u25A6 ' + l.size.toLocaleString('en-US') + ' m\u00B2</span>');
    return (
      '<article class="prop reveal" data-id="' + esc(l.id) + '">' +
      '  <div class="prop__img">' +
      '    <a class="prop__img-link" href="' + href + '" tabindex="-1" aria-hidden="true"></a>' +
      (l.image ? '<img src="' + esc(l.image) + '" alt="' + esc(l.title) + '" loading="lazy" />' : '') +
      '    <span class="tag tag--price">' + M.priceCompact(l) + '</span>' +
      '    <span class="tag ' + M.dealClass(l) + '">' + M.dealLabel(l) + '</span>' +
      '    <button class="prop__fav" data-listing-id="' + esc(l.id) + '" data-listing-title="' + esc(l.title) + '" aria-label="Save ' + esc(l.title) + '" aria-pressed="false">' + ICONS.heart + '</button>' +
      '  </div>' +
      '  <div class="prop__body">' +
      '    <h3 class="prop__title"><a href="' + href + '">' + esc(l.title) + '</a></h3>' +
      '    <p class="prop__loc">' + ICONS.pin + esc(l.area) + (l.county ? ', ' + esc(l.county) : '') + '</p>' +
      '    <div class="prop__specs">' + specs.join('') + '</div>' +
      '  </div>' +
      '</article>'
    );
  }

  /* ── Not found ─────────────────────────────────────────────── */
  function renderNotFound() {
    crumbTitle.textContent = 'Not found';
    root.innerHTML =
      '<div class="pd__notfound reveal">' +
      '  <h2>Listing not found</h2>' +
      '  <p>That property may have been sold, rented or removed. Browse the live listings instead.</p>' +
      '  <a href="listings.html" class="btn btn--accent">Browse Properties</a>' +
      '</div>';
    window.MAPLOTI_SITE.reveal(root.firstElementChild);
  }

  /* ── OG tags (rich link previews when shared) ──────────────── */
  function setOGTags(l) {
    const setMeta = (attr, key, content) => {
      let el = document.querySelector('meta[' + attr + '="' + key + '"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    const image = l.gallery[0] || l.image || '';
    setMeta('property', 'og:title', l.title + ' — Maploti');
    setMeta('property', 'og:description', shareText(l));
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', shareURL(l));
    setMeta('property', 'og:type', 'website');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', l.title + ' — Maploti');
    setMeta('name', 'twitter:description', shareText(l));
    setMeta('name', 'twitter:image', image);
  }

  /* ── Main render ───────────────────────────────────────────── */
  function renderListing(l, owner) {
    crumbTitle.textContent = l.title;
    document.title = l.title + ' — Maploti';

    const agent = owner || l.agent || null;
    // Scraped `agent` objects may use different field names — read defensively.
    const agentName = agent && agent.name ? String(agent.name) : 'Maploti Agent';
    const agentRole = agent && agent.role ? String(agent.role) : 'Listed on Maploti';
    const agentPhone = agent && agent.phone ? String(agent.phone) : '';
    const hasContact = !!agentPhone;
    const waDigits = hasContact
      ? agentPhone.replace(/[^\d]/g, '').replace(/^0/, '254')
      : '';
    const url = shareURL(l);
    const waText = encodeURIComponent(shareText(l) + '\n' + url);
    const waHref = 'https://wa.me/' + waDigits + '?text=' + waText;
    const added = l.added
      ? new Date(l.added + 'T00:00:00').toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        })
      : 'Recently';
    const ref = 'MA-' + String((window.MAPLOTI_LISTINGS || []).indexOf(l) + 1).padStart(3, '0');
    // Owner/agent photo (users/{uid}.photoUrl) falls back to the initial.
    const agentPhoto = owner && owner.photo ? String(owner.photo) : (agent && agent.photo ? String(agent.photo) : '');
    const agentAvatar = (agentName || 'M').charAt(0);

    root.innerHTML =
      '<div class="pd__grid">' +
      /* ── Gallery ── */
      '  <div class="pd__gallery reveal">' +
      '    <div class="pd__main">' +
      (l.gallery[0]
        ? '<img id="pdMainImg" src="' + esc(l.gallery[0]) + '" alt="' + esc(l.title) + ' — photo 1" />'
        : '<div class="pd__main pd__main--blank"><p>No photos available yet</p></div>') +
      '      <span class="tag tag--price">' + M.priceFull(l) + '</span>' +
      '      <span class="tag ' + M.dealClass(l) + '">' + M.dealLabel(l) + '</span>' +
      (l.verified ? '      <span class="tag tag--verified">' + ICONS.verified + ' VERIFIED</span>' : '') +
      (l.gallery.length > 1 ? '      <span class="pd__main-count mono" id="pdCount">1 / ' + l.gallery.length + '</span>' : '') +
      '    </div>' +
      (l.gallery.length > 1
        ? '    <div class="pd__thumbs" id="pdThumbs">' +
          l.gallery.map((src, i) =>
            '<button type="button" class="pd__thumb' + (i === 0 ? ' is-active' : '') + '" data-i="' + i + '" aria-label="Photo ' + (i + 1) + '">' +
            '<img src="' + esc(src) + '" alt="" loading="lazy" /></button>'
          ).join('') +
          '    </div>'
        : '') +
      '  </div>' +

      /* ── Sidebar ── */
      '  <aside class="pd__side reveal reveal--delay-1">' +
      '    <div class="pd__card">' +
      '      <div class="pd__deal-row">' +
      '        <span class="pd__price">' + M.priceFull(l) + '</span>' +
      '        <span class="pd__deal-badge' + (l.deal === 'rent' ? ' pd__deal-badge--rent' : '') + '">' + M.dealLabel(l) + '</span>' +
      '      </div>' +
      '      <div class="pd__perks">' +
      '        <div class="pd__perk">' + ICONS.bed + '<span>' + (l.beds > 0 ? l.beds + ' Beds' : '—') + '</span></div>' +
      '        <div class="pd__perk">' + ICONS.bath + '<span>' + (l.baths > 0 ? l.baths + ' Baths' : '—') + '</span></div>' +
      '        <div class="pd__perk">' + ICONS.size + '<span>' + (l.size > 0 ? l.size.toLocaleString('en-US') + ' m\u00B2' : '—') + '</span></div>' +
      '        <div class="pd__perk">' + ICONS.home + '<span>' + esc(l.type) + '</span></div>' +
      '      </div>' +
      '      <div class="pd__ctas">' +
      (hasContact
        ? '        <a href="' + waHref + '" target="_blank" rel="noopener" class="btn btn--wa">' + ICONS.wa + ' WhatsApp Agent</a>' +
          '        <a href="tel:' + esc(agentPhone.replace(/[^+\d]/g, '')) + '" class="btn btn--outline">' + ICONS.call + ' Call ' + esc(agentName.split(' ')[0]) + '</a>'
        : '        <a href="' + waHref.replace('wa.me/' + waDigits, 'wa.me/') + '" target="_blank" rel="noopener" class="btn btn--wa">' + ICONS.wa + ' Ask on WhatsApp</a>') +
      '        <div class="pd__ctas-row">' +
      '          <button type="button" class="btn btn--icon" id="pdSave" data-listing-id="' + esc(l.id) + '" data-listing-title="' + esc(l.title) + '" aria-label="Save this property" aria-pressed="false">' + ICONS.heart + '</button>' +
      '          <button type="button" class="btn btn--icon" id="pdShare" aria-label="Share this property">' + ICONS.share + '</button>' +
      '          <button type="button" class="btn btn--icon" id="pdCopy" aria-label="Copy link">' + ICONS.copy + '</button>' +
      '          <a class="btn btn--icon" style="flex:1" href="listings.html" aria-label="Back to listings">All listings</a>' +
      '        </div>' +
      '      </div>' +
      '      <div class="pd__meta">' +
      '        <span>Listed ' + added + '</span>' +
      '        <span>Ref ' + ref + '</span>' +
      '      </div>' +
      '    </div>' +
      '    <div class="pd__agent">' +
      '      <div class="pd__agent-avatar">' +
      '        <span class="pd__agent-avatar-initial">' + esc(agentAvatar) + '</span>' +
      (agentPhoto
        ? '<img src="' + esc(agentPhoto) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" />'
        : '') +
      '      </div>' +
      '      <div>' +
      '        <div class="pd__agent-name">' + esc(agentName) + '</div>' +
      '        <div class="pd__agent-role">' + ICONS.verified + esc(agentRole) + '</div>' +
      '      </div>' +
      '    </div>' +
      '  </aside>' +
      '</div>' +

      /* ── Body ── */
      '<div class="pd__body">' +
      '  <h1 class="pd__title reveal">' + esc(l.title) + '</h1>' +
      '  <p class="pd__loc reveal">' + ICONS.pin + esc(l.area) + (l.county ? ', ' + esc(l.county) + ' County' : '') + '</p>' +
      (l.tags && l.tags.length
        ? '  <div class="pd__tags reveal">' + l.tags.map((t) => '<span class="pd__tag">' + esc(t) + '</span>').join('') + '</div>'
        : '') +
      '  <h2 class="pd__h reveal">Overview</h2>' +
      '  <p class="pd__desc reveal">' + (l.summary ? esc(l.summary) : 'No description provided for this property yet.') + '</p>' +
      '  <h2 class="pd__h reveal">Key features</h2>' +
      '  <div class="pd__specs reveal">' +
      '    <div class="pd__spec">' + ICONS.bed + '<strong>' + (l.beds > 0 ? l.beds : '—') + '</strong><span>Bedrooms</span></div>' +
      '    <div class="pd__spec">' + ICONS.bath + '<strong>' + (l.baths > 0 ? l.baths : '—') + '</strong><span>Bathrooms</span></div>' +
      '    <div class="pd__spec">' + ICONS.size + '<strong>' + (l.size > 0 ? l.size.toLocaleString('en-US') : '—') + '</strong><span>m\u00B2</span></div>' +
      '    <div class="pd__spec">' + ICONS.home + '<strong>' + esc(l.type) + '</strong><span>Type</span></div>' +
      '  </div>' +
      '</div>';

    /* Similar properties */
    const all = window.MAPLOTI_LISTINGS || [];
    const similar = all
      .filter((x) => x.id !== l.id && (x.type === l.type || x.deal === l.deal))
      .slice(0, 3);
    if (similar.length) {
      const div = document.createElement('section');
      div.className = 'pd__similar';
      div.innerHTML =
        '<p class="eyebrow">You might also like</p>' +
        '<h2 class="heading" style="font-size:clamp(26px,3vw,34px)">Similar properties</h2>' +
        '<div class="props" style="margin-top:36px">' + similar.map(cardHTML).join('') + '</div>';
      root.appendChild(div);
    }

    /* Reveal hooks */
    root.querySelectorAll('.reveal').forEach((el) => window.MAPLOTI_SITE.reveal(el));

    // Reflect the signed-in user's saved state
    if (window.MAPLOTI_USER) window.MAPLOTI_USER.syncHearts();

    /* ── Interactions ── */
    const mainImg = $('pdMainImg');
    const countEl = $('pdCount');
    document.querySelectorAll('.pd__thumb').forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const i = parseInt(thumb.dataset.i, 10);
        mainImg.src = l.gallery[i];
        mainImg.alt = esc(l.title) + ' — photo ' + (i + 1);
        countEl.textContent = (i + 1) + ' / ' + l.gallery.length;
        document.querySelectorAll('.pd__thumb').forEach((t) => t.classList.toggle('is-active', t === thumb));
      });
    });

    const saveBtn = $('pdSave');
    saveBtn.addEventListener('click', async () => {
      if (window.MAPLOTI_USER) {
        const before = window.MAPLOTI_USER.isSaved(l.id);
        await window.MAPLOTI_USER.toggleSave(l.id);
        const after = window.MAPLOTI_USER.isSaved(l.id);
        if (after === before && window.MAPLOTI_USER.isSignedIn) {
          toast('Saved to your shortlist — synced with the app');
        } else if (after) {
          toast('Saved to your shortlist — synced with the app');
        } else {
          toast('Removed from your shortlist');
        }
      }
    });

    // Native share → fallback: copy link
    $('pdShare').addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({ title: l.title, text: shareText(l), url });
          return;
        } catch (_) { /* cancelled — fall through to copy */ }
      }
      await copyLink();
    });

    // Copy link button
    $('pdCopy').addEventListener('click', copyLink);

    async function copyLink() {
      const ok = await copyText(url);
      toast(ok ? 'Link copied — paste it anywhere to share' : 'Copy failed — long-press the URL to copy');
    }
  }

  /* ── Clipboard + tiny toast ────────────────────────────────── */
  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      return true;
    } catch (_) {
      return false;
    }
  }

  function toast(msg, ms) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), ms || 2400);
  }

  /* ── Init (async) ──────────────────────────────────────────── */
  (async function init() {
    try {
      await M.ready();
      listing = M.byId(id);
      if (!listing) {
        renderNotFound();
        return;
      }
      let owner = null;
      if (listing.ownerId) {
        try {
          const db = window.MAPLOTI_DB;
          if (db) {
            const doc = await db.collection('users').doc(listing.ownerId).get();
            if (doc.exists) {
              const d = doc.data() || {};
              owner = {
                name: d.displayName || 'Maploti Agent',
                role: d.role || 'Agent',
                phone: d.phone || '',
                photo: d.photoUrl || '',
              };
            }
          }
        } catch (_) { /* owner profile is optional */ }
      }
      setOGTags(listing);
      renderListing(listing, owner);
    } catch (_) {
      renderNotFound();
    }
  })();
})();
