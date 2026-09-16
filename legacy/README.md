# Maploti

Find, save and list properties across Kenya. A Flutter app + static marketing
website that share one Firebase backend — the same live listings, the same
accounts, the same saved properties.

## Highlights

- **Live listings from Firestore** — 770+ scraped property listings (Mbanyu),
  with paginated, server-cursor-based feeds and client-side filtering
- **Interactive map** with marker clustering and budget filtering
- **Saved properties synced everywhere** — hearts on the web and in the app
  write to the same `users/{uid}.savedProperties` field
- **Firebase Auth** on web and mobile (email/password + Google), with shared
  profiles (`users/{uid}`) including avatar photos that sync both ways
- **Share with rich previews** — property pages inject OG/Twitter meta tags;
  the app shares the listing's web URL
- **Production-hardened** — locked-down Firestore rules, deployed indexes,
  custom 404, robots/sitemap, cache headers

## Repository layout

```
lib/                          Flutter app (Android / iOS / web)
  core/                       theme, widgets, config, realtime-db service
  features/
    auth/                     auth service, providers, login screen
    listings/                 models, providers, screens, services, widgets
    notifications/            realtime inquiry notifications
    profile/                  profile screen (avatar upload, edit, sign out)
    search/                   search screen
website/                      Static marketing site (vanilla JS, same Firestore)
  index.html                  landing page (live listing count)
  listings.html               grid with filters, sort, pagination
  property.html               detail page (gallery, share, owner card)
  saved.html                  the signed-in user's saved properties
  login.html                  Firebase Auth (email + Google)
  js/                         firebase, data, user, listings, property, saved…
css/  scripts/  test/         styles · scrape/import utilities · tests
```

## Getting started

### App

```bash
flutter pub get
flutter run               # pick a device (Android/iOS/web)
```

Requires the Firebase config in `lib/firebase_options.dart` (already checked in
for the `maploti` project).

### Website (local)

The site is plain static files — no build step:

```bash
cd website
python -m http.server 8091    # or any static server
```

## Deployment

### Firestore rules & indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### Website (Firebase Hosting)

`firebase.json` already points hosting at `website/` with cache headers and a
404 page:

```bash
firebase deploy --only hosting
```

Before you go live:

1. **Add your domain** to Firebase Console → Authentication → Authorized
   domains (Google sign-in needs it; `localhost` is auto-allowed).
2. **Configure Storage CORS** so the website can upload avatars as real
   Storage URLs (it falls back to small data URLs until you do):
   ```bash
   gsutil cors set '{"cors":[{"origin":["*"],"method":["GET","PUT","POST"],"maxAgeSeconds":3600}]}' gs://maploti.firebasestorage.app
   ```
3. **Point the app's share links** at the real domain:
   ```bash
   flutter build apk --dart-define=WEB_BASE_URL=https://your-domain.com
   flutter build web --dart-define=WEB_BASE_URL=https://your-domain.com
   ```
   Default is `https://maploti.app` (see `lib/core/config.dart`).
4. Update the domain in `website/robots.txt`, `website/sitemap.xml`, and the
   canonical links in the HTML pages if they differ.

### App release builds

```bash
flutter build apk --release        # Android
flutter build appbundle --release  # Play Store
flutter build web --release        # Flutter web (if used)
```

## Data & scraping

The listings were imported from real estate sources with scripts in `scripts/`
(`scrapeMbanyuToFirestore.js`, `scrapeJijiSmoke.js`, seeders, importers). Each
listing document lives in `listings/` with `status: 'active'`, a nested
`location` (county/area/geoPoint), `images[]`, `price`, `bedrooms`,
`propertyType`, `listingType` (`sale`/`rent`), `ownerId`, `featured`,
`verified` and timestamps.

User profiles live in `users/{uid}` with `displayName`, `email`, `phone`,
`photoUrl`, `savedProperties[]`, `role`, `createdAt`, `lastSeen`.

## Testing

```bash
flutter test          # 38 widget + model tests
node --check website/js/*.js   # website JS syntax
```

## Notes

- The website works fully without the app: search, filter, save, sign in,
  share. It degrades to sample data with a banner if Firestore is unreachable.
- `website/js/firebase.js` embeds the public web API key — this is expected
  for client-side Firebase usage and safe behind the Firestore rules.
