importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAPtbf7tJLAWnzucwKD7GmrR_hwKYCxNmQ",
  authDomain: "masjid-agullia.firebaseapp.com",
  projectId: "masjid-agullia",
  storageBucket: "masjid-agullia.firebasestorage.app",
  messagingSenderId: "1003466181667",
  appId: "1:1003466181667:web:0129b910ec16f5f601b596",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Masjid Angullia";
  const options = {
    body: payload.notification?.body || "New update available",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: payload.data?.url || "/",
    },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

const CACHE_NAME = 'angullia-portal-v3';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.webmanifest',
    '/logo.png',
    '/images/mosque.png',
    '/images/mosque2.png',
    '/images/prayer.png'
];

// Paths that must never be cached (authenticated content, mutations, auth flow)
const NO_CACHE_PATH_PREFIXES = ['/admin', '/api', '/login', '/signup'];

function isUncacheablePath(pathname) {
    return NO_CACHE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'));
}

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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Bypass caching for localhost/development to prevent HMR issues
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        return;
    }

    // Skip authenticated and API routes entirely — go straight to network, no cache writes,
    // no cache fallback. Prevents leaking one user's admin page to another on the same device.
    if (isUncacheablePath(url.pathname)) {
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
