// Service Worker for Random Workout Generator
// Enables offline use and installable PWA behavior

const CACHE_NAME = 'workout-gen-v1';
const ASSETS = [
    '/workout-generator/',
    '/workout-generator/index.html',
    '/workout-generator/manifest.json',
    '/workout-generator/favicon.svg',
    '/workout-generator/favicon.ico',
    '/workout-generator/icon-192.png',
    '/workout-generator/icon-512.png',
    '/workout-generator/icon-maskable.png'
];

// Install: cache all core assets for offline use
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS);
        })
    );
    // Activate immediately, don't wait for old tabs to close
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) { return key !== CACHE_NAME; })
                    .map(function(key) { return caches.delete(key); })
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch: serve from cache, falling back to network
self.addEventListener('fetch', function(event) {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(function(cached) {
            // Return cached version, then update cache in background
            var fetched = fetch(event.request).then(function(response) {
                if (response && response.status === 200) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(event.request, clone);
                    });
                }
                return response;
            }).catch(function() {
                // If network fails and no cache match, return the cached index
                return caches.match('/workout-generator/');
            });

            return cached || fetched;
        })
    );
});
