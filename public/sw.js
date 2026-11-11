// Service worker: makes Insettario installable and playable offline.
// Bump CACHE when the caching rules below change; old caches are then removed.
const CACHE = 'insettario-v1';
const SHELL = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// The page: always try the network first, so a new version shows up right away;
// the saved copy is only used when offline.
async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (await cache.match('./')) || Response.error();
  }
}

// Vite names built files "name-<hash>.ext": a new build of the script or the style sheet
// gets a new name, so the copies of older builds can go.
async function dropOlderBuilds(cache, url) {
  const match = /^(.*\/[^/]+)-[\w-]{8}\.(js|css)$/.exec(url);
  if (!match) return;
  const sameFile = new RegExp('^' + match[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-[\\w-]{8}\\.' + match[2] + '$');
  for (const request of await cache.keys()) {
    if (request.url !== url && sameFile.test(request.url)) await cache.delete(request);
  }
}

// Everything else (script, style, fonts, photos, voice clips): kept the first time it is
// used and served from the cache from then on. Built file names change with their content.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request.url);
  if (cached) return cached;
  const response = await fetch(request.url);
  if (response.ok) {
    await cache.put(request.url, response.clone());
    await dropOlderBuilds(cache, request.url);
  }
  return response;
}

// Audio players ask for a slice of the file (Range header). The Cache API only stores
// whole files, so the slice is cut here from the saved copy.
async function slice(request) {
  const whole = await cacheFirst(request);
  if (!whole.ok) return whole;
  const data = await whole.arrayBuffer();
  const range = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range')) || [];
  let start = range[1] ? Number(range[1]) : 0;
  let end = range[2] ? Number(range[2]) : data.byteLength - 1;
  if (!range[1] && range[2]) { start = data.byteLength - Number(range[2]); end = data.byteLength - 1; }
  start = Math.max(0, start);
  end = Math.min(end, data.byteLength - 1);
  if (start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + data.byteLength } });
  return new Response(data.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': whole.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + data.byteLength,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') event.respondWith(networkFirst(request));
  else if (request.headers.has('range')) event.respondWith(slice(request));
  else event.respondWith(cacheFirst(request));
});
