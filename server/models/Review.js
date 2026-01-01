const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LugandaMovie',
        required: [true, 'Review must belong to a movie']
    },
    rating: {
        type: Number,
        required: [true, 'Please provide a rating'],
        min: [1, 'Rating must be at least 1'],
        max: [5, 'Rating cannot exceed 5']
    },
    title: {
        type: String,
        trim: true,
        maxlength: [100, 'Review title cannot exceed 100 characters']
    },
    content: {
        type: String,
        required: [true, 'Please provide review content'],
        trim: true,
        maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isSpoiler: {
        type: Boolean,
        default: false
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    helpfulCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Ensure one review per user per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });
reviewSchema.index({ movie: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

// Virtual for like count
reviewSchema.virtual('likeCount').get(function() {
    return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
reviewSchema.virtual('dislikeCount').get(function() {
    return this.dislikes ? this.dislikes.length : 0;
});

// Static method to calculate average rating for a movie
reviewSchema.statics.calcAverageRating = async function(movieId) {
    const stats = await this.aggregate([
        { $match: { movie: movieId, isHidden: false } },
        {
            $group: {
                _id: '$movie',
                nRatings: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    if (stats.length > 0) {
        await mongoose.model('LugandaMovie').findByIdAndUpdate(movieId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: Math.round(stats[0].avgRating * 10) / 10
        });
    } else {
        await mongoose.model('LugandaMovie').findByIdAndUpdate(movieId, {
            ratingsQuantity: 0,
            ratingsAverage: 0
        });
    }
};

// Update average rating after save
reviewSchema.post('save', function() {
    this.constructor.calcAverageRating(this.movie);
});

// Update average rating after delete
reviewSchema.post('remove', function() {
    this.constructor.calcAverageRating(this.movie);
});

module.exports = mongoose.model('Review', reviewSchema);
