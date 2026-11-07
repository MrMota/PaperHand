# Paperhand on Android

Paperhand ships two ways:

| | what it is | needs a server? | works offline? |
| --- | --- | --- | --- |
| **PWA** | the website, installable from the browser ("Install app" button, or the browser menu → *Install app / Add to Home screen*) | yes, the deployed site | yes, after the first visit |
| **APK** | a real Android app (Capacitor) with the whole web app packaged inside | **no** | yes, from the first launch |

The one thing that always needs the internet: the **AI** background-removal methods download their model
(25–110 MB) the first time. The "plain backgrounds" method works offline.

## What is different inside the app

- **Downloads** (PNG, JPG, PDF, SVG, design files, backups) open Android's **share sheet**: choose *Save to Files /
  Drive / Photos* or send to another app. Android's WebView can't do browser-style downloads.
- **Opening a design file** shows all files, because Android doesn't know the `.paperhand` type.
- No service worker inside the app: the files are already on the phone.
- The status bar and gesture bar are kept clear using Capacitor's SystemBars insets.

## Install the debug APK on your phone

1. Copy `paperhand-debug.apk` to the phone (USB, Drive, email...).
2. Open it. Android asks to allow installs from that app (Files, Drive...) the first time: allow it.
3. Open **Paperhand** from the app drawer.

A debug APK is signed with a throwaway debug key. Fine for your own phones and testers; **not** for Google Play,
and an update signed with a different key can't install over it (uninstall first).

## Build it yourself

Needs Node 22, JDK 21, and the Android SDK (Android Studio installs it; or the command-line tools).

```bash
npm ci
npm run android:debug          # → android/app/build/outputs/apk/debug/app-debug.apk
npm run android:open           # or open the project in Android Studio
```

After any change to the web app: `npm run android:sync`, then build again.

## A release build for Google Play (you do this)

Your **upload key** proves future updates come from you. Create it once, back it up somewhere safe, and never
commit it. Losing it means Play can't accept updates signed by you (Play App Signing can reset an upload key,
with a support request).

```bash
keytool -genkeypair -v -keystore ~/paperhand-upload.jks -alias paperhand -keyalg RSA -keysize 2048 -validity 10000
```

Then create `android/keystore.properties` (already git-ignored, see below):

```properties
storeFile=/home/you/paperhand-upload.jks
storePassword=...
keyAlias=paperhand
keyPassword=...
```

and run `npm run android:release`. Outputs:

- `android/app/build/outputs/bundle/release/app-release.aab`, the file Google Play wants
- `android/app/build/outputs/apk/release/app-release.apk`, for installing directly

Before the first Play upload:

- **App ID** is `com.mrmota.paperhand` (`capacitor.config.ts`, `android/app/build.gradle`). It can never change
  after the first upload. Change it now if you want another.
- Bump `versionCode` (integer, +1 every upload) and `versionName` in `android/app/build.gradle`.
- Play Console: $25 one-time developer account (yours), store listing from `replica/launch/listing.json`, the
  privacy policy URL (`#/privacy` on your deployed site), and the data safety form: **no data collected, no data
  shared**. The app makes one kind of network request, the optional model download from Hugging Face.
- New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before Play
  allows production. Plan for it.
