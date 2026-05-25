# RMSH Rentals — Architecture Guide

## Why Zustand (not Redux Toolkit)

For this POC, domain state is **moderate in complexity** — a handful of entity collections with CRUD and cross-entity assignments. Zustand provides:

- Minimal boilerplate vs Redux slices + RTK
- Fine-grained subscriptions (`useCarStore(s => s.cars)`)
- Easy imperative access (`useCarStore.getState().hydrate()`)
- Optional `persist` middleware for **UI preferences only** (filters, search)

**Redux Toolkit becomes valuable when:**

- Normalized cache across many endpoints (RTK Query)
- Complex middleware (auth refresh, offline queue)
- Time-travel debugging at scale
- Large teams needing strict action contracts

The codebase is structured so RTK can be introduced **alongside** repositories without rewriting screens.

## Why repositories persist domain data (not Zustand persist)

**Source of truth:** AsyncStorage via `ICarRepository`, `ICustomerRepository`, etc.

**Zustand stores:** In-memory reactive cache hydrated on app launch.

Duplicating persistence in both Zustand and repositories causes sync bugs. UI prefs (car filter, customer filter) use Zustand `persist` with a separate storage namespace.

## Repository pattern & API migration

```ts
// Today
repositories.cars = asyncStorageCarRepository;

// Tomorrow
repositories.cars = apiCarRepository; // implements same ICarRepository
```

Screens and stores depend on **interfaces**, not storage technology.

Migration steps:

1. Implement `ApiCarRepository` with axios/fetch
2. Swap binding in `repositoryRegistry.ts`
3. Keep Zustand stores — change `hydrate()` to call API repo
4. Add auth headers in a single API client (not in screens)

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Screens** | Composition, navigation, hook wiring |
| **Hooks** | Derived/filtered data, screen-specific logic |
| **Stores (Zustand)** | UI reactivity, orchestration |
| **Services** | Pure business rules (conflicts, earnings, availability) |
| **Repositories** | Persistence / API I/O |
| **storageService** | Low-level key-value adapter swap (AsyncStorage → MMKV) |

## Media architecture

- `MediaUri` type supports local paths today, CDN URLs tomorrow
- `ImageSlider` — carousel + pagination + tap-to-viewer
- `ImageViewerModal` — fullscreen swipe + pinch zoom (react-native-image-viewing)
- `MediaUploader` — picker abstraction ready for cloud upload service injection

## Bottom sheets

`@gorhom/bottom-sheet` with `AppBottomSheet` wrapper exposing imperative `open()` / `close()` via `forwardRef` — same UX pattern as AvY App's RBSheet, with better gestures and Reanimated integration.

## Avoiding technical debt

1. **No AsyncStorage in screens** — only repositories
2. **No validation in screens** — `core/validation/`
3. **No hardcoded colors** — `app/theme/`
4. **No inline business rules** — `core/services/`
5. **Typed navigation** — `app/navigation/types.ts`

## Offline-first evolution

```
Local repo (POC) → Sync repository → API + conflict resolution
```

`bookingConflictService` and `availabilityService` remain pure functions — reusable on server or client.

## Testing strategy

- **Unit:** services, validators (Jest)
- **Integration:** repositories with mocked storage adapter
- **Component:** React Native Testing Library (setup in `jest.setup.ts`)

E2E (Detox/Maestro) can be added without architectural changes.
