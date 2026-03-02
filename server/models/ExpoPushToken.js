const mongoose = require('mongoose');

/**
 * Expo Push Token Model
 * Stores Expo push tokens for sending mobile push notifications
 */
const expoPushTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    pushToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    platform: {
        type: String,
        enum: ['android', 'ios'],
        required: true
    },
    // Notification preferences
    preferences: {
        newMovies: {
            type: Boolean,
            default: true
        },
        newSeries: {
            type: Boolean,
            default: true
        },
        vjUpdates: {
            type: Boolean,
            default: true
        },
        subscriptionAlerts: {
            type: Boolean,
            default: true
        },
        systemAnnouncements: {
            type: Boolean,
            default: true
        }
    },
    // Status tracking
    isActive: {
        type: Boolean,
        default: true
    },
    lastUsed: {
        type: Date,
        default: Date.now
    },
    failedAttempts: {
        type: Number,
        default: 0
    },
    disabledAt: Date,
    disabledReason: String
}, {
    timestamps: true
});

// Indexes for efficient querying
expoPushTokenSchema.index({ user: 1, isActive: 1 });
expoPushTokenSchema.index({ 'preferences.newMovies': 1, isActive: 1 });
expoPushTokenSchema.index({ platform: 1, isActive: 1 });

/**
 * Get all active tokens for sending notifications
 */
expoPushTokenSchema.statics.getActiveTokens = function(preferenceKey = null) {
    const query = { isActive: true };
    if (preferenceKey) {
        query[`preferences.${preferenceKey}`] = true;
    }
    return this.find(query).select('pushToken platform user').lean();
};

/**
 * Get tokens for a specific user
 */
expoPushTokenSchema.statics.getUserTokens = function(userId) {
    return this.find({ user: userId, isActive: true }).lean();
};

/**
 * Mark token as used successfully
 */
expoPushTokenSchema.methods.markUsed = function() {
    this.lastUsed = new Date();
    this.failedAttempts = 0;
    return this.save();
};

/**
 * Mark token as failed
 */
expoPushTokenSchema.methods.markFailed = async function() {
    this.failedAttempts += 1;
    
    // Disable after 5 consecutive failures
    if (this.failedAttempts >= 5) {
        this.isActive = false;
        this.disabledAt = new Date();
        this.disabledReason = 'Too many failed delivery attempts';
    }
    
    return this.save();
};

/**
 * Remove invalid token
 */
expoPushTokenSchema.statics.removeToken = function(pushToken) {
    return this.findOneAndDelete({ pushToken });
};

module.exports = mongoose.model('ExpoPushToken', expoPushTokenSchema);
