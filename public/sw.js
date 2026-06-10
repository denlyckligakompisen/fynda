const CACHE_NAME = 'booli-image-cache-v2';
const IMAGE_REGEX = /https:\/\/bcdn\.se\/images\/cache\//;

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    // Clear old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle image requests to Booli's CDN
    if (IMAGE_REGEX.test(event.request.url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque')) {
                            return networkResponse;
                        }
                        
                        try {
                            cache.put(event.request, networkResponse.clone());
                        } catch (err) {
                            console.error('Failed to cache image:', err);
                        }
                        return networkResponse;
                    }).catch((error) => {
                        console.error('Fetch failed:', error);
                        // If both cache and network fail, we just throw or return a broken response
                        throw error;
                    });
                });
            })
        );
    }
});
