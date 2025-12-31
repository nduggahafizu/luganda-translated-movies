const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Comment must belong to a user']
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LugandaMovie',
        required: [true, 'Comment must belong to a movie']
    },
    content: {
        type: String,
        required: [true, 'Please provide comment content'],
        trim: true,
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    replyCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for efficient queries
commentSchema.index({ movie: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ user: 1, createdAt: -1 });

// Virtual for replies
commentSchema.virtual('replies', {
    ref: 'Comment',
    foreignField: 'parentComment',
    localField: '_id'
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Update reply count on parent comment
commentSchema.post('save', async function() {
    if (this.parentComment) {
        await mongoose.model('Comment').findByIdAndUpdate(this.parentComment, {
            $inc: { replyCount: 1 }
        });
    }
});

module.exports = mongoose.model('Comment', commentSchema);
