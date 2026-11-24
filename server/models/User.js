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
        // Nested quantifiers over overlapping character classes here used to
        // cause catastrophic backtracking (confirmed: ~34s to reject a single
        // ~45-char input, growing exponentially with length) — a crafted or
        // even accidental email could hang the entire single-threaded Node
        // process for every user on one registration request. This pattern
        // has no such ambiguity: each quantified segment is a single
        // character class, and every dot-separated group is unambiguously
        // bounded by a literal '.', so there's exactly one way to parse any
        // input — linear time. It also fixes a real rejection bug: TLDs
        // longer than 3 characters (.info, .technology) were wrongly rejected.
        match: [/^[\w.-]+@[\w-]+(\.[\w-]+)+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: function() {
            // Password is only required for non-Google users
            return !this.googleId && this.provider !== 'google';
        },
        minlength: [8, 'Password must be at least 8 characters'],
        select: false
    },
    googleId: {
        type: String,
        default: null
    },
    provider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    profileImage: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null,
        trim: true
    },
    verified: {
        type: Boolean,
        default: false
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
    canDownload: {
        type: Boolean,
        default: false
    },
    subscription: {
        plan: {
            type: String,
            enum: ['free', 'daily', 'weekly', 'biweekly', 'monthly', 'starter', 'basic', 'standard', 'premium', 'vip'],
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
    activeDevices: [{
        deviceId: String,
        userAgent: String,
        ip: String,
        lastActive: { type: Date, default: Date.now }
    }],
    watchlist: [{
        contentType: {
            type: String,
            enum: ['movie', 'series', 'LugandaMovie'],
            default: 'LugandaMovie'
        },
        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LugandaMovie'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LugandaMovie'
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
    // Optional full-access trial window (see isInTrialPeriod/canAccessContent
    // below). New accounts no longer get one automatically — this is only
    // set by a manual/admin grant. Deliberately NOT given a non-null schema
    // `default`: that would backfill onto every existing account the next
    // time anything calls .save() on it.
    trialEndsAt: {
        type: Date,
        default: null
    },
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
    lastVisit: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Account status for admin control (active, restricted, banned)
    status: {
        type: String,
        enum: ['active', 'restricted', 'banned'],
        default: 'active'
    },
    statusReason: {
        type: String,
        default: null
    },
    statusUpdatedAt: {
        type: Date,
        default: null
    },
    statusUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Security features
    lastSecurityUpdate: {
        type: Date,
        default: null
    },
    refreshTokens: [{
        token: String,
        device: String,
        ip: String,
        createdAt: { type: Date, default: Date.now },
        expiresAt: Date
    }],
    // Device tracking for security
    trustedDevices: [{
        deviceId: String,
        deviceName: String,
        browser: String,
        os: String,
        ip: String,
        lastUsed: { type: Date, default: Date.now },
        addedAt: { type: Date, default: Date.now }
    }],
    // Security settings
    security: {
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: String,
        loginAlerts: { type: Boolean, default: true },
        deviceAlerts: { type: Boolean, default: true }
    },
    // Push notification subscriptions count
    pushSubscriptionsCount: {
        type: Number,
        default: 0
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

// Still within a manually granted full-access trial window?
userSchema.methods.isInTrialPeriod = function() {
    return !!this.trialEndsAt && this.trialEndsAt > Date.now();
};

// Check if user can access content based on subscription
userSchema.methods.canAccessContent = function(requiredPlan) {
    if (this.isInTrialPeriod()) return true;

    const planHierarchy = { free: 0, starter: 1, daily: 1, basic: 2, weekly: 2, biweekly: 3, standard: 3, premium: 4, monthly: 4, vip: 5 };
    const userPlanLevel = planHierarchy[this.subscription.plan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    return this.hasActiveSubscription() && userPlanLevel >= requiredPlanLevel;
};

// Plan capabilities (owner's decision, Nov 2026):
//  - downloads on every paid plan, Daily included
//  - only the UGX 1,000 Daily plan has a device limit (1 device); every other
//    plan, the free account and the trial have no device limit
const UNLIMITED_DEVICES = Infinity;
const PLAN_CONFIG = {
    free:     { devices: UNLIMITED_DEVICES, download: false, ads: true },
    trial:    { devices: UNLIMITED_DEVICES, download: false, ads: false },
    daily:    { devices: 1,                 download: true,  ads: true },
    weekly:   { devices: UNLIMITED_DEVICES, download: true,  ads: true },
    biweekly: { devices: UNLIMITED_DEVICES, download: true,  ads: false },
    monthly:  { devices: UNLIMITED_DEVICES, download: true,  ads: false },
    starter:  { devices: UNLIMITED_DEVICES, download: true,  ads: true },
    basic:    { devices: UNLIMITED_DEVICES, download: true,  ads: true },
    standard: { devices: UNLIMITED_DEVICES, download: true,  ads: false },
    premium:  { devices: UNLIMITED_DEVICES, download: true,  ads: false },
    vip:      { devices: UNLIMITED_DEVICES, download: true,  ads: false }
};

userSchema.methods.getPlanConfig = function() {
    // A real active paid plan always wins over trial status — trialEndsAt is
    // only set once, at account creation (or by a one-off backfill), and is
    // never cleared on purchase. Checking trial first would silently
    // downgrade a paying customer (e.g. daily/download:true) to trial-level
    // access (download:false) for as long as their old trial window happens
    // to still be running. Trial is a fallback for free accounts only.
    if (this.subscription.plan !== 'free' && this.hasActiveSubscription()) {
        return PLAN_CONFIG[this.subscription.plan] || PLAN_CONFIG.free;
    }
    // Trial gets full streaming access (no device limit, no ads) but NOT
    // downloads — downloads stay a paid-only perk even during the trial.
    if (this.isInTrialPeriod()) return PLAN_CONFIG.trial;
    return PLAN_CONFIG.free;
};

// Get max allowed devices for this user (Infinity = no limit; APIs send null)
userSchema.methods.getMaxDevices = function() {
    if (this.role === 'admin') return UNLIMITED_DEVICES;
    return this.getPlanConfig().devices;
};

// Check if user can download
userSchema.methods.hasDownloadAccess = function() {
    if (this.role === 'admin') return true;
    if (this.canDownload === true) return true;
    return this.hasActiveSubscription() && this.getPlanConfig().download;
};

// Check if user should see ads
userSchema.methods.shouldSeeAds = function() {
    if (this.role === 'admin') return false;
    return this.getPlanConfig().ads;
};

userSchema.statics.PLAN_CONFIG = PLAN_CONFIG;

// Register the device making this request (one id per device and browser:
// tabs and network changes are the same device — see utils/deviceId.js).
// Returns { allowed: false } when the plan's device limit is reached (only
// Daily: 1 device) by another device used in the last 24 hours; this device
// is then not added. The site asks "Log out your other device?" on sign-in
// (GET /api/auth/device-check) and on Play/Download (DEVICE_LIMIT from
// /api/video/playback-token); Yes = POST /api/auth/device-switch.
userSchema.methods.registerDevice = function(deviceId, userAgent, ip) {
    const now = Date.now();
    const lastUsed = d => new Date(d.lastActive).getTime();

    // Forget devices not used for 24 hours
    if (this.activeDevices.some(d => lastUsed(d) <= now - 24 * 60 * 60 * 1000)) {
        this.activeDevices = this.activeDevices.filter(d => lastUsed(d) > now - 24 * 60 * 60 * 1000);
    }

    const maxDevices = this.getMaxDevices();
    // More devices listed than the plan allows (e.g. used on several devices
    // on Weekly, then bought Daily): the most recently used keep their place
    if (this.activeDevices.length > maxDevices) {
        const keep = new Set([...this.activeDevices]
            .sort((a, b) => lastUsed(b) - lastUsed(a))
            .slice(0, maxDevices)
            .map(d => d.deviceId));
        this.activeDevices = this.activeDevices.filter(d => keep.has(d.deviceId));
    }

    const existing = this.activeDevices.find(d => d.deviceId === deviceId);
    if (existing) {
        existing.lastActive = new Date();
        existing.ip = ip;
        return { allowed: true };
    }

    if (this.activeDevices.length >= maxDevices) {
        return { allowed: false };
    }
    this.activeDevices.push({ deviceId, userAgent, ip, lastActive: new Date() });
    return { allowed: true };
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

// Remove sensitive data from JSON output — this runs on every API response
// that serializes a user document (e.g. GET /api/auth/me), so anything left
// in here goes straight to the client.
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpire;
    delete user.resetPasswordToken;
    delete user.resetPasswordExpire;
    delete user.refreshTokens; // raw token strings — client never needs these
    delete user.activeDevices; // device IPs/user-agents
    delete user.trustedDevices;
    if (user.security) delete user.security.twoFactorSecret;
    return user;
};

module.exports = mongoose.model('User', userSchema);
