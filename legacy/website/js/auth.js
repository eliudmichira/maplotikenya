/* ══════════════════════════════════════════════════════════════
   MAPLOTI — auth page (login.html only)
   Real Firebase Auth: email/password + Google. Creates/merges the
   users/{uid} Firestore profile with the same shape as the app so
   saved listings, phone and role sync across web & mobile.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const auth = window.MAPLOTI_AUTH;
  const db = window.MAPLOTI_DB;
  const $ = (id) => document.getElementById(id);

  const els = {
    tabSignin: $('tabSignin'),
    tabRegister: $('tabRegister'),
    title: $('authTitle'),
    sub: $('authSub'),
    googleLabel: $('googleLabel'),
    googleBtn: $('googleBtn'),
    form: $('authForm'),
    nameField: $('nameField'),
    name: $('name'),
    email: $('email'),
    password: $('password'),
    eyeBtn: $('eyeBtn'),
    eyeOpen: $('eyeOpen'),
    eyeClosed: $('eyeClosed'),
    forgot: $('forgotLink'),
    submitBtn: $('submitBtn'),
    submitLabel: $('submitLabel'),
    switchLine: $('switchLine'),
    switchBtn: $('switchBtn'),
    success: $('authSuccess'),
    successTitle: $('successTitle'),
    successSub: $('successSub'),
    authNote: document.querySelector('.auth__note'),
  };

  let isSignUp = new URLSearchParams(location.search).get('mode') === 'register';
  let busy = false;

  const COPY = {
    title: ['Welcome back to Maploti', 'Create your Account'],
    sub: [
      'Access your saved properties and manage your account.',
      'Start searching, saving, and listing properties across Kenya.',
    ],
    google: ['Sign in with Google', 'Continue with Google'],
    submit: ['SIGN IN', 'CREATE ACCOUNT'],
    switchPre: ["Don't have an account?", 'Already have an account?'],
    switchPost: ['Register', 'Sign In'],
  };

  /* ── Friendly Firebase errors (mirrors the app) ─────────────── */
  const FRIENDLY = {
    'user-not-found': 'No user found with this email address.',
    'wrong-password': 'Incorrect password. Please try again.',
    'invalid-credential': 'Incorrect email or password. Please try again.',
    'email-already-in-use': 'An account already exists with this email.',
    'weak-password': 'Password is too weak. Use at least 6 characters.',
    'invalid-email': 'Invalid email address format.',
    'user-disabled': 'This account has been disabled.',
    'too-many-requests': 'Too many attempts. Please try again later.',
    'network-request-failed': 'Network error — check your connection and try again.',
    'operation-not-allowed': 'This sign-in method is not enabled for the project.',
  };
  function friendly(e) {
    const code = e && e.code;
    return (FRIENDLY[code] || (e && e.message) || 'An authentication error occurred.')
      .replace(/\(auth\/[^)]*\)/g, '')
      .trim();
  }

  function showBanner(msg) {
    let b = document.querySelector('.auth__banner');
    if (!b) {
      b = document.createElement('p');
      b.className = 'auth__banner';
      els.form.insertAdjacentElement('beforebegin', b);
    }
    b.textContent = msg;
    b.classList.add('is-visible');
    clearTimeout(b._timer);
    b._timer = setTimeout(() => b.classList.remove('is-visible'), 5200);
  }

  function setMode(signUp) {
    isSignUp = signUp;
    const i = signUp ? 1 : 0;

    els.tabSignin.classList.toggle('is-active', !signUp);
    els.tabRegister.classList.toggle('is-active', signUp);
    els.tabSignin.setAttribute('aria-pressed', String(!signUp));
    els.tabRegister.setAttribute('aria-pressed', String(signUp));

    els.title.textContent = COPY.title[i];
    els.sub.textContent = COPY.sub[i];
    els.googleLabel.textContent = COPY.google[i];
    els.submitLabel.textContent = COPY.submit[i];
    els.switchLine.innerHTML =
      COPY.switchPre[i] + ' <button type="button" id="switchBtn">' + COPY.switchPost[i] + '</button>';

    // Rebind the freshly re-rendered switch button
    $('switchBtn').addEventListener('click', () => setMode(!isSignUp));

    els.nameField.hidden = !signUp;
    els.forgot.style.display = signUp ? 'none' : 'inline-block';
    els.name.required = signUp;

    // Update URL without a full reload, so the mode survives refresh.
    // Keep `next` (deep link back to the page the user was on).
    const url = new URL(location.href);
    if (signUp) url.searchParams.set('mode', 'register');
    else url.searchParams.delete('mode');
    history.replaceState(null, '', url);

    clearErrors();
    updateDocTitle();
  }

  function updateDocTitle() {
    document.title = (isSignUp ? 'Create Account — ' : 'Sign In — ') + 'Maploti';
  }

  /* ── Validation ─────────────────────────────────────────────── */
  const showError = (field, show) => {
    const input = field.input;
    input.classList.toggle('has-error', show);
    const msg = document.querySelector('.auth__error-msg[data-for="' + field.id + '"]');
    if (msg) msg.classList.toggle('is-visible', show);
    return !show;
  };

  function validate() {
    let ok = true;
    if (isSignUp && !els.name.value.trim()) ok = showError({ input: els.name, id: 'name' }, true) && ok;
    else showError({ input: els.name, id: 'name' }, false);

    const email = els.email.value.trim();
    const emailOk = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    ok = showError({ input: els.email, id: 'email' }, !emailOk) && ok;

    const pw = els.password.value;
    const pwOk = pw.length >= 6;
    ok = showError({ input: els.password, id: 'password' }, !pwOk) && ok;
    return ok;
  }

  function clearErrors() {
    els.form.querySelectorAll('.auth__input').forEach((el) => el.classList.remove('has-error'));
    els.form.querySelectorAll('.auth__error-msg').forEach((el) => el.classList.remove('is-visible'));
  }

  /* ── Loading state ──────────────────────────────────────────── */
  function setBusy(b) {
    busy = b;
    els.submitBtn.disabled = b;
    els.googleBtn.disabled = b;
    els.submitBtn.innerHTML = b
      ? '<span class="auth__spinner auth__spinner--dark" aria-hidden="true"></span>'
      : '<span id="submitLabel">' + COPY.submit[isSignUp ? 1 : 0] + '</span>';
  }

  /* ── Success + redirect (preserve ?next=) ───────────────────── */
  function nextUrl() {
    const next = new URLSearchParams(location.search).get('next');
    if (next && next.startsWith('/')) return next;
    return 'listings.html';
  }

  function complete(user, name) {
    if (els.authNote) els.authNote.hidden = true;
    const mode = isSignUp ? 'register' : 'signin';
    if (mode === 'register') {
      els.successTitle.textContent = 'Welcome aboard' + (name ? ', ' + name.split(' ')[0] : '') + '!';
      els.successSub.textContent = 'Your account is ready — start hunting for your next home.';
    } else {
      els.successTitle.textContent = "You're in!";
      els.successSub.textContent = 'Welcome back — your saved properties are waiting.';
    }
    els.form.hidden = true;
    els.switchLine.hidden = true;
    els.success.hidden = false;
    els.successSub.textContent += ' Redirecting\u2026';

    setTimeout(() => { location.href = nextUrl(); }, 1200);
  }

  /* ── Firestore profile (same shape as the app) ──────────────── */
  async function ensureProfile(user, { displayName, photoUrl } = {}) {
    if (!db || !user) return;
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        displayName: displayName || user.displayName || 'User',
        email: user.email || '',
        phone: '',
        photoUrl: photoUrl || user.photoURL || '',
        savedProperties: [],
        role: 'user',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      await ref.set(
        { lastSeen: firebase.firestore.FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
  }

  /* ── Events ─────────────────────────────────────────────────── */
  els.tabSignin.addEventListener('click', () => setMode(false));
  els.tabRegister.addEventListener('click', () => setMode(true));

  els.eyeBtn.addEventListener('click', () => {
    const show = els.password.type === 'password';
    els.password.type = show ? 'text' : 'password';
    els.eyeOpen.style.display = show ? 'none' : '';
    els.eyeClosed.style.display = show ? '' : 'none';
    els.eyeBtn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });

  /* ── Forgot password (real) ─────────────────────────────────── */
  els.forgot.addEventListener('click', async () => {
    const email = els.email.value.trim();
    if (!auth) { showBanner('Auth is unavailable right now.'); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showBanner('Enter your email above to get a reset link.');
      return;
    }
    try {
      await auth.sendPasswordResetEmail(email);
      showBanner('Password reset link sent to ' + email);
    } catch (e) {
      showBanner(friendly(e));
    }
  });

  /* ── Email / password submit ────────────────────────────────── */
  els.form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy || !auth) { if (!auth) showBanner('Auth is unavailable right now.'); return; }
    if (!validate()) return;

    setBusy(true);
    const email = els.email.value.trim();
    const password = els.password.value;
    const name = els.name.value.trim();

    try {
      let user;
      if (isSignUp) {
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        user = cred.user;
        if (user && name) {
          try { await user.updateProfile({ displayName: name }); } catch (_) { /* best effort */ }
        }
        await ensureProfile(user, { displayName: name || user.displayName || 'User' });
      } else {
        const cred = await auth.signInWithEmailAndPassword(email, password);
        user = cred.user;
        await ensureProfile(user);
      }
      setBusy(false);
      complete(user, name);
    } catch (err) {
      setBusy(false);
      showBanner(friendly(err));
    }
  });

  /* ── Google sign-in (popup, same as the Flutter web build) ──── */
  els.googleBtn.addEventListener('click', async () => {
    if (busy || !auth) { if (!auth) showBanner('Auth is unavailable right now.'); return; }
    setBusy(true);
    const original = els.googleBtn.innerHTML;
    els.googleBtn.innerHTML = '<span class="auth__spinner" aria-hidden="true"></span>';
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      const cred = await auth.signInWithPopup(provider);
      const user = cred.user;
      if (user) {
        await ensureProfile(user, { displayName: user.displayName || '', photoUrl: user.photoURL || '' });
      }
      els.googleBtn.innerHTML = original;
      setBusy(false);
      complete(user, user && user.displayName ? user.displayName : '');
    } catch (err) {
      els.googleBtn.innerHTML = original;
      setBusy(false);
      if (err && (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request')) {
        return; // user closed the popup — no error needed
      }
      showBanner(friendly(err));
    }
  });

  /* ── Init ───────────────────────────────────────────────────── */
  if (!auth) {
    showBanner('Firebase Auth is not available right now. Try again shortly.');
  }
  setMode(isSignUp);
})();
