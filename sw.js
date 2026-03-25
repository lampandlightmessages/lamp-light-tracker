const CACHE = 'lamp-light-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/supabase.js',
  '/js/storage.js',
  '/js/app.js',
  '/js/ideas.js',
  '/js/wip.js',
  '/js/ready.js',
  '/js/recorded.js',
  '/js/overview.js',
  '/js/init.js',
  '/manifest.json',
];

// Install — cache all static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache-first for assets, network-first for API calls
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for Supabase API calls
  if (url.hostname.includes('supabase.co') || url.hostname.includes('googleapis.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/index.html'))
  );
});
