const express = require('express');
const router = express.Router();
const ViewStats = require('../models/ViewStats');
const LugandaMovie = require('../models/LugandaMovie');
const Review = require('../models/Review');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const crypto = require('crypto');

// Record a view (public endpoint)
router.post('/view', async (req, res) => {
    try {
        const { movieId, watchTime = 0, completed = false } = req.body;
        
        // Create viewer ID from IP and user agent
        const viewerData = req.ip + (req.headers['user-agent'] || '');
        const viewerId = crypto.createHash('sha256').update(viewerData).digest('hex').substring(0, 16);

        await ViewStats.recordView(movieId, viewerId, watchTime, completed);

        res.json({ status: 'success' });
    } catch (error) {
        console.error('Record view error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to record view' });
    }
});

// Get trending movies
router.get('/trending', async (req, res) => {
    try {
        const { days = 7, limit = 10 } = req.query;

        const trending = await ViewStats.getTrending(parseInt(days), parseInt(limit));

        res.json({
            status: 'success',
            data: { movies: trending }
        });
    } catch (error) {
        console.error('Get trending error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get trending movies' });
    }
});

// Get most viewed movies of all time
router.get('/most-viewed', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const movies = await ViewStats.aggregate([
            {
                $group: {
                    _id: '$movie',
                    totalViews: { $sum: '$views' },
                    totalUniqueViews: { $sum: '$uniqueViews' }
                }
            },
            { $sort: { totalViews: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'lugandamovies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            { $unwind: '$movie' }
        ]);

        res.json({
            status: 'success',
            data: { movies }
        });
    } catch (error) {
        console.error('Get most viewed error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get most viewed movies' });
    }
});

// Get top rated movies
router.get('/top-rated', async (req, res) => {
    try {
        const { limit = 10, minRatings = 5 } = req.query;

        const movies = await Review.aggregate([
            { $match: { isHidden: false } },
            {
                $group: {
                    _id: '$movie',
                    avgRating: { $avg: '$rating' },
                    ratingCount: { $sum: 1 }
                }
            },
            { $match: { ratingCount: { $gte: parseInt(minRatings) } } },
            { $sort: { avgRating: -1, ratingCount: -1 } },
            { $limit: parseInt(limit) },
            {
                $lookup: {
                    from: 'lugandamovies',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'movie'
                }
            },
            { $unwind: '$movie' }
        ]);

        res.json({
            status: 'success',
            data: { movies }
        });
    } catch (error) {
        console.error('Get top rated error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get top rated movies' });
    }
});

// Get movie recommendations for user
router.get('/recommendations', protect, async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const userId = req.user._id;

        // Get user's watch history
        const user = await User.findById(userId);
        const watchedMovieIds = user.watchHistory.map(h => h.contentId);

        // Get genres from watched movies
        const watchedMovies = await LugandaMovie.find({ _id: { $in: watchedMovieIds } });
        const genreCounts = {};
        
        watchedMovies.forEach(movie => {
            if (movie.genres) {
                movie.genres.forEach(genre => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            }
        });

        // Sort genres by count
        const preferredGenres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        // Get similar movies the user hasn't watched
        let recommendations = [];

        if (preferredGenres.length > 0) {
            recommendations = await LugandaMovie.find({
                _id: { $nin: watchedMovieIds },
                genres: { $in: preferredGenres }
            })
                .sort({ rating: -1, createdAt: -1 })
                .limit(parseInt(limit));
        }

        // If not enough recommendations, add trending
        if (recommendations.length < limit) {
            const trending = await ViewStats.getTrending(7, limit - recommendations.length);
            const trendingMovies = trending
                .filter(t => !watchedMovieIds.some(id => id.toString() === t._id.toString()))
                .map(t => t.movie);
            recommendations = [...recommendations, ...trendingMovies];
        }

        res.json({
            status: 'success',
            data: {
                recommendations,
                basedOn: preferredGenres
            }
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get recommendations' });
    }
});

// Admin: Get overall statistics
router.get('/admin/overview', protect, adminOnly, async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        // Total counts
        const totalMovies = await LugandaMovie.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalReviews = await Review.countDocuments();
        
        // Monthly stats
        const monthlyViews = await ViewStats.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: '$views' },
                    uniqueViews: { $sum: '$uniqueViews' },
                    watchTime: { $sum: '$watchTime' }
                }
            }
        ]);

        // New users this month
        const newUsers = await User.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });

        // Daily stats for the last 30 days
        const dailyStats = await ViewStats.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                    views: { $sum: '$views' },
                    uniqueViews: { $sum: '$uniqueViews' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            status: 'success',
            data: {
                totals: {
                    movies: totalMovies,
                    users: totalUsers,
                    reviews: totalReviews
                },
                monthly: monthlyViews[0] || { totalViews: 0, uniqueViews: 0, watchTime: 0 },
                newUsers,
                dailyStats
            }
        });
    } catch (error) {
        console.error('Get admin stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get statistics' });
    }
});

// Admin: Get movie analytics
router.get('/admin/movie/:movieId', protect, adminOnly, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { days = 30 } = req.query;

        const analytics = await ViewStats.getMovieAnalytics(movieId, parseInt(days));

        res.json({
            status: 'success',
            data: analytics[0] || {
                totalViews: 0,
                totalUniqueViews: 0,
                totalWatchTime: 0,
                totalCompletions: 0,
                dailyStats: []
            }
        });
    } catch (error) {
        console.error('Get movie analytics error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to get movie analytics' });
    }
});

module.exports = router;
