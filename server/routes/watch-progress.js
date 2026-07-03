const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// In-memory storage for watch progress (replace with database in production)
// Structure: { userId: { movieId: { currentTime, duration, percentage, lastWatched } } }
// NOTE: still in-memory — lost on restart/redeploy and inconsistent across
// multiple server instances. Fine for now since it's auth-scoped, but should
// move to the User document (like watchHistory) or a real store eventually.
const watchProgressStore = new Map();

/**
 * @route   POST /api/watch-progress/update
 * @desc    Update watch progress for a movie
 * @access  Private
 */
router.post('/update', protect, async (req, res) => {
    try {
        const { movieId, currentTime, duration } = req.body;

        if (!movieId || currentTime === undefined || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: movieId, currentTime, duration'
            });
        }

        // req.sessionID was never populated (no session middleware in this app —
        // auth is JWT-based) and silently fell back to a single shared 'anonymous'
        // bucket, mixing every unauthenticated user's progress together. Requiring
        // auth here doesn't remove working functionality — that path never worked.
        const userId = req.user.id;

        // Calculate percentage
        const percentage = Math.round((currentTime / duration) * 100);
        
        // Store progress
        if (!watchProgressStore.has(userId)) {
            watchProgressStore.set(userId, new Map());
        }
        
        const userProgress = watchProgressStore.get(userId);
        userProgress.set(movieId, {
            currentTime: parseFloat(currentTime),
            duration: parseFloat(duration),
            percentage: percentage,
            lastWatched: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Watch progress updated',
            progress: {
                movieId,
                currentTime,
                duration,
                percentage
            }
        });
        
    } catch (error) {
        console.error('Error updating watch progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update watch progress'
        });
    }
});

/**
 * @route   GET /api/watch-progress/:movieId
 * @desc    Get watch progress for a specific movie
 * @access  Private
 */
router.get('/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user.id;
        
        const userProgress = watchProgressStore.get(userId);
        const progress = userProgress?.get(movieId);
        
        if (!progress) {
            return res.json({
                success: true,
                progress: null
            });
        }
        
        res.json({
            success: true,
            progress: progress
        });
        
    } catch (error) {
        console.error('Error fetching watch progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch watch progress'
        });
    }
});

/**
 * @route   GET /api/watch-progress/user/all
 * @desc    Get all watch progress for current user
 * @access  Private
 */
router.get('/user/all', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const userProgress = watchProgressStore.get(userId);
        
        if (!userProgress) {
            return res.json({
                success: true,
                progress: {}
            });
        }
        
        // Convert Map to Object
        const progressObj = {};
        userProgress.forEach((value, key) => {
            progressObj[key] = value;
        });
        
        res.json({
            success: true,
            progress: progressObj
        });
        
    } catch (error) {
        console.error('Error fetching user progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user progress'
        });
    }
});

/**
 * @route   DELETE /api/watch-progress/:movieId
 * @desc    Delete watch progress for a movie
 * @access  Private
 */
router.delete('/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user.id;
        
        const userProgress = watchProgressStore.get(userId);
        if (userProgress) {
            userProgress.delete(movieId);
        }
        
        res.json({
            success: true,
            message: 'Watch progress deleted'
        });
        
    } catch (error) {
        console.error('Error deleting watch progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete watch progress'
        });
    }
});

module.exports = router;
