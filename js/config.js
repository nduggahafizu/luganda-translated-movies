/**
 * Centralized API Configuration
 * Automatically detects environment and uses appropriate backend URL
 */

// Disable console.log in production to hide API URLs
(function() {
    const hostname = window.location.hostname;
    const isProd = hostname.includes('netlify.app') || 
                   hostname.includes('translatedmovies') ||
                   hostname === 'unrulymovies.com' || 
                   hostname === 'www.unrulymovies.com' ||
                   hostname === 'watch.unrulymovies.com';
    if (isProd) {
        const noop = function() {};
        window.console.log = noop;
        window.console.debug = noop;
        window.console.info = noop;
        // Keep console.warn and console.error for real issues
    }
})();

const API_CONFIG = (function() {
    'use strict';

    // Detect environment
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const isProduction = hostname === 'watch.unrulymovies.com' ||
                        hostname === 'unrulymovies.com' ||
                        hostname === 'www.unrulymovies.com' ||
                        hostname.includes('netlify.app'); // Include Netlify previews as production
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Backend URLs
    // Production uses empty string so all requests go to /api/* on the same domain.
    // Netlify proxies /api/* → Railway, so the Railway URL never appears in DevTools.
    const PRODUCTION_API_URL = '';
    const DEVELOPMENT_API_URL = 'http://localhost:5000'; // Use local server for development

    // Allow forcing production API when running the frontend locally.
    // Example: http://localhost:3000/test-push.html?api=prod
    const params = new URLSearchParams(window.location.search);
    const apiParam = (params.get('api') || '').toLowerCase();
    const apiBaseParam = params.get('apiBase');
    const apiBaseOverride = apiBaseParam || localStorage.getItem('API_BASE_OVERRIDE');

    // Select appropriate URL based on environment
    let BASE_URL = isLocalhost ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;
    if (apiParam === 'prod' || apiParam === 'production') {
        BASE_URL = PRODUCTION_API_URL;
    }
    if (apiBaseOverride && typeof apiBaseOverride === 'string') {
        BASE_URL = apiBaseOverride;
    }

    // Retry configuration
    const RETRY_CONFIG = {
        maxRetries: 3,
        retryDelay: 1000, // 1 second
        backoffMultiplier: 2
    };

    // Fetch with retry and timeout
    async function fetchWithRetry(url, options = {}, retries = RETRY_CONFIG.maxRetries) {
        const timeout = options.timeout || 15000; // 15 second default timeout
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok && response.status >= 500 && retries > 0) {
                // Server error - retry
                const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxRetries - retries);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(url, options, retries - 1);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                console.warn(`Request timeout: ${url}`);
            }
            
            if (retries > 0) {
                const delay = RETRY_CONFIG.retryDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxRetries - retries);
                console.log(`Retrying in ${delay}ms... (${retries} retries left)`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(url, options, retries - 1);
            }
            
            throw error;
        }
    }

    // Pre-warm the backend on page load
    function warmupBackend() {
        // Don't attempt network warmup from file:// (origin null)
        if (protocol !== 'https:' && protocol !== 'http:') return;
        fetch(`${BASE_URL}/api/health`, { 
            method: 'GET',
            cache: 'no-store'
        }).catch(() => {});
    }

    // Warm up backend immediately
    if (typeof window !== 'undefined') {
        warmupBackend();
    }

    return {
        // Base API URL
        BASE_URL: BASE_URL,
        
        // API endpoints
        API_ENDPOINTS: {
            AUTH: `${BASE_URL}/api/auth`,
            LUGANDA_MOVIES: `${BASE_URL}/api/luganda-movies`,
            MOVIES: `${BASE_URL}/api/movies`,
            TMDB: `${BASE_URL}/api/tmdb`,
            PAYMENTS: `${BASE_URL}/api/payments`,
            VJS: `${BASE_URL}/api/vjs`,
            WATCH_PROGRESS: `${BASE_URL}/api/watch-progress`,
            PLAYLIST: `${BASE_URL}/api/playlist`,
            HEALTH: `${BASE_URL}/api/health`
        },

        // Environment info
        ENVIRONMENT: {
            isProduction: isProduction,
            isLocalhost: isLocalhost,
            hostname: hostname
        },

        // Google OAuth Client ID
        GOOGLE_CLIENT_ID: '573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com',

        // Helper method to get full API URL
        getApiUrl: function(endpoint) {
            return `${BASE_URL}${endpoint}`;
        },

        // Fetch with retry
        fetch: fetchWithRetry,

        // Warm up backend
        warmup: warmupBackend,

        // Log configuration (only in development)
        logConfig: function() {
            if (!isProduction) {
                console.log('🔧 API Configuration:', {
                    environment: isProduction ? 'PRODUCTION' : 'DEVELOPMENT',
                    baseUrl: BASE_URL,
                    hostname: hostname
                });
            }
        }
    };
})();

// Log configuration on load (development only)
API_CONFIG.logConfig();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = API_CONFIG;
}

// Ensure the main service worker is registered on all pages that load config.js.
// This avoids having multiple SW scripts fighting for the same scope and ensures
// push notifications are handled by the same SW that owns the PushSubscription.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Service workers require http(s); file:// will throw SecurityError.
        if (window.location.protocol === 'https:' || window.location.protocol === 'http:') {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    });
}

