const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect: auth } = require('../middleware/auth');

// @route   GET /api/users/preferences
// @desc    Get user preferences (watchlist, favorites, history)
// @access  Private
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('watchlist', 'originalTitle poster year vjName')
            .populate('favorites', 'originalTitle poster year vjName')
            .populate('watchHistory.movie', 'originalTitle poster year vjName');

        res.json({
            status: 'success',
            data: {
                watchlist: user.watchlist || [],
                favorites: user.favorites || [],
                watchHistory: user.watchHistory || [],
                preferences: user.preferences || {}
            }
        });
    } catch (error) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error fetching preferences'
        });
    }
});

// @route   POST /api/users/watchlist
// @desc    Add movie to watchlist
// @access  Private
router.post('/watchlist', auth, async (req, res) => {
    try {
        const { movieId } = req.body;
        
        const user = await User.findById(req.user.id);
        
        // Check if already in watchlist
        if (user.watchlist && user.watchlist.includes(movieId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Movie already in watchlist'
            });
        }
        
        // Add to watchlist
        if (!user.watchlist) user.watchlist = [];
        user.watchlist.unshift(movieId);
        await user.save();
        
        res.json({
            status: 'success',
            message: 'Added to watchlist'
        });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/users/watchlist/:movieId
// @desc    Remove movie from watchlist
// @access  Private
router.delete('/watchlist/:movieId', auth, async (req, res) => {
    try {
        const { movieId } = req.params;
        
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { watchlist: movieId }
        });
        
        res.json({
            status: 'success',
            message: 'Removed from watchlist'
        });
    } catch (error) {
        console.error('Error removing from watchlist:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   POST /api/users/favorites
// @desc    Add movie to favorites
// @access  Private
router.post('/favorites', auth, async (req, res) => {
    try {
        const { movieId } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (user.favorites && user.favorites.includes(movieId)) {
            return res.status(400).json({
                status: 'error',
                message: 'Movie already in favorites'
            });
        }
        
        if (!user.favorites) user.favorites = [];
        user.favorites.unshift(movieId);
        await user.save();
        
        res.json({
            status: 'success',
            message: 'Added to favorites'
        });
    } catch (error) {
        console.error('Error adding to favorites:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/users/favorites/:movieId
// @desc    Remove movie from favorites
// @access  Private
router.delete('/favorites/:movieId', auth, async (req, res) => {
    try {
        const { movieId } = req.params;
        
        await User.findByIdAndUpdate(req.user.id, {
            $pull: { favorites: movieId }
        });
        
        res.json({
            status: 'success',
            message: 'Removed from favorites'
        });
    } catch (error) {
        console.error('Error removing from favorites:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   POST /api/users/history
// @desc    Add/Update watch history
// @access  Private
router.post('/history', auth, async (req, res) => {
    try {
        const { movieId, progress, duration } = req.body;
        
        const user = await User.findById(req.user.id);
        
        if (!user.watchHistory) user.watchHistory = [];
        
        // Find existing history entry
        const existingIndex = user.watchHistory.findIndex(
            h => h.movie.toString() === movieId
        );
        
        const historyEntry = {
            movie: movieId,
            watchedAt: new Date(),
            progress: progress || 0,
            duration: duration || 0,
            percentComplete: duration > 0 ? Math.round((progress / duration) * 100) : 0
        };
        
        if (existingIndex > -1) {
            // Update existing entry
            user.watchHistory[existingIndex] = historyEntry;
        } else {
            // Add new entry
            user.watchHistory.unshift(historyEntry);
        }
        
        // Keep only last 100 entries
        user.watchHistory = user.watchHistory.slice(0, 100);
        
        await user.save();
        
        res.json({
            status: 'success',
            message: 'History updated'
        });
    } catch (error) {
        console.error('Error updating history:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/users/history
// @desc    Clear watch history
// @access  Private
router.delete('/history', auth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {
            $set: { watchHistory: [] }
        });
        
        res.json({
            status: 'success',
            message: 'History cleared'
        });
    } catch (error) {
        console.error('Error clearing history:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
    try {
        const { autoplay, notifications, quality, language, theme } = req.body;
        
        const updateData = {};
        
        if (autoplay !== undefined) updateData['preferences.autoplay'] = autoplay;
        if (notifications !== undefined) updateData['preferences.notifications'] = notifications;
        if (quality) updateData['preferences.quality'] = quality;
        if (language) updateData['preferences.language'] = language;
        if (theme) updateData['preferences.theme'] = theme;
        
        await User.findByIdAndUpdate(req.user.id, {
            $set: updateData
        });
        
        res.json({
            status: 'success',
            message: 'Preferences updated'
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/continue-watching
// @desc    Get movies to continue watching
// @access  Private
router.get('/continue-watching', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('watchHistory.movie', 'originalTitle poster year vjName video');
        
        // Filter movies that are between 5% and 90% complete
        const continueWatching = (user.watchHistory || [])
            .filter(h => h.percentComplete > 5 && h.percentComplete < 90)
            .slice(0, 10)
            .map(h => ({
                movie: h.movie,
                progress: h.progress,
                duration: h.duration,
                percentComplete: h.percentComplete,
                watchedAt: h.watchedAt
            }));
        
        res.json({
            status: 'success',
            data: continueWatching
        });
    } catch (error) {
        console.error('Error fetching continue watching:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        res.json({
            status: 'success',
            data: user
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, email, avatar, phone } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (avatar) updateData.avatar = avatar;
        if (phone) updateData.phone = phone;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateData },
            { new: true }
        ).select('-password');
        
        res.json({
            status: 'success',
            message: 'Profile updated',
            data: user
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

module.exports = router;
