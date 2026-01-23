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
                        hostname.includes('netlify.app'); // Include Netlify previews as production
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Backend URLs
    const PRODUCTION_API_URL = 'https://luganda-translated-movies-production.up.railway.app';
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
