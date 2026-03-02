/**
 * Push Notifications Manager
 * Handles subscription, permission requests, and notification preferences
 */

const UnrulyPush = {
    // VAPID public key - fetched from server
    vapidPublicKey: null,
    
    // Current subscription
    subscription: null,
    
    // API URL
    apiUrl: (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL)
        ? API_CONFIG.BASE_URL
        : 'https://luganda-translated-movies-production.up.railway.app',

    /**
     * Initialize push notifications
     */
    async init() {
        // Check if push is supported
        if (!this.isSupported()) {
            console.log('Push notifications not supported');
            return false;
        }

        // Ensure the main PWA service worker is registered (this SW also handles push events)
        try {
            if ('serviceWorker' in navigator) {
                const existing = await navigator.serviceWorker.getRegistration('/');
                if (!existing) {
                    await navigator.serviceWorker.register('/sw.js');
                }
            }
        } catch (e) {
            // Non-fatal; we'll still try to proceed with ready registration
        }

        // Get VAPID public key from server
        try {
            const response = await fetch(`${this.apiUrl}/api/push/vapid-public-key`);
            const data = await response.json();
            
            if (data.status === 'success' && data.data.publicKey) {
                this.vapidPublicKey = data.data.publicKey;
                console.log('✅ Push notifications available');
                
                // Check existing subscription
                await this.checkExistingSubscription();
                
                // Show prompt for logged-in users who haven't subscribed
                this.showSubscribePromptIfNeeded();
                
                return true;
            }
        } catch (error) {
            console.log('Push notifications not configured on server');
            return false;
        }
        
        return false;
    },

    /**
     * Check if push notifications are supported
     */
    isSupported() {
        // Check for basic notification support
        if (!('Notification' in window)) {
            console.log('Notifications not supported in this browser');
            return false;
        }

        // iOS/Safari limitations - web push not supported on iOS < 16.4
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIOS) {
            // iOS 16.4+ supports web push only for installed PWAs
            const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
            if (!isStandalone) {
                console.log('iOS requires PWA installation for push notifications');
                return false;
            }
        }

        // Check for required APIs
        return 'serviceWorker' in navigator && 
               'PushManager' in window && 
               'Notification' in window;
    },

    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!localStorage.getItem('token');
    },

    /**
     * Get auth token
     */
    getToken() {
        return localStorage.getItem('token');
    },

    /**
     * Check existing subscription
     */
    async checkExistingSubscription() {
        try {
            const registration = await navigator.serviceWorker.ready;
            this.subscription = await registration.pushManager.getSubscription();
            
            if (this.subscription) {
                console.log('Existing push subscription found');
                localStorage.setItem('pushSubscribed', 'true');
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    },

    /**
     * Show subscribe prompt if user hasn't subscribed
     */
    showSubscribePromptIfNeeded() {
        // Only show for logged-in users who haven't subscribed or dismissed
        if (!this.isLoggedIn()) return;
        if (this.subscription) return;
        
        // Check if permanently dismissed
        if (localStorage.getItem('pushPromptDismissed') === 'permanent') return;
        
        // Check if user already made a decision
        const permissionState = localStorage.getItem('notificationPermissionState');
        if (permissionState === 'granted' || permissionState === 'denied') return;
        
        // Check current browser permission
        if (Notification.permission === 'denied') {
            localStorage.setItem('notificationPermissionState', 'denied');
            return;
        }
        if (Notification.permission === 'granted') {
            localStorage.setItem('notificationPermissionState', 'granted');
            return;
        }

        // Check temporary dismissal (24 hours)
        const dismissedAt = localStorage.getItem('pushPromptDismissedAt');
        if (dismissedAt) {
            const hoursSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
            if (hoursSinceDismissed < 24) return;
        }

        // Wait a bit before showing prompt (don't interrupt user immediately)
        setTimeout(() => {
            this.showSubscribePrompt();
        }, 5000);
    },

    /**
     * Show the subscribe prompt UI
     */
    showSubscribePrompt() {
        // Don't show if already exists
        if (document.getElementById('push-prompt')) return;

        const prompt = document.createElement('div');
        prompt.id = 'push-prompt';
        prompt.innerHTML = `
            <div class="push-prompt-overlay">
                <div class="push-prompt-modal">
                    <div class="push-prompt-icon">🔔</div>
                    <h3>Stay Updated!</h3>
                    <p>Get notified when new movies and series are added. Never miss a new release!</p>
                    <div class="push-prompt-buttons">
                        <button class="push-btn-enable" onclick="UnrulyPush.requestPermission()">
                            Enable Notifications
                        </button>
                        <button class="push-btn-later" onclick="UnrulyPush.dismissPrompt()">
                            Maybe Later
                        </button>
                    </div>
                    <label class="push-dont-ask">
                        <input type="checkbox" id="push-dont-ask-checkbox">
                        <span>Don't ask again</span>
                    </label>
                </div>
            </div>
        `;

        // Add styles
        const styles = document.createElement('style');
        styles.textContent = `
            .push-prompt-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                animation: fadeIn 0.3s ease;
            }
            .push-prompt-modal {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(124, 252, 0, 0.2);
            }
            .push-prompt-icon {
                font-size: 60px;
                margin-bottom: 15px;
                animation: bounce 1s ease infinite;
            }
            .push-prompt-modal h3 {
                color: #7CFC00;
                font-size: 24px;
                margin-bottom: 10px;
            }
            .push-prompt-modal p {
                color: #ccc;
                font-size: 14px;
                margin-bottom: 25px;
                line-height: 1.5;
            }
            .push-prompt-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .push-btn-enable {
                background: linear-gradient(135deg, #7CFC00 0%, #00D9FF 100%);
                color: #000;
                border: none;
                padding: 14px 30px;
                border-radius: 30px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .push-btn-enable:hover {
                transform: scale(1.05);
                box-shadow: 0 5px 20px rgba(124, 252, 0, 0.4);
            }
            .push-btn-later {
                background: transparent;
                color: #888;
                border: 1px solid #444;
                padding: 12px 30px;
                border-radius: 30px;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .push-btn-later:hover {
                border-color: #666;
                color: #aaa;
            }
            .push-dont-ask {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                margin-top: 20px;
                color: #666;
                font-size: 12px;
                cursor: pointer;
            }
            .push-dont-ask input {
                accent-color: #7CFC00;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(prompt);
    },

    /**
     * Dismiss the prompt
     */
    dismissPrompt() {
        const prompt = document.getElementById('push-prompt');
        const dontAsk = document.getElementById('push-dont-ask-checkbox');
        
        if (dontAsk && dontAsk.checked) {
            // Permanently dismiss
            localStorage.setItem('pushPromptDismissed', 'permanent');
        } else {
            // Temporarily dismiss (will show again after 24 hours)
            localStorage.setItem('pushPromptDismissedAt', Date.now().toString());
        }
        
        if (prompt) {
            prompt.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => prompt.remove(), 300);
        }
    },

    /**
     * Request notification permission and subscribe
     */
    async requestPermission() {
        try {
            // Check if notifications are supported first
            if (!this.isSupported()) {
                this.showToast('Push notifications are not supported on this device/browser', 'warning');
                this.dismissPrompt();
                localStorage.setItem('pushPromptDismissed', 'permanent');
                return false;
            }

            // Request permission
            const permission = await Notification.requestPermission();
            
            // Store the permission state
            localStorage.setItem('notificationPermissionState', permission);
            
            if (permission !== 'granted') {
                if (permission === 'denied') {
                    this.showToast('Notifications blocked. Enable them in browser settings.', 'error');
                } else {
                    this.showToast('Notification permission not granted', 'warning');
                }
                this.dismissPrompt();
                return false;
            }

            // Subscribe to push
            const subscribed = await this.subscribe();
            
            if (subscribed) {
                this.showToast('🔔 Notifications enabled! You\'ll be notified of new releases.', 'success');
                localStorage.setItem('pushSubscribed', 'true');
                localStorage.setItem('notificationPermissionState', 'granted');
            } else {
                this.showToast('Could not complete subscription. Please try again.', 'error');
            }
            
            this.dismissPrompt();
            return subscribed;
        } catch (error) {
            console.error('Permission request error:', error);
            this.showToast('Failed to enable notifications. Try again later.', 'error');
            this.dismissPrompt();
            return false;
        }
    },

    /**
     * Subscribe to push notifications
     */
    async subscribe() {
        try {
            const registration = await navigator.serviceWorker.ready;
            
            // Convert VAPID key
            const convertedKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
            
            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
            });

            this.subscription = subscription;

            // Send subscription to server
            const token = this.getToken();
            if (!token) {
                console.error('No auth token');
                return false;
            }

            const response = await fetch(`${this.apiUrl}/api/push/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    preferences: {
                        newMovies: true,
                        newSeries: true,
                        vjUpdates: true,
                        subscriptionAlerts: true,
                        systemAnnouncements: true
                    }
                })
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                console.log('✅ Push subscription saved to server');
                return true;
            } else {
                console.error('Failed to save subscription:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Subscribe error:', error);
            return false;
        }
    },

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe() {
        try {
            if (!this.subscription) {
                const registration = await navigator.serviceWorker.ready;
                this.subscription = await registration.pushManager.getSubscription();
            }

            if (!this.subscription) {
                return true;
            }

            const endpoint = this.subscription.endpoint;

            // Unsubscribe locally
            await this.subscription.unsubscribe();
            this.subscription = null;

            // Remove from server
            const token = this.getToken();
            if (token) {
                await fetch(`${this.apiUrl}/api/push/unsubscribe`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ endpoint })
                });
            }

            localStorage.removeItem('pushSubscribed');
            this.showToast('Notifications disabled', 'info');
            return true;
        } catch (error) {
            console.error('Unsubscribe error:', error);
            return false;
        }
    },

    /**
     * Update notification preferences
     */
    async updatePreferences(preferences) {
        try {
            const token = this.getToken();
            if (!token) return false;

            const response = await fetch(`${this.apiUrl}/api/push/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ preferences })
            });

            const data = await response.json();
            return data.status === 'success';
        } catch (error) {
            console.error('Update preferences error:', error);
            return false;
        }
    },

    /**
     * Send test notification
     */
    async sendTest() {
        try {
            const token = this.getToken();
            if (!token) {
                this.showToast('Please login first', 'error');
                return false;
            }

            const response = await fetch(`${this.apiUrl}/api/push/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.status === 'success') {
                this.showToast('Test notification sent!', 'success');
                return true;
            } else {
                this.showToast(data.message || 'Failed to send test', 'error');
                return false;
            }
        } catch (error) {
            console.error('Test notification error:', error);
            this.showToast('Failed to send test notification', 'error');
            return false;
        }
    },

    /**
     * Convert VAPID key to Uint8Array
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
    },

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `push-toast push-toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            z-index: 100001;
            animation: slideUp 0.3s ease;
            background: ${type === 'success' ? '#7CFC00' : type === 'error' ? '#ff4444' : '#00D9FF'};
            color: ${type === 'error' ? '#fff' : '#000'};
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Check notification status
     */
    getStatus() {
        return {
            supported: this.isSupported(),
            permission: Notification.permission,
            subscribed: !!this.subscription || localStorage.getItem('pushSubscribed') === 'true',
            loggedIn: this.isLoggedIn()
        };
    }
};

// Add animation keyframes
const animStyles = document.createElement('style');
animStyles.textContent = `
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(100px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(100px); opacity: 0; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(animStyles);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Wait for service worker to be ready
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(() => {
            UnrulyPush.init();
        });
    }
});

// Export for global access
window.UnrulyPush = UnrulyPush;