// --- Android app install banner (slim bottom bar, Android web only) ---------
// Shows a dismissible "Get the app" bar to Android visitors, sitting just above
// the mobile bottom nav. Never shows inside the installed app, and remembers a
// dismissal. Wrapped so it can never break the page.
(function () {
    try {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        if (!/Android/i.test(navigator.userAgent || '')) return;
        // Keep the sign-in and sign-up screens free of extra bars
        if (/\/(login|register)(\.html)?$/i.test(location.pathname)) return;

        var inApp = (document.referrer || '').indexOf('android-app://com.unruly.pix') === 0
            || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
        if (inApp) return;

        try {
            var until = parseInt(localStorage.getItem('unrulyAppBannerDismissed') || '0', 10);
            if (until && Date.now() < until) return;
        } catch (e) {}

        var STORE = 'https://play.google.com/store/apps/details?id=com.unruly.pix';

        function build() {
            if (document.getElementById('unruly-app-banner') || !document.body) return;

            // Sit just above the floating bottom nav. The gap is worked out from the
            // nav's own CSS position and height, not from the window height, so it
            // stays right when the phone's address bar slides away, the screen
            // rotates, or the nav appears after this runs. (offsetParent is always
            // null for position:fixed elements, so it can't test visibility.)
            function navOffset() {
                var nav = document.querySelector('.app-bottom-nav');
                if (!nav) return 0;
                var cs = getComputedStyle(nav);
                if (cs.display === 'none' || !nav.offsetHeight) return 0;
                return Math.round((parseFloat(cs.bottom) || 0) + nav.offsetHeight + 8);
            }
            var offset = navOffset();
            function hiddenTransform() { return 'translateY(calc(100% + ' + offset + 'px))'; }

            var bar = document.createElement('div');
            bar.id = 'unruly-app-banner';
            bar.setAttribute('role', 'region');
            bar.setAttribute('aria-label', 'Get the Unruly Movies Android app');
            bar.style.cssText = [
                'position:fixed', 'z-index:2147482000',
                'display:flex', 'align-items:center', 'gap:10px',
                'padding:10px 12px', 'box-sizing:border-box',
                'background:#15171c',
                'box-shadow:0 -6px 20px rgba(0,0,0,0.45)', 'color:#fff', 'font-family:inherit',
                'transform:' + hiddenTransform(), 'transition:transform .35s ease, bottom .2s ease'
            ].join(';');

            function place() {
                offset = navOffset();
                var floating = offset > 0;
                bar.style.left = bar.style.right = (floating ? 10 : 0) + 'px';
                bar.style.bottom = offset + 'px';
                bar.style.borderRadius = (floating ? 14 : 0) + 'px';
                bar.style.border = floating ? '1px solid rgba(255,255,255,0.12)' : '0';
                bar.style.borderTop = '1px solid rgba(255,255,255,0.12)';
            }
            place();
            bar.innerHTML =
                '<img src="/assets/images/icons/icon-192x192.png" alt="" width="40" height="40" style="border-radius:9px;flex:0 0 auto" onerror="this.style.display=\'none\'">' +
                '<div style="flex:1 1 auto;min-width:0;line-height:1.25">' +
                  '<div style="font-weight:700;font-size:14px">Unruly Movies app</div>' +
                  '<div style="font-size:12px;color:#b9c0cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Faster streaming &amp; downloads on your phone</div>' +
                '</div>' +
                '<a href="' + STORE + '" target="_blank" rel="noopener" id="unrulyAppInstall" ' +
                  'style="flex:0 0 auto;background:#4ade80;color:#04140a;font-weight:700;font-size:13px;text-decoration:none;padding:9px 16px;border-radius:8px">Install</a>' +
                '<button type="button" id="unrulyAppClose" aria-label="Dismiss" ' +
                  'style="flex:0 0 auto;background:transparent;border:0;color:#9aa3af;font-size:22px;line-height:1;padding:4px 6px;cursor:pointer">&times;</button>';
            document.body.appendChild(bar);
            requestAnimationFrame(function () { bar.style.transform = 'translateY(0)'; });

            // Lift the chat button above the banner while it shows (a style rule,
            // so it applies even if the chat widget is created after this).
            var lift = document.createElement('style');
            lift.id = 'unruly-app-banner-lift';
            lift.textContent = '#chat-widget{transform:translateY(-' + (bar.offsetHeight + 8) + 'px);transition:transform .35s ease}';
            document.head.appendChild(lift);

            // Leave room at the bottom of the page so the banner doesn't cover
            // the last bit of content (e.g. the footer's copyright line).
            var originalPad = document.body.style.paddingBottom;
            var basePad = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
            function reserveSpace() {
                document.body.style.paddingBottom = (basePad + bar.offsetHeight + 8) + 'px';
            }
            reserveSpace();

            var resizeTimer;
            function onResize() {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () { place(); reserveSpace(); }, 150);
            }
            window.addEventListener('resize', onResize);
            window.addEventListener('orientationchange', onResize);

            function dismiss(days) {
                window.removeEventListener('resize', onResize);
                window.removeEventListener('orientationchange', onResize);
                bar.style.transform = hiddenTransform();
                lift.textContent = '#chat-widget{transform:none;transition:transform .35s ease}';
                document.body.style.paddingBottom = originalPad;
                try { localStorage.setItem('unrulyAppBannerDismissed', String(Date.now() + days * 86400000)); } catch (e) {}
                setTimeout(function () {
                    if (bar.parentNode) bar.parentNode.removeChild(bar);
                    if (lift.parentNode) lift.parentNode.removeChild(lift);
                }, 350);
            }
            document.getElementById('unrulyAppClose').addEventListener('click', function () { dismiss(7); });
            document.getElementById('unrulyAppInstall').addEventListener('click', function () { dismiss(30); });
        }

        if (document.readyState === 'complete') build();
        else window.addEventListener('load', build);
    } catch (e) { /* a banner must never break the page */ }
})();
