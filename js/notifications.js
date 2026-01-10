/**
 * Unruly Movies - Push Notification System
 * Handles browser push notifications for new movies, series, and updates
 */

class UnrulyNotifications {
    constructor() {
        this.swRegistration = null;
        this.isSubscribed = false;
        this.permissionGranted = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    async init() {
        // Check current permission status
        if ('Notification' in window) {
            this.permissionGranted = Notification.permission === 'granted';
        }
        
        // Register service worker if supported
        if ('serviceWorker' in navigator) {
            try {
                this.swRegistration = await navigator.serviceWorker.register('/sw-push.js');
            } catch (error) {
                // Silent fail
            }
        }
        
        // Show prompt if permission not yet decided
        if (!('Notification' in window) || Notification.permission === 'default') {
            // Check if already dismissed
            const dismissed = localStorage.getItem('notification-prompt-dismissed');
            if (!dismissed || Date.now() - parseInt(dismissed) > 24 * 60 * 60 * 1000) {
                // Show after 2 seconds
                setTimeout(() => this.showPermissionPrompt(), 2000);
            }
        } else if (this.permissionGranted) {
            this.setupLocalNotifications();
        }
    }
    
    // Show custom permission prompt UI - with full inline styles for reliability
    showPermissionPrompt() {
        // Don't show if already showing
        if (document.getElementById('notification-prompt')) return;
        
        // Create prompt overlay
        const overlay = document.createElement('div');
        overlay.id = 'notification-prompt';
        
        // Apply styles via JavaScript for maximum compatibility
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '999999',
            padding: '20px',
            boxSizing: 'border-box'
        });
        
