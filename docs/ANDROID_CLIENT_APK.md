# Android APK for client testing (direct install)

Send your client a **`.apk` file**. They install it outside the Play Store (sideload).

---

## Before you build

### 1. Install dependencies

```bash
cd RMSHRentals
npm install
cd android && ./gradlew --version && cd ..
```

First Android build downloads Gradle/SDK — allow time and stable internet.

### 2. Client `.env`

Edit `.env` in the project root:

```bash
APP_ENV=production
SHOW_DEV_DATA_TOOLS=false

# Firebase (if client uses cloud sync)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
# ... other FIREBASE_* keys
```

Then:

```bash
npm run sync-env
```

Release builds hide dev tools (`__DEV__` is false). `SHOW_DEV_DATA_TOOLS=false` is still recommended.

---

## Small APK (default)

`npm run build:android:apk` is tuned for **small size**:

| Setting | Effect |
|---------|--------|
| **arm64-v8a only** | One CPU type (~70% smaller native libs vs all 4 ABIs). Covers almost all phones from ~2017 onward. |
| **MaterialCommunityIcons font only** | Drops unused vector-icon font files |
| **R8 + resource shrinking** | Minifies Java/Kotlin and unused resources |
| **Bundle compression** | Compresses the Hermes JS bundle in the APK |

```bash
cd RMSHRentals
npm run build:android:apk
```

**Output file:**

```
android/app/build/outputs/apk/release/app-release.apk
```

Share that file (Google Drive, etc.).

**Very old 32-bit-only phones** (rare): build with both ARM types (larger APK):

```bash
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
```

---

## Option B — Proper release keystore (recommended for updates)

If you ship a **second** APK later, you must sign with the **same keystore** or the client cannot update in place — they must uninstall first.

### B1. Create a keystore (once)

```bash
cd RMSHRentals/android/app
keytool -genkeypair -v -storetype PKCS12 -keystore rmsh-release.keystore \
  -alias rmsh -keyalg RSA -keysize 2048 -validity 10000
```

Remember the passwords you enter.

### B2. Configure signing

```bash
cd RMSHRentals/android
cp keystore.properties.example keystore.properties
```

Edit `keystore.properties`:

```properties
storeFile=rmsh-release.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=rmsh
keyPassword=YOUR_KEY_PASSWORD
```

`keystore.properties` and `*.keystore` are gitignored — do not commit them.

### B3. Build

```bash
cd RMSHRentals
npm run build:android:apk
```

Same APK path as Option A.

---

## What to send your client

1. **`app-release.apk`**
2. Short instructions:
   - Download the APK on the phone
   - Open it → **Install**
   - If blocked: **Settings → Security** (or **Apps**) → allow install from **Chrome / Files / Drive**
   - Android 8+: enable **Install unknown apps** for the app used to open the file

### Updating later

- Same signing key → install over the old app (data may remain)
- Different key → uninstall old app first, then install new APK

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `SDK location not found` | Install Android Studio; set `ANDROID_HOME` to SDK path |
| Build runs out of memory | Close other apps; `org.gradle.jvmargs` in `gradle.properties` is already 2GB |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Client must uninstall old APK (different signature) |
| Firebase empty in release | Run `npm run sync-env` **before** `build:android:apk` |
| Metro / JS errors | Build command bundles JS automatically; no Metro needed on client device |

---

## Play Store later?

Use **AAB** (`./gradlew bundleRelease`), not APK, for Google Play upload. This guide is for **direct APK sideload** only.

---

## Related

- [IOS_CLIENT_BUILD.md](./IOS_CLIENT_BUILD.md) — iOS / TestFlight
- [PROJECT_GUIDE.md](../PROJECT_GUIDE.md) — env and architecture
