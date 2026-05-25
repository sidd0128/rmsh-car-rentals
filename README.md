# RMSH Rentals

Production-grade **Car Rental Management** mobile app (POC) built with React Native CLI and TypeScript.

Local-first architecture using AsyncStorage repositories — designed for seamless API migration later.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native 0.85 + TypeScript |
| Navigation | React Navigation 7 (typed stacks + bottom tabs) |
| State | Zustand (domain stores + persist for UI prefs) |
| Forms | React Hook Form + custom validators (no Zod/Yup) |
| UI | React Native Paper + centralized theme tokens |
| Lists | Shopify FlashList |
| Bottom sheets | @gorhom/bottom-sheet |
| Media | Image picker, image-viewing (fullscreen zoom/swipe) |
| Dates | dayjs + `@react-native-community/datetimepicker` |
| Storage | AsyncStorage via `storageService` + repository pattern |

## Getting Started

```bash
cd RMSHRentals
npm install

# One-time: install CocoaPods via Bundler (if `pod` command is not found)
bundle install

# iOS
cd ios && bundle exec pod install && cd ..
npm run ios

# Android
npm run android
```

## Project Structure

```
src/
├── app/          # Navigation, providers, theme
├── core/         # Storage, services, validation, types, hooks
├── shared/       # Reusable UI, media, bottom sheets, layouts, modals
└── features/     # dashboard, cars, customers, rentals, fines, accidents, payments
                  # (only subfolders with real code — no empty placeholders)
```

Each feature grows with only the folders it needs (e.g. `screens/`, `store/`, `repository/`). Additional folders (`services/`, `types/`, etc.) are added when required — not pre-created empty.

## Icons (vector fonts)

Icons come from `react-native-vector-icons`, which is autolinked (CocoaPods on iOS, `fonts.gradle` on Android). **Do not run `react-native-asset`** for icon fonts — it duplicates the pod copy step and causes Xcode error *Multiple commands produce … .ttf*.

## Scripts

- `npm start` — Metro bundler
- `npm run ios` / `npm run android` — Run app
- `npm test` — Jest unit tests
- `npm run lint` — ESLint

## Seed Data

On first launch, sample cars, customers, rentals, fines, and payments are seeded automatically.

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for engineering decisions (Zustand vs Redux, repository pattern, API migration path).

## Future Roadmap

- REST/GraphQL API repositories
- Authentication & multi-role access
- Push notifications, analytics, payments
- Offline sync & cloud media (CDN URLs)
