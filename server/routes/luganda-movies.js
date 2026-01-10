const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');
const axios = require('axios');

// Import notification service (optional - won't break if not available)
let notifyNewMovie, notifyVjFollowers;
try {
    const notificationService = require('../utils/notificationService');
    notifyNewMovie = notificationService.notifyNewMovie;
    notifyVjFollowers = notificationService.notifyVjFollowers;
} catch (err) {
    console.warn('Notification service not available:', err.message);
    notifyNewMovie = async () => ({ success: false });
    notifyVjFollowers = async () => ({ success: false });
}

// CORS middleware for all routes - Dynamic origin support
const setCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    // Allow requests from unrulymovies.com, netlify.app, railway.app, and localhost
    const allowedOrigins = [
        'https://watch.unrulymovies.com',
        'https://unrulymovies.com',
        'https://translatedmovies.netlify.app',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:8000'
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

// Helper to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Valid genres for the model
const VALID_GENRES = ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'animation', 'fantasy', 'documentary', 'crime', 'mystery', 'adventure', 'family', 'war', 'history', 'western', 'music', 'tv movie', 'science fiction', 'other'];

// Map TMDB genres to valid genres
const mapGenres = (genres) => {
    if (!genres || !Array.isArray(genres)) return ['action'];
    
    const mapped = genres
        .map(g => g.toLowerCase().trim())
        .filter(g => VALID_GENRES.includes(g));
    
    return mapped.length > 0 ? mapped : ['action'];
};

// POST /api/luganda-movies/simple-add - Simple add movie with embed URL (Admin Dashboard)
router.post('/simple-add', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const {
            originalTitle,
            lugandaTitle,
            vjName,
            year,
            duration,
            description,
            overview,
            director,
            poster,
            backdrop,
            genres,
            embedUrl,
            featured,
            trending,
            tmdbId
        } = req.body;

        // Validate required fields
        if (!originalTitle || !vjName || !embedUrl) {
            return res.status(400).json({ 
                success: false, 
                message: 'Required fields: originalTitle, vjName, embedUrl' 
            });
        }

        // Create movie with minimal required fields, using defaults for others
        const movieData = {
            originalTitle,
            lugandaTitle: lugandaTitle || originalTitle,
            slug: generateSlug(originalTitle) + '-' + Date.now(),
            vjName,
            year: year || new Date().getFullYear(),
            duration: duration || 120,
            description: description || overview || 'No description available.',
            director: director || 'Unknown',
            poster: poster || '/assets/images/placeholder.svg',
            backdrop: backdrop || null,
            genres: mapGenres(genres),
            video: {
                originalVideoPath: embedUrl, // Use embedUrl as path
                embedUrl: embedUrl,
                provider: 'streamtape',
                quality: 'hd',
                format: 'mp4'
            },
            featured: featured || false,
            trending: trending || false,
            status: 'published',
            metaData: tmdbId ? { tmdbId: parseInt(tmdbId) } : {}
        };

        const newMovie = await LugandaMovie.create(movieData);

        // Send notifications to users about the new movie
        try {
            await notifyNewMovie(newMovie);
            await notifyVjFollowers(newMovie, vjName);
        } catch (notifyError) {
            console.error('Notification error (non-blocking):', notifyError.message);
        }

        res.status(201).json({ 
            success: true, 
            message: 'Movie added successfully!',
            data: newMovie 
        });
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add movie', 
            details: error.message 
        });
    }
});

// POST /api/luganda-movies/auto-add - Auto-add a movie using TMDB and S3
router.post('/auto-add', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const {
            originalTitle,
            year,
            vjName,
            duration,
            genres,
            videoKey,
            director
        } = req.body;

        // Fetch TMDB data
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(originalTitle)}&year=${year}`;
        const tmdbRes = await axios.get(tmdbUrl);
        let tmdbId = '', imdbId = '', poster = '', description = '';
        if (tmdbRes.data.results && tmdbRes.data.results.length > 0) {
            const movie = tmdbRes.data.results[0];
            tmdbId = movie.id;
            poster = movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : '';
            description = movie.overview || '';
        }

        // Create movie
        const newMovie = await LugandaMovie.create({
            originalTitle,
            vjName,
            year,
            duration,
            description,
            director,
            poster,
            genres,
            video: {
                originalVideoPath: `s3://${process.env.AWS_S3_BUCKET}/${videoKey}`,
                provider: 'aws',
                format: 'mp4',
                quality: 'hd'
            },
            metaData: {
                tmdbId,
                imdbId
            },
            status: 'published'
        });

        // Send notifications to users about the new movie
        try {
            await notifyNewMovie(newMovie);
            await notifyVjFollowers(newMovie, vjName);
        } catch (notifyError) {
            console.error('Notification error (non-blocking):', notifyError.message);
        }

        res.status(201).json({ status: 'success', data: newMovie });
    } catch (error) {
        console.error('Error auto-adding movie:', error);
        res.status(500).json({ status: 'error', message: 'Failed to auto-add movie', details: error.message });
    }
});
// POST /api/luganda-movies - Add a new Luganda movie (Admin only)
router.post('/', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        // Example: expects TMDB data, S3 video key, and other required fields in req.body
        const {
            originalTitle,
            lugandaTitle,
            vjName,
            year,
            duration,
            description,
            director,
            poster,
            genres,
            videoKey,
            tmdbId,
            imdbId
        } = req.body;

        // S3 video path
        const originalVideoPath = `s3://${process.env.AWS_S3_BUCKET}/${videoKey}`;

        const newMovie = await LugandaMovie.create({
            originalTitle,
            lugandaTitle,
            vjName,
            year,
            duration,
            description,
            director,
            poster,
            genres,
            video: {
                originalVideoPath,
                provider: 'aws',
                format: 'mp4',
                quality: 'hd'
            },
            metaData: {
                tmdbId,
                imdbId
            },
            status: 'published'
        });

        // Send notifications to users about the new movie
        try {
            await notifyNewMovie(newMovie);
            await notifyVjFollowers(newMovie, vjName);
        } catch (notifyError) {
            console.error('Notification error (non-blocking):', notifyError.message);
        }

        res.status(201).json({ status: 'success', data: newMovie });
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({ status: 'error', message: 'Failed to add movie', details: error.message });
    }
});

