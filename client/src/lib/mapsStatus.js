import { useSyncExternalStore } from 'react';

// Google Maps reports a bad, unbilled or over-quota key by calling
// window.gm_authFailure after the script has loaded, so `loadError` from the
// loader stays null and the map renders as a grey box with an error overlay.
// This module listens for that callback (and the app's own googleMapsError
// event), remembers the failure for the session, and exposes it as a hook so
// every map can switch to the free CARTO / OpenStreetMap basemap.

const STORAGE_KEY = 'maploti_maps_auth_failed';
const listeners = new Set();

let failed = (() => {
  try { return sessionStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
})();

function markFailed() {
  if (failed) return;
  failed = true;
  try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* private mode */ }
  listeners.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  const previous = window.gm_authFailure;
  window.gm_authFailure = () => {
    console.warn('[Maps] Google Maps rejected the API key (billing, quota or restrictions). Using the OpenStreetMap basemap.');
    try { previous?.(); } catch { /* ignore */ }
    markFailed();
  };
  window.addEventListener('googleMapsError', markFailed);
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getSnapshot = () => failed;
const getServerSnapshot = () => false;

export function useGoogleMapsAuthFailed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const googleMapsAuthFailed = () => failed;
