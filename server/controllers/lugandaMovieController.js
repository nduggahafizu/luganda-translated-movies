const LugandaMovie = require('../models/LugandaMovie');
const dbManager = require('../config/database');

// @desc    Get all Luganda movies
// @route   GET /api/luganda-movies
// @access  Public
exports.getAllMovies = async (req, res) => {
    try {
        // Check if using in-memory mode
        if (dbManager.isInMemoryMode()) {
            const store = dbManager.getInMemoryStore();
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const skip = (page - 1) * limit;

            let movies = store.lugandaMovies.filter(m => m.status === 'published');

            // Apply filters
            if (req.query.genre) {
                movies = movies.filter(m => m.genres && m.genres.includes(req.query.genre));
            }
            if (req.query.year) {
                movies = movies.filter(m => m.year === parseInt(req.query.year));
            }
            if (req.query.vjName) {
                const vjName = req.query.vjName.toLowerCase();
                movies = movies.filter(m => m.vjName && m.vjName.toLowerCase().includes(vjName));
            }

            // Sorting
            if (req.query.sort === 'popular') {
                movies.sort((a, b) => (b.views || 0) - (a.views || 0));
            } else if (req.query.sort === 'rating') {
                movies.sort((a, b) => (b.rating?.userRating || 0) - (a.rating?.userRating || 0));
            } else if (req.query.sort === 'title') {
                movies.sort((a, b) => (a.lugandaTitle || '').localeCompare(b.lugandaTitle || ''));
            }

            const total = movies.length;
            const paginatedMovies = movies.slice(skip, skip + limit);

            return res.status(200).json({
                success: true,
                count: paginatedMovies.length,
                total,
                page,
                pages: Math.ceil(total / limit),
                data: paginatedMovies,
                inMemoryMode: true
            });
        }

        // MongoDB mode
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
        res.status(500).json({
            success: false,
            message: 'Error fetching movies',
            error: error.message
        });
    }
};

// @desc    Get single Luganda movie by ID or slug
// @route   GET /api/luganda-movies/:id
// @access  Public
exports.getMovie = async (req, res) => {
    try {
        // Check if using in-memory mode
        if (dbManager.isInMemoryMode()) {
            const store = dbManager.getInMemoryStore();
            const movie = store.lugandaMovies.find(m => 
                m._id === req.params.id || m.slug === req.params.id
            );

            if (!movie) {
                return res.status(404).json({
                    success: false,
                    message: 'Movie not found'
                });
            }

            // Increment views
            movie.views = (movie.views || 0) + 1;

            return res.status(200).json({
                success: true,
                data: movie,
                inMemoryMode: true
            });
        }

        // MongoDB mode
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
        res.status(500).json({
            success: false,
            message: 'Error fetching movie',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error searching movies',
            error: error.message
        });
    }
};

// @desc    Get trending Luganda movies
// @route   GET /api/luganda-movies/trending
// @access  Public
exports.getTrending = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Check if using in-memory mode
        if (dbManager.isInMemoryMode()) {
            const store = dbManager.getInMemoryStore();
            const movies = store.lugandaMovies
                .filter(m => m.status === 'published' && m.trending)
                .sort((a, b) => (b.views || 0) - (a.views || 0))
                .slice(0, limit);

            return res.status(200).json({
                success: true,
                count: movies.length,
                data: movies,
                inMemoryMode: true
            });
        }

        // MongoDB mode
        const movies = await LugandaMovie.getTrending(limit);

        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trending movies',
            error: error.message
        });
    }
};

// @desc    Get featured Luganda movies
// @route   GET /api/luganda-movies/featured
// @access  Public
exports.getFeatured = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Check if using in-memory mode
        if (dbManager.isInMemoryMode()) {
            const store = dbManager.getInMemoryStore();
            const movies = store.lugandaMovies
                .filter(m => m.status === 'published' && m.featured)
                .sort((a, b) => new Date(b.translationDate) - new Date(a.translationDate))
                .slice(0, limit);

            return res.status(200).json({
                success: true,
                count: movies.length,
                data: movies,
                inMemoryMode: true
            });
        }

        // MongoDB mode
        const movies = await LugandaMovie.getFeatured(limit);

        res.status(200).json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured movies',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error fetching latest movies',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error fetching VJ movies',
            error: error.message
        });
    }
};

// @desc    Get all VJs
// @route   GET /api/luganda-movies/vjs
// @access  Public
exports.getAllVJs = async (req, res) => {
    try {
        // Check if using in-memory mode
        if (dbManager.isInMemoryMode()) {
            const store = dbManager.getInMemoryStore();
            const vjMap = {};

            store.lugandaMovies
                .filter(m => m.status === 'published')
                .forEach(movie => {
                    if (!vjMap[movie.vjName]) {
                        vjMap[movie.vjName] = {
                            _id: movie.vjName,
                            movieCount: 0,
                            avgRating: 0,
                            totalViews: 0,
                            ratings: []
                        };
                    }
                    vjMap[movie.vjName].movieCount++;
                    vjMap[movie.vjName].totalViews += movie.views || 0;
                    if (movie.rating && movie.rating.translationRating) {
                        vjMap[movie.vjName].ratings.push(movie.rating.translationRating);
                    }
                });

            const vjs = Object.values(vjMap).map(vj => {
                vj.avgRating = vj.ratings.length > 0
                    ? vj.ratings.reduce((a, b) => a + b, 0) / vj.ratings.length
                    : 0;
                delete vj.ratings;
                return vj;
            }).sort((a, b) => b.movieCount - a.movieCount);

            return res.status(200).json({
                success: true,
                count: vjs.length,
                data: vjs,
                inMemoryMode: true
            });
        }

        // MongoDB mode
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
        res.status(500).json({
            success: false,
            message: 'Error fetching VJs',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error adding rating',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error adding translation rating',
            error: error.message
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
        res.status(400).json({
            success: false,
            message: 'Error creating movie',
            error: error.message
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
        res.status(400).json({
            success: false,
            message: 'Error updating movie',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error deleting movie',
            error: error.message
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
        res.status(500).json({
            success: false,
            message: 'Error fetching stream URL',
            error: error.message
        });
    }
};
