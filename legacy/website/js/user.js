/* ══════════════════════════════════════════════════════════════
   MAPLOTI — shared user state (every page after js/firebase.js)
   Tracks Firebase Auth + the signed-in user's saved listings.
   Saved listings live in users/{uid}.savedProperties — the SAME
   field the Maploti app reads/writes, so hearts sync both ways.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const auth = window.MAPLOTI_AUTH;
  const db = window.MAPLOTI_DB;

  const HEART_OUT =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';
  const HEART_IN =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>';

  const state = {
    user: null,
    saved: new Set(), // listing IDs
    profile: null,    // { displayName, email, phone, photoUrl, role } from Firestore
    ready: false,     // auth state resolved at least once
  };

  /* ── Listeners (page scripts hook in to re-sync after renders) ── */
  const listeners = new Set();
  function emit() {
    listeners.forEach((fn) => {
      try { fn(state); } catch (_) { /* never let a listener break sync */ }
    });
  }

  /* ── Account menu icons (static markup — never user data) ───── */
  const ICONS = {
    caret:
      '<svg class="nav__user-caret" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    heart:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>',
    plus:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    app:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
    logout:
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>',
    camera:
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M9 3 7.4 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.4L15 3H9Zm3 13.5A4.5 4.5 0 1 1 16.5 12 4.5 4.5 0 0 1 12 16.5Z"/></svg>',
  };

  /* ── Nav: swap "Sign In" for an account menu (dropdown) ───────
       Built with DOM APIs + textContent (never innerHTML with user
       data) so a crafted displayName/email can't inject markup.
       The anchor may have been replaced by the menu already, so
       query both. */
  function textSpan(cls, value) {
    const s = document.createElement('span');
    s.className = cls;
    s.textContent = value;
    return s;
  }

  /* ── Avatar: real photo (from users/{uid}.photoUrl) or initial ──
       photoUrl is a plain URL set via .src (no HTML injection). */
  function avatarEl(classes, initial, photoUrl) {
    if (photoUrl) {
      const img = document.createElement('img');
      img.className = classes + ' nav__user-avatar--photo';
      img.setAttribute('alt', '');
      img.setAttribute('loading', 'lazy');
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.src = photoUrl;
      return img;
    }
    return textSpan(classes, initial);
  }

  /* ── Toast (reuses the global .toast styles) ─────────────────── */
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  /* ── Avatar upload: pick → center-crop to a square → Storage ──
       Writes users/{uid}.photoUrl (same field the app uses), so the
       photo syncs to the Maploti app and back. */
  function resizeToSquare(file, max) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const size = Math.max(1, Math.round(Math.min(1, max / side) * side));
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (e) => { URL.revokeObjectURL(img.src); reject(e); };
      img.src = URL.createObjectURL(file);
    });
  }

  /* Race a promise against a timeout (Storage preflight failures can
     hang instead of rejecting, so we bound the wait). */
  function withTimeout(promise, ms) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), ms);
      promise.then(
        (v) => { clearTimeout(t); resolve(v); },
        (e) => { clearTimeout(t); reject(e); }
      );
    });
  }

  async function uploadAvatar(file) {
    const user = state.user;
    const storage = window.MAPLOTI_STORAGE;
    if (!user || !auth || !db) throw new Error('avatar upload unavailable');

    // Always resize to a small square first — it's the fallback payload
    // AND keeps Storage uploads tiny.
    const dataUrl = await resizeToSquare(file, 256);
    let photoUrl = dataUrl;

    // Prefer Firebase Storage (a real URL the app can also load). If the
    // bucket lacks CORS config for web uploads (or hangs), fall back to
    // storing the small data URL directly — still renders in <img>
    // everywhere and the app decodes it via MemoryImage.
    if (storage) {
      try {
        const ref = storage.ref('avatars/' + user.uid + '.jpg');
        const snapshot = await withTimeout(ref.putString(dataUrl, 'data_url'), 4000);
        photoUrl = await snapshot.ref.getDownloadURL();
      } catch (err) {
        console.warn('Maploti: Storage upload blocked \u2014 storing a small data URL instead.', err);
      }
    }

    await db.collection('users').doc(user.uid).update({
      photoUrl: photoUrl,
      lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return photoUrl;
  }

  let avatarInput = null;
  function openAvatarPicker() {
    if (!avatarInput) {
      avatarInput = document.createElement('input');
      avatarInput.type = 'file';
      avatarInput.accept = 'image/*';
      avatarInput.style.display = 'none';
      document.body.appendChild(avatarInput);
      avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files && avatarInput.files[0];
        avatarInput.value = '';
        if (!file) return;
        const cam = document.querySelector('.nav__user-camera');
        if (cam) cam.classList.add('is-busy');
        try {
          await uploadAvatar(file);
        } catch (err) {
          console.warn('Maploti: avatar upload failed', err);
          showToast('Couldn\u2019t upload that photo \u2014 try a different one.');
        } finally {
          const cam2 = document.querySelector('.nav__user-camera');
          if (cam2) cam2.classList.remove('is-busy');
        }
      });
    }
    avatarInput.click();
  }

  function buildAccountMenu(name, initial, profile) {
    const wrap = document.createElement('span');
    wrap.className = 'nav__user-wrap';
    wrap.id = 'navUser';

    // Chip button
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'nav__user';
    chip.setAttribute('aria-haspopup', 'true');
    chip.setAttribute('aria-expanded', 'false');
    chip.setAttribute('aria-label', 'Account: ' + name);
    chip.appendChild(avatarEl('nav__user-avatar', initial, profile.photoUrl));
    chip.appendChild(textSpan('nav__user-name', name));
    chip.insertAdjacentHTML('beforeend', ICONS.caret);

    // Dropdown panel (plain labeled group — links stay tabbable, no
    // menu-role arrow-key expectations)
    const menu = document.createElement('div');
    menu.className = 'nav__user-menu';
    menu.setAttribute('aria-label', 'Account menu');

    // Profile header — mirrors the app's profile card
    const head = document.createElement('div');
    head.className = 'nav__user-head';
    const photoWrap = document.createElement('span');
    photoWrap.className = 'nav__user-photo';
    photoWrap.appendChild(avatarEl('nav__user-avatar nav__user-avatar--lg', initial, profile.photoUrl));
    const camBtn = document.createElement('button');
    camBtn.type = 'button';
    camBtn.className = 'nav__user-camera';
    camBtn.setAttribute('aria-label', 'Change profile photo');
    camBtn.title = 'Upload a profile photo';
    camBtn.innerHTML = ICONS.camera;
    camBtn.addEventListener('click', (e) => { e.stopPropagation(); openAvatarPicker(); });
    photoWrap.appendChild(camBtn);
    head.appendChild(photoWrap);
    const info = document.createElement('div');
    info.className = 'nav__user-head-info';
    info.appendChild(textSpan('nav__user-display', profile.displayName || name));
    if (profile.email) info.appendChild(textSpan('nav__user-email', profile.email));
    if (profile.phone) info.appendChild(textSpan('nav__user-phone', 'WhatsApp: ' + profile.phone));
    info.appendChild(textSpan('nav__user-role', (profile.role || 'user').toUpperCase()));
    head.appendChild(info);
    menu.appendChild(head);

    // Actions — the app's profile screen actions, web equivalents
    const link = (href, icon, label) => {
      const a = document.createElement('a');
      a.href = href;
      a.insertAdjacentHTML('beforeend', ICONS[icon]);
      a.appendChild(document.createTextNode(label));
      return a;
    };
    menu.appendChild(link('saved.html', 'heart', 'Saved Properties'));
    menu.appendChild(link('login.html', 'plus', 'List a Property'));
    menu.appendChild(link('index.html#app', 'app', 'Get the App'));

    const signOutBtn = document.createElement('button');
    signOutBtn.type = 'button';
    signOutBtn.className = 'nav__user-signout';
    signOutBtn.insertAdjacentHTML('beforeend', ICONS.logout);
    signOutBtn.appendChild(document.createTextNode('Sign Out'));
    signOutBtn.addEventListener('click', () => MAPLOTI_USER.signOut());
    menu.appendChild(signOutBtn);

    const setOpen = (open) => {
      menu.classList.toggle('is-open', open);
      chip.setAttribute('aria-expanded', String(open));
    };
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!menu.classList.contains('is-open'));
    });
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(!menu.classList.contains('is-open'));
      }
    });

    wrap.appendChild(chip);
    wrap.appendChild(menu);
    return wrap;
  }

  function closeOpenMenu(returnFocus) {
    const open = document.querySelector('.nav__user-menu.is-open');
    if (!open) return;
    open.classList.remove('is-open');
    const chip = open.parentNode && open.parentNode.querySelector('.nav__user');
    if (chip) {
      chip.setAttribute('aria-expanded', 'false');
      // Keyboard path: hand focus back to the chip (outside clicks don't)
      if (returnFocus) chip.focus();
    }
  }

  function updateNav() {
    const user = state.user;
    const holder = document.querySelector('.nav__signin') || document.getElementById('navUser');
    if (!holder || !holder.parentNode) return;

    if (user) {
      const profile = state.profile || {};
      const full = profile.displayName || user.displayName || user.email || 'Account';
      const name = full.split(' ')[0];
      const initial = full.charAt(0).toUpperCase();
      holder.parentNode.replaceChild(buildAccountMenu(name, initial, profile), holder);
    } else {
      const anchor = document.createElement('a');
      anchor.href = 'login.html';
      anchor.className = 'btn btn--ghost nav__signin';
      anchor.textContent = 'Sign In';
      holder.parentNode.replaceChild(anchor, holder);
    }

    // Mobile menu: same treatment
    const mobile = document.querySelector('#navMobile a[href="login.html"]');
    if (mobile) {
      mobile.textContent = user ? 'Sign Out' : 'Sign In';
      if (user) {
        mobile.href = 'javascript:void(0)';
        mobile.onclick = (e) => { e.preventDefault(); MAPLOTI_USER.signOut(); };
      } else {
        mobile.href = 'login.html';
        mobile.onclick = null;
      }
    }
  }

  /* ── Hearts: apply saved state to every heart on the page ───── */
  function heartFor(btn) {
    const id = btn.dataset && btn.dataset.listingId;
    if (!id) return;
    const isSaved = state.saved.has(id);
    btn.classList.toggle('is-saved', isSaved);
    btn.innerHTML = isSaved ? HEART_IN : HEART_OUT;
    btn.style.color = isSaved ? '#EF4444' : '';
    btn.setAttribute('aria-pressed', String(isSaved));
    btn.setAttribute('aria-label', (isSaved ? 'Unsave ' : 'Save ') + (btn.dataset.listingTitle || 'this property'));
  }

  function syncHearts() {
    document.querySelectorAll('.prop__fav').forEach(heartFor);
    const detail = document.getElementById('pdSave');
    if (detail) heartFor(detail);
  }

  /* ── Firestore: keep saved set live (same shape as the app) ─── */
  let unsub = null;
  function watchFavorites(uid) {
    if (unsub) { unsub(); unsub = null; }
    if (!db || !uid) return;
    unsub = db.collection('users').doc(uid).onSnapshot(
      (doc) => {
        const data = doc.exists ? doc.data() : {};
        // Source of truth is `savedProperties`; fall back to the legacy
        // `savedListings` key for docs written by older app versions.
        const favs = Array.isArray(data.savedProperties)
          ? data.savedProperties
          : Array.isArray(data.savedListings)
            ? data.savedListings
            : [];
        state.saved = new Set(favs.map(String));

        // Keep the profile fields (email, phone, role…) from the SAME
        // Firestore doc so the account menu shows live profile info.
        const profile = {
          displayName: data.displayName || (state.user && state.user.displayName) || '',
          email: data.email || (state.user && state.user.email) || '',
          phone: data.phone || '',
          photoUrl: data.photoUrl || (state.user && state.user.photoURL) || '',
          role: data.role || 'user',
        };
        if (JSON.stringify(profile) !== JSON.stringify(state.profile)) {
          state.profile = profile;
          updateNav(); // refresh the menu with profile details
        }
        emit();
        syncHearts();
      },
      () => { /* read errors are non-fatal; keep last known state */ }
    );
  }

  /* ── Actions ────────────────────────────────────────────────── */
  async function toggleSave(listingId) {
    const user = state.user;
    if (!user || !auth || !db) {
      // Not signed in → send them to login, back to this page after.
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = 'login.html?next=' + next;
      return;
    }
    if (!listingId) return;

    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    const data = snap.exists ? snap.data() : {};
    const favs = Array.isArray(data.savedProperties)
      ? data.savedProperties.slice()
      : Array.isArray(data.savedListings)
        ? data.savedListings.slice()
        : [];

    const i = favs.indexOf(String(listingId));
    if (i >= 0) favs.splice(i, 1);
    else favs.push(String(listingId));

    // Merge-set keeps the app-compatible profile shape; if the doc is
    // somehow missing this still creates a complete-enough record.
    await ref.set(
      {
        savedProperties: favs,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        displayName: data.displayName || user.displayName || 'User',
        email: data.email || user.email || '',
        phone: data.phone || '',
        photoUrl: data.photoUrl || user.photoURL || '',
        role: data.role || 'user',
      },
      { merge: true }
    );
    // Optimistic local update; the snapshot listener reconciles anyway.
    state.saved = new Set(favs);
    emit();
    syncHearts();
  }

  async function signOut() {
    if (auth) {
      try { await auth.signOut(); } catch (_) { /* ignore */ }
    }
    location.href = location.pathname + location.search;
  }

  /* ── Close the account menu on outside click / Escape ───────── */
  document.addEventListener('click', (e) => {
    const open = document.querySelector('.nav__user-menu.is-open');
    if (open && !open.closest('.nav__user-wrap').contains(e.target)) closeOpenMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOpenMenu(true);
  });

  /* ── Boot ───────────────────────────────────────────────────── */
  if (auth) {
    auth.onAuthStateChanged((user) => {
      state.user = user;
      state.ready = true;
      if (user) watchFavorites(user.uid);
      else {
        if (unsub) { unsub(); unsub = null; }
        state.saved = new Set();
      }
      updateNav();
      emit();
      syncHearts();
    });
  } else {
    state.ready = true;
    updateNav();
  }

  window.MAPLOTI_USER = {
    get user() { return state.user; },
    get isSignedIn() { return !!state.user; },
    get ready() { return state.ready; },
    get saved() { return state.saved; },
    isSaved(id) { return state.saved.has(String(id)); },
    syncHearts,
    onChange(fn) { listeners.add(fn); fn(state); },
    toggleSave,
    signOut,
  };
})();
