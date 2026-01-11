/**
 * Centralized API Configuration
 * Automatically detects environment and uses appropriate backend URL
 */

const API_CONFIG = (function() {
    'use strict';

    // Detect environment
    const hostname = window.location.hostname;
    const isProduction = hostname === 'watch.unrulymovies.com' ||
                        hostname === 'unrulymovies.com' ||
                        hostname.includes('netlify.app'); // Include Netlify previews as production
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Backend URLs
    const PRODUCTION_API_URL = 'https://luganda-translated-movies-production.up.railway.app';
    const DEVELOPMENT_API_URL = 'http://localhost:5000'; // Use local server for development

    // Select appropriate URL based on environment
    const BASE_URL = isLocalhost ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

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
