# RMSH Rentals — Architecture

Design decisions and layer rules. For folder map and feature list, see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md). For a file-by-file source map, see [docs/SOURCE_MAP.md](./docs/SOURCE_MAP.md).

---

## Layer diagram

```
┌──────────────────────────────────────────────┐
│ App shell                                    │
│ AppProvider, ThemeProvider, LanguageProvider │
│ NetworkProvider, AuthGate, navigation        │
├──────────────────────────────────────────────┤
│ Screens and shared UI                        │
│ features/*, shared/*                         │
├──────────────────────────────────────────────┤
│ Hooks and Zustand stores                     │
│ filtered lists, form data, reactive cache    │
├──────────────────────────────────────────────┤
│ Services and helpers                         │
│ pure business rules and shared calculations  │
├──────────────────────────────────────────────┤
│ Repositories                                 │
│ typed persistence interfaces and wrappers    │
├──────────────────────────────────────────────┤
│ AsyncStorage + Firestore sync/outbox         │
└──────────────────────────────────────────────┘
```

**Rule:** screens do not import AsyncStorage or Firestore directly.

---

## Startup Wiring

1. `index.js` registers `App.tsx`.
2. `App.tsx` renders `AppProvider`.
3. `AppProvider` mounts gesture, safe area, theme, language, Paper, bottom sheet, network, global UI, and auth/sync bootstraps.
4. `AuthGate` shows `AuthStack` only when Firebase is configured and the user is unauthenticated.
5. `RootNavigator` shows `BottomTabs` after auth/local-only readiness.
6. On authenticated startup, `offlineFirstSyncOrchestratorService.syncWithCloud()` runs before store hydration.
7. `useHydrateStores()` hydrates domain stores from repositories.

---

## Why Zustand (not Redux)

- Small number of entity lists with CRUD — low boilerplate.
- Selective subscriptions: `useCarStore(s => s.cars)`.
- `persist` only for **UI prefs** (car filter/search), not domain data.

Domain data lives in repositories; stores hydrate on launch.

---

## Why repositories own persistence

- One source of truth per entity in AsyncStorage.
- Swap `asyncStorageCarRepository` → `apiCarRepository` in `repositoryRegistry.ts` without rewriting screens.
- Offline-first wrappers add cloud write + outbox on every mutation.

**Bulk sync** uses raw AsyncStorage repos + `replaceAll()` so merge does not fire per-row cloud writes.

---

## Car status model

`deriveCarStatus` in `availabilityService.ts`:

1. **ON_RENT** — today is inside a non-completed rental period.
2. **UPCOMING_BOOKING** — has a rental starting after today, and not on rent today.
3. **AVAILABLE** — otherwise.

List filter “Upcoming Bookings” uses `carHasUpcomingBookingOnly` (same rules), not a stale stored flag alone.

---

## Rental & payments

- Assignment → `rentalScheduleService` creates rental + installment rows.
- Billing math → `rentalBillingService` (frequency, weekday/month-day due rules).
- Active rental end-date updates → `updateRentalEndDateService`.
- UI actions (received / not paid) → `usePaymentInstallmentActions` + `PaymentInstallmentActions`.

Rental list/detail screens were intentionally removed. Rental context is now surfaced through car details, customer profiles, dashboard, earnings, and the history tab.

---

## Theme And Language Rules

- `ThemeProvider` exposes runtime `colors`, `paperTheme`, `isDark`, and `setMode`.
- Components use `useThemeContext()` for colors. Do not import `colors` directly in screens/components.
- `app/theme/typography.ts`, `screenStyles.ts`, and `modalFormStyles.ts` should stay theme-neutral unless they are part of theme infrastructure.
- `LanguageProvider` owns language selection and calls i18n. English is the default and currently the only selectable language.
- UI copy belongs in `src/locales/en.json`; avoid hardcoded user-facing strings in screens.

---

## Bottom sheets

- `@gorhom/bottom-sheet` via `AppBottomSheet` / `FilterBottomSheet`.
- `BottomSheetModalProvider` in `AppProvider`.
- Snap height: `useBottomSheetLayoutMetrics` + `bottomSheetSnapHeight`; tab clearance: `screenBottomInset`.

Modals that need full height, such as rental assignment or end-date editing, sit **outside** parent `ScrollView` on detail screens.

---

## Media

- `MediaUri` supports local paths today, remote URLs later.
- `MediaUploader` → `ImageSlider` → `ImageViewerModal` for viewing.

---

## Maintaining quality

1. New business rules → `core/services` or `core/helpers` + tests.
2. New entity → interface + asyncStorage repo + offline-first wrapper + store + register in `repositoryRegistry`.
3. Cross-feature UI → `shared/ui` (not copied per screen).
4. Avoid duplicate persistence (Zustand persist + repository for same entity).
5. New user-facing text → translation key in `src/locales/en.json`.
6. New theme-aware UI → consume `useThemeContext()`.

---

## Recent cleanup (maintainers)

- Removed dead `useRentalStore.addRental` (rentals created via `createScheduledRental` only).
- Removed unused per-entity repository `delete*` APIs (full wipe uses `wipeAllAppData`).
- Removed unused `rentDueFieldsFromDate` and misleading `authError` auth store field.
- Fines/accidents on customer profile use `customerId` on records (not `fineHistory` / `accidentHistory` arrays).
- Car and customer detail screens share `CustomerFineHistory` / `CustomerAccidentHistory` list UI.
- Removed unused rental list/detail screens and old extension flow code. Rebuild those only when a real requirement returns.
