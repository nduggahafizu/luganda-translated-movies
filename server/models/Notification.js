const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Notification must belong to a user']
    },
    type: {
        type: String,
        enum: [
            'new_movie',
            'comment_reply',
            'review_like',
            'comment_like',
            'subscription_expiring',
            'subscription_expired',
            'new_vj_movie',
            'watchlist_available',
            'system_announcement'
        ],
        required: true
    },
    title: {
        type: String,
        required: [true, 'Notification must have a title'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Notification must have a message'],
        trim: true
    },
    image: {
        type: String,
        default: null
    },
    link: {
        type: String,
        default: null
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Static method to create notification for multiple users
notificationSchema.statics.createForUsers = async function(userIds, notificationData) {
    const notifications = userIds.map(userId => ({
        user: userId,
        ...notificationData
    }));
    return this.insertMany(notifications);
};

// Static method to broadcast to all users
notificationSchema.statics.broadcast = async function(notificationData) {
    const User = mongoose.model('User');
    const users = await User.find({ isActive: true }).select('_id');
    const userIds = users.map(u => u._id);
    return this.createForUsers(userIds, notificationData);
};

module.exports = mongoose.model('Notification', notificationSchema);
