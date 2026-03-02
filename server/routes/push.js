/**
 * Push Notification Routes
 * Handles subscription management and sending notifications
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushService');
const UAParser = require('ua-parser-js');

/**
 * @route   GET /api/push/vapid-public-key
 * @desc    Get VAPID public key for client subscription
 * @access  Public
 */
router.get('/vapid-public-key', (req, res) => {
    const publicKey = pushService.getVapidPublicKey();
    
    if (!publicKey) {
        return res.status(503).json({
            status: 'error',
            message: 'Push notifications not configured on server'
        });
    }

    res.json({
        status: 'success',
        data: { publicKey }
    });
});

/**
 * @route   GET /api/push/status
 * @desc    Check if push notifications are configured
 * @access  Public
 */
router.get('/status', (req, res) => {
    res.json({
        status: 'success',
        data: {
            configured: pushService.isPushConfigured(),
            features: {
                newMovies: true,
                newSeries: true,
                vjUpdates: true,
                subscriptionAlerts: true,
                systemAnnouncements: true
            }
        }
    });
});

/**
 * @route   POST /api/push/subscribe
 * @desc    Subscribe to push notifications
 * @access  Private
 */
router.post('/subscribe', protect, async (req, res) => {
    try {
        const { subscription, preferences } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid subscription object'
            });
        }

        // Parse user agent for device info
        const parser = new UAParser(req.headers['user-agent']);
        const ua = parser.getResult();

        // Check if subscription already exists
        let existingSubscription = await PushSubscription.findOne({
            endpoint: subscription.endpoint
        });

        if (existingSubscription) {
            // Update existing subscription
            existingSubscription.user = req.user._id;
            existingSubscription.keys = subscription.keys;
            existingSubscription.isActive = true;
            existingSubscription.failedAttempts = 0;
            existingSubscription.disabledAt = undefined;
            existingSubscription.disabledReason = undefined;
            
            if (preferences) {
                existingSubscription.preferences = {
                    ...existingSubscription.preferences,
                    ...preferences
                };
            }

            await existingSubscription.save();

            return res.json({
                status: 'success',
                message: 'Subscription updated',
                data: { subscriptionId: existingSubscription._id }
            });
        }

        // Create new subscription
        const newSubscription = await PushSubscription.create({
            user: req.user._id,
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            },
            device: {
                type: detectDeviceType(ua),
                browser: ua.browser?.name || 'Unknown',
                os: ua.os?.name || 'Unknown',
                userAgent: req.headers['user-agent']
            },
            preferences: preferences || {}
        });

        // Update user's subscription count
        await req.user.updateOne({
            $inc: { pushSubscriptionsCount: 1 }
        });

        res.status(201).json({
            status: 'success',
            message: 'Successfully subscribed to push notifications',
            data: { subscriptionId: newSubscription._id }
        });
    } catch (error) {
        console.error('Push subscribe error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to subscribe to push notifications',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/push/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @access  Private
 */
router.delete('/unsubscribe', protect, async (req, res) => {
    try {
        const { endpoint } = req.body;

        if (!endpoint) {
            return res.status(400).json({
                status: 'error',
                message: 'Endpoint required'
            });
        }

        const subscription = await PushSubscription.findOneAndDelete({
            user: req.user._id,
            endpoint
        });

        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
        }

        // Update user's subscription count
        await req.user.updateOne({
            $inc: { pushSubscriptionsCount: -1 }
        });

        res.json({
            status: 'success',
            message: 'Successfully unsubscribed from push notifications'
        });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to unsubscribe',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/push/preferences
 * @desc    Update notification preferences
 * @access  Private
 */
router.put('/preferences', protect, async (req, res) => {
    try {
        const { preferences, endpoint } = req.body;

        if (!preferences) {
            return res.status(400).json({
                status: 'error',
                message: 'Preferences required'
            });
        }

        const query = { user: req.user._id };
        if (endpoint) {
            query.endpoint = endpoint;
        }

        const result = await PushSubscription.updateMany(query, {
            $set: {
                'preferences.newMovies': preferences.newMovies ?? true,
                'preferences.newSeries': preferences.newSeries ?? true,
                'preferences.vjUpdates': preferences.vjUpdates ?? true,
                'preferences.subscriptionAlerts': preferences.subscriptionAlerts ?? true,
                'preferences.systemAnnouncements': preferences.systemAnnouncements ?? true,
                'preferences.promotions': preferences.promotions ?? false
            }
        });

        res.json({
            status: 'success',
            message: 'Preferences updated',
            data: { updated: result.modifiedCount }
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update preferences',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/push/subscriptions
 * @desc    Get user's push subscriptions
 * @access  Private
 */
router.get('/subscriptions', protect, async (req, res) => {
    try {
        const subscriptions = await PushSubscription.find({
            user: req.user._id
        }).select('-keys');

        res.json({
            status: 'success',
            data: {
                subscriptions,
                count: subscriptions.length
            }
        });
    } catch (error) {
        console.error('Get subscriptions error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get subscriptions',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/push/test
 * @desc    Send test notification to user
 * @access  Private
 */
router.post('/test', protect, async (req, res) => {
    try {
        const result = await pushService.sendToUser(req.user._id, {
            title: '🎉 Test Notification',
            body: 'Push notifications are working! You\'ll receive updates about new movies and series.',
            tag: 'test-notification',
            url: '/'
        });

        res.json({
            status: 'success',
            message: 'Test notification sent',
            data: result
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send test notification',
            error: error.message
        });
    }
});

// ============ ADMIN ROUTES ============

/**
 * @route   POST /api/push/admin/broadcast
 * @desc    Send notification to all users (admin only)
 * @access  Private/Admin
 */
router.post('/admin/broadcast', protect, authorize('admin'), async (req, res) => {
    try {
        const { title, body, url, image } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                status: 'error',
                message: 'Title and body are required'
            });
        }

        const result = await pushService.sendSystemAnnouncementPush(title, body, url || '/');

        res.json({
            status: 'success',
            message: 'Broadcast sent',
            data: result
        });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send broadcast',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/push/admin/stats
 * @desc    Get push notification statistics (admin only)
 * @access  Private/Admin
 */
router.get('/admin/stats', protect, authorize('admin'), async (req, res) => {
    try {
        const totalSubscriptions = await PushSubscription.countDocuments();
        const activeSubscriptions = await PushSubscription.countDocuments({ isActive: true });
        const disabledSubscriptions = await PushSubscription.countDocuments({ isActive: false });

        // Subscriptions by preference
        const byPreference = {
            newMovies: await PushSubscription.countDocuments({ isActive: true, 'preferences.newMovies': true }),
            newSeries: await PushSubscription.countDocuments({ isActive: true, 'preferences.newSeries': true }),
            vjUpdates: await PushSubscription.countDocuments({ isActive: true, 'preferences.vjUpdates': true }),
            systemAnnouncements: await PushSubscription.countDocuments({ isActive: true, 'preferences.systemAnnouncements': true })
        };

        // Recent subscriptions
        const recentSubscriptions = await PushSubscription.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        res.json({
            status: 'success',
            data: {
                total: totalSubscriptions,
                active: activeSubscriptions,
                disabled: disabledSubscriptions,
                byPreference,
                recentWeek: recentSubscriptions
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/push/admin/cleanup
 * @desc    Clean up expired/invalid subscriptions (admin only)
 * @access  Private/Admin
 */
router.post('/admin/cleanup', protect, authorize('admin'), async (req, res) => {
    try {
        const deletedCount = await PushSubscription.cleanup();

        res.json({
            status: 'success',
            message: `Cleaned up ${deletedCount} subscriptions`,
            data: { deleted: deletedCount }
        });
    } catch (error) {
        console.error('Cleanup error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to cleanup subscriptions',
            error: error.message
        });
    }
});

// Helper function to detect device type
function detectDeviceType(ua) {
    if (ua.device?.type === 'mobile') return 'android';
    if (ua.os?.name?.toLowerCase().includes('ios')) return 'ios';
    if (ua.browser?.name?.toLowerCase().includes('pwa')) return 'pwa';
    return 'web';
}

module.exports = router;
