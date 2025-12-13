const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

/**
 * @route   GET /api/movies/fetch
 * @desc    Fetch movies with pagination (MyVJ-style)
 * @access  Public
 * @query   page, limit, category, vj, sort
 */
router.get('/fetch', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 18;
        const skip = (page - 1) * limit;
        
        // Build query
        let query = {};
        
        // Filter by category/genre
        if (req.query.category && req.query.category !== 'recently-updated') {
            query.genres = { $in: [req.query.category] };
        }
        
        // Filter by VJ
        if (req.query.vj) {
            query.vjName = req.query.vj;
        }
        
        // Filter by quality
        if (req.query.quality) {
            query['video.quality'] = req.query.quality;
        }
        
        // Search
        if (req.query.search) {
            query.$or = [
                { originalTitle: { $regex: req.query.search, $options: 'i' } },
                { lugandaTitle: { $regex: req.query.search, $options: 'i' } },
                { vjName: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        // Sorting
        let sort = { createdAt: -1 }; // Default: latest
        if (req.query.sort === 'popular') {
            sort = { views: -1 };
        } else if (req.query.sort === 'rating') {
            sort = { 'rating.translationRating': -1 };
        } else if (req.query.sort === 'title') {
            sort = { originalTitle: 1 };
        }
        
        // Fetch movies
        const movies = await LugandaMovie.find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-__v');
        
        // Get total count for pagination
        const total = await LugandaMovie.countDocuments(query);
        
        // Format response (MyVJ-style)
        const formattedMovies = movies.map(movie => ({
            row_id: movie._id,
            title: movie.originalTitle,
            luganda_title: movie.lugandaTitle,
            slug: movie.slug,
            vj: movie.vjName,
            vj_slug: movie.vjSlug,
            tmdb_poster_path: movie.poster.replace('https://image.tmdb.org/t/p/w500/', ''),
            poster_url: movie.poster,
            trailer: movie.video.trailerUrl || '',
            height: movie.video.resolution?.height || 1080,
            quality: movie.video.quality,
            watch_percentage: 0, // Will be updated from user's watch history
            categories: movie.genres.join(', '),
            rating: movie.rating.translationRating,
            year: movie.year,
            duration: movie.duration,
            views: movie.views
        }));
        
        res.json({
            success: true,
            movies: formattedMovies,
            pagination: {
                page: page,
                limit: limit,
                total: total,
                pages: Math.ceil(total / limit),
                hasMore: page < Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch movies',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/movies/:id
 * @desc    Get single movie details
 * @access  Public
 */
router.get('/:id', async (req, res) => {
    try {
        const movie = await LugandaMovie.findById(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                error: 'Movie not found'
            });
        }
        
        // Increment view count
        movie.views += 1;
        await movie.save();
        
        res.json({
            success: true,
            movie: movie
        });
        
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch movie',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/movies/trending/now
 * @desc    Get trending movies
 * @access  Public
 */
router.get('/trending/now', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get movies with highest views in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const movies = await LugandaMovie.find({
            createdAt: { $gte: sevenDaysAgo }
        })
        .sort({ views: -1 })
        .limit(limit)
        .select('-__v');
        
        res.json({
            success: true,
            movies: movies
        });
        
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending movies'
        });
    }
});

module.exports = router;
