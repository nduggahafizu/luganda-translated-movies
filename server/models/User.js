const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please provide your full name'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    avatar: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'basic', 'premium'],
            default: 'free'
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'cancelled', 'expired'],
            default: 'active'
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            default: null
        },
        autoRenew: {
            type: Boolean,
            default: false
        }
    },
    watchlist: [{
        contentType: {
            type: String,
            enum: ['movie', 'series']
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'watchlist.contentType'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    watchHistory: [{
        contentType: {
            type: String,
            enum: ['movie', 'series']
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'watchHistory.contentType'
        },
        watchedAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        episodeId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        }
    }],
    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        autoplay: {
            type: Boolean,
            default: true
        },
        quality: {
            type: String,
            enum: ['auto', 'sd', 'hd', '4k'],
            default: 'auto'
        },
        notifications: {
            email: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving (only for local users)
userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || this.provider === 'google') {
        return next();
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user has active subscription
userSchema.methods.hasActiveSubscription = function() {
    if (this.subscription.plan === 'free') return true;
    
    return this.subscription.status === 'active' && 
           (!this.subscription.endDate || this.subscription.endDate > Date.now());
};

// Check if user can access content based on subscription
userSchema.methods.canAccessContent = function(requiredPlan) {
    const planHierarchy = { free: 0, basic: 1, premium: 2 };
    const userPlanLevel = planHierarchy[this.subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];
    
    return this.hasActiveSubscription() && userPlanLevel >= requiredPlanLevel;
};

// Add to watchlist
userSchema.methods.addToWatchlist = function(contentType, contentId) {
    const exists = this.watchlist.some(
        item => item.contentId.toString() === contentId.toString()
    );
    
    if (!exists) {
        this.watchlist.push({ contentType, contentId });
    }
    
    return this.save();
};

// Remove from watchlist
userSchema.methods.removeFromWatchlist = function(contentId) {
    this.watchlist = this.watchlist.filter(
        item => item.contentId.toString() !== contentId.toString()
    );
    
    return this.save();
};

// Update watch history
userSchema.methods.updateWatchHistory = function(contentType, contentId, progress, episodeId = null) {
    const existingIndex = this.watchHistory.findIndex(
        item => item.contentId.toString() === contentId.toString() &&
                (!episodeId || item.episodeId?.toString() === episodeId.toString())
    );
    
    if (existingIndex !== -1) {
        this.watchHistory[existingIndex].progress = progress;
        this.watchHistory[existingIndex].watchedAt = Date.now();
    } else {
        this.watchHistory.push({
            contentType,
            contentId,
            progress,
            episodeId
        });
    }
    
    return this.save();
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpire;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    return user;
};

module.exports = mongoose.model('User', userSchema);
