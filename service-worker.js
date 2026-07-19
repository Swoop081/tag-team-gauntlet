/* Tag Team Gauntlet Service Worker 1.0 */
const APP_VERSION = '6.3.1';
const CACHE_NAME = `ttg-runtime-${APP_VERSION}`;
const NEVER_CACHE = ['version.json', 'service-worker.js'];

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('ttg-') && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

function isNeverCache(url) {
  return NEVER_CACHE.some(name => url.pathname.endsWith(`/${name}`) || url.pathname.endsWith(name));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNeverCache(url)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  const isCode = request.mode === 'navigate' || ['document', 'script', 'style'].includes(request.destination);
  event.respondWith(isCode ? networkFirst(request) : cacheFirst(request));
});
