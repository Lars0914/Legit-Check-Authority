# Ticker (React Native CLI)

**App identity:** display name **Legit Check Authority**, Android package / iOS bundle ID **`com.legitcheckauthority.app`**, React Native module name **`Ticker`** (`app.json`).

After changing package ID, uninstall any previous **TickerMobile** build from the device/emulator, then run a clean native build (`cd android && ./gradlew clean` on Android).

Watch authentication guide app for **Android emulator** (and iOS simulator on Mac).

## Prerequisites

1. **Backend** running: `cd ../backend && npm run dev` (port 3001)
2. **Android Studio** with SDK and an AVD (emulator)
3. Set environment variables (Windows example):

```bash
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

## Run on Android emulator (Windows `.bat`)

Double-click **`run.bat`** (one script; window stays open so you can read errors).

| Command | What it does | Typical time |
|---------|----------------|--------------|
| `run.bat` | Emulator if needed → Metro → **quick launch** if `com.legitcheckauthority.app` is already installed | ~20–30 s |
| `run.bat rebuild` | Same, but always runs Gradle + native build (needed after package/native changes) | 1–3 min |

Optional helpers: `run-metro.bat`, `run-android.bat`, `run-emulator.bat`.

**Why a run felt slow:** A full Gradle rebuild downloads dependencies and compiles native code (e.g. Google Sign-In). That happens on first install, after `run.bat rebuild`, or if the Gradle cache was cleared. Day-to-day JS edits only need `run.bat` (quick) + Metro reload (**R** in the emulator).

**Before using the app:** start the backend (`cd ..\backend && npm run dev`).

## Run on Android emulator (manual)

1. Set Android SDK (Windows Git Bash):

```bash
export ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

2. Start an emulator (Android Studio → Device Manager → Play), or:

```bash
emulator -list-avds
emulator -avd Resizable_Experimental
```

3. Terminal A — Metro:

```bash
cd mobile
npm start
```

4. Terminal B — build and install:

```bash
cd mobile
npm run android
```

If port 8081 is busy, stop the other Metro process or run `npm start -- --port 8082` and `npx react-native run-android --port 8082`.

The app calls the API at **`http://10.0.2.2:3001`** (Android emulator → your PC’s localhost).

## API URL

Edit `src/config.ts` if needed:

| Target | URL |
|--------|-----|
| Android emulator | `http://10.0.2.2:3001` |
| iOS simulator | `http://localhost:3001` |
| Physical device | `http://<your-pc-lan-ip>:3001` |

## Screens

- **Search** — query guides (brand, model, filename)
- **Guide** — sections with genuine vs counterfeit text and aligned images

## Release APK (Android)

From the project root (not `android/`):

```bash
npm install
cd android
gradlew assembleRelease
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

If Metro fails with `@d11/react-native-fast-image could not be found`, run **`npm install`** in the project root first. That package is required for disk-cached archive images; after installing, run a native rebuild (`run.bat rebuild` or `gradlew assembleRelease` again).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| “Cannot reach API” | Start backend; confirm `curl http://localhost:3001/health` |
| Build fails | Set `ANDROID_HOME`, run `cd android && ./gradlew clean` |
| `react-native-fast-image could not be found` | Run `npm install` in project root, then rebuild |
| No emulator | `adb devices` should list a device |
| Red screen / Metro | `npm start` in one terminal, `npm run android` in another |
| Google sign-in "Invalid token" | Set Vercel `GOOGLE_CLIENT_ID` to the **Web** OAuth client ID (same as `GOOGLE_WEB_CLIENT_ID` in `src/config.ts`). In Google Cloud → Credentials, create/use **Web application** + **Android** clients for package `com.legitcheckauthority.app`. Redeploy backend. |
| Sign-in "pending admin approval" | Expected for new accounts — an admin must approve the user in the Admin dashboard **Users** tab. |
