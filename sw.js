/* Ironstack service worker.
   Serves the things that never change per-URL — fonts, versioned css/js,
   seal artwork — cache-first, so page-to-page navigation never waits on
   the network for them and text renders in the right font immediately.
   HTML is never cached here: a deploy shows up on the very next click.
   Same-origin only; nothing leaves this domain. */
var CACHE = 'ironstack-static-v1';

self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  var cacheable =
    url.pathname.indexOf('/assets/fonts/') === 0 ||
    (/\.(css|js)$/.test(url.pathname) && url.searchParams.has('v')) ||
    /\/assets\/ironstack-seal-[^/]+\.svg$/.test(url.pathname);
  if (!cacheable) return;
  e.respondWith(caches.open(CACHE).then(function (cache) {
    return cache.match(e.request).then(function (hit) {
      var refresh = fetch(e.request).then(function (res) {
        if (res && res.ok) cache.put(e.request, res.clone());
        return res;
      });
      if (hit) { refresh.catch(function () {}); return hit; }
      return refresh;
    });
  }));
});
