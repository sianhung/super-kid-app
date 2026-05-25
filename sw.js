const CACHE_NAME = 'super-kid-v7';
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
  './assets/trio.png',
  './assets/y2k_bg.png'
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

// Fetch listener with Network-First strategy for HTML and Stale-While-Revalidate for CSS/JS
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // For HTML navigations: Network-First
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  
  // For cached local assets: Stale-While-Revalidate (fetch new in background, return cache instantly)
  const isLocalAsset = ASSETS.some(asset => {
    const cleanAsset = asset.replace('./', '');
    return cleanAsset && url.pathname.endsWith(cleanAsset);
  });

  if (isLocalAsset) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        const fetchPromise = fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return networkResponse;
        }).catch(() => {});
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Fallback default fetch
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => {
        console.log('[Service Worker] Fetch fallback.');
      });
    })
  );
});
