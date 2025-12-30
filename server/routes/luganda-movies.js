const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

// GET /api/luganda-movies/latest
router.get('/latest', async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://watch.unrulymovies.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({}).sort({ createdAt: -1 }).limit(limit);
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

module.exports = router;
