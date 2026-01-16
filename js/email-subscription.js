/**
 * Email Subscription Component
 * Newsletter signup popup and footer form
 */

class EmailSubscription {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: (window.API_CONFIG && window.API_CONFIG.BASE_URL) || 'https://luganda-translated-movies-production.up.railway.app',
            showPopupDelay: 30000, // 30 seconds
            popupCooldown: 7 * 24 * 60 * 60 * 1000, // 7 days
            ...options
        };
        
        this.init();
    }
    
    init() {
        this.createPopup();
        this.createFooterForm();
        this.addStyles();
        this.checkPopupTrigger();
    }
    
    createPopup() {
        this.popup = document.createElement('div');
        this.popup.id = 'email-popup';
        this.popup.className = 'email-popup hidden';
        this.popup.innerHTML = `
            <div class="email-popup-overlay"></div>
            <div class="email-popup-content">
                <button class="email-popup-close" aria-label="Close">&times;</button>
                <div class="email-popup-icon">🎬📧</div>
                <h2>Never Miss a Movie!</h2>
                <p>Get notified when new Luganda-translated movies are added.</p>
                
                <form class="email-popup-form">
                    <input type="email" name="email" placeholder="Enter your email" required>
                    <button type="submit">
                        <span class="btn-text">Subscribe</span>
                        <span class="btn-loading hidden">...</span>
                    </button>
                </form>
                
                <div class="email-preferences">
                    <label>
                        <input type="checkbox" name="weeklyDigest" checked>
                        Weekly movie digest
                    </label>
                    <label>
                        <input type="checkbox" name="newMovies" checked>
                        New movie alerts
                    </label>
                </div>
                
                <p class="email-disclaimer">No spam, unsubscribe anytime.</p>
                
                <div class="email-success hidden">
                    <div class="success-icon">✅</div>
                    <h3>You're In!</h3>
                    <p>Check your email to confirm your subscription.</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.popup);
        
        // Event listeners
        this.popup.querySelector('.email-popup-overlay').addEventListener('click', () => this.hidePopup());
        this.popup.querySelector('.email-popup-close').addEventListener('click', () => this.hidePopup());
        this.popup.querySelector('.email-popup-form').addEventListener('submit', (e) => this.handlePopupSubmit(e));
    }
    
    createFooterForm() {
        // Find footer or create container
        const footer = document.querySelector('footer') || document.querySelector('.footer');
        if (!footer) return;
        
        // Check if newsletter section already exists
        if (footer.querySelector('.newsletter-section')) return;
        
        const newsletterSection = document.createElement('div');
        newsletterSection.className = 'newsletter-section';
        newsletterSection.innerHTML = `
            <div class="newsletter-container">
                <div class="newsletter-text">
                    <h3>📧 Stay Updated</h3>
                    <p>Subscribe to get notifications about new Luganda movies</p>
                </div>
                <form class="newsletter-form">
                    <input type="email" name="email" placeholder="Your email address" required>
                    <button type="submit">Subscribe</button>
                </form>
            </div>
        `;
        
        // Insert at the beginning of footer
        footer.insertBefore(newsletterSection, footer.firstChild);
        
        // Event listener
        newsletterSection.querySelector('.newsletter-form').addEventListener('submit', (e) => this.handleFooterSubmit(e));
    }
    
    checkPopupTrigger() {
        // Don't show on admin pages
        if (window.location.pathname.includes('admin')) return;
        
        // Check cooldown
        const lastShown = localStorage.getItem('emailPopupLastShown');
        if (lastShown) {
            const timeSince = Date.now() - parseInt(lastShown);
            if (timeSince < this.options.popupCooldown) return;
        }
        
        // Check if already subscribed
        if (localStorage.getItem('emailSubscribed')) return;
        
        // Show popup after delay
        setTimeout(() => {
            this.showPopup();
        }, this.options.showPopupDelay);
        
        // Also trigger on scroll (50% down the page)
        let scrollTriggered = false;
        window.addEventListener('scroll', () => {
            if (scrollTriggered) return;
            
            const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > 50) {
                scrollTriggered = true;
                setTimeout(() => this.showPopup(), 2000);
            }
        });
    }
    
    showPopup() {
        if (localStorage.getItem('emailSubscribed')) return;
        
        this.popup.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Record showing
        localStorage.setItem('emailPopupLastShown', Date.now().toString());
        
        // Track
        if (typeof gtag === 'function') {
            gtag('event', 'email_popup_shown');
        }
    }
    
    hidePopup() {
        this.popup.classList.add('hidden');
        document.body.style.overflow = '';
    }
    
    async handlePopupSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('input[name="email"]').value;
        const weeklyDigest = form.querySelector('input[name="weeklyDigest"]').checked;
        const newMovies = form.querySelector('input[name="newMovies"]').checked;
        
        await this.subscribe(email, { weeklyDigest, newMovies }, 'popup', form);
    }
    
    async handleFooterSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('input[name="email"]').value;
        
        await this.subscribe(email, { weeklyDigest: true, newMovies: true }, 'footer', form);
    }
    
    async subscribe(email, preferences, source, form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text') || submitBtn;
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Show loading
        if (btnLoading) {
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        }
        submitBtn.disabled = true;
        
        try {
            const response = await fetch(`${this.options.apiEndpoint}/api/email/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    preferences,
                    source
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                // Mark as subscribed
                localStorage.setItem('emailSubscribed', 'true');
                localStorage.setItem('subscribedEmail', email);
                
                // Show success
                if (source === 'popup') {
                    form.classList.add('hidden');
                    form.parentElement.querySelector('.email-preferences').classList.add('hidden');
                    form.parentElement.querySelector('.email-disclaimer').classList.add('hidden');
                    form.parentElement.querySelector('.email-success').classList.remove('hidden');
                    
                    // Auto-close after 3 seconds
                    setTimeout(() => this.hidePopup(), 3000);
                } else {
                    // Footer form success
                    form.innerHTML = '<p class="newsletter-success">✅ Subscribed! Check your email.</p>';
                }
                
                // Track
                if (typeof gtag === 'function') {
                    gtag('event', 'email_subscribed', {
                        'source': source
                    });
                }
            } else {
                throw new Error(data.message);
            }
            
        } catch (error) {
            // Show error toast
            this.showToast(error.message || 'Failed to subscribe. Please try again.', 'error');
        } finally {
            // Reset button
            if (btnLoading) {
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
            }
            submitBtn.disabled = false;
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `email-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    addStyles() {
        if (document.getElementById('email-subscription-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'email-subscription-styles';
        style.textContent = `
            /* Popup Styles */
            .email-popup {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .email-popup.hidden {
                display: none;
            }
            .email-popup-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
            }
            .email-popup-content {
                position: relative;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 420px;
                width: 100%;
                text-align: center;
                animation: popupSlide 0.4s ease;
                border: 1px solid rgba(102, 187, 106, 0.2);
            }
            @keyframes popupSlide {
                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .email-popup-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: #888;
                font-size: 28px;
                cursor: pointer;
                transition: color 0.2s;
            }
            .email-popup-close:hover {
                color: #fff;
            }
            .email-popup-icon {
                font-size: 48px;
                margin-bottom: 15px;
            }
            .email-popup-content h2 {
                color: #fff;
                margin: 0 0 10px;
                font-size: 24px;
            }
            .email-popup-content p {
                color: #aaa;
                margin: 0 0 25px;
            }
            .email-popup-form {
                display: flex;
                gap: 10px;
                margin-bottom: 15px;
            }
            .email-popup-form input {
                flex: 1;
                padding: 14px 18px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                color: #fff;
                font-size: 15px;
            }
            .email-popup-form input::placeholder {
                color: #888;
            }
            .email-popup-form input:focus {
                outline: none;
                border-color: #66BB6A;
            }
            .email-popup-form button {
                padding: 14px 24px;
                background: linear-gradient(135deg, #66BB6A, #4CAF50);
                border: none;
                border-radius: 10px;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s, box-shadow 0.2s;
                white-space: nowrap;
            }
            .email-popup-form button:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(102, 187, 106, 0.4);
            }
            .email-popup-form button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
            .email-preferences {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-bottom: 15px;
            }
            .email-preferences label {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #888;
                font-size: 13px;
                cursor: pointer;
            }
            .email-preferences input[type="checkbox"] {
                accent-color: #66BB6A;
            }
            .email-disclaimer {
                font-size: 12px;
                color: #666;
            }
            .email-success {
                padding: 20px 0;
            }
            .email-success .success-icon {
                font-size: 48px;
                margin-bottom: 10px;
            }
            .email-success h3 {
                color: #66BB6A;
                margin: 0 0 10px;
            }
            .email-success p {
                margin: 0;
            }
            
            /* Newsletter Footer Styles */
            .newsletter-section {
                background: linear-gradient(135deg, rgba(102, 187, 106, 0.1), rgba(76, 175, 80, 0.05));
                padding: 30px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .newsletter-container {
                max-width: 800px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 20px;
            }
            .newsletter-text h3 {
                color: #fff;
                margin: 0 0 5px;
                font-size: 18px;
            }
            .newsletter-text p {
                color: #888;
                margin: 0;
                font-size: 14px;
            }
            .newsletter-form {
                display: flex;
                gap: 10px;
            }
            .newsletter-form input {
                padding: 12px 16px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                min-width: 250px;
            }
            .newsletter-form input::placeholder {
                color: #888;
            }
            .newsletter-form input:focus {
                outline: none;
                border-color: #66BB6A;
            }
            .newsletter-form button {
                padding: 12px 24px;
                background: #66BB6A;
                border: none;
                border-radius: 8px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .newsletter-form button:hover {
                background: #4CAF50;
            }
            .newsletter-success {
                color: #66BB6A;
                font-size: 14px;
                margin: 0;
            }
            
            /* Toast */
            .email-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                padding: 12px 24px;
                background: #333;
                color: #fff;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10002;
                transition: transform 0.3s;
            }
            .email-toast.show {
                transform: translateX(-50%) translateY(0);
            }
            .email-toast.error {
                background: #dc3545;
            }
            .email-toast.success {
                background: #66BB6A;
            }
            
            .hidden {
                display: none !important;
            }
            
            @media (max-width: 600px) {
                .email-popup-content {
                    padding: 30px 20px;
                }
                .email-popup-form {
                    flex-direction: column;
                }
                .email-preferences {
                    flex-direction: column;
                    gap: 10px;
                }
                .newsletter-container {
                    flex-direction: column;
                    text-align: center;
                }
                .newsletter-form {
                    flex-direction: column;
                    width: 100%;
                }
                .newsletter-form input {
                    min-width: auto;
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    // Don't show on admin pages
    if (!window.location.pathname.includes('admin')) {
        setTimeout(() => {
            window.emailSubscription = new EmailSubscription();
        }, 1000);
    }
});

// Export
window.EmailSubscription = EmailSubscription;
