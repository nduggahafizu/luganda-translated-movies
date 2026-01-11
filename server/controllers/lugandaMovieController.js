const LugandaMovie = require('../models/LugandaMovie');
const { logger } = require('../middleware/logger');

// @desc    Get all Luganda movies
// @route   GET /api/luganda-movies
// @access  Public
exports.getAllMovies = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filters = { status: 'published' };

        // Apply filters
        if (req.query.genre) {
            filters.genres = req.query.genre;
        }
        if (req.query.year) {
            filters.year = parseInt(req.query.year);
        }
        if (req.query.quality) {
            filters['video.quality'] = req.query.quality;
        }
        if (req.query.vjName) {
            filters.vjName = { $regex: req.query.vjName, $options: 'i' };
        }
        if (req.query.minRating) {
            filters['rating.translationRating'] = { $gte: parseFloat(req.query.minRating) };
        }

        // Sorting
        let sortBy = '-translationDate'; // Default: newest first
        if (req.query.sort === 'popular') {
            sortBy = '-views';
        } else if (req.query.sort === 'rating') {
            sortBy = '-rating.userRating';
        } else if (req.query.sort === 'title') {
            sortBy = 'lugandaTitle';
        } else if (req.query.sort === 'translation-rating') {
            sortBy = '-rating.translationRating';
        }

        const movies = await LugandaMovie.find(filters)
            .sort(sortBy)
            .skip(skip)
            .limit(limit)
            .select('-video.originalVideoPath -video.lugandaVideoPath -video.lugandaAudioPath'); // Hide file paths from public

        const total = await LugandaMovie.countDocuments(filters);

        res.status(200).json({
            success: true,
            count: movies.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: movies
        });
    } catch (error) {
        logger.error('GetAllMovies error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get single Luganda movie by ID or slug
// @route   GET /api/luganda-movies/:id
// @access  Public
exports.getMovie = async (req, res) => {
    try {
        let movie;
        
        // Check if it's a MongoDB ID or slug
        if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            movie = await LugandaMovie.findById(req.params.id);
        } else {
            movie = await LugandaMovie.findOne({ slug: req.params.id });
        }

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Increment views
        await movie.incrementViews();

        res.status(200).json({
            success: true,
            data: movie
        });
    } catch (error) {
        logger.error('GetMovie error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Search Luganda movies
// @route   GET /api/luganda-movies/search
// @access  Public
exports.searchMovies = async (req, res) => {
    try {
        const query = req.query.q || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a search query'
            });
        }

        const filters = {
            genre: req.query.genre,
            year: req.query.year,
            quality: req.query.quality,
            vjName: req.query.vjName,
            minTranslationRating: req.query.minRating
        };

        const movies = await LugandaMovie.searchMovies(query, filters)
            .skip(skip)
            .limit(limit)
            .select('-video.originalVideoPath -video.lugandaVideoPath -video.lugandaAudioPath');

        const total = await LugandaMovie.searchMovies(query, filters).countDocuments();

        res.status(200).json({
            success: true,
            count: movies.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            query,
            data: movies
        });
    } catch (error) {
        logger.error('SearchMovies error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get trending Luganda movies
// @route   GET /api/luganda-movies/trending
// @access  Public
exports.getTrending = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.getTrending(limit);

        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        logger.error('GetTrending error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get featured Luganda movies
// @route   GET /api/luganda-movies/featured
// @access  Public
exports.getFeatured = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.getFeatured(limit);

        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        logger.error('GetFeatured error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get latest Luganda translations
// @route   GET /api/luganda-movies/latest
// @access  Public
exports.getLatest = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const movies = await LugandaMovie.getLatest(limit);

        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        logger.error('GetLatest error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get movies by VJ
// @route   GET /api/luganda-movies/vj/:vjName
// @access  Public
exports.getByVJ = async (req, res) => {
    try {
        const vjName = req.params.vjName;
        const limit = parseInt(req.query.limit) || 20;
        const movies = await LugandaMovie.getByVJ(vjName, limit);

        res.status(200).json({
            success: true,
            count: movies.length,
            vjName,
            data: movies
        });
    } catch (error) {
        logger.error('GetByVJ error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get all VJs
// @route   GET /api/luganda-movies/vjs
// @access  Public
exports.getAllVJs = async (req, res) => {
    try {
        const vjs = await LugandaMovie.aggregate([
            { $match: { status: 'published' } },
            {
                $group: {
                    _id: '$vjName',
                    movieCount: { $sum: 1 },
                    avgRating: { $avg: '$rating.translationRating' },
                    totalViews: { $sum: '$views' }
                }
            },
            { $sort: { movieCount: -1 } }
        ]);

        res.status(200).json({
            success: true,
            count: vjs.length,
            data: vjs
        });
    } catch (error) {
        logger.error('GetAllVJs error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Add movie rating
// @route   POST /api/luganda-movies/:id/rate
// @access  Private
exports.rateMovie = async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 0 || rating > 10) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid rating between 0 and 10'
            });
        }

        const movie = await LugandaMovie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        await movie.addMovieRating(rating);

        res.status(200).json({
            success: true,
            message: 'Rating added successfully',
            data: movie
        });
    } catch (error) {
        logger.error('RateMovie error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Add translation quality rating
// @route   POST /api/luganda-movies/:id/rate-translation
// @access  Private
exports.rateTranslation = async (req, res) => {
    try {
        const { rating } = req.body;

        if (!rating || rating < 0 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid rating between 0 and 5'
            });
        }

        const movie = await LugandaMovie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        await movie.addTranslationRating(rating);

        res.status(200).json({
            success: true,
            message: 'Translation rating added successfully',
            data: movie
        });
    } catch (error) {
        logger.error('RateTranslation error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Create new Luganda movie (Admin only)
// @route   POST /api/luganda-movies
// @access  Private/Admin
exports.createMovie = async (req, res) => {
    try {
        const movie = await LugandaMovie.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Movie created successfully',
            data: movie
        });
    } catch (error) {
        logger.error('CreateMovie error', { error, requestId: req.requestId });
        res.status(400).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Update Luganda movie (Admin only)
// @route   PUT /api/luganda-movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res) => {
    try {
        const movie = await LugandaMovie.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Movie updated successfully',
            data: movie
        });
    } catch (error) {
        logger.error('UpdateMovie error', { error, requestId: req.requestId });
        res.status(400).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Delete Luganda movie (Admin only)
// @route   DELETE /api/luganda-movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await LugandaMovie.findByIdAndDelete(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Movie deleted successfully'
        });
    } catch (error) {
        logger.error('DeleteMovie error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get movie stream URL (for authorized users)
// @route   GET /api/luganda-movies/:id/stream
// @access  Private
exports.getStreamUrl = async (req, res) => {
    try {
        const movie = await LugandaMovie.findById(req.params.id);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Check user subscription level
        // This would be implemented based on your auth system
        // For now, returning the video path

        res.status(200).json({
            success: true,
            data: {
                originalVideo: movie.video.originalVideoPath,
                lugandaVideo: movie.video.lugandaVideoPath,
                lugandaAudio: movie.video.lugandaAudioPath,
                subtitles: movie.subtitles,
                quality: movie.video.quality
            }
        });
    } catch (error) {
        logger.error('GetStreamUrl error', { error, requestId: req.requestId });
        res.status(500).json({
            success: false,
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};
