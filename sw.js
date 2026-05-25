const CACHE_NAME = 'super-kid-v3';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './assets/mascot.png',
  './assets/crown.png',
  './assets/episode1.png',
  './assets/episode2.png',
  './assets/episode3.png',
  './assets/hat.png',
  './assets/jetpack.png',
  './assets/portal_orb.png',
  './assets/visor.png',
  './assets/trio.png'
];

// Cache all assets during install
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force active immediately
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching application shell assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// Clear out old caches on activation
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache registry:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // Claim active clients immediately
  );
});

// Network fallback to cache fetch listener
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch(() => {
        // Safe fallback if fetch fails and asset isn't in cache
        console.log('[Service Worker] Asset fetch failed, offline mode active.');
      });
    })
  );
});
