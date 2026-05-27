const CACHE_NAME = "angullia-pwa-v1";
const OFFLINE_FALLBACK = "/offline.html";

const ASSETS_TO_CACHE = [
    OFFLINE_FALLBACK,
    "/icon.png",
    "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Only cache GET requests
    if (event.request.method !== "GET") return;

    // Bypass firebase calls, dynamic API calls, and hot reloads
    const url = new URL(event.request.url);
    if (
        url.pathname.startsWith("/api") || 
        url.hostname.includes("firestore.googleapis.com") || 
        url.hostname.includes("identitytoolkit.googleapis.com") || 
        url.pathname.includes("_next")
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If it is a valid response, cache it for offline use
                if (response && response.status === 200 && response.type === "basic") {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache if network request fails
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // If it is a page request, serve the offline fallback page
                    if (event.request.headers.get("accept").includes("text/html")) {
                        return caches.match(OFFLINE_FALLBACK);
                    }
                });
            })
    );
});
