const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LugandaMovie = require('../models/LugandaMovie');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/playlist/watchlist
 * @desc    Get user's watchlist from MongoDB
 * @access  Private
 */
router.get('/watchlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Get all movie IDs from watchlist
        const movieIds = user.watchlist
            .filter(item => item.contentId)
            .map(item => item.contentId);

        // Fetch movies directly from LugandaMovie collection
        const movies = await LugandaMovie.find({ _id: { $in: movieIds } })
            .select('originalTitle lugandaTitle poster thumbnailUrl year duration vjName slug');

        // Create a map for quick lookup
        const movieMap = new Map();
        movies.forEach(movie => {
            movieMap.set(movie._id.toString(), movie);
        });

        // Build watchlist with movie details
        const watchlist = user.watchlist
            .filter(item => item.contentId && movieMap.has(item.contentId.toString()))
            .map(item => {
                const movie = movieMap.get(item.contentId.toString());
                return {
                    _id: movie._id,
                    originalTitle: movie.originalTitle,
                    lugandaTitle: movie.lugandaTitle,
                    poster: movie.poster,
                    thumbnailUrl: movie.thumbnailUrl,
                    year: movie.year,
                    duration: movie.duration,
                    vjName: movie.vjName,
                    slug: movie.slug,
                    addedAt: item.addedAt
                };
            });

        res.json({
            status: 'success',
            data: {
                watchlist,
                count: watchlist.length
            }
        });

    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch watchlist'
        });
    }
});

/**
 * @route   POST /api/playlist/watchlist/:movieId
 * @desc    Add movie to watchlist in MongoDB
 * @access  Private
 */
router.post('/watchlist/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        // Check if movie exists
        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Movie not found'
            });
        }

        // Check if already in watchlist
        const user = await User.findById(userId);
        const alreadyInWatchlist = user.watchlist.some(
            item => item.contentId && item.contentId.toString() === movieId
        );

        if (alreadyInWatchlist) {
            return res.status(400).json({
                status: 'error',
                message: 'Movie already in watchlist'
            });
        }

        // Add to watchlist
        await User.findByIdAndUpdate(userId, {
            $push: {
                watchlist: {
                    contentType: 'movie',
                    contentId: movieId,
                    addedAt: new Date()
                }
            }
        });

        res.json({
            status: 'success',
            message: 'Movie added to watchlist',
            data: {
                movieId,
                title: movie.originalTitle || movie.lugandaTitle
            }
        });

    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add to watchlist'
        });
    }
});

/**
 * @route   DELETE /api/playlist/watchlist/:movieId
 * @desc    Remove movie from watchlist in MongoDB
 * @access  Private
 */
router.delete('/watchlist/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: {
                watchlist: { contentId: movieId }
            }
        });

        res.json({
            status: 'success',
            message: 'Movie removed from watchlist'
        });

    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to remove from watchlist'
        });
    }
});

/**
 * @route   POST /api/playlist/watchlist/toggle
 * @desc    Toggle movie in watchlist (add if not present, remove if present)
 * @access  Private
 */
router.post('/watchlist/toggle', protect, async (req, res) => {
    try {
        const { contentId, contentType } = req.body;
        const userId = req.user._id;

        if (!contentId) {
            return res.status(400).json({
                success: false,
                message: 'Content ID is required'
            });
        }

        const user = await User.findById(userId);
        const existingIndex = user.watchlist.findIndex(
            item => item.contentId && item.contentId.toString() === contentId
        );

        let added = false;

        if (existingIndex >= 0) {
            // Remove from watchlist
            await User.findByIdAndUpdate(userId, {
                $pull: { watchlist: { contentId: contentId } }
            });
            added = false;
        } else {
            // Add to watchlist
            await User.findByIdAndUpdate(userId, {
                $push: {
                    watchlist: {
                        contentType: contentType || 'movie',
                        contentId: contentId,
                        addedAt: new Date()
                    }
                }
            });
            added = true;
        }

        res.json({
            success: true,
            added: added,
            message: added ? 'Added to watchlist' : 'Removed from watchlist'
        });

    } catch (error) {
        console.error('Error toggling watchlist:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle watchlist'
        });
    }
});

/**
 * @route   GET /api/playlist/watchlist/check/:movieId
 * @desc    Check if movie is in watchlist
 * @access  Private
 */
router.get('/watchlist/check/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        const user = await User.findById(userId);
        const inWatchlist = user.watchlist.some(
            item => item.contentId && item.contentId.toString() === movieId
        );

        res.json({
            status: 'success',
            data: { inWatchlist }
        });

    } catch (error) {
        console.error('Error checking watchlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to check watchlist'
        });
    }
});

/**
 * @route   GET /api/playlist/favorites
 * @desc    Get user's favorites
 * @access  Private
 */
router.get('/favorites', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'favorites',
                select: 'originalTitle lugandaTitle poster thumbnailUrl year duration vjName slug'
            });

        res.json({
            status: 'success',
            data: {
                favorites: user.favorites || [],
                count: user.favorites?.length || 0
            }
        });

    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch favorites'
        });
    }
});

/**
 * @route   POST /api/playlist/favorites/:movieId
 * @desc    Add movie to favorites
 * @access  Private
 */
router.post('/favorites/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        // Check if movie exists
        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Movie not found'
            });
        }

        // Check if already in favorites
        const user = await User.findById(userId);
        if (user.favorites.includes(movieId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Movie already in favorites'
            });
        }

        await User.findByIdAndUpdate(userId, {
            $push: { favorites: movieId }
        });

        res.json({
            status: 'success',
            message: 'Movie added to favorites'
        });

    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to add to favorites'
        });
    }
});

/**
 * @route   DELETE /api/playlist/favorites/:movieId
 * @desc    Remove movie from favorites
 * @access  Private
 */
router.delete('/favorites/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user._id;

        await User.findByIdAndUpdate(userId, {
            $pull: { favorites: movieId }
        });

        res.json({
            status: 'success',
            message: 'Movie removed from favorites'
        });

    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to remove from favorites'
        });
    }
});

module.exports = router;
