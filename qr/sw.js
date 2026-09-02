const CACHE_NAME = 'vylex-qr-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './generator.html',
  './scanner.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js',
  'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js',
  'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching offline assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  
  // Exclude non-GET requests and chrome extension schemes
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Network-First strategy for HTML pages to ensure they get updates, falling back to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-First with Network Fallback strategy for libraries, fonts, and assets
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // If cached, return it, but fetch a fresh copy in the background (stale-while-revalidate for local assets)
          if (!requestUrl.host.includes('cdn') && !requestUrl.host.includes('cdnjs')) {
            fetch(event.request).then(networkResponse => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
              }
            }).catch(() => {/* Ignore network errors on revalidation */});
          }
          return cachedResponse;
        }

        // Cache miss: fetch from network
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            // For CDN/CORS requests, type might be 'cors' which is fine to cache
            if (requestUrl.host.includes('cdn') || requestUrl.host.includes('cdnjs') || requestUrl.host.includes('unpkg.com') || requestUrl.host.includes('jsdelivr')) {
              const responseCopy = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
            }
            return networkResponse;
          }

          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseCopy));
          return networkResponse;
        });
      })
  );
});
