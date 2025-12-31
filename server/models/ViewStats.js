const mongoose = require('mongoose');

const viewStatsSchema = new mongoose.Schema({
    movie: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LugandaMovie',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    uniqueViews: {
        type: Number,
        default: 0
    },
    watchTime: {
        type: Number, // Total watch time in seconds
        default: 0
    },
    completions: {
        type: Number, // Number of users who watched >90%
        default: 0
    },
    viewers: [{
        type: String // IP hashes or user IDs
    }]
}, {
    timestamps: true
});

// Compound index for efficient queries
viewStatsSchema.index({ movie: 1, date: 1 }, { unique: true });
viewStatsSchema.index({ date: -1 });

// Static method to record a view
viewStatsSchema.statics.recordView = async function(movieId, viewerId, watchTime = 0, completed = false) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const update = {
        $inc: { views: 1, watchTime: watchTime }
    };

    if (completed) {
        update.$inc.completions = 1;
    }

    // Check if viewer already viewed today
    const existingStats = await this.findOne({
        movie: movieId,
        date: today,
        viewers: viewerId
    });

    if (!existingStats) {
        update.$inc.uniqueViews = 1;
        update.$addToSet = { viewers: viewerId };
    }

    return this.findOneAndUpdate(
        { movie: movieId, date: today },
        update,
        { upsert: true, new: true }
    );
};

// Static method to get trending movies
viewStatsSchema.statics.getTrending = async function(days = 7, limit = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
            $group: {
                _id: '$movie',
                totalViews: { $sum: '$views' },
                totalUniqueViews: { $sum: '$uniqueViews' },
                totalWatchTime: { $sum: '$watchTime' },
                totalCompletions: { $sum: '$completions' }
            }
        },
        {
            $addFields: {
                trendScore: {
                    $add: [
                        { $multiply: ['$totalViews', 1] },
                        { $multiply: ['$totalUniqueViews', 2] },
                        { $multiply: ['$totalCompletions', 5] }
                    ]
                }
            }
        },
        { $sort: { trendScore: -1 } },
        { $limit: limit },
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
};

// Static method to get movie analytics
viewStatsSchema.statics.getMovieAnalytics = async function(movieId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.aggregate([
        {
            $match: {
                movie: mongoose.Types.ObjectId(movieId),
                date: { $gte: startDate }
            }
        },
        { $sort: { date: 1 } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' },
                totalUniqueViews: { $sum: '$uniqueViews' },
                totalWatchTime: { $sum: '$watchTime' },
                totalCompletions: { $sum: '$completions' },
                dailyStats: {
                    $push: {
                        date: '$date',
                        views: '$views',
                        uniqueViews: '$uniqueViews',
                        watchTime: '$watchTime',
                        completions: '$completions'
                    }
                }
            }
        }
    ]);
};

module.exports = mongoose.model('ViewStats', viewStatsSchema);
