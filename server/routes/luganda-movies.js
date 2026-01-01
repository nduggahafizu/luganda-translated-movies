const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

// CORS middleware for all routes
const setCorsHeaders = (res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://watch.unrulymovies.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// GET /api/luganda-movies/latest - Get latest movies (MUST come before /:id)
router.get('/latest', async (req, res) => {
    setCorsHeaders(res);

    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published' }).sort({ createdAt: -1 }).limit(limit);
        res.json({
            status: 'success',
            data: movies,
            count: movies.length
        });
    } catch (error) {
        console.error('Error fetching latest movies:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch latest movies'
        });
    }
});

// GET /api/luganda-movies/:id - Get single movie by ID
router.get('/:id', async (req, res) => {
    setCorsHeaders(res);
    
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
        movie.viewCount = (movie.viewCount || 0) + 1;
        await movie.save();
        
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
