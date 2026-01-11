const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { protect, optionalAuth, admin } = require('../middleware/auth');

// GET all comments (admin only)
router.get('/', protect, admin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status = 'all' } = req.query;
        
        let query = { parentComment: null }; // Top-level comments only
        if (status === 'hidden') {
            query.isHidden = true;
        } else if (status === 'visible') {
            query.isHidden = false;
        }
        
        const comments = await Comment.find(query)
            .populate('user', 'fullName profileImage email')
            .populate('movie', 'originalTitle poster')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();
        
        const total = await Comment.countDocuments(query);
        
        res.json({
            status: 'success',
            data: comments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all comments error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch comments' });
    }
});

// Get comments for a movie
router.get('/movie/:movieId', optionalAuth, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { page = 1, limit = 20, sort = 'newest' } = req.query;

        let sortQuery = { createdAt: -1 };
        if (sort === 'oldest') sortQuery = { createdAt: 1 };
        if (sort === 'popular') sortQuery = { likeCount: -1, createdAt: -1 };

        // Get top-level comments only
        const comments = await Comment.find({
            movie: movieId,
            parentComment: null,
            isHidden: false
        })
            .populate('user', 'fullName avatar role')
            .populate({
                path: 'replies',
                match: { isHidden: false },
                populate: { path: 'user', select: 'fullName avatar role' },
                options: { limit: 3, sort: { createdAt: 1 } }
            })
            .sort(sortQuery)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Comment.countDocuments({
            movie: movieId,
            parentComment: null,
            isHidden: false
        });

        // Add user's like status to each comment
        if (req.user) {
            comments.forEach(comment => {
                comment.userLiked = comment.likes?.some(id => id.toString() === req.user._id.toString());
                if (comment.replies) {
                    comment.replies.forEach(reply => {
                        reply.userLiked = reply.likes?.some(id => id.toString() === req.user._id.toString());
                    });
                }
            });
        }

        res.json({
            status: 'success',
            data: {
                comments,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch comments' });
    }
});

// Get replies for a comment
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const replies = await Comment.find({
            parentComment: commentId,
            isHidden: false
        })
            .populate('user', 'fullName avatar role')
            .sort({ createdAt: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const total = await Comment.countDocuments({
            parentComment: commentId,
            isHidden: false
        });

        if (req.user) {
            replies.forEach(reply => {
                reply.userLiked = reply.likes?.some(id => id.toString() === req.user._id.toString());
            });
        }

        res.json({
            status: 'success',
            data: {
                replies,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch replies' });
    }
});

// Create a comment
router.post('/', protect, async (req, res) => {
    try {
        const { movieId, content, parentCommentId } = req.body;

        const commentData = {
            user: req.user._id,
            movie: movieId,
            content
        };

        if (parentCommentId) {
            commentData.parentComment = parentCommentId;

            // Notify parent comment author
            const parentComment = await Comment.findById(parentCommentId).populate('user', '_id');
            if (parentComment && parentComment.user._id.toString() !== req.user._id.toString()) {
                await Notification.create({
                    user: parentComment.user._id,
                    type: 'comment_reply',
                    title: 'New Reply',
                    message: `${req.user.fullName} replied to your comment`,
                    link: `/player.html?id=${movieId}#comment-${parentCommentId}`
                });
            }
        }

        const comment = await Comment.create(commentData);
        await comment.populate('user', 'fullName avatar role');

        res.status(201).json({
            status: 'success',
            data: { comment }
        });
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create comment' });
    }
});

// Update a comment
router.put('/:commentId', protect, async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        comment.content = content;
        comment.isEdited = true;

        await comment.save();
        await comment.populate('user', 'fullName avatar role');

        res.json({
            status: 'success',
            data: { comment }
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update comment' });
    }
});

// Delete a comment
router.delete('/:commentId', protect, async (req, res) => {
    try {
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ status: 'error', message: 'Not authorized' });
        }

        // If deleting parent comment, also delete replies
        if (!comment.parentComment) {
            await Comment.deleteMany({ parentComment: commentId });
        }

        await comment.remove();

        res.json({
            status: 'success',
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete comment' });
    }
});

// Like/unlike a comment
router.post('/:commentId/like', protect, async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const comment = await Comment.findById(commentId).populate('user', '_id fullName');

        if (!comment) {
            return res.status(404).json({ status: 'error', message: 'Comment not found' });
        }

        const hasLiked = comment.likes.includes(userId);

        if (hasLiked) {
            comment.likes.pull(userId);
        } else {
            comment.likes.push(userId);
            
            // Notify comment author
            if (comment.user._id.toString() !== userId.toString()) {
                await Notification.create({
                    user: comment.user._id,
                    type: 'comment_like',
                    title: 'Comment Liked',
                    message: `${req.user.fullName} liked your comment`,
                    link: `/player.html?id=${comment.movie}#comment-${commentId}`
                });
            }
        }

        await comment.save();

        res.json({
            status: 'success',
            data: {
                liked: !hasLiked,
                likeCount: comment.likes.length
            }
        });
    } catch (error) {
        console.error('Like comment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to like comment' });
    }
});

module.exports = router;