        // Create card
        const card = document.createElement('div');
        Object.assign(card.style, {
            background: '#1a1a25',
            borderRadius: '20px',
            padding: '35px 25px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid #333',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)'
        });
        
        // Icon container
        const iconDiv = document.createElement('div');
        Object.assign(iconDiv.style, {
            width: '70px',
            height: '70px',
            margin: '0 auto 20px',
            background: 'rgba(124, 252, 0, 0.15)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        iconDiv.innerHTML = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7CFC00" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
        
        // Title
        const title = document.createElement('h3');
        Object.assign(title.style, {
            fontSize: '22px',
            fontWeight: '700',
            marginBottom: '10px',
            color: '#ffffff',
            fontFamily: 'Inter, -apple-system, sans-serif'
        });
        title.textContent = '🔔 Stay Updated!';
        
        // Description
        const desc = document.createElement('p');
        Object.assign(desc.style, {
            fontSize: '14px',
            color: '#888888',
            marginBottom: '25px',
            lineHeight: '1.6',
            fontFamily: 'Inter, -apple-system, sans-serif'
        });
        desc.textContent = 'Get notified when new Luganda movies and series are added to Unruly Movies';
        
        // Button container
        const btnContainer = document.createElement('div');
        Object.assign(btnContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        });
        
        // Allow button
        const allowBtn = document.createElement('button');
        Object.assign(allowBtn.style, {
            background: 'linear-gradient(135deg, #7CFC00 0%, #00D9FF 100%)',
            color: '#000000',
            border: 'none',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: 'Inter, -apple-system, sans-serif',
            width: '100%'
        });
        allowBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Enable Notifications';
        allowBtn.onclick = () => this.requestPermission();
        
        // Later button
        const laterBtn = document.createElement('button');
        Object.assign(laterBtn.style, {
            background: 'transparent',
            color: '#888888',
            border: '1px solid #333333',
            padding: '14px 24px',
            borderRadius: '12px',
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'Inter, -apple-system, sans-serif',
            width: '100%'
        });
        laterBtn.textContent = 'Maybe Later';
        laterBtn.onclick = () => this.dismissPrompt();
        
        // Assemble
        btnContainer.appendChild(allowBtn);
        btnContainer.appendChild(laterBtn);
        card.appendChild(iconDiv);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(btnContainer);
        overlay.appendChild(card);
        
        document.body.appendChild(overlay);
    }
    
    // Request browser notification permission
    async requestPermission() {
        if (!('Notification' in window)) {
            this.showToast('Notifications not supported on this browser', 'warning');
            this.removePrompt();
            return;
        }
        
        try {
            const permission = await Notification.requestPermission();
            this.permissionGranted = permission === 'granted';
            
            if (this.permissionGranted) {
                this.removePrompt();
                this.setupLocalNotifications();
                
                // Show welcome notification
                this.showNotification({
                    title: '🎬 Notifications Enabled!',
                    body: 'You\'ll be notified when new movies and series are added.',
                    icon: '/assets/images/logo.png'
                });
                
                // Show success toast
                this.showToast('Notifications enabled! 🔔', 'success');
            } else if (permission === 'denied') {
                this.removePrompt();
                this.showToast('Notifications blocked. Enable in browser settings.', 'warning');
            }
        } catch (error) {
            this.removePrompt();
            this.showToast('Could not enable notifications', 'error');
        }
    }
    
    // Dismiss the prompt
    dismissPrompt() {
        localStorage.setItem('notification-prompt-dismissed', Date.now().toString());
        this.removePrompt();
    }
    
    // Remove prompt from DOM
    removePrompt() {
        const prompt = document.getElementById('notification-prompt');
        if (prompt) {
            prompt.style.opacity = '0';
            setTimeout(() => {
                if (prompt.parentNode) prompt.parentNode.removeChild(prompt);
            }, 300);
        }
    }
    
    // Setup local notification triggers
    setupLocalNotifications() {
        console.log('✅ Local notifications setup complete');
        
        // Store subscription status
        localStorage.setItem('notifications-enabled', 'true');
        
        // Check for new content periodically (every 30 minutes)
        this.checkForNewContent();
        setInterval(() => this.checkForNewContent(), 30 * 60 * 1000);
    }
    
    // Check API for new content
    async checkForNewContent() {
        if (!this.permissionGranted) return;
        
        const lastCheck = localStorage.getItem('last-notification-check') || '0';
        const lastCheckTime = parseInt(lastCheck);
        
        try {
            // Check for new movies
            const API_BASE = window.API_BASE_URL || 'https://luganda-movies-api.onrender.com/api';
            const response = await fetch(`${API_BASE}/luganda-movies?limit=5&sort=-createdAt`);
            
            if (response.ok) {
                const data = await response.json();
                const movies = data.data || [];
                
                // Find movies added after last check
                for (const movie of movies) {
                    const movieTime = new Date(movie.createdAt).getTime();
                    if (movieTime > lastCheckTime) {
                        // New movie found!
                        this.showNotification({
                            title: '🎬 New Movie Added!',
                            body: `${movie.title} is now available to watch`,
                            icon: movie.poster || '/assets/images/logo.png',
                            image: movie.poster,
                            url: `/player.html?id=${movie._id}`,
                            tag: `movie-${movie._id}`
                        });
                    }
                }
            }
            
            // Update last check time
            localStorage.setItem('last-notification-check', Date.now().toString());
        } catch (error) {
            console.log('Could not check for new content:', error.message);
        }
    }
    
    // Show a notification
    showNotification(options) {
        if (!this.permissionGranted) {
            console.log('Notifications not permitted');
            return;
        }
        
        const defaults = {
            title: 'Unruly Movies',
            body: 'New content available!',
            icon: '/assets/images/logo.png',
            badge: '/assets/images/favicon.png',
            tag: 'unruly-general',
            requireInteraction: false,
            silent: false
        };
        
        const config = { ...defaults, ...options };
        
        // Use service worker notification if available
        if (this.swRegistration) {
            this.swRegistration.showNotification(config.title, {
                body: config.body,
                icon: config.icon,
                badge: config.badge,
                image: config.image,
                tag: config.tag,
                data: { url: config.url || '/' },
                requireInteraction: config.requireInteraction,
                vibrate: [100, 50, 100],
                actions: config.url ? [
                    { action: 'open', title: 'Watch Now' },
                    { action: 'close', title: 'Dismiss' }
                ] : []
            });
        } else {
            // Fallback to basic notification
            const notification = new Notification(config.title, {
                body: config.body,
                icon: config.icon,
                tag: config.tag
            });
            
            if (config.url) {
                notification.onclick = () => {
                    window.focus();
                    window.location.href = config.url;
                };
            }
        }
    }
    
    // Show in-app toast notification with inline styles
    showToast(message, type = 'info') {
        // Get or create container
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            Object.assign(container.style, {
                position: 'fixed',
                top: '80px',
                right: '20px',
                zIndex: '999999',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                maxWidth: '350px'
            });
            document.body.appendChild(container);
        }
        
        // Create toast
        const toast = document.createElement('div');
        const colors = {
            success: '#00C853',
            warning: '#FFD600',
            error: '#FF5252',
            info: '#00B0FF'
        };
        
        Object.assign(toast.style, {
            background: '#1a1a25',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '15px',
            borderLeft: `4px solid ${colors[type] || colors.info}`,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            transform: 'translateX(120%)',
            transition: 'transform 0.3s ease',
            fontFamily: 'Inter, -apple-system, sans-serif'
        });
        
        const span = document.createElement('span');
        span.textContent = message;
        Object.assign(span.style, {
            fontSize: '14px',
            color: '#ffffff'
        });
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            color: '#888',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 5px',
            lineHeight: '1'
        });
        closeBtn.onclick = () => toast.remove();
        
        toast.appendChild(span);
        toast.appendChild(closeBtn);
        container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
        });
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(120%)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }
    
    // Manually trigger notification for new movie
    notifyNewMovie(movie) {
        this.showNotification({
            title: '🎬 New Movie!',
            body: `${movie.title} - Watch now in Luganda!`,
            icon: movie.poster || '/assets/images/logo.png',
            image: movie.backdrop || movie.poster,
            url: `/player.html?id=${movie._id}`,
            tag: `movie-${movie._id}`,
            requireInteraction: true
        });
    }
    
    // Notify for new series episode
    notifyNewEpisode(series, season, episode) {
        this.showNotification({
            title: `📺 New Episode!`,
            body: `${series.title} S${season}E${episode} is now available`,
            icon: series.poster || '/assets/images/logo.png',
            url: `/series-player.html?id=${series._id}&season=${season}&episode=${episode}`,
            tag: `series-${series._id}-s${season}e${episode}`,
            requireInteraction: true
        });
    }
    
    // Check if notifications are enabled
    isEnabled() {
        return this.permissionGranted && localStorage.getItem('notifications-enabled') === 'true';
    }
    
    // Disable notifications
    disable() {
        localStorage.removeItem('notifications-enabled');
        this.showToast('Notifications disabled', 'info');
    }
}

// Initialize notifications
const unrulyNotifications = new UnrulyNotifications();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UnrulyNotifications;
}
