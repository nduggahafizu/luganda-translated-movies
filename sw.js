// Service Worker for Unruly Movies PWA
const CACHE_NAME = 'unruly-movies-v2';
const DYNAMIC_CACHE = 'unruly-dynamic-v2';

// Files to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/movies.html',
    '/search.html',
    '/dashboard.html',
    '/login.html',
    '/css/style.css',
    '/css/responsive.css',
    '/js/config.js',
    '/js/main.js',
    '/js/auth.js',
    '/assets/images/logo.png',
    '/assets/images/placeholder.svg',
    '/manifest.json',
    '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[ServiceWorker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[ServiceWorker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== DYNAMIC_CACHE)
                        .map(name => {
                            console.log('[ServiceWorker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') return;
    
    // ALWAYS bypass service worker for API requests - fetch fresh data
    if (url.pathname.startsWith('/api/') || url.hostname.includes('railway.app')) {
        return; // Let browser handle it directly, no caching
    }
    
    // Skip cross-origin requests except images
    if (url.origin !== location.origin && !url.href.includes('image.tmdb.org')) {
        return;
    }
    
    // For images, use cache-first strategy
    if (request.destination === 'image' || url.href.includes('image.tmdb.org')) {
        event.respondWith(cacheFirst(request));
        return;
    }
    
    // For HTML pages, use network-first strategy
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // For other assets, use cache-first strategy
    event.respondWith(cacheFirst(request));
});

// Cache-first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache the new response
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return placeholder for images
        if (request.destination === 'image') {
            return caches.match('/assets/images/placeholder.svg');
        }
        
        throw error;
    }
}

// Network-first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Try to return cached version
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Handle push notifications
self.addEventListener('push', event => {
    console.log('[ServiceWorker] Push received');
    
    let data = {};
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'New Notification', body: event.data.text() };
        }
    }
    
    const options = {
        body: data.body || 'New update from Unruly Movies',
        icon: '/assets/images/icons/icon-192x192.png',
        badge: '/assets/images/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: [
            { action: 'open', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        tag: data.tag || 'general',
        renotify: true
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Unruly Movies', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('[ServiceWorker] Notification click');
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(windowClients => {
                // Check if there's already a window open
                for (const client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
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

// Background sync for offline actions
self.addEventListener('sync', event => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    
    if (event.tag === 'sync-watchlist') {
        event.waitUntil(syncWatchlist());
    }
    
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncWatchProgress());
    }
});

async function syncWatchlist() {
    // Get pending watchlist actions from IndexedDB
    // Sync with server when online
    console.log('[ServiceWorker] Syncing watchlist...');
}

async function syncWatchProgress() {
    // Sync watch progress with server
    console.log('[ServiceWorker] Syncing watch progress...');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-content') {
        event.waitUntil(updateContent());
    }
});

async function updateContent() {
    // Pre-fetch latest movies for offline access
    console.log('[ServiceWorker] Updating content...');
    
    try {
        const response = await fetch('/api/luganda-movies?limit=20');
        const data = await response.json();
        
        // Cache movie data
        const cache = await caches.open(DYNAMIC_CACHE);
        await cache.put('/api/luganda-movies?limit=20', new Response(JSON.stringify(data)));
        
        // Pre-cache movie posters
        if (data.data?.movies) {
            const posterUrls = data.data.movies
                .filter(m => m.poster)
                .map(m => m.poster);
            
            await cache.addAll(posterUrls);
        }
    } catch (error) {
        console.error('[ServiceWorker] Update content error:', error);
    }
}
