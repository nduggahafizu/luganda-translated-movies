const mongoose = require('mongoose');

const emailSubscriptionSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    preferences: {
        newMovies: {
            type: Boolean,
            default: true
        },
        weeklyDigest: {
            type: Boolean,
            default: true
        },
        promotions: {
            type: Boolean,
            default: false
        },
        vjUpdates: {
            type: Boolean,
            default: false
        }
    },
    favoriteGenres: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    verificationToken: {
        type: String,
        default: null
    },
    verified: {
        type: Boolean,
        default: false
    },
    unsubscribeToken: {
        type: String,
        default: null
    },
    source: {
        type: String,
        enum: ['website', 'app', 'popup', 'footer', 'checkout'],
        default: 'website'
    },
    lastEmailSent: {
        type: Date,
        default: null
    },
    emailsSent: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Generate tokens
emailSubscriptionSchema.pre('save', function(next) {
    if (!this.unsubscribeToken) {
        this.unsubscribeToken = require('crypto').randomBytes(32).toString('hex');
    }
    if (!this.verified && !this.verificationToken) {
        this.verificationToken = require('crypto').randomBytes(32).toString('hex');
    }
    next();
});

// Static method to get active subscribers
emailSubscriptionSchema.statics.getActiveSubscribers = function(preference = 'newMovies') {
    const query = { isActive: true, verified: true };
    query[`preferences.${preference}`] = true;
    return this.find(query).select('email preferences favoriteGenres');
};

module.exports = mongoose.model('EmailSubscription', emailSubscriptionSchema);
