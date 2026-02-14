const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const ExpoPushToken = require('../models/ExpoPushToken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// =============================================
// PUSH TOKEN MANAGEMENT ENDPOINTS
// =============================================

// @route   GET /api/notifications/tokens
// @desc    Get all push tokens (admin only)
// @access  Admin only
router.get('/tokens', [protect, adminOnly], async (req, res) => {
    try {
        const tokens = await ExpoPushToken.find({ isActive: true })
            .populate('user', 'fullName email lastVisit status createdAt')
            .sort({ updatedAt: -1 })
            .lean();
        
        res.json({
            status: 'success',
            data: tokens,
            count: tokens.length
        });
    } catch (error) {
        console.error('Get tokens error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch tokens' });
    }
});

// @route   GET /api/notifications/tokens/count
// @desc    Get push token count (admin only)
// @access  Admin only
router.get('/tokens/count', [protect, adminOnly], async (req, res) => {
    try {
        const count = await ExpoPushToken.countDocuments({ isActive: true });
        res.json({ status: 'success', count });
    } catch (error) {
        console.error('Get token count error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to count tokens' });
    }
});

// @route   POST /api/notifications/register-token
// @desc    Register Expo push token (works with or without auth)
// @access  Public or Private
router.post('/register-token', async (req, res) => {
    try {
        const { pushToken, platform = 'android' } = req.body;

        if (!pushToken) {
            return res.status(400).json({ status: 'error', message: 'Push token is required' });
        }

        // Try to get user from auth header (optional)
        let userId = null;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const jwt = require('jsonwebtoken');
                const JWT_SECRET = process.env.JWT_SECRET || 'unruly-movies-jwt-secret-key-2024';
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.userId || decoded.id;
            }
        } catch (e) {
            // No valid token, continue without user
        }

        // Check if token already exists
        let existingToken = await ExpoPushToken.findOne({ pushToken });

        if (existingToken) {
            // Update existing token
            existingToken.platform = platform;
            existingToken.isActive = true;
            existingToken.failedAttempts = 0;
            existingToken.disabledAt = undefined;
            existingToken.disabledReason = undefined;
            existingToken.lastUsed = new Date();
            if (userId) existingToken.user = userId;
            await existingToken.save();

            return res.json({
                status: 'success',
                message: 'Push token updated'
            });
        }

        // Create new token
        await ExpoPushToken.create({
            user: userId,
            pushToken,
            platform,
            isActive: true
        });

        res.status(201).json({
            status: 'success',
            message: 'Push token registered'
        });
    } catch (error) {
        console.error('Register push token error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to register push token' });
    }
});

// @route   DELETE /api/notifications/unregister-token
// @desc    Unregister Expo push token
// @access  Public
router.delete('/unregister-token', async (req, res) => {
    try {
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ status: 'error', message: 'Push token is required' });
        }

        await ExpoPushToken.findOneAndDelete({ pushToken });

        res.json({
            status: 'success',
            message: 'Push token unregistered'
        });
    } catch (error) {
        console.error('Unregister push token error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to unregister token' });
    }
});

// =============================================
// USER NOTIFICATIONS ENDPOINTS
// =============================================

// Get user's notifications
router.get('/', protect, async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const query = { user: req.user._id };
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        res.json({
            status: 'success',
            data: {
                notifications,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                },
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch notifications' });
    }
});

// Get unread count
router.get('/unread-count', protect, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });

        res.json({
            status: 'success',
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get unread count' });
    }
});

// Mark notification as read
router.put('/:notificationId/read', protect, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: req.user._id },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ status: 'error', message: 'Notification not found' });
        }

        res.json({
            status: 'success',
            data: { notification }
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to mark as read' });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true, readAt: new Date() }
        );

        res.json({
            status: 'success',
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to mark all as read' });
    }
});

// Delete a notification
router.delete('/:notificationId', protect, async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            user: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ status: 'error', message: 'Notification not found' });
        }

        res.json({
            status: 'success',
            message: 'Notification deleted'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete notification' });
    }
});

// Delete all notifications
router.delete('/', protect, async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });

        res.json({
            status: 'success',
            message: 'All notifications deleted'
        });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete notifications' });
    }
});

// Admin: Send system announcement to all users
router.post('/announce', protect, async (req, res) => {
    try {
        // Check if user is admin (add proper admin check based on your auth system)
        if (!req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Admin access required' });
        }

        const { title, message, link } = req.body;

        if (!title || !message) {
            return res.status(400).json({ status: 'error', message: 'Title and message are required' });
        }

        const { sendSystemAnnouncement } = require('../utils/notificationService');
        const result = await sendSystemAnnouncement(title, message, link);

        if (result.success) {
            res.json({
                status: 'success',
                message: `Announcement sent to ${result.notified} users`
            });
        } else {
            res.status(500).json({ status: 'error', message: result.error });
        }
    } catch (error) {
        console.error('Send announcement error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send announcement' });
    }
});

