/**
 * Cookie Consent Banner
 * GDPR & AdSense Compliant
 * Add this script to all pages
 */

(function() {
    'use strict';
    
    const COOKIE_NAME = 'unruly_cookie_consent';
    const COOKIE_EXPIRY_DAYS = 365;
    
    // Check if user has already consented
    function hasConsented() {
        return localStorage.getItem(COOKIE_NAME) === 'accepted';
    }
    
    // Set consent cookie
    function setConsent(value) {
        localStorage.setItem(COOKIE_NAME, value);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + COOKIE_EXPIRY_DAYS);
        document.cookie = `${COOKIE_NAME}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    }
    
    // Create and show banner
    function showCookieBanner() {
        if (hasConsented()) return;
        
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-consent-content">
                <div class="cookie-icon">🍪</div>
                <div class="cookie-text">
                    <strong>We use cookies</strong>
                    <p>We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                    <a href="/cookies.html" target="_blank">Learn more</a></p>
                </div>
                <div class="cookie-actions">
                    <button class="cookie-btn cookie-btn-secondary" onclick="window.cookieConsent.reject()">Reject</button>
                    <button class="cookie-btn cookie-btn-primary" onclick="window.cookieConsent.accept()">Accept All</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Add styles
        if (!document.getElementById('cookie-consent-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cookie-consent-styles';
            styles.textContent = `
                #cookie-consent-banner {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
                    border-top: 2px solid #7CFC00;
                    padding: 20px;
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
                    z-index: 999999;
                    animation: slideUp 0.4s ease;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .cookie-consent-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                
                .cookie-icon {
                    font-size: 2.5rem;
                    flex-shrink: 0;
                }
                
                .cookie-text {
                    flex: 1;
                    min-width: 250px;
                }
                
                .cookie-text strong {
                    color: #fff;
                    font-size: 1.1rem;
                    display: block;
                    margin-bottom: 5px;
                }
                
                .cookie-text p {
                    color: #aaa;
                    margin: 0;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .cookie-text a {
                    color: #7CFC00;
                    text-decoration: underline;
                }
                
                .cookie-text a:hover {
                    color: #9dff44;
                }
                
                .cookie-actions {
                    display: flex;
                    gap: 10px;
                    flex-shrink: 0;
                }
                
                .cookie-btn {
                    padding: 10px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    white-space: nowrap;
                }
                
                .cookie-btn-primary {
                    background: #7CFC00;
                    color: #000;
                }
                
                .cookie-btn-primary:hover {
                    background: #9dff44;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(124, 252, 0, 0.3);
                }
                
                .cookie-btn-secondary {
                    background: transparent;
                    color: #aaa;
                    border: 1px solid #444;
                }
                
                .cookie-btn-secondary:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border-color: #666;
                }
                
                @media (max-width: 768px) {
                    #cookie-consent-banner {
                        padding: 15px;
                    }
                    
                    .cookie-consent-content {
                        flex-direction: column;
                        text-align: center;
                    }
                    
                    .cookie-actions {
                        width: 100%;
                        flex-direction: column;
                    }
                    
                    .cookie-btn {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    // Accept cookies
    function acceptCookies() {
        setConsent('accepted');
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.4s ease';
            setTimeout(() => banner.remove(), 400);
        }
        
        // Initialize tracking after consent
        initializeTracking();
    }
    
    // Reject cookies
    function rejectCookies() {
        setConsent('rejected');
        const banner = document.getElementById('cookie-consent-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.4s ease';
            setTimeout(() => banner.remove(), 400);
        }
        
        // Disable non-essential cookies
        disableTracking();
    }
    
    // Initialize tracking (GA4, AdSense)
    function initializeTracking() {
        // Google Analytics will already be loaded, just ensure it's active
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'granted',
                'ad_storage': 'granted',
                'ad_user_data': 'granted',
                'ad_personalization': 'granted'
            });
        }
    }
    
    // Disable tracking
    function disableTracking() {
        if (typeof gtag === 'function') {
            gtag('consent', 'update', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied'
            });
        }
        
        // Disable AdSense personalization
        window['adsbygoogle'] = window['adsbygoogle'] || [];
        window['adsbygoogle'].requestNonPersonalizedAds = 1;
    }
    
    // Slide down animation
    const slideDownKeyframes = `
        @keyframes slideDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }
    `;
    
    // Public API
    window.cookieConsent = {
        accept: acceptCookies,
        reject: rejectCookies,
        show: showCookieBanner
    };
    
    // Show banner on page load if not consented
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showCookieBanner);
    } else {
        showCookieBanner();
    }
    
    // If user already consented, initialize tracking
    if (hasConsented()) {
        initializeTracking();
    }
    
})();
