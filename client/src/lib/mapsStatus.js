import { useSyncExternalStore } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

// Which basemap the site uses.
//
//   VITE_MAPS_PROVIDER=carto   (default) the free map: OpenFreeMap vector tiles
//                              (OpenStreetMap data) via MapLibre + Leaflet. No
//                              key, no registration, no billing.
//   VITE_MAPS_PROVIDER=google  Google Maps, which needs VITE_GOOGLE_MAPS_API_KEY
//                              on a project with billing enabled.
//
// Even with Google selected, the site falls back to the free map on its own when
// Google rejects the key (gm_authFailure) or serves the unbilled
// "For development purposes only" map, and remembers that for the session.

export const MAPS_PROVIDER = String(import.meta.env.VITE_MAPS_PROVIDER || 'carto').trim().toLowerCase();
export const GOOGLE_MAPS_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
export const USE_GOOGLE_MAPS = MAPS_PROVIDER === 'google' && GOOGLE_MAPS_KEY.length > 0;

const STORAGE_KEY = 'maploti_maps_auth_failed';
const WATERMARK = 'For development purposes only';
const listeners = new Set();

let failed = (() => {
  try { return sessionStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
})();

function markFailed(reason) {
  if (failed) return;
  failed = true;
  console.warn(`[Maps] ${reason} Using the OpenStreetMap basemap instead.`);
  try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch { /* private mode */ }
  listeners.forEach((fn) => fn());
}

// Google only tells the page about an unbilled key by drawing a watermark
// into the map, so watch the DOM for it.
function watchForWatermark() {
  if (typeof MutationObserver === 'undefined' || !document.body) return;
  const check = (node) => {
    if (node?.nodeType !== 1) return false;
    return node.textContent?.includes(WATERMARK) || false;
  };
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (check(node)) {
          markFailed('Google Maps has no billing account (development watermark).');
          observer.disconnect();
          return;
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (typeof window !== 'undefined' && USE_GOOGLE_MAPS && !failed) {
  const previous = window.gm_authFailure;
  window.gm_authFailure = () => {
    try { previous?.(); } catch { /* ignore */ }
    markFailed('Google Maps rejected the API key (billing, quota or restrictions).');
  };
  window.addEventListener('googleMapsError', () => markFailed('Google Maps failed to load.'));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watchForWatermark, { once: true });
  else watchForWatermark();
}

const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const getSnapshot = () => failed;
const getServerSnapshot = () => false;

// True when the page should render the free basemap instead of Google.
export function useGoogleMapsAuthFailed() {
  const authFailed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return !USE_GOOGLE_MAPS || authFailed;
}

export const googleMapsAuthFailed = () => !USE_GOOGLE_MAPS || failed;

// Loads the Google Maps script only when Google is the chosen provider, so
// the CARTO site never requests (or gets billed for) Google's script.
// USE_GOOGLE_MAPS is a build-time constant, so the branch never changes
// between renders and the hook order stays stable.
export function useGoogleMapsLoader(options) {
  if (USE_GOOGLE_MAPS) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useJsApiLoader(options);
  }
  return { isLoaded: false, loadError: null };
}
