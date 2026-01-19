const mongoose = require('mongoose');

/**
 * Token Blacklist Model
 * Stores invalidated tokens for security (logout, password change, etc.)
 * Tokens are automatically removed after expiry via TTL index
 */
const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: true
    },
    tokenType: {
        type: String,
        enum: ['access', 'refresh'],
        default: 'access'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        enum: ['logout', 'password_change', 'security_breach', 'admin_revoke', 'token_refresh'],
        default: 'logout'
    },
    blacklistedAt: {
        type: Date,
        default: Date.now
    },
    // Auto-delete after 30 days (tokens would have expired anyway)
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
        index: { expires: 0 } // TTL index - MongoDB auto-deletes
    },
    deviceInfo: {
        userAgent: String,
        ip: String
    }
}, {
    timestamps: true
});

// Compound index for faster lookups
tokenBlacklistSchema.index({ token: 1, tokenType: 1 });
tokenBlacklistSchema.index({ userId: 1, blacklistedAt: -1 });

/**
 * Static method to blacklist a token
 */
tokenBlacklistSchema.statics.blacklistToken = async function(token, userId, tokenType = 'access', reason = 'logout', deviceInfo = {}) {
    return this.create({
        token,
        userId,
        tokenType,
        reason,
        deviceInfo
    });
};

/**
 * Static method to check if token is blacklisted
 */
tokenBlacklistSchema.statics.isBlacklisted = async function(token) {
    const blacklisted = await this.findOne({ token });
    return !!blacklisted;
};

/**
 * Static method to blacklist all user tokens (security breach, password change)
 */
tokenBlacklistSchema.statics.revokeAllUserTokens = async function(userId, reason = 'security_breach') {
    // This doesn't blacklist specific tokens, but sets a flag on user
    // Handled in auth middleware by checking lastSecurityUpdate
    const User = require('./User');
    await User.findByIdAndUpdate(userId, {
        lastSecurityUpdate: new Date()
    });
    return { success: true, message: 'All user tokens invalidated' };
};

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
