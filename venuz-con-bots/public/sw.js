// VENUZ Service Worker v1
const CACHE_NAME = 'venuz-v1';
const STATIC_CACHE = 'venuz-static-v1';
const DYNAMIC_CACHE = 'venuz-dynamic-v1';

const urlsToCache = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Instalación - cachear assets estáticos
self.addEventListener('install', (event) => {
    console.log('🚀 VENUZ SW: Installing...');
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 VENUZ SW: Caching static assets');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activación - limpiar caches antiguos
self.addEventListener('activate', (event) => {
    console.log('✅ VENUZ SW: Activated');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName.startsWith('venuz-') &&
                                cacheName !== STATIC_CACHE &&
                                cacheName !== DYNAMIC_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('🗑️ VENUZ SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API requests - always go to network
    if (event.request.url.includes('/api/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For static assets, cache first
    if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?)$/)) {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then((fetchResponse) => {
                            // Cache the new response
                            return caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(event.request, fetchResponse.clone());
                                    return fetchResponse;
                                });
                        });
                })
        );
        return;
    }

    // For HTML pages, network first
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE)
                        .then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                }
                return response;
            })
            .catch(() => {
                // Fallback to cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // Fallback to offline page
                        return caches.match('/');
                    });
            })
    );
});

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('🔔 VENUZ SW: Push received');

    let data = { title: 'VENUZ', body: 'Nuevo contenido disponible' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Cerrar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('👆 VENUZ SW: Notification clicked');

    event.notification.close();

    if (event.action === 'close') return;

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(urlToOpen);
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-favorites') {
        console.log('🔄 VENUZ SW: Syncing favorites...');
        // TODO: Implement offline favorites sync
    }
});

console.log('🎉 VENUZ Service Worker loaded');
