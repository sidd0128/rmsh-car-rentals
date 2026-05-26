# iOS build for client testing (first-time guide)

You need a **Mac** with **Xcode** installed. Building for a real iPhone always goes through Apple’s signing system.

---

## Choose how to send the app to your client

| Method | Best for | Client installs via |
|--------|----------|---------------------|
| **TestFlight** (recommended) | Most clients, easy updates | TestFlight app from App Store |
| **Ad Hoc IPA** | Few devices, no TestFlight | Special link + trust profile (awkward) |
| **App Store** | Public release | App Store |

**Recommendation:** use **TestFlight**. You still build an IPA/archive in Xcode, but Apple hosts it and your client gets a simple install link.

---

## Part 1 — Apple Developer setup (one time)

1. Enrol at [Apple Developer Program](https://developer.apple.com/programs/) (**$99 USD / year**).
2. On your Mac, open **Xcode** → **Settings** (or Preferences) → **Accounts** → **+** → sign in with your Apple ID.
3. Select your team → **Manage Certificates** → ensure you have an **Apple Development** and (for distribution) **Apple Distribution** certificate. Xcode can create these automatically when you enable signing.

---

## Part 2 — Prepare RMSHRentals for a client build

From the project root:

```bash
cd RMSHRentals
npm install
cd ios && bundle install && bundle exec pod install && cd ..
```

### Client `.env` (release behaviour)

Edit `.env` before building:

```bash
APP_ENV=production
SHOW_DEV_DATA_TOOLS=false

# Your Firebase keys (if client uses cloud sync)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
# ... rest of FIREBASE_* keys
```

Then:

```bash
npm run sync-env
```

Release builds set `__DEV__` to `false`, so the wipe-data section stays hidden even if you forget the flag—but set `SHOW_DEV_DATA_TOOLS=false` anyway.

---

## Part 3 — Xcode signing & bundle ID

1. Open the workspace (not the `.xcodeproj` alone):

   ```bash
   open ios/RMSHRentals.xcworkspace
   ```

2. In the left sidebar, click the blue **RMSHRentals** project → target **RMSHRentals** → **Signing & Capabilities**.

3. Check **Automatically manage signing**.

4. Choose your **Team** (your Apple Developer account).

5. Set a unique **Bundle Identifier**, e.g. `com.yourcompany.rmshrentals`  
   (Default `org.reactjs.native.example.RMSHRentals` is only for local dev.)

6. Repeat for **Release** if Xcode shows separate Debug/Release signing tabs.

7. Set version: **General** tab → **Version** (e.g. `1.0.0`) and **Build** (e.g. `1`).

---

## Part 4A — TestFlight (recommended)

### A1. Create the app in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/) → **Apps** → **+** → **New App**.
2. Platform: **iOS**, name: **RMSH Rentals**, bundle ID: same as Xcode, SKU: any unique string.

### A2. Archive in Xcode

1. Scheme: **RMSHRentals** → device: **Any iOS Device (arm64)** (not a simulator).
2. Menu **Product** → **Archive** (wait several minutes).
3. When the **Organizer** opens, select the archive → **Distribute App**.
4. **App Store Connect** → **Upload** → follow prompts (defaults are usually fine).
5. Wait for processing (15–60 minutes) in App Store Connect → your app → **TestFlight**.

### A3. Invite your client

1. App Store Connect → **TestFlight** → **Internal Testing** or **External Testing**.
2. **External** requires a short Beta App Review the first time.
3. Add tester by **email**; they install **TestFlight** on iPhone and accept the invite.

No IPA file to email manually—Apple handles distribution.

---

## Part 4B — Ad Hoc IPA (optional, advanced)

Use only if you cannot use TestFlight.

### B1. Register client iPhones

1. [Apple Developer](https://developer.apple.com/account) → **Devices** → register each iPhone **UDID** (client can find UDID via Finder when iPhone is connected, or use a UDID website tool).

### B2. Ad Hoc provisioning profile

Xcode **Signing & Capabilities** → for Release, or create an **Ad Hoc** profile in the developer portal that includes those devices.

### B3. Archive & export IPA

1. **Product** → **Archive**.
2. Organizer → **Distribute App** → **Ad Hoc** → export `.ipa`.
3. Share via **Diawi**, **TestFlight alternative**, or Apple Configurator—not as easy as TestFlight.

Client must trust the enterprise/developer certificate under **Settings → General → VPN & Device Management**.

---

## Part 5 — Command-line archive (optional)

After signing is configured in Xcode once:

```bash
cd ios
xcodebuild -workspace RMSHRentals.xcworkspace \
  -scheme RMSHRentals \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/RMSHRentals.xcarchive \
  archive
```

Export IPA still needs Xcode Organizer or `xcodebuild -exportArchive` with an `ExportOptions.plist`.

---

## Common errors

| Problem | Fix |
|---------|-----|
| Signing / provisioning errors | Xcode → Signing & Capabilities → correct Team, unique bundle ID |
| `pod install` fails | `cd ios && bundle exec pod install` |
| Metro / JS errors in release | Run `npm run sync-env`, then clean build: Xcode **Product → Clean Build Folder** |
| Firebase not working in release | `.env` filled + `npm run sync-env` **before** archive |
| Archive greyed out | Select **Any iOS Device**, not simulator |

---

## Checklist before sending to client

- [ ] `.env` has production values and `SHOW_DEV_DATA_TOOLS=false`
- [ ] `npm run sync-env` run
- [ ] Bundle ID set in Xcode (not default example id)
- [ ] Release archive succeeds
- [ ] TestFlight build processed and tester invited
- [ ] Client has TestFlight app installed

---

## Related

- [PROJECT_GUIDE.md](../PROJECT_GUIDE.md) — env and Firebase
- [README.md](../README.md) — install and CocoaPods
