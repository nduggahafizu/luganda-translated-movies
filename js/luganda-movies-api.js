/* ===================================
   Luganda Movies API Client
   =================================== */

const LugandaMoviesAPI = (function() {
    'use strict';

    // API Base URL - Uses centralized config
    const API_BASE_URL = API_CONFIG.API_ENDPOINTS.LUGANDA_MOVIES;

    // Helper function for API calls
    async function apiCall(endpoint, options = {}) {
        try {
            // Remove trailing slash from API_BASE_URL and leading slash from endpoint to avoid double slashes
            const base = API_BASE_URL.replace(/\/$/, '');
            const path = endpoint.replace(/^\//, '');
            const url = `${base}/${path}`;
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    return {
        // Get all Luganda movies with filters
        getAllMovies: async function(params = {}) {
            const queryString = new URLSearchParams(params).toString();
            return await apiCall(`?${queryString}`);
        },

        // Get single movie by ID or slug
        getMovie: async function(id) {
            return await apiCall(`/${id}`);
        },

        // Search movies
        searchMovies: async function(query, filters = {}) {
            const params = { q: query, ...filters };
            const queryString = new URLSearchParams(params).toString();
            return await apiCall(`/search?${queryString}`);
        },

        // Get trending movies
        getTrending: async function(limit = 10) {
            // Fallback to latest since /trending does not exist in backend
            return await apiCall(`/latest?limit=${limit}`);
        },

        // Get featured movies
        getFeatured: async function(limit = 10) {
            return await apiCall(`/featured?limit=${limit}`);
        },

        // Get latest translations
        getLatest: async function(limit = 10) {
            return await apiCall(`/latest?limit=${limit}`);
        },

        // Get movies by VJ
        getByVJ: async function(vjName, limit = 20) {
            return await apiCall(`/vj/${encodeURIComponent(vjName)}?limit=${limit}`);
        },

        // Get all VJs
        getAllVJs: async function() {
            return await apiCall('/vjs');
        },

        // Rate movie
        rateMovie: async function(movieId, rating) {
            return await apiCall(`/${movieId}/rate`, {
                method: 'POST',
                body: JSON.stringify({ rating })
            });
        },

        // Rate translation quality
        rateTranslation: async function(movieId, rating) {
            return await apiCall(`/${movieId}/rate-translation`, {
                method: 'POST',
                body: JSON.stringify({ rating })
            });
        },

        // Get stream URL (requires authentication)
        getStreamUrl: async function(movieId) {
            return await apiCall(`/${movieId}/stream`);
        },

        // Admin: Create movie
        createMovie: async function(movieData) {
            return await apiCall('/', {
                method: 'POST',
                body: JSON.stringify(movieData)
            });
        },

        // Admin: Update movie
        updateMovie: async function(movieId, movieData) {
            return await apiCall(`/${movieId}`, {
                method: 'PUT',
                body: JSON.stringify(movieData)
            });
        },

        // Admin: Delete movie
        deleteMovie: async function(movieId) {
            return await apiCall(`/${movieId}`, {
                method: 'DELETE'
            });
        },

        // Get trending movies
        getTrending: async function(limit = 10) {
            return await apiCall(`/trending?limit=${limit}`);
        },

        // Get genres
        getGenres: async function() {
            return await apiCall('/genres');
        },

        // Get movies by genre
        getByGenre: async function(genre, limit = 20) {
            return await apiCall(`/genre/${encodeURIComponent(genre)}?limit=${limit}`);
        },

        // Get all VJs
        getAllVJs: async function() {
            return await apiCall('/vjs');
        }
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LugandaMoviesAPI };
}
