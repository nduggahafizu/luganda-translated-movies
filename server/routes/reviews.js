const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const LugandaMovie = require('../models/LugandaMovie');
const { protect, optionalAuth, admin } = require('../middleware/auth');

// GET all reviews (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'all' } = req.query;
        
        let query = {};
        if (status !== 'all') {
            query.status = status;
        }
        
        const reviews = await Review.find(query)
            .populate('user', 'fullName profileImage email')
            .populate('movie', 'originalTitle poster')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        const total = await Review.countDocuments(query);
        
        res.json({
            status: 'success',
            data: reviews,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all reviews error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch reviews' });
    }
});

// Get reviews for a movie
router.get('/movie/:movieId', optionalAuth, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { page = 1, limit = 10, sort = 'newest' } = req.query;

        let sortQuery = { createdAt: -1 };
        if (sort === 'oldest') sortQuery = { createdAt: 1 };
        if (sort === 'highest') sortQuery = { rating: -1 };
        if (sort === 'lowest') sortQuery = { rating: 1 };
        if (sort === 'helpful') sortQuery = { helpfulCount: -1 };

        const reviews = await Review.find({ movie: movieId, isHidden: false })
            .populate('user', 'fullName avatar')
            .sort(sortQuery)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Review.countDocuments({ movie: movieId, isHidden: false });

        // Add user's reaction to each review
        if (req.user) {
            reviews.forEach(review => {
                review.userLiked = review.likes?.some(id => id.toString() === req.user._id.toString());
                review.userDisliked = review.dislikes?.some(id => id.toString() === req.user._id.toString());
            });
        }

        // Get rating distribution
        const ratingDistribution = await Review.aggregate([
            { $match: { movie: require('mongoose').Types.ObjectId(movieId), isHidden: false } },
            { $group: { _id: '$rating', count: { $sum: 1 } } },
            { $sort: { _id: -1 } }
        ]);

        res.json({
            status: 'success',
            data: {
                reviews,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                },
                ratingDistribution
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch reviews' });
    }
});

// Create a review
router.post('/', protect, async (req, res) => {
    try {
        const { movieId, rating, title, content, isSpoiler } = req.body;

        // Check if movie exists
        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ status: 'error', message: 'Movie not found' });
        }

        // Check if user already reviewed this movie
        const existingReview = await Review.findOne({
            user: req.user._id,
            movie: movieId
        });

        if (existingReview) {
            return res.status(400).json({
                status: 'error',
                message: 'You have already reviewed this movie'
            });
        }

        const review = await Review.create({
            user: req.user._id,
            movie: movieId,
            rating,
            title,
            content,
            isSpoiler
        });

        await review.populate('user', 'fullName avatar');

        res.status(201).json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create review' });
    }
});

// Update a review
router.put('/:reviewId', protect, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, title, content, isSpoiler } = req.body;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this review' });
        }

        review.rating = rating || review.rating;
        review.title = title || review.title;
        review.content = content || review.content;
        review.isSpoiler = isSpoiler !== undefined ? isSpoiler : review.isSpoiler;

        await review.save();
        await review.populate('user', 'fullName avatar');

        res.json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update review' });
    }
});

// Delete a review
router.delete('/:reviewId', protect, async (req, res) => {
    try {
        const { reviewId } = req.params;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this review' });
        }

        await review.remove();

        res.json({
            status: 'success',
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete review' });
    }
});

// Like/unlike a review
router.post('/:reviewId/like', protect, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        const hasLiked = review.likes.includes(userId);
        const hasDisliked = review.dislikes.includes(userId);

        if (hasLiked) {
            // Remove like
            review.likes.pull(userId);
            review.helpfulCount = Math.max(0, review.helpfulCount - 1);
        } else {
            // Add like
            review.likes.push(userId);
            review.helpfulCount += 1;
            // Remove dislike if exists
            if (hasDisliked) {
                review.dislikes.pull(userId);
            }
        }

        await review.save();

        res.json({
            status: 'success',
            data: {
                liked: !hasLiked,
                likeCount: review.likes.length,
                dislikeCount: review.dislikes.length
            }
        });
    } catch (error) {
        console.error('Like review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to like review' });
    }
});

// Dislike a review
router.post('/:reviewId/dislike', protect, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user._id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({ status: 'error', message: 'Review not found' });
        }

        const hasDisliked = review.dislikes.includes(userId);
        const hasLiked = review.likes.includes(userId);

        if (hasDisliked) {
            // Remove dislike
            review.dislikes.pull(userId);
        } else {
            // Add dislike
            review.dislikes.push(userId);
            // Remove like if exists
            if (hasLiked) {
                review.likes.pull(userId);
                review.helpfulCount = Math.max(0, review.helpfulCount - 1);
            }
        }

        await review.save();

        res.json({
            status: 'success',
            data: {
                disliked: !hasDisliked,
                likeCount: review.likes.length,
                dislikeCount: review.dislikes.length
            }
        });
    } catch (error) {
        console.error('Dislike review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to dislike review' });
    }
});

// Get user's review for a movie
router.get('/user/movie/:movieId', protect, async (req, res) => {
    try {
        const { movieId } = req.params;

        const review = await Review.findOne({
            user: req.user._id,
            movie: movieId
        }).populate('user', 'fullName avatar');

        res.json({
            status: 'success',
            data: { review }
        });
    } catch (error) {
        console.error('Get user review error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch user review' });
    }
});

module.exports = router;
