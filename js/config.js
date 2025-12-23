/**
 * Centralized API Configuration
 * Automatically detects environment and uses appropriate backend URL
 */

const API_CONFIG = (function() {
    'use strict';

    // Detect environment
    const hostname = window.location.hostname;
    const isProduction = hostname === 'watch.unrulymovies.com' || hostname === 'unrulymovies.com';
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // Backend URLs
    const PRODUCTION_API_URL = 'https://luganda-translated-movies-production.up.railway.app';
    const DEVELOPMENT_API_URL = 'http://localhost:5000';

    // Select appropriate URL based on environment
    const BASE_URL = isProduction ? PRODUCTION_API_URL : DEVELOPMENT_API_URL;

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
