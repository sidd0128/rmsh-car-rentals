# RMSH Rentals — Architecture

Design decisions and layer rules. For folder map and feature list, see [PROJECT_GUIDE.md](./PROJECT_GUIDE.md).

---

## Layer diagram

```
┌─────────────────────────────────────────┐
│  Screens (features/* + navigation)      │
├─────────────────────────────────────────┤
│  Hooks (filtered lists, form data)      │
├─────────────────────────────────────────┤
│  Zustand stores (reactive cache)        │
├─────────────────────────────────────────┤
│  Services (pure business rules)         │
├─────────────────────────────────────────┤
│  Repositories (persistence interfaces)  │
├─────────────────────────────────────────┤
│  storageService → AsyncStorage          │
│  Firestore + sync outbox (optional)     │
└─────────────────────────────────────────┘
```

**Rule:** screens do not import AsyncStorage or Firestore directly.

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
- UI actions (received / not paid) → `usePaymentInstallmentActions` + `PaymentInstallmentActions`.

---

## Bottom sheets

- `@gorhom/bottom-sheet` via `AppBottomSheet` / `FilterBottomSheet`.
- `BottomSheetModalProvider` in `AppProvider`.
- Snap height: `useBottomSheetLayoutMetrics` + `bottomSheetSnapHeight`; tab clearance: `screenBottomInset`.

Modals that need full height (assign, extend) sit **outside** parent `ScrollView` on detail screens.

---

## Media

- `MediaUri` supports local paths today, remote URLs later.
- `MediaUploader` → `ImageSlider` → `ImageViewerModal` for viewing.

---

## Maintaining quality

1. New business rules → `core/services` or `core/helpers` + tests.
2. New entity → interface + asyncStorage repo + offline-first wrapper + store + register in `repositoryRegistry`.
3. Cross-feature UI → `shared/ui` or `reusable/` (not copied per screen).
4. Avoid duplicate persistence (Zustand persist + repository for same entity).

---

## Recent cleanup (maintainers)

- Removed unused `customerIsInPendingSection` (old customer filter).
- Removed unused monthly upcoming-earnings helpers (dashboard uses year total).
- Removed obsolete `@rmsh/customer-store-prefs` from data wipe.
- Fixed wipe reset: car filter defaults to `ALL` (not `AVAILABLE`).
- Shared `ReadOnlyFormField` for fine/accident car display.
- Docs rewritten to match current behaviour (see PROJECT_GUIDE).
