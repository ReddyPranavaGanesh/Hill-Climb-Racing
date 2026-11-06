// Hill Climb Racing - Rock-Solid Offline PWA Service Worker
const CACHE_NAME = 'hill-climb-pwa-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './qr.svg',
  './qr.png',
  './js/audio.js',
  './js/terrain.js',
  './js/physics.js',
  './js/vehicles.js',
  './js/game.js'
];

// Install: Cache all core assets immediately
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn('Could not cache asset:', url, err);
          });
        })
      );
    })
  );
});

// Activate: Clean up old caches immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate & Fallback
// If cached, return instantly; if network fails or returns 5xx error, use cache!
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Only handle http and https requests
  if (!url.protocol.startsWith('http')) return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        // If network returns error (502, 503, 504), do not replace cache
        if (!networkResponse || networkResponse.status >= 500) {
          if (cachedResponse) return cachedResponse;
          return networkResponse;
        }

        // Clone and update cache with fresh response
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Network completely offline/failed - return cached response
        return cachedResponse;
      });

      // If we already have it in cache, return it immediately for instant offline play!
      return cachedResponse || fetchPromise;
    })
  );
});
