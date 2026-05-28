/**
 * Service Worker — InnerOrbit Caching Engine
 * 
 * Optimises page reloading performance across development and production targets:
 *  - Cache-First for heavy static assets (Fonts, Images) to enable < 5ms instant load times.
 *  - Safe Bypass in Development for JS bundles, maps, HMR scripts to preserve real-time reloading.
 *  - Cache-First for content-hashed production JS/CSS bundles.
 *  - Network-First for main HTML documents to ensure zero-lag offline startup and seamless online updates.
 */

const CACHE_NAME = 'innerorbit-cache-v2';

// Core shell assets to pre-cache on register
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.png',
  '/assets/favicon.png',
  '/assets/icon.png',
  '/assets/InnerOrbit-Logo.png'
];

// 1. Install Event: Setup precache
self.addEventListener('install', (event) => {
  const isDevMode = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';
  
  // In development mode, only precache the root path to avoid Metro throwing console errors
  // for static assets (like favicon/icons) that it maps via custom bundling logic.
  const assetsToPrecache = isDevMode ? ['/'] : PRECACHE_ASSETS;

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Pre-cache individual assets safely to avoid installation failure if some are missing
        return Promise.allSettled(
          assetsToPrecache.map(asset => 
            cache.add(asset).catch(err => console.warn(`[SW] Precache failed for asset "${asset}":`, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Flushing obsolete cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Intercept same-origin HTTP requests
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Intercept only GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Intercept only same-origin requests to prevent cross-origin issues
  if (url.origin !== self.location.origin) return;

  const isDevMode = url.hostname === 'localhost' || url.hostname === '127.0.0.1';

  // --- DEVELOPMENT EXCLUSIONS ---
  // In development mode, completely ignore JS bundles, source maps, hot-reload scripts, 
  // and Metro developer tool pathways to ensure HMR works perfectly.
  if (isDevMode) {
    if (
      url.pathname.endsWith('.bundle') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.map') ||
      url.pathname.endsWith('.json') ||
      url.pathname.includes('hot-update') ||
      url.pathname.includes('_expo/')
    ) {
      // Direct pass-through to Metro server
      return;
    }
  }

  // --- CACHE STRATEGIES ---

  // Strategy A: Heavy Static Assets (Fonts, Images, Audio, WebAssembly)
  // Cache-First with Network Fallback. Once fetched, they are loaded instantly in < 5ms.
  const isStaticAsset = (
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.mp3') ||
    url.pathname.endsWith('.wav') ||
    url.pathname.endsWith('.wasm') ||
    url.pathname.includes('/assets/')
  );

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Instant 0ms return from cache
        }
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        }).catch(() => {
          return new Response('Asset not available offline.', { status: 404 });
        });
      })
    );
    return;
  }

  // Strategy B: Production JavaScript & CSS Bundles
  // Since production Expo web exports JS/CSS bundles with unique content-hashes, they are immutable.
  // Cache-First with Network Fallback.
  const isProductionBundle = !isDevMode && (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.includes('/_expo/static/')
  );

  if (isProductionBundle) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy C: Main Page Document (index.html, Root route "/")
  // Network-First with Cache Fallback. Guarantees users always see new build updates immediately,
  // while offering robust offline/weak connection startup capabilities.
  const isHTMLDocument = (
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    request.headers.get('accept')?.includes('text/html')
  );

  if (isHTMLDocument) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse; // Load cached app shell when offline
          });
        })
    );
    return;
  }
});
