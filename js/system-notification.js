/**
 * SYSTEM NOTIFICATION CONFIGURATION
 * =====================================
 * 
 * Notifications are now managed by admin from the admin dashboard.
 * Go to Admin > Send Notification to broadcast messages to all users.
 */

const SystemNotification = {
    // ========== CONFIGURATION ==========
    
    // Static notifications are disabled - admin controls this now
    ENABLED: false,
    
    // Delay before showing (ms)
    DELAY: 500,
    
    // ========== END CONFIGURATION ==========
    
    // Type colors
    colors: {
        warning: '#e74c3c',
        info: '#3498db',
        success: '#27ae60',
        error: '#c0392b'
    },
    
    // Initialize the notification system
    init: function() {
        // Check for admin-sent notification first
        this.checkAdminNotification();
    },
    
    // Check for admin broadcast notification
    checkAdminNotification: function() {
        const adminNotif = localStorage.getItem('admin_notification');
        if (!adminNotif) return;
        
        try {
            const config = JSON.parse(adminNotif);
            if (!config.enabled) return;
            
            // Check if user dismissed this notification today
            const dismissed = localStorage.getItem('notification_dismissed_' + config.id);
            if (dismissed) {
                const dismissedDate = new Date(dismissed);
                const today = new Date();
                if (dismissedDate.toDateString() === today.toDateString()) {
                    return;
                }
            }
            
            // Show the admin notification
            setTimeout(() => {
                this.ID = config.id;
                this.TYPE = config.type || 'warning';
                this.TITLE = config.title;
                this.MESSAGE = `<p>${config.message.replace(/\n/g, '</p><p>')}</p>`;
                this.show();
            }, this.DELAY);
            
        } catch (e) {
            console.error('Invalid admin notification config');
        }
    },
    
    // Create notification HTML
    createHTML: function() {
        const color = this.colors[this.TYPE] || this.colors.warning;
        
        return `
        <div id="systemNotificationOverlay" class="sys-notif-overlay">
            <div class="sys-notif-modal" style="border-color: ${color}; box-shadow: 0 20px 60px ${color}33;">
                <div class="sys-notif-icon" style="color: ${color};">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        ${this.getIcon()}
                    </svg>
                </div>
                <h2 class="sys-notif-title">${this.TITLE}</h2>
                <div class="sys-notif-message" style="border-left-color: ${color};">
                    ${this.MESSAGE}
                </div>
                <button class="sys-notif-btn" style="background: linear-gradient(135deg, ${color}, ${this.darkenColor(color)});">
                    I Understand
                </button>
                <label class="sys-notif-checkbox">
                    <input type="checkbox" id="sysNotifDontShow"> Don't show this again today
                </label>
            </div>
        </div>
        <style>
            .sys-notif-overlay{display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);z-index:999999;justify-content:center;align-items:center;animation:sysNotifFadeIn .3s ease}
            @keyframes sysNotifFadeIn{from{opacity:0}to{opacity:1}}
            @keyframes sysNotifSlideIn{from{transform:scale(.8) translateY(-20px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
            .sys-notif-modal{background:linear-gradient(145deg,#1a1a2e,#16213e);border:2px solid;border-radius:20px;padding:40px;max-width:500px;width:90%;text-align:center;animation:sysNotifSlideIn .4s ease}
            .sys-notif-icon{margin-bottom:20px}
            .sys-notif-icon svg{filter:drop-shadow(0 0 10px currentColor)}
            .sys-notif-title{color:#fff;font-size:1.8em;margin-bottom:20px;font-weight:700}
            .sys-notif-message{color:#ddd;font-size:1.1em;line-height:1.7;margin-bottom:30px;text-align:left;background:rgba(255,255,255,.05);padding:20px;border-radius:10px;border-left:4px solid}
            .sys-notif-message p{margin:10px 0}
            .sys-notif-btn{color:#fff;border:none;padding:15px 50px;font-size:1.1em;font-weight:600;border-radius:50px;cursor:pointer;transition:all .3s ease;text-transform:uppercase;letter-spacing:1px}
            .sys-notif-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
            .sys-notif-checkbox{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:20px;color:#888;font-size:.9em;cursor:pointer}
            .sys-notif-checkbox input{width:18px;height:18px;cursor:pointer;accent-color:${color}}
            @media(max-width:600px){.sys-notif-modal{padding:25px;margin:15px}.sys-notif-title{font-size:1.4em}.sys-notif-message{font-size:1em}.sys-notif-btn{padding:12px 35px;font-size:1em}}
        </style>
        `;
    },
    
    // Get icon based on type
    getIcon: function() {
        const icons = {
            warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
            info: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>',
            success: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>',
            error: '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>'
        };
        return icons[this.TYPE] || icons.warning;
    },
    
    // Darken a color for gradient
    darkenColor: function(color) {
        // Simple darkening for common colors
        const darken = {
            '#e74c3c': '#c0392b',
            '#3498db': '#2980b9',
            '#27ae60': '#1e8449',
            '#c0392b': '#922b21'
        };
        return darken[color] || color;
    },
    
    // Show notification
    show: function() {
        // Create container
        const container = document.createElement('div');
        container.innerHTML = this.createHTML();
        document.body.appendChild(container);
        document.body.style.overflow = 'hidden';
        
        // Add button click handler
        const btn = container.querySelector('.sys-notif-btn');
        btn.addEventListener('click', () => this.close(container));
        
        // Close on overlay click
        const overlay = container.querySelector('.sys-notif-overlay');
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) this.close(container);
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close(container);
        });
    },
    
    // Close notification
    close: function(container) {
        // Check don't show again checkbox
        const checkbox = document.getElementById('sysNotifDontShow');
        if (checkbox && checkbox.checked) {
            localStorage.setItem('notification_dismissed_' + this.ID, new Date().toISOString());
        }
        
        // Fade out
        const overlay = container.querySelector('.sys-notif-overlay');
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.2s ease';
        
        setTimeout(() => {
            container.remove();
            document.body.style.overflow = '';
        }, 200);
    }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SystemNotification.init());
} else {
    SystemNotification.init();
}
