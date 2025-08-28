/*
  Basic service worker for Next.js App Router app.
  - Caches navigation requests (network-first with offline fallback)
  - Caches static assets (cache-first)
  - Provides a manual message channel for skipWaiting/claim
*/

const VERSION = 'v1';
const RUNTIME_CACHE = `runtime-${VERSION}`;
const STATIC_CACHE = `static-${VERSION}`;

const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  OFFLINE_URL,
  '/',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Utility: cache-first for static assets
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    return cached || Response.error();
  }
}

// Utility: network-first for navigations with offline fallback
async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    // fallback to offline page for document requests
    if (request.mode === 'navigate') {
      const offline = await caches.match(OFFLINE_URL);
      if (offline) return offline;
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Handle Next.js static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App icons and manifest
  if (url.pathname.startsWith('/icons/') || url.pathname.endsWith('manifest.webmanifest')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // For navigation requests use network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Default: try runtime cache for same-origin GET requests
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          cache.put(request, response.clone());
          return response;
        } catch {
          return cached || Response.error();
        }
      })()
    );
  }
});

// Allow page to request SW to update/activate immediately
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

