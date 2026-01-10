// Service Worker for Push Notifications - Unruly Movies
const CACHE_NAME = 'unruly-movies-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('🔔 Push Service Worker installed');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('🔔 Push Service Worker activated');
    event.waitUntil(clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
    console.log('🔔 Push notification received');
    
    let data = {
        title: 'Unruly Movies',
        body: 'New content available!',
        icon: '/assets/images/logo.png',
        badge: '/assets/images/favicon.png',
        image: null,
        url: '/'
    };
    
    // Parse push data if available
    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon || '/assets/images/logo.png',
        badge: data.badge || '/assets/images/favicon.png',
        image: data.image,
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            dateOfArrival: Date.now()
        },
        actions: [
            {
                action: 'open',
                title: 'Watch Now',
                icon: '/assets/images/play-icon.png'
            },
            {
                action: 'close',
                title: 'Later'
            }
        ],
        requireInteraction: true,
        tag: data.tag || 'unruly-notification',
        renotify: true
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked');
    event.notification.close();
    
    const url = event.notification.data?.url || '/';
    
    if (event.action === 'close') {
        return;
    }
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if there's already an open window
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        client.navigate(url);
                        return client.focus();
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow(url);
                }
            })
    );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
    console.log('🔔 Notification closed');
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    // Sync logic when back online
    console.log('🔔 Syncing notifications...');
}
