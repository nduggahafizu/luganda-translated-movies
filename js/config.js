/**
 * Configuration file for Luganda Movies
 * Automatically detects environment and uses appropriate API URLs
 */

const Config = (function() {
    'use strict';

    // Detect environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname === '';

    const isNetlify = window.location.hostname.includes('netlify.app') ||
                     window.location.hostname.includes('netlify.com');

    // API Configuration
    const API_CONFIG = {
        // Backend API URL
        BACKEND_URL: isLocalhost 
            ? 'http://localhost:5000'
            : 'https://luganda-translated-movies-production.up.railway.app', // Railway backend URL

        // Google OAuth Client ID
        GOOGLE_CLIENT_ID: '573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com',

        // TMDB Configuration
        TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p',
        TMDB_POSTER_SIZE: 'w500',
        TMDB_BACKDROP_SIZE: 'original',

        // Environment
        ENVIRONMENT: isLocalhost ? 'development' : 'production',
        IS_LOCALHOST: isLocalhost,
        IS_NETLIFY: isNetlify,

        // Feature Flags
        ENABLE_GOOGLE_AUTH: true,
        ENABLE_OFFLINE_MODE: true, // Work without backend
        ENABLE_SAMPLE_DATA: true,  // Use sample data as fallback

        // Timeouts
        API_TIMEOUT: 10000, // 10 seconds
        
        // Pagination
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    };

    // Get full API URL
    function getApiUrl(endpoint = '') {
        const baseUrl = `${API_CONFIG.BACKEND_URL}/api`;
        return endpoint ? `${baseUrl}${endpoint}` : baseUrl;
    }

    // Get TMDB image URL
    function getTmdbImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${API_CONFIG.TMDB_IMAGE_BASE}/${size}${path}`;
    }

    // Check if backend is available
    async function checkBackendAvailability() {
        try {
            const response = await fetch(getApiUrl('/health'), {
                method: 'GET',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn('Backend not available:', error.message);
            return false;
        }
    }

    // Log configuration on load
    console.log('🔧 Luganda Movies Configuration:');
    console.log('   Environment:', API_CONFIG.ENVIRONMENT);
    console.log('   Backend URL:', API_CONFIG.BACKEND_URL);
    console.log('   Hostname:', window.location.hostname);
    console.log('   Is Localhost:', API_CONFIG.IS_LOCALHOST);
    console.log('   Is Netlify:', API_CONFIG.IS_NETLIFY);

    // Public API
    return {
        // Configuration
        ...API_CONFIG,
        
        // Helper functions
        getApiUrl,
        getTmdbImageUrl,
        checkBackendAvailability,

        // Convenience getters
        get authUrl() {
            return getApiUrl('/auth');
        },
        get moviesUrl() {
            return getApiUrl('/luganda-movies');
        },
        get vjsUrl() {
            return getApiUrl('/vjs');
        }
    };
})();

// Make Config available globally
window.Config = Config;
