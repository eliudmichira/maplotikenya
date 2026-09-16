/* ══════════════════════════════════════════════════════════════
   MAPLOTI — Firebase init (every page before js/data.js)
   Reads the SAME Firestore project as the Maploti app so the
   website shows identical, live listings.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // Mirrors lib/firebase_options.dart (web) — maploti project.
  const CONFIG = {
    apiKey: 'AIzaSyDE7eq4hi-zjnl6rSAvX3GVNEsqWty9tFw',
    authDomain: 'maploti.firebaseapp.com',
    projectId: 'maploti',
    storageBucket: 'maploti.firebasestorage.app',
    messagingSenderId: '689776477151',
    appId: '1:689776477151:web:29acc07e1e70666edd7a6a',
    measurementId: 'G-EYJ71SS6ZW',
  };

  window.MAPLOTI_FIREBASE_CONFIG = CONFIG;

  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    const app = firebase.initializeApp(CONFIG);
    window.MAPLOTI_DB = app.firestore ? firebase.firestore(app) : null;
    window.MAPLOTI_AUTH = app.auth ? firebase.auth(app) : null;
    window.MAPLOTI_STORAGE = app.storage ? firebase.storage(app) : null;
  } else {
    console.warn('Maploti: Firebase SDK not loaded — website will show demo data.');
    window.MAPLOTI_DB = null;
    window.MAPLOTI_AUTH = null;
    window.MAPLOTI_STORAGE = null;
  }
})();
