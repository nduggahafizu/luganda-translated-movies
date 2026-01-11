const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Site Info
    siteName: {
        type: String,
        default: 'Unruly Movies'
    },
    siteTagline: {
        type: String,
        default: 'Your Gateway to Luganda Entertainment'
    },
    siteDescription: {
        type: String,
        default: 'Watch Luganda translated movies online'
    },
    contactEmail: {
        type: String,
        default: ''
    },
    supportPhone: {
        type: String,
        default: ''
    },
    
    // Social Media
    socialMedia: {
        youtube: { type: String, default: '' },
        twitter: { type: String, default: '' },
        facebook: { type: String, default: '' },
        instagram: { type: String, default: '' },
        tiktok: { type: String, default: '' }
    },
    
    // Features
    features: {
        enableRegistration: { type: Boolean, default: true },
        enableComments: { type: Boolean, default: true },
        enableReviews: { type: Boolean, default: true },
        enableDownloads: { type: Boolean, default: false },
        enableNotifications: { type: Boolean, default: true },
        enableAds: { type: Boolean, default: false },
        maintenanceMode: { type: Boolean, default: false }
    },
    
    // Pricing/Subscription
    pricing: {
        basicPrice: { type: Number, default: 5000 },
        premiumPrice: { type: Number, default: 15000 },
        vipPrice: { type: Number, default: 30000 },
        currency: { type: String, default: 'UGX' },
        trialDays: { type: Number, default: 3 }
    },
    
    // Content
    content: {
        moviesPerPage: { type: Number, default: 20 },
        featuredMoviesCount: { type: Number, default: 5 },
        trendingMoviesCount: { type: Number, default: 10 }
    },
    
    // SEO
    seo: {
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        metaKeywords: { type: String, default: '' },
        googleAnalyticsId: { type: String, default: '' }
    },
    
    // Last updated
    updatedAt: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

settingsSchema.statics.updateSettings = async function(updates, userId) {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({ ...updates, updatedBy: userId });
    } else {
        Object.assign(settings, updates);
        settings.updatedAt = Date.now();
        settings.updatedBy = userId;
        await settings.save();
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
