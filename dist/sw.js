/* PURINAT LIFE OS service worker (generated at build time from src/sw-template.js).
 * - App shell and hashed assets: cached at install (cache-first).
 * - Pages, data/*.json and config.js: network-first, cached copy when offline.
 * - Photos: cache-first after the first view.
 * - Map tiles and other cross-origin requests: not cached (provider terms).
 */
const VERSION = '30019c10e98b';
const BASE = '/';
const PRECACHE = ["/index.html","/assets/index-iNHZYzM8.css","/assets/index-DBmcO55G.js","/assets/dashboard-CEjCgUFw.js","/assets/activities-Bcos9aEv.js","/assets/activity-DCPe7VYb.js","/assets/mistakes-BCzK8pe-.js","/assets/phrases-q8oSvArM.js","/assets/library-DkkPwdNP.js","/assets/plan-CxtYuZ_L.js","/assets/readiness-Bg2kazco.js","/assets/charts-SBChLv_l.js","/assets/journal-BUyMvOpb.js","/assets/json-output-DByEEPgJ.js","/assets/shared-D54qyj6l.js","/assets/explore-Cv3kmKpb.js","/assets/journeys-DDLEcAeu.js","/assets/journey-BNdVf2i0.js","/assets/places-8ACcilZb.js","/assets/shared-CZ3pmquq.js","/assets/place-D1-vCfGi.js","/assets/timeline-DOfOLOlM.js","/assets/wrapped-Vh2OY4c9.js","/assets/dreams-CumiuJVW.js","/assets/about-CGEJ51gi.js","/assets/map-OsGvGZdz.js","/config.js","/manifest.webmanifest","/icons/favicon.svg","/icons/icon-192.png","/icons/icon-512.png"];
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
