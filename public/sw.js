const CACHE_NAME = 'angullia-portal-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/images/mosque.png',
    '/images/mosque2.png',
    '/images/prayer.png'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Bypass caching for localhost/development to prevent HMR issues
    const url = new URL(event.request.url);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return;
    }

    // Network-First Strategy: Try network, fall back to cache
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Don't cache if not a success or if it's a cross-origin request
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Fallback to cache if network fails
                return caches.match(event.request);
            })
    );
});
