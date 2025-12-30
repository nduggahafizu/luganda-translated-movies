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
        }
    };
})();

// Sample Luganda movies data (for development/demo purposes)
const SAMPLE_LUGANDA_MOVIES = [
    // VJ Ice P Movies
    {
        _id: '1',
        originalTitle: 'Lokah',
        lugandaTitle: 'Lokah (Luganda)',
        vjName: 'VJ Ice P',
        year: 2023,
        genres: ['action', 'drama'],
        rating: {
            imdb: 7.5,
            userRating: 8.2,
            translationRating: 4.8
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
        description: 'An intense Indian action drama that follows the journey of a fearless protagonist.',
        vjId: 'vj-ice-p',
        translationQuality: 4.8,
        views: 25420,
        featured: true,
        trending: true
    },
    {
        _id: '2',
        originalTitle: 'Running Man',
        lugandaTitle: 'Running Man (Luganda)',
        vjName: 'VJ Ice P',
        year: 2013,
        genres: ['action', 'thriller'],
        rating: {
            imdb: 6.9,
            userRating: 7.8,
            translationRating: 4.7
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/jfINh7Wr6vWwNq5k0jZF6o5YpXA.jpg',
        description: 'A man wrongly accused of murder must run for his life while trying to prove his innocence.',
        vjId: 'vj-ice-p',
        translationQuality: 4.7,
        views: 18900,
        featured: true,
        trending: true
    },
    {
        _id: '3',
        originalTitle: 'Kantara',
        lugandaTitle: 'Kantara (Luganda)',
        vjName: 'VJ Ice P',
        year: 2022,
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.2,
            userRating: 8.9,
            translationRating: 4.9
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/8I37NtDffNV7AZlDa7uDvvqhovU.jpg',
        description: 'A legendary Indian film that explores the conflict between man and nature in a small village.',
        vjId: 'vj-ice-p',
        translationQuality: 4.9,
        views: 32100,
        featured: true,
        trending: true
    },
    {
        _id: '4',
        originalTitle: 'Frankenstein',
        lugandaTitle: 'Frankenstein (Luganda)',
        vjName: 'VJ Ice P',
        year: 2015,
        genres: ['horror', 'sci-fi', 'thriller'],
        rating: {
            imdb: 6.2,
            userRating: 7.1,
            translationRating: 4.5
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/4WnZkVlFxMkQ7XhGKFJPKPGVLqL.jpg',
        description: 'A modern retelling of Mary Shelley\'s classic tale of a scientist who creates a monster.',
        vjId: 'vj-ice-p',
        translationQuality: 4.5,
        views: 14200,
        featured: false,
        trending: true
    },
    {
        _id: '5',
        originalTitle: 'Predator: Badlands',
        lugandaTitle: 'Predator: Badlands (Luganda)',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'sci-fi', 'thriller'],
        rating: {
            imdb: 7.8,
            userRating: 8.3,
            translationRating: 4.6
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/sR0SpCrXamlIkw5qnbfth0p0aQi.jpg',
        description: 'The latest installment in the Predator franchise brings the hunt to the badlands.',
        vjId: 'vj-ice-p',
        translationQuality: 4.6,
        views: 28500,
        featured: true,
        trending: true
    },
    {
        _id: '6',
        originalTitle: 'Fist of Fury',
        lugandaTitle: 'Fist of Fury (Luganda)',
        vjName: 'VJ Ice P',
        year: 1972,
        genres: ['action', 'drama'],
        rating: {
            imdb: 7.3,
            userRating: 8.1,
            translationRating: 4.7
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/nJQFZPi9z8cAKmK4JMl4hGDhGd.jpg',
        description: 'Bruce Lee stars in this classic martial arts film about a student seeking revenge for his master\'s death.',
        vjId: 'vj-ice-p',
        translationQuality: 4.7,
        views: 21500,
        featured: false,
        trending: true
    },
    
    // VJ Soul Series
    {
        _id: '7',
        originalTitle: 'War Season 1',
        lugandaTitle: 'War Season 1 (Luganda)',
        vjName: 'VJ Soul',
        year: 2024,
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.1,
            userRating: 8.7,
            translationRating: 4.8
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        description: 'An epic war series that follows soldiers through intense battles and personal struggles. Season 1.',
        vjId: 'vj-soul',
        translationQuality: 4.8,
        views: 35600,
        featured: true,
        trending: true
    },
    {
        _id: '8',
        originalTitle: 'War Season 2',
        lugandaTitle: 'War Season 2 (Luganda)',
        vjName: 'VJ Soul',
        year: 2024,
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.3,
            userRating: 8.9,
            translationRating: 4.9
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        description: 'The war intensifies in Season 2 as alliances shift and new enemies emerge.',
        vjId: 'vj-soul',
        translationQuality: 4.9,
        views: 32400,
        featured: true,
        trending: true
    },
    {
        _id: '9',
        originalTitle: 'War Season 3',
        lugandaTitle: 'War Season 3 (Luganda)',
        vjName: 'VJ Soul',
        year: 2024,
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.4,
            userRating: 9.0,
            translationRating: 4.9
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        description: 'Season 3 brings the conflict to a climax with explosive action and emotional depth.',
        vjId: 'vj-soul',
        translationQuality: 4.9,
        views: 29800,
        featured: true,
        trending: true
    },
    {
        _id: '10',
        originalTitle: 'War Season 4',
        lugandaTitle: 'War Season 4 (Luganda)',
        vjName: 'VJ Soul',
        year: 2024,
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.5,
            userRating: 9.1,
            translationRating: 5.0
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        description: 'The epic conclusion to the War series. Season 4 delivers an unforgettable finale.',
        vjId: 'vj-soul',
        translationQuality: 5.0,
        views: 38900,
        featured: true,
        trending: true
    },
    
    // Additional Popular Movies
    {
        _id: '11',
        originalTitle: 'Fast & Furious 9',
        lugandaTitle: 'Fast & Furious 9 (Luganda)',
        vjName: 'VJ Junior',
        year: 2021,
        genres: ['action', 'thriller'],
        rating: {
            imdb: 5.2,
            userRating: 7.5,
            translationRating: 4.5
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/bOFaAXmWWXC3Rbv4u4uM9ZSzRXP.jpg',
        description: 'Dom and the crew must take on an international terrorist who turns out to be Dom\'s forsaken brother.',
        vjId: 'vj-junior',
        translationQuality: 4.5,
        views: 15420,
        featured: false,
        trending: false
    },
    {
        _id: '12',
        originalTitle: 'Black Panther',
        lugandaTitle: 'Black Panther (Luganda)',
        vjName: 'VJ Emmy',
        year: 2018,
        genres: ['action', 'adventure'],
        rating: {
            imdb: 7.3,
            userRating: 8.2,
            translationRating: 4.8
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg',
        description: 'T\'Challa returns home to the African nation of Wakanda to take his rightful place as king.',
        vjId: 'vj-emmy',
        translationQuality: 4.8,
        views: 28350,
        featured: false,
        trending: false
    }
];

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LugandaMoviesAPI, SAMPLE_LUGANDA_MOVIES };
}
