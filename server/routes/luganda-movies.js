const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');
const ViewStats = require('../models/ViewStats');
const crypto = require('crypto');
const axios = require('axios');
const { memCache, clearMemoryCache } = require('../middleware/cache');
const { protect } = require('../middleware/auth');

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

// Import Expo push service for mobile notifications
let expoPushNotifyNewMovie;
try {
    const expoPushService = require('../services/expoPushService');
    expoPushNotifyNewMovie = expoPushService.notifyNewMovie;
} catch (err) {
    console.warn('Expo push service not available:', err.message);
    expoPushNotifyNewMovie = async () => ({ success: false });
}

// CORS middleware for all routes - Dynamic origin support
const setCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    // Allow requests from unrulymovies.com, netlify.app, railway.app, and localhost
    const allowedOrigins = [
        'https://watch.unrulymovies.com',
        'https://unrulymovies.com',
        'https://www.unrulymovies.com',
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

// Set cache headers for public data (movies list)
const setCacheHeaders = (res, maxAge = 30) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=60`);
};

// Helper to generate slug
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Helper: sanitize movie objects for public responses.
const sanitizeMovieForPublic = (movie) => {
    if (!movie) return movie;
    const movieObj = typeof movie.toObject === 'function' ? movie.toObject() : { ...movie };
    return movieObj;
};

const sanitizeMoviesForPublic = (movies) => {
    if (!Array.isArray(movies)) return movies;
    return movies.map(sanitizeMovieForPublic);
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
            forYou,
            tmdbId,
            trailer
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
            forYou: forYou || false,
            status: 'published',
            metaData: tmdbId ? { tmdbId: parseInt(tmdbId) } : {},
            trailer: trailer || null
        };

        const newMovie = await LugandaMovie.create(movieData);

        // Clear cache so new movie shows immediately
        clearMemoryCache('/api/luganda-movies');

        // Send notifications to users about the new movie
        try {
            await notifyNewMovie(newMovie);
            await notifyVjFollowers(newMovie, vjName);
            // Send push notification to mobile app users
            await expoPushNotifyNewMovie(newMovie);
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

// ============================================================
// TV SERIES IMPORT ROUTES
// ============================================================

// Import TMDB service for TV series
const tmdbService = require('../services/tmdbService');

// POST /api/luganda-movies/import-series - Import complete TV series from TMDB
router.post('/import-series', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { tmdbId, vjName, lugandaTitle } = req.body;

        console.log('[IMPORT-SERIES] Starting import, tmdbId:', tmdbId);

        if (!tmdbId) {
            return res.status(400).json({ 
                success: false, 
                message: 'TMDB ID is required' 
            });
        }

        // Check if series already exists
        const existingSeries = await LugandaMovie.findOne({ 
            'metaData.tmdbId': tmdbId.toString(),
            contentType: 'series'
        });
        
        if (existingSeries) {
            console.log('[IMPORT-SERIES] Series already exists:', existingSeries.originalTitle);
            return res.status(400).json({ 
                success: false, 
                message: `This series "${existingSeries.originalTitle}" has already been imported. Check your TV Series Management.`
            });
        }

        // Check if TMDB API key is configured
        if (!process.env.TMDB_API_KEY) {
            console.error('[IMPORT-SERIES] TMDB_API_KEY not configured');
            return res.status(500).json({ 
                success: false, 
                message: 'TMDB API key not configured. Please add TMDB_API_KEY to environment variables.' 
            });
        }

        console.log('[IMPORT-SERIES] Fetching from TMDB...');

        // Fetch complete series data from TMDB
        const seriesData = await tmdbService.getTVSeriesComplete(tmdbId);

        if (!seriesData) {
            return res.status(404).json({ 
                success: false, 
                message: 'TV series not found on TMDB' 
            });
        }

        console.log('[IMPORT-SERIES] Series data fetched:', seriesData.originalTitle, 'Genres:', seriesData.genres);

        // Customize data if provided
        if (vjName) {
            seriesData.vjName = vjName;
        }
        if (lugandaTitle) {
            seriesData.lugandaTitle = lugandaTitle;
        }

        // Generate slug
        seriesData.slug = generateSlug(seriesData.originalTitle) + '-series-' + Date.now();

        // Save to database
        console.log('[IMPORT-SERIES] Saving to database...');
        const newSeries = await LugandaMovie.create(seriesData);
        console.log('[IMPORT-SERIES] Series saved:', newSeries._id);

        // Send push notification to mobile app users
        try {
            await expoPushNotifyNewMovie(newSeries);
        } catch (notifyError) {
            console.error('Expo push notification error (non-blocking):', notifyError.message);
        }

        res.status(201).json({ 
            success: true, 
            message: `TV series "${newSeries.originalTitle}" imported with ${newSeries.totalSeasons} seasons and ${newSeries.totalEpisodes} episodes!`,
            data: newSeries 
        });
    } catch (error) {
        console.error('[IMPORT-SERIES] Error:', error.message, error.stack);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to import TV series';
        if (error.message.includes('ENOTFOUND') || error.message.includes('network')) {
            errorMessage = 'Network error - cannot connect to TMDB. Check your internet connection.';
        } else if (error.message.includes('duplicate key') || error.code === 11000) {
            errorMessage = 'This series already exists in the database.';
        } else if (error.message.includes('validation')) {
            errorMessage = 'Data validation error: ' + error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        res.status(500).json({ 
            success: false, 
            message: errorMessage,
            details: error.message 
        });
    }
});

// POST /api/luganda-movies/search-series - Search for TV series on TMDB
router.post('/search-series', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { query, year } = req.body;

        if (!query) {
            return res.status(400).json({ 
                success: false, 
                message: 'Search query is required' 
            });
        }

        // Check if TMDB API key is configured
        if (!process.env.TMDB_API_KEY) {
            return res.status(500).json({ 
                success: false, 
                message: 'TMDB API key not configured. Please add TMDB_API_KEY to environment variables.' 
            });
        }

        console.log('Searching TMDB for:', query, year);
        const results = await tmdbService.searchTVShows(query, 1, year);

        // Format results for frontend
        const formattedResults = (results.results || []).slice(0, 10).map(show => ({
            tmdbId: show.id,
            title: show.name || show.original_name,
            year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : null,
            poster: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : null,
            overview: show.overview,
            rating: show.vote_average
        }));

        console.log('Found', formattedResults.length, 'series results');
        res.json({ 
            success: true, 
            count: formattedResults.length,
            data: formattedResults 
        });
    } catch (error) {
        console.error('Error searching TV series:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to search TV series', 
            details: error.message 
        });
    }
});

// GET /api/luganda-movies/series/:id - Get a series with all seasons/episodes
// PROTECTED: Requires authentication to view series
router.get('/series/:id', protect, async (req, res) => {
    setCorsHeaders(req, res);
    try {
        let series;
        
        // Check if it's a MongoDB ID or slug
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            series = await LugandaMovie.findOne({ _id: req.params.id, contentType: 'series' });
        } else {
            series = await LugandaMovie.findOne({ slug: req.params.id, contentType: 'series' });
        }

        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'TV series not found'
            });
        }

        // Increment views
        series.views = (series.views || 0) + 1;
        await series.save();

        res.json({
            success: true,
            data: series
        });
    } catch (error) {
        console.error('Error fetching series:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch series',
            details: error.message
        });
    }
});

// PUT /api/luganda-movies/series/:id/episode - Update a specific episode video URL
router.put('/series/:id/episode', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { seasonNumber, episodeNumber, embedUrl, vjName, isTranslated } = req.body;

        if (!seasonNumber || !episodeNumber) {
            return res.status(400).json({
                success: false,
                message: 'Season number and episode number are required'
            });
        }

        const series = await LugandaMovie.findById(req.params.id);

        if (!series || series.contentType !== 'series') {
            return res.status(404).json({
                success: false,
                message: 'TV series not found'
            });
        }

        // Find the season
        const season = series.seasons.find(s => s.seasonNumber === parseInt(seasonNumber));
        if (!season) {
            return res.status(404).json({
                success: false,
                message: `Season ${seasonNumber} not found`
            });
        }

        // Find the episode
        const episode = season.episodes.find(e => e.episodeNumber === parseInt(episodeNumber));
        if (!episode) {
            return res.status(404).json({
                success: false,
                message: `Episode ${episodeNumber} not found in Season ${seasonNumber}`
            });
        }

        // Update episode data
        if (embedUrl) {
            episode.video = {
                embedUrl: embedUrl,
                streamtapeId: '',
                archiveUrl: '',
                provider: 'streamtape'
            };
        }
        if (vjName !== undefined) episode.vjName = vjName;
        if (isTranslated !== undefined) episode.isTranslated = isTranslated;

        await series.save();

        res.json({
            success: true,
            message: `Episode S${seasonNumber}E${episodeNumber} updated successfully`,
            data: series
        });
    } catch (error) {
        console.error('Error updating episode:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update episode',
            details: error.message
        });
    }
});

// GET /api/luganda-movies/all-series - Get all TV series
router.get('/all-series', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const series = await LugandaMovie.find({ contentType: 'series', status: 'published' })
            .sort('-createdAt')
            .skip(skip)
            .limit(limit)
            .select('originalTitle lugandaTitle poster totalSeasons totalEpisodes rating genres year slug');

        const total = await LugandaMovie.countDocuments({ contentType: 'series', status: 'published' });

        res.json({
            success: true,
            count: series.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: series
        });
    } catch (error) {
        console.error('Error fetching series:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch series',
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
            // Send push notification to mobile app users
            await expoPushNotifyNewMovie(newMovie);
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
            // Send push notification to mobile app users
            await expoPushNotifyNewMovie(newMovie);
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
        
        const query = {};
        
        // Handle status filter - 'all' returns everything, otherwise filter by status
        if (req.query.status === 'all') {
            // No status filter - return all
        } else if (req.query.status) {
            query.status = req.query.status;
        } else {
            // Default to published only for public requests
            query.status = 'published';
        }
        
        // Filter by contentType if provided (movie or series)
        if (req.query.contentType) {
            query.contentType = req.query.contentType;
        }
        
        const [movies, total] = await Promise.all([
            LugandaMovie.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            LugandaMovie.countDocuments(query)
        ]);

        const isAdminLikeRequest = req.query.status === 'all';
        
        res.json({
            success: true,
            data: isAdminLikeRequest ? movies : sanitizeMoviesForPublic(movies),
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
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
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
        
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('Error fetching new releases:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch new releases' });
    }
});

// GET /api/luganda-movies/latest - Get latest movies (CACHED for 30 seconds)
router.get('/latest', memCache(30), async (req, res) => {
    setCorsHeaders(req, res);
    setCacheHeaders(res, 30);
    try {
        const limit = parseInt(req.query.limit) || 10;
        // Use lean() for faster queries (returns plain JS objects)
        const movies = await LugandaMovie.find({ status: 'published' })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-__v') // Exclude version key
            .lean();
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('[LATEST] Error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch latest movies', error: error.message });
    }
});

// GET /api/luganda-movies/trending - Get trending movies (CACHED for 60 seconds)
router.get('/trending', memCache(60), async (req, res) => {
    setCorsHeaders(req, res);
    setCacheHeaders(res, 60);
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Only return movies explicitly marked as trending by admin
        const movies = await LugandaMovie.find({ 
            status: 'published',
            trending: true
        })
        .sort({ updatedAt: -1, views: -1 })
        .limit(limit)
        .select('-__v')
        .lean();
        
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch trending movies' });
    }
});

// GET /api/luganda-movies/featured - Get featured movies (CACHED for 60 seconds)
router.get('/featured', memCache(60), async (req, res) => {
    setCorsHeaders(req, res);
    setCacheHeaders(res, 60);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published', featured: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('-__v')
            .lean();
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('Error fetching featured movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch featured movies' });
    }
});

// GET /api/luganda-movies/todays-picks - Get today's picks (CACHED for 60 seconds)
router.get('/todays-picks', memCache(60), async (req, res) => {
    setCorsHeaders(req, res);
    setCacheHeaders(res, 60);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published', todaysPicks: true })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .select('-__v')
            .lean();
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('Error fetching today\'s picks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch today\'s picks' });
    }
});

// GET /api/luganda-movies/for-you - Get "For You" recommendations (CACHED for 60 seconds)
router.get('/for-you', memCache(60), async (req, res) => {
    setCorsHeaders(req, res);
    setCacheHeaders(res, 60);
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.find({ status: 'published', forYou: true })
            .sort({ views: -1, createdAt: -1 })
            .limit(limit)
            .select('-__v')
            .lean();
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('Error fetching for-you movies:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch for-you movies' });
    }
});

// GET /api/luganda-movies/series - Get all TV series (auto-synced by contentType)
router.get('/series', memCache(60), async (req, res) => {
    setCorsHeaders(req, res);
    setCacheHeaders(res, 60);
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const [series, total] = await Promise.all([
            LugandaMovie.find({ 
                status: 'published', 
                contentType: 'series' 
            })
            .sort({ updatedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v')
            .lean(),
            LugandaMovie.countDocuments({ status: 'published', contentType: 'series' })
        ]);
        
        res.json({ 
            success: true, 
            data: sanitizeMoviesForPublic(series), 
            count: series.length,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching series:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch series' });
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
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length, genre });
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
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length, vjName });
    } catch (error) {
        console.error('Error fetching movies by VJ:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch movies by VJ' });
    }
});

// GET /api/luganda-movies/search - Search movies
router.get('/search', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { q, genre, vj, year, sort, limit: limitParam } = req.query;
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

        let sortOption = { createdAt: -1 };
        if (sort === 'popular') sortOption = { views: -1 };
        else if (sort === 'rating') sortOption = { 'rating.userRating': -1 };
        else if (sort === 'title') sortOption = { originalTitle: 1 };
        else if (sort === 'year') sortOption = { year: -1 };

        const movies = await LugandaMovie.find(query).sort(sortOption).limit(limit);
        res.json({ success: true, data: sanitizeMoviesForPublic(movies), count: movies.length });
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ success: false, message: 'Failed to search movies' });
    }
});

// GET /api/luganda-movies/:id - Get single movie by ID (MUST be last route with dynamic param)
// PUBLIC: Anyone can view movie details
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

        // Build a response-safe object (avoid leaking Archive.org direct URLs)
        const movieObj = movie.toObject();

        const clean = (v) => (typeof v === 'string' ? v.trim().replace(/\s+/g, '') : v);
        const urlCandidates = [
            clean(movieObj?.video?.originalVideoPath),
            clean(movieObj?.video?.embedUrl),
            clean(movieObj?.embedUrl),
            clean(movieObj?.video?.url)
        ].filter(Boolean);

        const isArchiveSource = urlCandidates.some(u =>
            u.includes('archive.org/') || /ia\d+\.us\.archive\.org/i.test(u)
        );

        const extractArchiveItemId = (u) => {
            const s = clean(u);
            if (!s) return null;
            const embedMatch = s.match(/archive\.org\/embed\/([^/?#]+)/i);
            if (embedMatch) return embedMatch[1];
            const detailsMatch = s.match(/archive\.org\/details\/([^/?#]+)/i);
            if (detailsMatch) return detailsMatch[1];
            const downloadMatch = s.match(/archive\.org\/download\/([^/?#]+)/i);
            if (downloadMatch) return downloadMatch[1];
            const cdnMatch = s.match(/\/items\/([^/?#]+)/i);
            if (cdnMatch) return cdnMatch[1];
            return null;
        };

        if (isArchiveSource) {
            if (!movieObj.video) movieObj.video = {};
            movieObj.video.provider = 'archive';
            movieObj.video.secureStreamPath = `/api/video/stream/luganda/${movieObj._id}`;
            movieObj.video.archiveItemId = extractArchiveItemId(urlCandidates[0] || '') || null;

            // Strip raw Archive URLs from the public response
            delete movieObj.embedUrl;
            if (movieObj.video) {
                delete movieObj.video.originalVideoPath;
                delete movieObj.video.embedUrl;
                delete movieObj.video.url;
            }
        }
        
        res.json({
            success: true,
            data: movieObj
        });
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch movie'
        });
    }
});

// POST /api/luganda-movies/:id/like - Like/unlike a movie
router.post('/:id/like', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { id } = req.params;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid movie ID format' });
        }
        
        const movie = await LugandaMovie.findById(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        
        // Increment likes count
        movie.likes = (movie.likes || 0) + 1;
        await movie.save();
        
        // Clear cache
        clearMemoryCache();
        
        res.json({
            success: true,
            message: 'Movie liked',
            data: { likes: movie.likes }
        });
    } catch (error) {
        console.error('Error liking movie:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to like movie'
        });
    }
});

// POST /api/luganda-movies/:id/view - Increment view count from the player
router.post('/:id/view', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { id } = req.params;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid movie ID format' });
        }

        const movie = await LugandaMovie.findById(id);
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }

        movie.views = (movie.views || 0) + 1;
        await movie.save();

        // Write to ViewStats for analytics
        const viewerData = req.ip + (req.headers['user-agent'] || '');
        const viewerId = crypto.createHash('sha256').update(viewerData).digest('hex').substring(0, 16);
        await ViewStats.recordView(id, viewerId, 0, false);

        res.json({
            success: true,
            message: 'View counted',
            data: { views: movie.views }
        });
    } catch (error) {
        console.error('Error counting view:', error);
        res.status(500).json({ success: false, message: 'Failed to count view' });
    }
});

// PATCH /api/luganda-movies/:id - Quick update (toggle trending, featured, todaysPicks, forYou)
router.patch('/:id', async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const { id } = req.params;
        
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid movie ID format' });
        }
        
        const updateData = {};
        const body = req.body;
        
        // Handle both naming conventions (isTrending/trending, isFeatured/featured)
        if (body.trending !== undefined) updateData.trending = body.trending;
        if (body.isTrending !== undefined) updateData.trending = body.isTrending;
        if (body.featured !== undefined) updateData.featured = body.featured;
        if (body.isFeatured !== undefined) updateData.featured = body.isFeatured;
        if (body.todaysPicks !== undefined) updateData.todaysPicks = body.todaysPicks;
        if (body.isTodaysPicks !== undefined) updateData.todaysPicks = body.isTodaysPicks;
        if (body.forYou !== undefined) updateData.forYou = body.forYou;
        if (body.isForYou !== undefined) updateData.forYou = body.isForYou;
        
        // Also allow updating status
        if (body.status) updateData.status = body.status;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }
        
        const movie = await LugandaMovie.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!movie) {
            return res.status(404).json({ success: false, message: 'Movie not found' });
        }
        
        res.json({
            success: true,
            message: 'Movie updated successfully',
            data: movie
        });
    } catch (error) {
        console.error('PATCH movie error:', error);
        res.status(500).json({ success: false, message: error.message });
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
            trending,
            forYou,
            status,
            requiredPlan,
            trailer
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
        if (forYou !== undefined) updateData.forYou = forYou;
        if (status) updateData.status = status;
        if (requiredPlan) updateData.requiredPlan = requiredPlan;
        if (trailer !== undefined) updateData.trailer = trailer;
        
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
