/*
 * Yooza Avis — Service worker PWA
 * Cache les ressources locales nécessaires à l’utilisation hors connexion.
 */
const CACHE_NAME = 'yooza-avis-v1.1.0';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './js/dashboard.js',
  './js/clients.js',
  './js/client-detail.js',
  './js/settings.js',
  './assets/yooza-logo-sidebar.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.addAll(APP_SHELL); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) { return cacheName !== CACHE_NAME; })
          .map(function(cacheName) { return caches.delete(cacheName); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  // Réseau d’abord : les techniciens reçoivent les améliorations dès qu’ils sont connectés.
  // Cache de repli : l’application reste exploitable lorsqu’il n’y a plus de réseau.
  event.respondWith(
    fetch(event.request)
      .then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200 && new URL(event.request.url).origin === self.location.origin) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(function() {
        return caches.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') return caches.match('./index.html');
          return new Response('', { status: 504, statusText: 'Ressource indisponible hors connexion' });
        });
      })
  );
});
