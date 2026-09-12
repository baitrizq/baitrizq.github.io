const CACHE_NAME = 'baitrizq-shell-v2';
const APP_SHELL = [
  './index-6.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Never cache Firebase / live data / Google APIs — always go to network
  if (url.includes('firestore') || url.includes('firebaseio') || url.includes('googleapis') || url.includes('gstatic.com/firebasejs')) {
    return; // let the browser handle it normally (network)
  }
  if (event.request.method !== 'GET') return;

  // App shell: network-first, so any update to the site shows immediately.
  // Falls back to the cached copy ONLY when there's no internet connection.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
