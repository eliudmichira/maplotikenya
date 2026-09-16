/* ══════════════════════════════════════════════════════════════
   MAPLOTI — shared site behaviors (every page)
   sticky nav · mobile menu · scroll reveal · heart buttons
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Sticky nav ────────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('nav--scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile menu ───────────────────────────────────────────── */
  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');

  const setMenuState = (open) => {
    if (!mobile || !burger) return;
    mobile.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  if (burger && mobile) {
    burger.addEventListener('click', () => setMenuState(!mobile.classList.contains('is-open')));
    mobile.querySelectorAll('a').forEach((link) =>
      link.addEventListener('click', () => setMenuState(false))
    );
  }

  /* ── Current page marker: underline the nav link for this page ── */
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav__link').forEach((link) => {
    const target = (link.getAttribute('href') || '').split('#')[0].toLowerCase();
    if (target && target === here) link.classList.add('is-current');
  });

  /* ── Scroll reveal (works with content rendered later too) ─── */
  const observed = new Set();

  const reveal = (el) => {
    if (!el || observed.has(el)) return;
    observed.add(el);
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-visible');
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
  };

  const initReveals = () => document.querySelectorAll('.reveal').forEach(reveal);

  window.MAPLOTI_SITE = {
    reveal,
    initReveals,
  };

  const boot = () => {
    initReveals();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ── Heart buttons — delegated so rendered cards work too ────
       Real persistence lives in js/user.js (Firestore savedProperties).
       Static/demo cards (index.html hero) have no data-listing-id and
       are ignored. */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.prop__fav');
    if (!btn || !btn.dataset.listingId) return;
    e.preventDefault();
    const M = window.MAPLOTI_USER;
    if (M) M.toggleSave(btn.dataset.listingId);
  });
})();
