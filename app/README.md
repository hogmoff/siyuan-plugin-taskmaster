# Taskmaster PWA (Android)

Taskmaster is a Next.js app that can be installed as a Progressive Web App (PWA) on Android. It supports offline usage and syncs your changes back to SiYuan once you’re online again.

## Features
- Installable PWA on Android (Add to Home Screen)
- Works offline with cached UI and pages
- Offline queue for create/update/delete; auto-flush on reconnect
- Syncs tasks with SiYuan when connectivity returns

## Prerequisites
- Node.js 18+ and npm
- A running SiYuan instance and API token
- HTTPS domain (recommended) for full PWA features. If the app is served over HTTPS, your SiYuan API must also be HTTPS to avoid mixed-content blocking.

## Project Structure (relevant parts)
- `public/manifest.webmanifest`: Web app manifest
- `public/sw.js`: Service worker for caching and offline fallback
- `public/offline.html`: Offline fallback page
- `components/pwa/register-sw.tsx`: SW registration in the app
- `lib/storage/offline-queue.ts`: LocalStorage-backed offline mutation queue
- `lib/hooks/use-tasks.ts`: Loads/syncs tasks, handles offline queue flush

## Development
1. Install dependencies:
   - `npm i`
2. Run in dev mode:
   - `npm run dev`
3. Configure the SiYuan connection inside the app (Settings UI) or via LocalStorage keys used by the client.

Notes:
- The service worker only controls pages loaded over the same origin. In dev, SW updates on reload; you can inspect under Chrome DevTools → Application → Service Workers.

## Build & Run
- Build: `npm run build`
- Start: `npm start`

Deployment tips:
- Serve over HTTPS for installability and to avoid mixed-content issues when calling SiYuan.
- Ensure `public/icons/` contains required app icons (see “Icons” below).

## Docker
- Build image: `docker build -t taskmaster-app .`
- Run container: `docker run -p 3000:3000 taskmaster-app`
- Access app: open `http://localhost:3000`

Notes:
- The container runs the production Next.js server (`next start`) on port `3000`.
- Configure SiYuan connection inside the app UI (LocalStorage). If you prefer env vars, pass them with `-e KEY=VALUE` or `--env-file .env` when running.

## Android Installation
You can install the app using Chrome (or any PWA-capable browser) on Android.

- Navigate to your deployed URL.
- Wait a second for the service worker to register.
- Use one of the options:
  - Look for the “Install app” banner/prompt if shown, then confirm.
  - Or open the browser menu (⋮) → “Add to Home screen” → confirm.
- The app installs to your launcher and opens in a standalone window.

## Using the App Offline
- Browse previously visited pages: UI and static assets are cached.
- Create/update/delete tasks while offline: actions are stored locally and added to an offline queue.
- When your device comes back online and you open the app:
  - The offline queue flushes automatically.
  - Local-only tasks are retried for sync (IDs are replaced with real block IDs).

## SiYuan Connection
- The client reads and persists connection settings in LocalStorage under `siyuan_todoist_settings` (base URL and token).
- Make sure the base URL and the app’s origin are both HTTPS to avoid mixed-content errors in browsers.

## Icons
Add the following icons under `public/icons/` to enable proper Android install experience:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)
- `icon-512-maskable.png` (512×512, maskable safe area)

These are referenced by `public/manifest.webmanifest`.

## Updating the App
- New deployments publish an updated service worker. On next visit, it activates automatically (we call `skipWaiting` and `clients.claim`) and the app refreshes without requiring a full reinstall.

## Troubleshooting
- Not installable
  - Check DevTools → Application → Manifest for errors.
  - Ensure `manifest.webmanifest` and icons are served and valid.
  - Make sure the site is served over HTTPS and has a registered service worker.
- Mixed content / “Failed to fetch” SiYuan API
  - If app is HTTPS and SiYuan is HTTP, the browser blocks requests. Use HTTPS for SiYuan or proxy it via HTTPS.
- Changes don’t sync after being offline
  - Ensure the device is back online and open the app; queue flushes in the foreground.
  - Check DevTools console logs for “Failed to flush offline queue”.
- Next.js build fails fetching Google Fonts
  - Use a networked build environment, or switch to locally hosted fonts to avoid build-time fetches.

## Privacy & Storage
- Local data is saved in the browser’s LocalStorage for offline access and queueing. Clearing site data removes cached pages and the offline queue.

## Roadmap
- Optional Background Sync via service worker + IndexedDB for delivery while the app is closed.
- Optional notifications for sync success/failure.

---
Questions or want Background Sync added? Open an issue or request an enhancement.
