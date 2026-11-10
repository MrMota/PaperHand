# Paperhand on Windows

A desktop app built with Electron: the same web app, packaged with its own browser engine. It runs fully offline
(except the optional AI background-removal model, downloaded once from Hugging Face).

## Downloads (GitHub Releases)

| file | what it is |
| --- | --- |
| `Paperhand-Setup-<version>-x64.exe` | installer: Start menu and desktop shortcuts, uninstall from *Settings → Apps* |
| `Paperhand-<version>-x64-portable.exe` | portable: runs without installing |
| `*.sha256` | checksums |

Windows 10 and 11, 64-bit (x64). Not yet built for ARM64.

**SmartScreen.** The app isn't code-signed, so Windows may show *"Windows protected your PC"*: click **More info →
Run anyway**. Removing that warning needs a code-signing certificate (yours to buy), e.g. Azure Trusted Signing
(~US$10/month) or an OV/EV certificate from a certificate authority. Then add it to electron-builder's `win` config.

**Where designs live:** `%APPDATA%\Paperhand` (IndexedDB inside the app's profile). Uninstalling keeps it unless you
delete that folder. Use *Back up everything* on the home screen to keep a copy.

## How it is built

- `desktop/main.cjs` serves the built web app from a private `app://paperhand` scheme (secure, standard), so storage,
  workers and WebAssembly behave as on the web. The page has no Node.js access (context isolation, sandbox).
- External links open in the default browser. Electron's spellchecker is off (it would download dictionaries from Google).
- Downloads use Windows' Save dialog. `prompt()` isn't available in Electron, so renaming uses an in-app dialog.
- `desktop/` has its own minimal `package.json` so the installer contains only the app (no `node_modules`).

## Build it yourself

```bash
npm ci && cd desktop && npm ci && cd ..
npm run desktop:start      # run it locally
npm run desktop:win        # build the Windows installer + portable (on Windows; on Linux/macOS needs Wine)
```

`node desktop/smoke.cjs [path/to/Paperhand.exe]` launches the app, makes a design, downloads a PNG and checks the
background-removal worker starts. CI runs it against the packaged Windows build before publishing.

## Releasing a new version

Actions → **Windows release** → *Run workflow*, version e.g. `v1.0.1` (or push a `v*` tag). It builds on a Windows
runner, smoke-tests the packaged app, and adds the files to that version's GitHub Release, next to the Android APK.
Run **Android release** with the same version to add the APK.
