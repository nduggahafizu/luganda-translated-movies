const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

// CORS middleware for all routes - Dynamic origin support
const setCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    // Allow requests from unrulymovies.com, netlify.app, railway.app, and localhost
    const allowedOrigins = [
        'https://watch.unrulymovies.com',
        'https://unrulymovies.com',
        'https://translatedmovies.netlify.app',
        'http://localhost:3000',
        'http://localhost:5000'
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.includes('netlify.app') || origin.includes('unrulymovies.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// GET /api/luganda-movies/latest - Get latest movies
router.get('/latest', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published' }).sort({ createdAt: -1 }).limit(limit);
        res.json({ status: 'success', data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching latest movies:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch latest movies' });
    }
});

// GET /api/luganda-movies/trending - Get trending movies by views
router.get('/trending', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published' })
            .sort({ views: -1, 'rating.userRating': -1 })
            .limit(limit);
        res.json({ status: 'success', data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch trending movies' });
    }
});

// GET /api/luganda-movies/featured - Get featured movies
router.get('/featured', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published', featured: true })
            .sort({ createdAt: -1 })
            .limit(limit);
        res.json({ status: 'success', data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching featured movies:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch featured movies' });
    }
});

// GET /api/luganda-movies/genres - Get all unique genres
router.get('/genres', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const genres = await LugandaMovie.distinct('genres');
        res.json({ status: 'success', data: genres.filter(g => g) });
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch genres' });
    }
});

// GET /api/luganda-movies/genre/:genre - Get movies by genre
router.get('/genre/:genre', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 20;
        const genre = req.params.genre.toLowerCase();
        const movies = await LugandaMovie.find({ 
            status: 'published',
            genres: { $regex: new RegExp(genre, 'i') }
        }).sort({ createdAt: -1 }).limit(limit);
        res.json({ status: 'success', data: movies, count: movies.length, genre });
    } catch (error) {
        console.error('Error fetching movies by genre:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch movies by genre' });
    }
});

// GET /api/luganda-movies/vjs - Get all VJ translators
router.get('/vjs', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const vjs = await LugandaMovie.aggregate([
            { $match: { status: 'published' } },
            { $group: { 
                _id: '$vjName', 
                movieCount: { $sum: 1 },
                totalViews: { $sum: '$views' },
                avgRating: { $avg: '$rating.userRating' }
            }},
            { $sort: { movieCount: -1 } }
        ]);
        res.json({ status: 'success', data: vjs.filter(v => v._id) });
    } catch (error) {
        console.error('Error fetching VJs:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch VJs' });
    }
});

// GET /api/luganda-movies/vj/:vjName - Get movies by VJ
router.get('/vj/:vjName', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 20;
        const vjName = decodeURIComponent(req.params.vjName);
        const movies = await LugandaMovie.find({ 
            status: 'published',
            vjName: { $regex: new RegExp(vjName, 'i') }
        }).sort({ createdAt: -1 }).limit(limit);
        res.json({ status: 'success', data: movies, count: movies.length, vjName });
    } catch (error) {
        console.error('Error fetching movies by VJ:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch movies by VJ' });
    }
});

// GET /api/luganda-movies/search - Search movies
router.get('/search', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { q, genre, vj, year, limit: limitParam } = req.query;
        const limit = parseInt(limitParam) || 20;
        
        let query = { status: 'published' };
        
        if (q) {
            query.$or = [
                { originalTitle: { $regex: q, $options: 'i' } },
                { lugandaTitle: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }
        if (genre) query.genres = { $regex: new RegExp(genre, 'i') };
        if (vj) query.vjName = { $regex: new RegExp(vj, 'i') };
        if (year) query.year = parseInt(year);
        
        const movies = await LugandaMovie.find(query).sort({ createdAt: -1 }).limit(limit);
        res.json({ status: 'success', data: movies, count: movies.length });
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ status: 'error', message: 'Failed to search movies' });
    }
});

// GET /api/luganda-movies/:id - Get single movie by ID (MUST be last route with dynamic param)
router.get('/:id', async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const { id } = req.params;
        
        // Check if it's a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid movie ID format'
            });
        }
        
        const movie = await LugandaMovie.findById(id);
        
        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Movie not found'
            });
        }
        
        // Increment view count
        await movie.incrementViews();
        
        res.json({
            status: 'success',
            data: movie
        });
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch movie'
        });
    }
});

module.exports = router;