// GET /api/luganda-movies - Get all movies with pagination
router.get('/', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const query = { status: 'published' };
        
        const [movies, total] = await Promise.all([
            LugandaMovie.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            LugandaMovie.countDocuments(query)
        ]);
        
        res.json({
            success: true,
            data: movies,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch movies' });
    }
});

// GET /api/luganda-movies/all - Get all movies (alias)
router.get('/all', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 100;
        const movies = await LugandaMovie.find({ status: 'published' }).sort({ createdAt: -1 }).limit(limit);
        res.json({ success: true, data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching all movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch movies' });
    }
});

// GET /api/luganda-movies/stats - Get movie statistics
router.get('/stats', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const [totalMovies, totalVjs, genreStats, recentMovies] = await Promise.all([
            LugandaMovie.countDocuments({ status: 'published' }),
            LugandaMovie.distinct('vjName').then(vjs => vjs.filter(v => v).length),
            LugandaMovie.aggregate([
                { $match: { status: 'published' } },
                { $unwind: '$genres' },
                { $group: { _id: '$genres', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]),
            LugandaMovie.countDocuments({ 
                status: 'published',
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            })
        ]);
        
        const totalViews = await LugandaMovie.aggregate([
            { $match: { status: 'published' } },
            { $group: { _id: null, total: { $sum: '$views' } } }
        ]);
        
        res.json({
            success: true,
            data: {
                totalMovies,
                totalVjs,
                totalViews: totalViews[0]?.total || 0,
                recentMovies,
                topGenres: genreStats
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
});

// GET /api/luganda-movies/new-releases - Get new releases (last 30 days)
router.get('/new-releases', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 20;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const movies = await LugandaMovie.find({ 
            status: 'published',
            createdAt: { $gte: thirtyDaysAgo }
        }).sort({ createdAt: -1 }).limit(limit);
        
        res.json({ success: true, data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching new releases:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch new releases' });
    }
});

// GET /api/luganda-movies/latest - Get latest movies
router.get('/latest', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published' }).sort({ createdAt: -1 }).limit(limit);
        res.json({ success: true, data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching latest movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch latest movies' });
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
        res.json({ success: true, data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trending movies' });
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
        res.json({ success: true, data: movies, count: movies.length });
    } catch (error) {
        console.error('Error fetching featured movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured movies' });
    }
});

// GET /api/luganda-movies/genres - Get all unique genres
router.get('/genres', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const genres = await LugandaMovie.distinct('genres');
        res.json({ success: true, data: genres.filter(g => g) });
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch genres' });
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
        res.json({ success: true, data: movies, count: movies.length, genre });
    } catch (error) {
        console.error('Error fetching movies by genre:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch movies by genre' });
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
        res.json({ success: true, data: vjs.filter(v => v._id) });
    } catch (error) {
        console.error('Error fetching VJs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch VJs' });
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
        res.json({ success: true, data: movies, count: movies.length, vjName });
    } catch (error) {
        console.error('Error fetching movies by VJ:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch movies by VJ' });
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
        res.json({ success: true, data: movies, count: movies.length });
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ success: false, message: 'Failed to search movies' });
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
            success: true,
            data: movie
        });
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movie'
        });
    }
});

// PUT /api/luganda-movies/:id - Update a movie
router.put('/:id', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { id } = req.params;
        
        // Check if it's a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID format'
            });
        }
        
        const {
            originalTitle,
            lugandaTitle,
            vjName,
            year,
            duration,
            description,
            overview,
            director,
            poster,
            backdrop,
            genres,
            embedUrl,
            featured,
            trending
        } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        
        if (originalTitle) updateData.originalTitle = originalTitle;
        if (lugandaTitle !== undefined) updateData.lugandaTitle = lugandaTitle;
        if (vjName) updateData.vjName = vjName;
        if (year) updateData.year = parseInt(year);
        if (duration) updateData.duration = parseInt(duration);
        if (description) updateData.description = description;
        if (overview) updateData.description = overview;
        if (director) updateData.director = director;
        if (poster) updateData.poster = poster;
        if (backdrop !== undefined) updateData.backdrop = backdrop;
        if (genres) updateData.genres = mapGenres(genres);
        if (featured !== undefined) updateData.featured = featured;
        if (trending !== undefined) updateData.trending = trending;
        
        // Handle video/embed URL update
        if (embedUrl) {
            updateData.embedUrl = embedUrl;
            updateData['video.embedUrl'] = embedUrl;
            updateData['video.originalVideoPath'] = embedUrl;
        }
        
        const movie = await LugandaMovie.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Movie updated successfully!',
            data: movie
        });
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update movie',
            details: error.message
        });
    }
});

// DELETE /api/luganda-movies/:id - Delete a movie
router.delete('/:id', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { id } = req.params;
        
        // Check if it's a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid movie ID format'
            });
        }
        
        const movie = await LugandaMovie.findByIdAndDelete(id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Movie deleted successfully!',
            data: { id: movie._id, title: movie.originalTitle }
        });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete movie',
            details: error.message
        });
    }
});

module.exports = router;
