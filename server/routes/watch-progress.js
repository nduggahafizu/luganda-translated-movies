const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory storage for watch progress (replace with database in production)
// Structure: { userId: { movieId: { currentTime, duration, percentage, lastWatched } } }
const watchProgressStore = new Map();

/**
 * @route   POST /api/watch-progress/update
 * @desc    Update watch progress for a movie
 * @access  Private (requires auth) or Public with session
 */
router.post('/update', async (req, res) => {
    try {
        const { movieId, currentTime, duration } = req.body;
        
        if (!movieId || currentTime === undefined || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: movieId, currentTime, duration'
            });
        }
        
        // Get user ID (from auth or session)
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
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
 * @access  Private or Public with session
 */
router.get('/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
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
 * @access  Private or Public with session
 */
router.get('/user/all', async (req, res) => {
    try {
        const userId = req.user?.id || req.sessionID || 'anonymous';
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
 * @access  Private or Public with session
 */
router.delete('/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
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
