/* ===================================
   Luganda Movies API Client
   =================================== */

const LugandaMoviesAPI = (function() {
    'use strict';

    // API Base URL
    const API_BASE_URL = 'http://localhost:5000/api/luganda-movies';

    // Helper function for API calls
    async function apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
            return await apiCall(`/trending?limit=${limit}`);
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
    {
        _id: '1',
        originalTitle: 'Fast & Furious 9',
        lugandaTitle: '',
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
        featured: true,
        trending: true
    },
    {
        _id: '2',
        originalTitle: 'Black Panther',
        lugandaTitle: '',
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
        featured: true,
        trending: true
    },
    {
        _id: '3',
        originalTitle: 'Spider-Man: No Way Home',
        lugandaTitle: '',
        vjName: 'VJ Junior',
        year: 2021,
        genres: ['action', 'adventure', 'sci-fi'],
        rating: {
            imdb: 8.2,
            userRating: 8.9,
            translationRating: 4.7
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg',
        description: 'With Spider-Man\'s identity now revealed, Peter asks Doctor Strange for help.',
        vjId: 'vj-junior',
        translationQuality: 4.7,
        views: 32100,
        featured: true,
        trending: true
    },
    {
        _id: '4',
        originalTitle: 'John Wick 4',
        lugandaTitle: '',
        vjName: 'VJ Ice P',
        year: 2023,
        genres: ['action', 'thriller'],
        rating: {
            imdb: 7.8,
            userRating: 8.5,
            translationRating: 4.6
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
        description: 'John Wick uncovers a path to defeating The High Table.',
        vjId: 'vj-ice-p',
        translationQuality: 4.6,
        views: 19800,
        featured: false,
        trending: true
    },
    {
        _id: '5',
        originalTitle: 'Avatar: The Way of Water',
        lugandaTitle: '',
        vjName: 'VJ Emmy',
        year: 2022,
        genres: ['sci-fi', 'adventure'],
        rating: {
            imdb: 7.6,
            userRating: 8.1,
            translationRating: 4.4
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        description: 'Jake Sully and Ney\'tiri have formed a family and are doing everything to stay together.',
        vjId: 'vj-emmy',
        translationQuality: 4.4,
        views: 25600,
        featured: true,
        trending: false
    },
    {
        _id: '6',
        originalTitle: 'The Equalizer 3',
        lugandaTitle: '',
        vjName: 'VJ Junior',
        year: 2023,
        genres: ['action', 'thriller'],
        rating: {
            imdb: 6.8,
            userRating: 7.8,
            translationRating: 4.5
        },
        video: {
            quality: 'hd'
        },
        poster: 'https://image.tmdb.org/t/p/w500/b0Ej6fnXAP8fK75hlyi2jKqdhHz.jpg',
        description: 'Robert McCall finds himself at home in Southern Italy but discovers his friends are under the control of local crime bosses.',
        vjId: 'vj-junior',
        translationQuality: 4.5,
        views: 14200,
        featured: false,
        trending: true
    },
    {
        _id: '7',
        originalTitle: 'Guardians of the Galaxy Vol. 3',
        lugandaTitle: '',
        vjName: 'VJ Ice P',
        year: 2023,
        genres: ['action', 'adventure', 'sci-fi'],
        rating: {
            imdb: 7.9,
            userRating: 8.3,
            translationRating: 4.6
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg',
        description: 'Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe.',
        vjId: 'vj-ice-p',
        translationQuality: 4.6,
        views: 21500,
        featured: false,
        trending: true
    },
    {
        _id: '8',
        originalTitle: 'Mission: Impossible - Dead Reckoning',
        lugandaTitle: '',
        vjName: 'VJ Emmy',
        year: 2023,
        genres: ['action', 'thriller'],
        rating: {
            imdb: 7.7,
            userRating: 8.0,
            translationRating: 4.7
        },
        video: {
            quality: '4k'
        },
        poster: 'https://image.tmdb.org/t/p/w500/NNxYkU70HPurnNCSiCjYAmacwm.jpg',
        description: 'Ethan Hunt and his IMF team must track down a terrifying new weapon.',
        vjId: 'vj-emmy',
        translationQuality: 4.7,
        views: 18900,
        featured: true,
        trending: true
    }
];

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LugandaMoviesAPI, SAMPLE_LUGANDA_MOVIES };
}
