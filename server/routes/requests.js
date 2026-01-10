const express = require('express');
const router = express.Router();
const UserRequest = require('../models/UserRequest');
const { protect: auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// ============== PUBLIC ROUTES ==============

// @route   POST /api/requests
// @desc    Submit a new request/contact form
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message, movieDetails } = req.body;
        
        // Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, subject, and message are required'
            });
        }
        
        // Get user ID if logged in
        let userId = null;
        if (req.headers.authorization) {
            try {
                const jwt = require('jsonwebtoken');
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id || decoded.userId;
            } catch (e) {
                // Token invalid, continue as guest
            }
        }
        
        // Create request
        const newRequest = await UserRequest.create({
            user: userId,
            name,
            email,
            subject,
            message,
            movieDetails: movieDetails || undefined,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });
        
        res.status(201).json({
            success: true,
            message: 'Your request has been submitted successfully! We\'ll get back to you within 24-48 hours.',
            data: {
                id: newRequest._id,
                subject: newRequest.subject,
                status: newRequest.status
            }
        });
    } catch (error) {
        console.error('Submit request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit request. Please try again.'
        });
    }
});

// @route   GET /api/requests/my-requests
// @desc    Get user's own requests (logged in users)
// @access  Private
router.get('/my-requests', auth, async (req, res) => {
    try {
        const requests = await UserRequest.find({ 
            $or: [
                { user: req.user._id },
                { email: req.user.email }
            ]
        }).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============== ADMIN ROUTES ==============

// @route   GET /api/requests/admin
// @desc    Get all requests (admin)
// @access  Admin only
router.get('/admin', [auth, adminOnly], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const status = req.query.status;
        const subject = req.query.subject;
        const search = req.query.search;
        
        const query = {};
        
        if (status && status !== 'all') query.status = status;
        if (subject && subject !== 'all') query.subject = subject;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { message: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        
        const [requests, total, statusCounts] = await Promise.all([
            UserRequest.find(query)
                .populate('user', 'name email')
                .populate('adminResponse.respondedBy', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            UserRequest.countDocuments(query),
            UserRequest.getStatusCounts()
        ]);
        
        res.json({
            success: true,
            data: requests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            statusCounts
        });
    } catch (error) {
        console.error('Admin get requests error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/requests/admin/stats
// @desc    Get request statistics
// @access  Admin only
router.get('/admin/stats', [auth, adminOnly], async (req, res) => {
    try {
        const [statusCounts, subjectCounts, recentRequests] = await Promise.all([
            UserRequest.getStatusCounts(),
            UserRequest.getSubjectCounts(),
            UserRequest.find({ status: 'pending' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name email subject message createdAt')
        ]);
        
        // Get today's count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayCount = await UserRequest.countDocuments({ createdAt: { $gte: today } });
        
        res.json({
            success: true,
            data: {
                statusCounts,
                subjectCounts,
                todayCount,
                recentPending: recentRequests
            }
        });
    } catch (error) {
        console.error('Admin get stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/requests/admin/:id
// @desc    Get single request details
// @access  Admin only
router.get('/admin/:id', [auth, adminOnly], async (req, res) => {
    try {
        const request = await UserRequest.findById(req.params.id)
            .populate('user', 'name email avatar subscription')
            .populate('adminResponse.respondedBy', 'name email')
            .populate('notes.addedBy', 'name');
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        res.json({
            success: true,
            data: request
        });
    } catch (error) {
        console.error('Get request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/requests/admin/:id
// @desc    Update request status/details
// @access  Admin only
router.put('/admin/:id', [auth, adminOnly], async (req, res) => {
    try {
        const { status, priority, adminResponse } = req.body;
        
        const request = await UserRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        if (status) request.status = status;
        if (priority) request.priority = priority;
        
        if (adminResponse) {
            request.adminResponse = {
                message: adminResponse,
                respondedBy: req.user._id,
                respondedAt: new Date()
            };
        }
        
        request.updatedAt = new Date();
        await request.save();
        
        res.json({
            success: true,
            message: 'Request updated successfully',
            data: request
        });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/requests/admin/:id/note
// @desc    Add internal note to request
// @access  Admin only
router.post('/admin/:id/note', [auth, adminOnly], async (req, res) => {
    try {
        const { note } = req.body;
        
        if (!note) {
            return res.status(400).json({
                success: false,
                message: 'Note text is required'
            });
        }
        
        const request = await UserRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        request.notes.push({
            text: note,
            addedBy: req.user._id
        });
        
        await request.save();
        
        res.json({
            success: true,
            message: 'Note added successfully',
            data: request
        });
    } catch (error) {
        console.error('Add note error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE /api/requests/admin/:id
// @desc    Delete a request
// @access  Admin only
router.delete('/admin/:id', [auth, adminOnly], async (req, res) => {
    try {
        const request = await UserRequest.findByIdAndDelete(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Request deleted successfully'
        });
    } catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/requests/admin/bulk-action
// @desc    Perform bulk action on requests
// @access  Admin only
router.post('/admin/bulk-action', [auth, adminOnly], async (req, res) => {
    try {
        const { ids, action, status } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Request IDs are required'
            });
        }
        
        let result;
        
        if (action === 'delete') {
            result = await UserRequest.deleteMany({ _id: { $in: ids } });
        } else if (action === 'update_status' && status) {
            result = await UserRequest.updateMany(
                { _id: { $in: ids } },
                { $set: { status, updatedAt: new Date() } }
            );
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }
        
        res.json({
            success: true,
            message: `${result.modifiedCount || result.deletedCount} requests updated`,
            data: result
        });
    } catch (error) {
        console.error('Bulk action error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
