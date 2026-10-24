/* PURINAT LIFE OS service worker (generated at build time from src/sw-template.js).
 * - App shell and hashed assets: cached at install (cache-first).
 * - Pages, data/*.json and config.js: network-first, cached copy when offline.
 * - Photos: cache-first after the first view.
 * - Map tiles and other cross-origin requests: not cached (provider terms).
 */
const VERSION = '__VERSION__';
const BASE = '__BASE__';
const PRECACHE = [/* __PRECACHE__ */];
const SHELL = `${BASE}index.html`;
const CACHE = `lifeos-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('lifeos-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = (await cache.match(request, { ignoreSearch: true })) || (fallbackUrl && (await cache.match(fallbackUrl)));
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL));
    return;
  }
  const path = url.pathname.slice(BASE.length);
  if (path.startsWith('data/') || path === 'config.js' || path === 'manifest.webmanifest') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (path.startsWith('assets/') || path.startsWith('icons/') || path.startsWith('images/')) {
    event.respondWith(cacheFirst(request));
  }
});
