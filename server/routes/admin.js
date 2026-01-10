const express = require('express');
const router = express.Router();
const { protect: auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const User = require('../models/User');
const LugandaMovie = require('../models/LugandaMovie');
const VJ = require('../models/VJ');
const Review = require('../models/Review');
const Comment = require('../models/Comment');
const ViewStats = require('../models/ViewStats');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const { validateMovie, validateAdminUserUpdate, validateNotificationBroadcast } = require('../middleware/validation');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Admin only
router.get('/dashboard', [auth, adminOnly], async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        
        // Get counts
        const [
            totalUsers,
            newUsersToday,
            newUsersThisMonth,
            totalMovies,
            newMoviesThisMonth,
            totalVJs,
            totalReviews,
            totalComments,
            premiumUsers,
            activeSubscriptions
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments({ createdAt: { $gte: thisMonth } }),
            LugandaMovie.countDocuments(),
            LugandaMovie.countDocuments({ createdAt: { $gte: thisMonth } }),
            VJ.countDocuments(),
            Review.countDocuments(),
            Comment.countDocuments(),
            User.countDocuments({ 'subscription.plan': { $in: ['basic', 'premium'] } }),
            User.countDocuments({ 
                'subscription.status': 'active',
                'subscription.plan': { $ne: 'free' }
            })
        ]);
        
        // Get view stats for the month
        const viewStats = await ViewStats.aggregate([
            { $match: { viewedAt: { $gte: thisMonth } } },
            { $group: { _id: null, total: { $sum: 1 } } }
        ]);
        
        const totalViewsThisMonth = viewStats[0]?.total || 0;
        
        // Get last month views for comparison
        const lastMonthViews = await ViewStats.aggregate([
            { $match: { viewedAt: { $gte: lastMonth, $lt: thisMonth } } },
            { $group: { _id: null, total: { $sum: 1 } } }
        ]);
        
        const viewsGrowth = lastMonthViews[0]?.total 
            ? ((totalViewsThisMonth - lastMonthViews[0].total) / lastMonthViews[0].total * 100).toFixed(1)
            : 100;
        
        // Recent activity
        const recentMovies = await LugandaMovie.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('originalTitle poster createdAt vjName');
        
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('fullName email createdAt subscription.plan');
        
        const recentReviews = await Review.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'fullName')
            .populate('movie', 'originalTitle');
        
        res.json({
            status: 'success',
            data: {
                overview: {
                    totalUsers,
                    newUsersToday,
                    newUsersThisMonth,
                    totalMovies,
                    newMoviesThisMonth,
                    totalVJs,
                    totalReviews,
                    totalComments,
                    premiumUsers,
                    activeSubscriptions,
                    totalViewsThisMonth,
                    viewsGrowth
                },
                recentActivity: {
                    movies: recentMovies,
                    users: recentUsers,
                    reviews: recentReviews
                }
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Admin only
router.get('/users', [auth, adminOnly], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Build filter
        const filter = {};
        
        if (req.query.plan) {
            filter['subscription.plan'] = req.query.plan;
        }
        
        if (req.query.status) {
            filter['subscription.status'] = req.query.status;
        }
        
        if (req.query.role) {
            filter.role = req.query.role;
        }
        
        if (req.query.search) {
            filter.$or = [
                { fullName: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        const [users, total] = await Promise.all([
            User.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('-password'),
            User.countDocuments(filter)
        ]);
        
        res.json({
            status: 'success',
            data: users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin only
router.put('/users/:id', [auth, adminOnly, validateAdminUserUpdate], async (req, res) => {
    try {
        const { role, isActive, subscription } = req.body;
        
        const updateData = {};
        if (role) updateData.role = role;
        if (typeof isActive === 'boolean') updateData.isActive = isActive;
        if (subscription) {
            if (subscription.plan) updateData['subscription.plan'] = subscription.plan;
            if (subscription.status) updateData['subscription.status'] = subscription.status;
        }
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        res.json({
            status: 'success',
            message: 'User updated',
            data: user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin only
router.delete('/users/:id', [auth, adminOnly], async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }
        
        // Clean up user's data
        await Promise.all([
            Review.deleteMany({ user: req.params.id }),
            Comment.deleteMany({ user: req.params.id })
        ]);
        
        res.json({
            status: 'success',
            message: 'User deleted'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/movies
// @desc    Get all movies with filters
// @access  Admin only
router.get('/movies', [auth, adminOnly], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const filter = {};
        
        if (req.query.vj) {
            filter.vjName = req.query.vj;
        }
        
        if (req.query.genre) {
            filter.genres = req.query.genre;
        }
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.search) {
            filter.$or = [
                { originalTitle: { $regex: req.query.search, $options: 'i' } },
                { lugandaTitle: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        
        const [movies, total] = await Promise.all([
            LugandaMovie.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            LugandaMovie.countDocuments(filter)
        ]);
        
        res.json({
            status: 'success',
            data: movies,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   POST /api/admin/movies
// @desc    Add new movie
// @access  Admin only
router.post('/movies', [auth, adminOnly, validateMovie], async (req, res) => {
    try {
        const movie = new LugandaMovie(req.body);
        await movie.save();
        
        // Send notification to users
        await Notification.createForAllUsers({
            type: 'new_movie',
            title: 'New Movie Added!',
            message: `${movie.originalTitle} is now available with VJ ${movie.vjName}`,
            link: `/player.html?id=${movie._id}`,
            image: movie.poster
        });
        
        res.status(201).json({
            status: 'success',
            message: 'Movie added',
            data: movie
        });
    } catch (error) {
        console.error('Error adding movie:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Server error'
        });
    }
});

// @route   PUT /api/admin/movies/:id
// @desc    Update movie
// @access  Admin only
router.put('/movies/:id', [auth, adminOnly, validateMovie], async (req, res) => {
    try {
        const movie = await LugandaMovie.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Movie not found'
            });
        }
        
        res.json({
            status: 'success',
            message: 'Movie updated',
            data: movie
        });
    } catch (error) {
        console.error('Error updating movie:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/movies/:id
// @desc    Delete movie
// @access  Admin only
router.delete('/movies/:id', [auth, adminOnly], async (req, res) => {
    try {
        const movie = await LugandaMovie.findByIdAndDelete(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                status: 'error',
                message: 'Movie not found'
            });
        }
        
        // Clean up related data
        await Promise.all([
            Review.deleteMany({ movie: req.params.id }),
            Comment.deleteMany({ movie: req.params.id }),
            ViewStats.deleteMany({ movie: req.params.id })
        ]);
        
        res.json({
            status: 'success',
            message: 'Movie deleted'
        });
    } catch (error) {
        console.error('Error deleting movie:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/analytics
// @desc    Get detailed analytics
// @access  Admin only
router.get('/analytics', [auth, adminOnly], async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Views by day
        const viewsByDay = await ViewStats.aggregate([
            { $match: { viewedAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$viewedAt' } },
                    views: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Users by day
        const usersByDay = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Top movies
        const topMovies = await ViewStats.aggregate([
            { $match: { viewedAt: { $gte: startDate } } },
            {
                $group: {
                    _id: '$movie',
                    views: { $sum: 1 }
                }
            },
            { $sort: { views: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'lugandamovies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            { $unwind: '$movie' },
            {
                $project: {
                    _id: 1,
                    views: 1,
                    title: '$movie.originalTitle',
                    poster: '$movie.poster',
                    vj: '$movie.vjName'
                }
            }
        ]);
        
        // Top VJs
        const topVJs = await LugandaMovie.aggregate([
            {
                $group: {
                    _id: '$vjName',
                    movieCount: { $sum: 1 }
                }
            },
            { $sort: { movieCount: -1 } },
            { $limit: 10 }
        ]);
        
        // Subscription breakdown
        const subscriptionBreakdown = await User.aggregate([
            {
                $group: {
                    _id: '$subscription.plan',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            status: 'success',
            data: {
                viewsByDay,
                usersByDay,
                topMovies,
                topVJs,
                subscriptionBreakdown
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   POST /api/admin/notifications/broadcast
// @desc    Send notification to all users
// @access  Admin only
router.post('/notifications/broadcast', [auth, adminOnly, validateNotificationBroadcast], async (req, res) => {
    try {
        const { title, message, link, image, userFilter } = req.body;
        
        // Build user filter
        const filter = { isActive: true };
        if (userFilter) {
            if (userFilter.plan) filter['subscription.plan'] = userFilter.plan;
            if (userFilter.status) filter['subscription.status'] = userFilter.status;
        }
        
        const users = await User.find(filter).select('_id');
        const userIds = users.map(u => u._id);
        
        // Create notifications
        const notifications = userIds.map(userId => ({
            user: userId,
            type: 'system',
            title,
            message,
            link,
            image
        }));
        
        await Notification.insertMany(notifications);
        
        res.json({
            status: 'success',
            message: `Notification sent to ${userIds.length} users`
        });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/reviews
// @desc    Get all reviews for moderation
// @access  Admin only
router.get('/reviews', [auth, adminOnly], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (req.query.reported === 'true') {
            filter.isReported = true;
        }
        
        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'fullName email')
                .populate('movie', 'originalTitle'),
            Review.countDocuments(filter)
        ]);
        
        res.json({
            status: 'success',
            data: reviews,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/reviews/:id
// @desc    Delete review
// @access  Admin only
router.delete('/reviews/:id', [auth, adminOnly], async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);
        
        res.json({
            status: 'success',
            message: 'Review deleted'
        });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   GET /api/admin/comments
// @desc    Get all comments for moderation
// @access  Admin only
router.get('/comments', [auth, adminOnly], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (req.query.reported === 'true') {
            filter.isReported = true;
        }
        
        const [comments, total] = await Promise.all([
            Comment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('user', 'fullName email')
                .populate('movie', 'originalTitle'),
            Comment.countDocuments(filter)
        ]);
        
        res.json({
            status: 'success',
            data: comments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// @route   DELETE /api/admin/comments/:id
// @desc    Delete comment
// @access  Admin only
router.delete('/comments/:id', [auth, adminOnly], async (req, res) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        
        res.json({
            status: 'success',
            message: 'Comment deleted'
        });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({
            status: 'error',
            message: 'Server error'
        });
    }
});

// ============ VJ MANAGEMENT ============

// @route   GET /api/admin/vjs
// @desc    Get all VJs for admin
// @access  Admin only
router.get('/vjs', [auth, adminOnly], async (req, res) => {
    try {
        const vjs = await VJ.find().sort({ createdAt: -1 });
        res.json({
            status: 'success',
            data: vjs
        });
    } catch (error) {
        console.error('Error fetching VJs:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   POST /api/admin/vjs
// @desc    Add new VJ
// @access  Admin only
router.post('/vjs', [auth, adminOnly], async (req, res) => {
    try {
        const { name, slug, description, avatar, specialties, youtubeChannel, status } = req.body;
        
        // Check if VJ with same slug exists
        const existingVJ = await VJ.findOne({ slug });
        if (existingVJ) {
            return res.status(400).json({
                status: 'error',
                message: 'A VJ with this slug already exists'
            });
        }
        
        const vj = new VJ({
            name,
            slug,
            description,
            avatar,
            specialties: specialties || [],
            youtubeChannel,
            status: status || 'active'
        });
        
        await vj.save();
        
        res.status(201).json({
            status: 'success',
            message: 'VJ added successfully',
            data: vj
        });
    } catch (error) {
        console.error('Error adding VJ:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Server error' });
    }
});

// @route   PUT /api/admin/vjs/:id
// @desc    Update VJ
// @access  Admin only
router.put('/vjs/:id', [auth, adminOnly], async (req, res) => {
    try {
        const vj = await VJ.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        if (!vj) {
            return res.status(404).json({ status: 'error', message: 'VJ not found' });
        }
        
        res.json({
            status: 'success',
            message: 'VJ updated successfully',
            data: vj
        });
    } catch (error) {
        console.error('Error updating VJ:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// @route   DELETE /api/admin/vjs/:id
// @desc    Delete VJ
// @access  Admin only
router.delete('/vjs/:id', [auth, adminOnly], async (req, res) => {
    try {
        const vj = await VJ.findByIdAndDelete(req.params.id);
        
        if (!vj) {
            return res.status(404).json({ status: 'error', message: 'VJ not found' });
        }
        
        res.json({
            status: 'success',
            message: 'VJ deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting VJ:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// ============ GENRE MANAGEMENT ============

// @route   GET /api/admin/genres
// @desc    Get all genres (aggregated from movies)
// @access  Admin only
router.get('/genres', [auth, adminOnly], async (req, res) => {
    try {
        const genres = await LugandaMovie.aggregate([
            { $unwind: '$genres' },
            { $group: { 
                _id: '$genres', 
                movieCount: { $sum: 1 } 
            }},
            { $sort: { movieCount: -1 } }
        ]);
        
        res.json({
            status: 'success',
            data: genres.map(g => ({
                name: g._id,
                slug: g._id.toLowerCase().replace(/\s+/g, '-'),
                movieCount: g.movieCount
            }))
        });
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ status: 'error', message: 'Server error' });
    }
});

// ============ SEND NOTIFICATIONS ============

// @route   POST /api/admin/notifications/send
// @desc    Send notification to specific users or all users
// @access  Admin only
router.post('/notifications/send', [auth, adminOnly], async (req, res) => {
    try {
        const { title, message, type, link, linkText, image, targetUsers, targetAll, recipients } = req.body;
        
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }
        
        let userIds = [];
        let recipientDescription = 'all users';
        
        // Handle different recipient options
        if (targetAll || recipients === 'all') {
            const users = await User.find({ isActive: { $ne: false } }).select('_id');
            userIds = users.map(u => u._id);
            recipientDescription = 'all users';
        } else if (recipients === 'subscribers') {
            const users = await User.find({ 
                isActive: { $ne: false },
                'subscription.plan': { $in: ['basic', 'premium', 'vip'] }
            }).select('_id');
            userIds = users.map(u => u._id);
            recipientDescription = 'subscribers';
        } else if (recipients === 'free') {
            const users = await User.find({ 
                isActive: { $ne: false },
                $or: [
                    { 'subscription.plan': 'free' },
                    { 'subscription.plan': { $exists: false } }
                ]
            }).select('_id');
            userIds = users.map(u => u._id);
            recipientDescription = 'free users';
        } else if (targetUsers && targetUsers.length > 0) {
            userIds = targetUsers;
            recipientDescription = `${targetUsers.length} specific users`;
        } else {
            // Default to all users if no recipient specified
            const users = await User.find({ isActive: { $ne: false } }).select('_id');
            userIds = users.map(u => u._id);
            recipientDescription = 'all users';
        }
        
        if (userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No users found matching the criteria'
            });
        }
        
        const notifications = userIds.map(userId => ({
            user: userId,
            type: type || 'system_announcement',
            title,
            message,
            link: link || null,
            image: image || null,
            metadata: {
                linkText: linkText || null,
                sentBy: req.user._id,
                recipients: recipientDescription
            }
        }));
        
        await Notification.insertMany(notifications);
        
        res.json({
            success: true,
            message: `Notification sent to ${userIds.length} ${recipientDescription}`,
            recipientCount: userIds.length,
            data: { notifiedCount: userIds.length }
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
});

// @route   GET /api/admin/notifications/history
// @desc    Get notification history (sent notifications)
// @access  Admin only
router.get('/notifications/history', [auth, adminOnly], async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Get unique notification titles/messages (as broadcasts)
        const notifications = await Notification.aggregate([
            { $sort: { createdAt: -1 } },
            { $group: {
                _id: { title: '$title', message: '$message', createdAt: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
                count: { $sum: 1 },
                type: { $first: '$type' },
                createdAt: { $first: '$createdAt' },
                readCount: { $sum: { $cond: ['$isRead', 1, 0] } },
                recipients: { $first: '$metadata.recipients' }
            }},
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]);
        
        res.json({
            success: true,
            data: notifications.map(n => ({
                title: n._id.title,
                message: n._id.message,
                type: n.type,
                recipientCount: n.count,
                readCount: n.readCount,
                recipients: n.recipients || 'all users',
                createdAt: n.createdAt
            }))
        });
    } catch (error) {
        console.error('Notification history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============== SETTINGS ROUTES ==============

// @route   GET /api/admin/settings
// @desc    Get site settings
// @access  Admin only
router.get('/settings', [auth, adminOnly], async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/admin/settings
// @desc    Update site settings
// @access  Admin only
router.put('/settings', [auth, adminOnly], async (req, res) => {
    try {
        const updates = req.body;
        const settings = await Settings.updateSettings(updates, req.user._id);
        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/admin/settings/general
// @desc    Update general settings
// @access  Admin only
router.put('/settings/general', [auth, adminOnly], async (req, res) => {
    try {
        const { siteName, siteTagline, siteDescription, contactEmail, supportPhone } = req.body;
        const settings = await Settings.updateSettings({
            siteName,
            siteTagline,
            siteDescription,
            contactEmail,
            supportPhone
        }, req.user._id);
        
        res.json({
            success: true,
            message: 'General settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Update general settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/admin/settings/social
// @desc    Update social media settings
// @access  Admin only
router.put('/settings/social', [auth, adminOnly], async (req, res) => {
    try {
        const { youtube, twitter, facebook, instagram, tiktok } = req.body;
        const settings = await Settings.updateSettings({
            socialMedia: { youtube, twitter, facebook, instagram, tiktok }
        }, req.user._id);
        
        res.json({
            success: true,
            message: 'Social media settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Update social settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/admin/settings/features
// @desc    Update feature settings
// @access  Admin only
router.put('/settings/features', [auth, adminOnly], async (req, res) => {
    try {
        const features = req.body;
        const settings = await Settings.updateSettings({
            features
        }, req.user._id);
        
        res.json({
            success: true,
            message: 'Feature settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Update feature settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/admin/settings/pricing
// @desc    Update pricing settings
// @access  Admin only
router.put('/settings/pricing', [auth, adminOnly], async (req, res) => {
    try {
        const { basicPrice, premiumPrice, vipPrice, currency, trialDays } = req.body;
        const settings = await Settings.updateSettings({
            pricing: { basicPrice, premiumPrice, vipPrice, currency, trialDays }
        }, req.user._id);
        
        res.json({
            success: true,
            message: 'Pricing settings updated',
            data: settings
        });
    } catch (error) {
        console.error('Update pricing settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
