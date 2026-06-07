# RMSH Rentals

Production-grade **Car Rental Management** mobile app (POC) — offline-first with Firebase Auth + Firestore sync.

## Quick start

```bash
cd RMSHRentals
npm install
bundle install   # if `pod` is missing

cd ios && bundle exec pod install && cd ..
npm run ios      # or npm run android
```

```bash
cp .env.example .env   # then add Firebase keys (optional)
```

Configure Firebase before cloud features: see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md#environment-env).

## Documentation

| Document | Contents |
|----------|----------|
| **[PROJECT_GUIDE.md](./PROJECT_GUIDE.md)** | **Architecture flow, folders, services, shared/reusable components** |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Design decisions (layers, Zustand, repos, sync) |
| [docs/SOURCE_MAP.md](./docs/SOURCE_MAP.md) | **File-by-file responsibility map and wiring diagrams** |
| [docs/I18N.md](./docs/I18N.md) | Language/i18n workflow |
| [docs/FINE_DOCUMENT_AUTOFILL.md](./docs/FINE_DOCUMENT_AUTOFILL.md) | Fine document OCR/autofill flow |
| [docs/IOS_CLIENT_BUILD.md](./docs/IOS_CLIENT_BUILD.md) | **First-time iOS build / TestFlight for clients** |
| [docs/ANDROID_CLIENT_APK.md](./docs/ANDROID_CLIENT_APK.md) | **Build APK to send Android clients** |
| [firestore.rules.example](./firestore.rules.example) | Firestore security rules template |

## Tech stack (summary)

React Native 0.85 · TypeScript · React Navigation 7 · Zustand · AsyncStorage · Firebase Auth + Firestore · Paper · FlashList · Gorhom bottom sheets

## Scripts

- `npm start` — Metro bundler
- `npm run ios` / `npm run android` — Run app
- `npm test` — Jest
- `npm run lint` — ESLint

## iOS notes

- Do **not** commit `ios/Pods/` — run `bundle exec pod install` after clone.
- Do **not** run `react-native-asset` for icon fonts (duplicates CocoaPods fonts).

## Android notes

- Icon fonts come from `react-native-vector-icons/fonts.gradle` in `android/app/build.gradle` (MaterialCommunityIcons only).
- Do **not** keep `android/app/src/main/assets/fonts/` — it duplicates fonts and breaks release builds. Remove with `rm -rf android/app/src/main/assets/fonts` if present.

## Data

The app starts with **no sample data**. Lists are empty until you add cars, customers, and rentals (or sync from Firestore after sign-in).
