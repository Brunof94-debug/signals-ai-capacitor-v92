# Signals AI Capacitor Android Wrapper

This repository contains a Capacitor project to wrap the Signals AI PWA into a native Android application with FCM push notifications.

## Requirements

- Node.js v18+
- A Firebase project with FCM enabled
- A `google-services.json` file for the Android app
- A GitHub secret `GOOGLE_SERVICES_JSON_BASE64` containing the Base64‑encoded `google‑services.json` file
- VAPID keys for Web Push notifications used by your Netlify functions

## Project structure

- `web/` – the PWA files to be bundled into the native app
- `capacitor.config.ts` – Capacitor configuration
- `.github/workflows/android.yml` – GitHub Actions workflow to build the APK

## Building locally

```bash
npm install
npx cap add android
# copy google-services.json into android/app/
cd android
./gradlew assembleDebug
```

## Deploy via GitHub Actions

Push changes to `main`. The workflow will install dependencies, add the Android platform, decode the `GOOGLE_SERVICES_JSON_BASE64` secret into `android/app/google-services.json`, build the debug APK, and publish it as an artifact.

## Push notifications

The PWA uses Capacitor's PushNotifications API. When running natively, it registers with FCM and sends the token to your Netlify `subscribe` function. The `send` function can send pushes to all subscribed tokens.

See the `web/app.js` for client-side code and the `/functions` in your Netlify site for server-side logic.