// Admin: Manually trigger new movie notification
router.post('/notify-movie/:movieId', protect, async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Admin access required' });
        }

        const { movieId } = req.params;
        const LugandaMovie = require('../models/LugandaMovie');
        const movie = await LugandaMovie.findById(movieId);

        if (!movie) {
            return res.status(404).json({ status: 'error', message: 'Movie not found' });
        }

        const { notifyNewMovie, notifyVjFollowers } = require('../utils/notificationService');
        
        const [newMovieResult, vjResult] = await Promise.all([
            notifyNewMovie(movie),
            notifyVjFollowers(movie, movie.vjName)
        ]);

        res.json({
            status: 'success',
            message: 'Notifications sent',
            data: {
                newMovieNotifications: newMovieResult.notified || 0,
                vjFollowerNotifications: vjResult.notified || 0
            }
        });
    } catch (error) {
        console.error('Manual movie notification error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send notifications' });
    }
});

// Register Expo push token (for mobile app)
router.post('/register-token', protect, async (req, res) => {
    try {
        const { pushToken, platform } = req.body;

        if (!pushToken) {
            return res.status(400).json({ status: 'error', message: 'Push token is required' });
        }

        if (!platform || !['android', 'ios'].includes(platform)) {
            return res.status(400).json({ status: 'error', message: 'Valid platform (android/ios) is required' });
        }

        // Check if token already exists
        let existingToken = await ExpoPushToken.findOne({ pushToken });

        if (existingToken) {
            // Update existing token
            existingToken.user = req.user._id;
            existingToken.platform = platform;
            existingToken.isActive = true;
            existingToken.failedAttempts = 0;
            existingToken.disabledAt = undefined;
            existingToken.disabledReason = undefined;
            existingToken.lastUsed = new Date();
            await existingToken.save();

            return res.json({
                status: 'success',
                message: 'Push token updated',
                data: { tokenId: existingToken._id }
            });
        }

        // Create new token
        const newToken = await ExpoPushToken.create({
            user: req.user._id,
            pushToken,
            platform
        });

        res.status(201).json({
            status: 'success',
            message: 'Push token registered',
            data: { tokenId: newToken._id }
        });
    } catch (error) {
        console.error('Register push token error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to register push token' });
    }
});

// Register Expo push token anonymously (no login required)
// This allows collecting tokens from users who haven't logged in yet
router.post('/register-anonymous', async (req, res) => {
    try {
        const { pushToken, platform } = req.body;

        if (!pushToken) {
            return res.status(400).json({ status: 'error', message: 'Push token is required' });
        }

        // Check if token already exists
        let existingToken = await ExpoPushToken.findOne({ pushToken });

        if (existingToken) {
            // Update existing token
            existingToken.platform = platform || existingToken.platform;
            existingToken.isActive = true;
            existingToken.failedAttempts = 0;
            existingToken.lastUsed = new Date();
            await existingToken.save();

            return res.json({
                status: 'success',
                message: 'Push token updated'
            });
        }

        // Create new token (without user association)
        await ExpoPushToken.create({
            pushToken,
            platform: platform || 'android',
            isActive: true
        });

        res.status(201).json({
            status: 'success',
            message: 'Push token registered'
        });
    } catch (error) {
        console.error('Register anonymous push token error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to register push token' });
    }
});

// Unregister Expo push token
router.delete('/unregister-token', protect, async (req, res) => {
    try {
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ status: 'error', message: 'Push token is required' });
        }

        const result = await ExpoPushToken.findOneAndDelete({
            pushToken,
            user: req.user._id
        });

        if (!result) {
            return res.status(404).json({ status: 'error', message: 'Token not found' });
        }

        res.json({
            status: 'success',
            message: 'Push token unregistered'
        });
    } catch (error) {
        console.error('Unregister push token error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to unregister token' });
    }
});

// Admin: Send push notification to all mobile app users
router.post('/push-all', protect, async (req, res) => {
    try {
        if (!req.user.role || req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Admin access required' });
        }

        const { title, body, data } = req.body;

        if (!title || !body) {
            return res.status(400).json({ status: 'error', message: 'Title and body are required' });
        }

        const { sendSystemAnnouncement } = require('../services/expoPushService');
        const result = await sendSystemAnnouncement(title, body, data);

        res.json({
            status: 'success',
            message: `Push notification sent to ${result.sent} devices`,
            data: result
        });
    } catch (error) {
        console.error('Push all error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to send push notifications' });
    }
});

module.exports = router;