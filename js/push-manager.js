/**
 * Push Notification Manager
 * Handles Web Push subscription and notification management on the client side
 */

class PushManager {
    constructor() {
        this.swRegistration = null;
        this.isSubscribed = false;
        this.vapidPublicKey = null;
        this.API_URL = typeof API_CONFIG !== 'undefined' 
            ? API_CONFIG.BASE_URL 
            : 'https://luganda-translated-movies-production.up.railway.app';
    }

    /**
     * Initialize push notifications
     */
    async init() {
        // Check if service workers and push are supported
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log('Push notifications not supported');
            return false;
        }

        try {
            // Get service worker registration
            this.swRegistration = await navigator.serviceWorker.ready;
            console.log('Service Worker ready for push');

            // Get VAPID public key from server
            await this.getVapidKey();

            // Check current subscription status
            await this.checkSubscription();

            return true;
        } catch (error) {
            console.error('Push init failed:', error);
            return false;
        }
    }

    /**
     * Get VAPID public key from server
     */
    async getVapidKey() {
        try {
            const response = await fetch(`${this.API_URL}/api/push/vapid-public-key`);
            const data = await response.json();

            if (data.status === 'success') {
                this.vapidPublicKey = data.data.publicKey;
                return true;
            }
            
            console.warn('Push notifications not configured on server');
            return false;
        } catch (error) {
            console.error('Failed to get VAPID key:', error);
            return false;
        }
    }

    /**
     * Check if user is already subscribed
     */
    async checkSubscription() {
        if (!this.swRegistration) return false;

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            this.isSubscribed = subscription !== null;
            return this.isSubscribed;
        } catch (error) {
            console.error('Error checking subscription:', error);
            return false;
        }
    }

    /**
     * Subscribe to push notifications
     */
    async subscribe(preferences = {}) {
        if (!this.vapidPublicKey) {
            console.error('VAPID key not available');
            return { success: false, error: 'Push not configured' };
        }

        if (!this.swRegistration) {
            console.error('Service Worker not registered');
            return { success: false, error: 'Service Worker not ready' };
        }

        try {
            // Request notification permission
            const permission = await Notification.requestPermission();
            
            if (permission !== 'granted') {
                console.log('Notification permission denied');
                return { success: false, error: 'Permission denied' };
            }

            // Convert VAPID key to Uint8Array
            const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);

            // Subscribe to push
            const subscription = await this.swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });

            // Send subscription to server
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (!token) {
                console.error('User not logged in');
                return { success: false, error: 'Please login first' };
            }

            const response = await fetch(`${this.API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    preferences
                })
            });

            const data = await response.json();

            if (data.status === 'success') {
                this.isSubscribed = true;
                console.log('Successfully subscribed to push notifications');
                return { success: true, subscriptionId: data.data.subscriptionId };
            }

            return { success: false, error: data.message };
        } catch (error) {
            console.error('Subscribe failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe() {
        if (!this.swRegistration) {
            return { success: false, error: 'Service Worker not ready' };
        }

        try {
            const subscription = await this.swRegistration.pushManager.getSubscription();
            
            if (!subscription) {
                this.isSubscribed = false;
                return { success: true, message: 'Already unsubscribed' };
            }

            // Unsubscribe from browser
            await subscription.unsubscribe();

            // Remove from server
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (token) {
                await fetch(`${this.API_URL}/api/push/unsubscribe`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        endpoint: subscription.endpoint
                    })
                });
            }

            this.isSubscribed = false;
            console.log('Successfully unsubscribed from push notifications');
            return { success: true };
        } catch (error) {
            console.error('Unsubscribe failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
            return { success: false, error: 'Not logged in' };
        }

        try {
            const response = await fetch(`${this.API_URL}/api/push/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ preferences })
            });

            const data = await response.json();
            return { success: data.status === 'success', ...data };
        } catch (error) {
            console.error('Update preferences failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send test notification
     */
    async sendTestNotification() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
            return { success: false, error: 'Not logged in' };
        }

        try {
            const response = await fetch(`${this.API_URL}/api/push/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            return { success: data.status === 'success', ...data };
        } catch (error) {
            console.error('Test notification failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user's subscriptions
     */
    async getSubscriptions() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
            return { success: false, error: 'Not logged in' };
        }

        try {
            const response = await fetch(`${this.API_URL}/api/push/subscriptions`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            return { success: data.status === 'success', ...data.data };
        } catch (error) {
            console.error('Get subscriptions failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if notifications are supported and enabled
     */
    checkSupport() {
        return {
            serviceWorker: 'serviceWorker' in navigator,
            pushManager: 'PushManager' in window,
            notification: 'Notification' in window,
            permission: Notification.permission
        };
    }

    /**
     * Convert VAPID key from base64 to Uint8Array
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
}

// Create global instance
window.pushManager = new PushManager();

// Auto-init on DOM ready for logged-in users
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
        // Initialize push manager
        const initialized = await window.pushManager.init();
        
        if (initialized) {
            console.log('Push manager initialized');
            
            // Auto-prompt for notifications if not subscribed
            // Only on specific trigger pages or after user interaction
            // Don't auto-prompt - let user choose
        }
    }
});

/**
 * Quick helper to prompt user for push notifications
 * Call this after user action (e.g., clicks "Enable Notifications" button)
 */
async function enablePushNotifications(preferences = {}) {
    const result = await window.pushManager.subscribe(preferences);
    
    if (result.success) {
        showNotification?.('🔔 Notifications enabled!', 'success');
    } else {
        showNotification?.(result.error || 'Failed to enable notifications', 'error');
    }
    
    return result;
}

/**
 * Disable push notifications
 */
async function disablePushNotifications() {
    const result = await window.pushManager.unsubscribe();
    
    if (result.success) {
        showNotification?.('🔕 Notifications disabled', 'info');
    } else {
        showNotification?.(result.error || 'Failed to disable notifications', 'error');
    }
    
    return result;
}
