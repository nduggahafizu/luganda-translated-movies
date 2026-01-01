const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

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

module.exports = router;
