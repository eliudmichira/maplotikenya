// Feature flags.
//
// MOBILE_UI_ENABLED gates the app-style mobile UI (src/mobile/*): the bottom
// tab bar, the mobile home screen, mobile property list / details, and the
// rest of the mobile-only pages. While it is off, every screen size gets the
// responsive desktop site. Re-enable by adding
//   VITE_ENABLE_MOBILE_UI=true
// to client/.env.local (or the hosting environment) and rebuilding.
export const MOBILE_UI_ENABLED = import.meta.env.VITE_ENABLE_MOBILE_UI === 'true';
