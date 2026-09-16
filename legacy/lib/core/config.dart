/// App-wide configuration.
///
/// [kWebBaseUrl] is the public marketing website (the `website/` folder)
/// that shares the same Firestore data as the app. Listing share links
/// point at `property.html?id=<listingId>` on this origin so a shared
/// property opens the matching page in any browser.
///
/// Override it at build time once the site is deployed:
///
/// ```bash
/// flutter build apk  --dart-define=WEB_BASE_URL=https://your-domain.com
/// flutter build web  --dart-define=WEB_BASE_URL=https://your-domain.com
/// ```
const String kWebBaseUrl = String.fromEnvironment(
  'WEB_BASE_URL',
  defaultValue: 'https://maploti.app',
);
