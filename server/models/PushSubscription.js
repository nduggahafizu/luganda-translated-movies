const mongoose = require('mongoose');

/**
 * Push Subscription Model
 * Stores Web Push API subscriptions for sending push notifications
 */
const pushSubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true,
        unique: true
    },
    keys: {
        p256dh: {
            type: String,
            required: true
        },
        auth: {
            type: String,
            required: true
        }
    },
    // Device/browser info
    device: {
        type: {
            type: String,
            enum: ['web', 'android', 'ios', 'pwa'],
            default: 'web'
        },
        browser: String,
        os: String,
        userAgent: String,
        deviceName: String // User can name their device
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
        },
        promotions: {
            type: Boolean,
            default: false
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
    // Auto-disable after too many failures
    disabledAt: Date,
    disabledReason: String
}, {
    timestamps: true
});

// Indexes for efficient querying
pushSubscriptionSchema.index({ user: 1, isActive: 1 });
pushSubscriptionSchema.index({ 'preferences.newMovies': 1, isActive: 1 });

/**
 * Get subscription object for web-push library
 */
pushSubscriptionSchema.methods.getSubscriptionObject = function() {
    return {
        endpoint: this.endpoint,
        keys: {
            p256dh: this.keys.p256dh,
            auth: this.keys.auth
        }
    };
};

/**
 * Mark subscription as failed
 */
pushSubscriptionSchema.methods.markFailed = async function() {
    this.failedAttempts += 1;
    
    // Disable after 5 consecutive failures
    if (this.failedAttempts >= 5) {
        this.isActive = false;
        this.disabledAt = new Date();
        this.disabledReason = 'Too many delivery failures';
    }
    
    return this.save();
};

/**
 * Mark subscription as used successfully
 */
pushSubscriptionSchema.methods.markUsed = async function() {
    this.lastUsed = new Date();
    this.failedAttempts = 0;
    return this.save();
};

/**
 * Static: Get all active subscriptions for a user
 */
pushSubscriptionSchema.statics.getUserSubscriptions = function(userId) {
    return this.find({ user: userId, isActive: true });
};

/**
 * Static: Get subscriptions with specific preference enabled
 */
pushSubscriptionSchema.statics.getSubscriptionsByPreference = function(preference) {
    const query = { isActive: true };
    query[`preferences.${preference}`] = true;
    return this.find(query).populate('user', 'fullName email');
};

/**
 * Static: Remove expired/invalid subscriptions
 */
pushSubscriptionSchema.statics.cleanup = async function() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await this.deleteMany({
        $or: [
            { isActive: false, disabledAt: { $lt: thirtyDaysAgo } },
            { lastUsed: { $lt: thirtyDaysAgo }, failedAttempts: { $gte: 3 } }
        ]
    });
    
    return result.deletedCount;
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
