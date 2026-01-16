// Native App Push Notifications Handler
// This file initializes push notifications for the Capacitor native app

(function() {
    'use strict';

    // Check if running inside Capacitor native app
    const isNativeApp = window.Capacitor && window.Capacitor.isNativePlatform();
    
    if (!isNativeApp) {
        console.log('Not running in native app, skipping native notifications');
        return;
    }

    console.log('Running in Unruly Movies native app');

    // Import Capacitor plugins
    const { PushNotifications } = window.Capacitor.Plugins;
    const { LocalNotifications } = window.Capacitor.Plugins;
    const { StatusBar } = window.Capacitor.Plugins;
    const { SplashScreen } = window.Capacitor.Plugins;

    // Hide splash screen after page loads
    window.addEventListener('load', async () => {
        try {
            await SplashScreen.hide();
        } catch (e) {
            console.log('Splash screen already hidden');
        }
    });

    // Set status bar style
    async function setupStatusBar() {
        try {
            await StatusBar.setBackgroundColor({ color: '#0a0a0a' });
            await StatusBar.setStyle({ style: 'DARK' });
        } catch (e) {
            console.log('Status bar setup skipped');
        }
    }
    setupStatusBar();

    // Request notification permissions
    async function requestNotificationPermission() {
        try {
            let permStatus = await PushNotifications.checkPermissions();
            
            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.log('User denied notification permissions');
                return false;
            }

            // Register with push notification service
            await PushNotifications.register();
            console.log('Push notifications registered');
            return true;

        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }

    // Handle push notification registration
    PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token:', token.value);
        
        // Store token for backend use
        localStorage.setItem('pushToken', token.value);
        
        // Send token to your server
        sendTokenToServer(token.value);
    });

    // Handle registration errors
    PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error:', error);
    });

    // Handle incoming push notifications (app is open)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push notification received:', notification);
        
        // Show a local notification
        showLocalNotification(notification.title, notification.body, notification.data);
    });

    // Handle notification tap (opens app from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed:', notification);
        
        // Navigate based on notification data
        const data = notification.notification.data;
        if (data && data.url) {
            window.location.href = data.url;
        } else if (data && data.movieId) {
            window.location.href = `/movie-details.html?id=${data.movieId}`;
        }
    });

    // Show local notification
    async function showLocalNotification(title, body, data = {}) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title || 'Unruly Movies',
                        body: body || 'You have a new notification',
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 100) },
                        extra: data,
                        smallIcon: 'ic_notification',
                        iconColor: '#e50914'
                    }
                ]
            });
        } catch (error) {
            console.error('Error showing local notification:', error);
        }
    }

    // Send token to your server for later push notifications
    async function sendTokenToServer(token) {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            return;
        }

        try {
            const API_BASE = (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://luganda-translated-movies-production.up.railway.app';
            const response = await fetch(`${API_BASE}/api/notifications/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: userId,
                    token: token,
                    platform: 'android'
                })
            });
        } catch (error) {
            // Silently fail - notifications registration is not critical
        }
    }

    // Public API
    window.UnrulyNotifications = {
        requestPermission: requestNotificationPermission,
        showNotification: showLocalNotification,
        isNativeApp: isNativeApp
    };

    // Auto-request permission after 5 seconds
    setTimeout(() => {
        requestNotificationPermission();
    }, 5000);

    // Notify new movie arrivals
    window.notifyNewMovie = function(movie) {
        if (isNativeApp) {
            showLocalNotification(
                '🎬 New Movie Added!',
                `${movie.title} is now available in ${movie.language || 'Luganda'}`,
                { movieId: movie._id, url: `/movie-details.html?id=${movie._id}` }
            );
        }
    };

})();
