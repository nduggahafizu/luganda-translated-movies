const express = require('express');
const router = express.Router();
const tmdbService = require('../services/tmdbService');

/**
 * TMDB Proxy API Routes
 * Secure proxy to hide API keys from frontend
 * All TMDB requests go through backend
 */

// Search movies
router.get('/search/movies', async (req, res) => {
    try {
        const { query, page, year } = req.query;
        
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                error: 'Search query is required' 
            });
        }
        
        const results = await tmdbService.searchMovies(query, page, year);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Search movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search movies' 
        });
    }
});

// Get popular movies
router.get('/movies/popular', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const results = await tmdbService.getPopularMovies(page);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Get popular movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch popular movies' 
        });
    }
});

// Get trending movies
router.get('/movies/trending', async (req, res) => {
    try {
        const { timeWindow = 'week', page = 1 } = req.query;
        const results = await tmdbService.getTrendingMovies(timeWindow, page);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Get trending movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch trending movies' 
        });
    }
});

// Get top rated movies
router.get('/movies/top-rated', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const results = await tmdbService.getTopRatedMovies(page);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Get top rated movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch top rated movies' 
        });
    }
});

// Get now playing movies
router.get('/movies/now-playing', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const results = await tmdbService.getNowPlayingMovies(page);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Get now playing movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch now playing movies' 
        });
    }
});

// Get upcoming movies
router.get('/movies/upcoming', async (req, res) => {
    try {
        const { page = 1 } = req.query;
        const results = await tmdbService.getUpcomingMovies(page);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Get upcoming movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch upcoming movies' 
        });
    }
});

// Get movie details
router.get('/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await tmdbService.getMovieDetails(id);
        res.json({ success: true, data: movie });
    } catch (error) {
        console.error('Get movie details error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch movie details' 
        });
    }
});

// Get movie credits
router.get('/movie/:id/credits', async (req, res) => {
    try {
        const { id } = req.params;
        const credits = await tmdbService.getMovieCredits(id);
        res.json({ success: true, data: credits });
    } catch (error) {
        console.error('Get movie credits error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch movie credits' 
        });
    }
});

// Get movie videos
router.get('/movie/:id/videos', async (req, res) => {
    try {
        const { id } = req.params;
        const videos = await tmdbService.getMovieVideos(id);
        res.json({ success: true, data: videos });
    } catch (error) {
        console.error('Get movie videos error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch movie videos' 
        });
    }
});

// Get movie images
router.get('/movie/:id/images', async (req, res) => {
    try {
        const { id } = req.params;
        const images = await tmdbService.getMovieImages(id);
        res.json({ success: true, data: images });
    } catch (error) {
        console.error('Get movie images error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch movie images' 
        });
    }
});

// Get similar movies
router.get('/movie/:id/similar', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1 } = req.query;
        const similar = await tmdbService.getSimilarMovies(id, page);
        res.json({ success: true, data: similar });
    } catch (error) {
        console.error('Get similar movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch similar movies' 
        });
    }
});

// Get movie recommendations
router.get('/movie/:id/recommendations', async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1 } = req.query;
        const recommendations = await tmdbService.getMovieRecommendations(id, page);
        res.json({ success: true, data: recommendations });
    } catch (error) {
        console.error('Get movie recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch movie recommendations' 
        });
    }
});

// Get genres
router.get('/genres', async (req, res) => {
    try {
        const genres = await tmdbService.getGenres();
        res.json({ success: true, data: genres });
    } catch (error) {
        console.error('Get genres error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch genres' 
        });
    }
});

// Get movies by genre
router.get('/movies/genre/:genreId', async (req, res) => {
    try {
        const { genreId } = req.params;
        const { page = 1 } = req.query;
        const movies = await tmdbService.getMoviesByGenre(genreId, page);
        res.json({ success: true, data: movies });
    } catch (error) {
        console.error('Get movies by genre error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch movies by genre' 
        });
    }
});

// Discover movies with filters
router.post('/movies/discover', async (req, res) => {
    try {
        const filters = req.body;
        const movies = await tmdbService.discoverMovies(filters);
        res.json({ success: true, data: movies });
    } catch (error) {
        console.error('Discover movies error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to discover movies' 
        });
    }
});

// Get person details
router.get('/person/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const person = await tmdbService.getPersonDetails(id);
        res.json({ success: true, data: person });
    } catch (error) {
        console.error('Get person details error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch person details' 
        });
    }
});

// Search people
router.get('/search/people', async (req, res) => {
    try {
        const { query, page = 1 } = req.query;
        
        if (!query) {
            return res.status(400).json({ 
                success: false, 
                error: 'Search query is required' 
            });
        }
        
        const results = await tmdbService.searchPeople(query, page);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error('Search people error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to search people' 
        });
    }
});

// Get image URL helper
router.get('/image-url', (req, res) => {
    try {
        const { path, size = 'original' } = req.query;
        
        if (!path) {
            return res.status(400).json({ 
                success: false, 
                error: 'Image path is required' 
            });
        }
        
        const url = tmdbService.getImageUrl(path, size);
        res.json({ success: true, data: { url } });
    } catch (error) {
        console.error('Get image URL error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate image URL' 
        });
    }
});

// Cache statistics (admin only)
router.get('/cache/stats', (req, res) => {
    try {
        const stats = tmdbService.getCacheStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Get cache stats error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch cache stats' 
        });
    }
});

// Clear cache (admin only)
router.post('/cache/clear', (req, res) => {
    try {
        tmdbService.clearCache();
        res.json({ success: true, message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Clear cache error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to clear cache' 
        });
    }
});

module.exports = router;
