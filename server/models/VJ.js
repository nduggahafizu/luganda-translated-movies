const mongoose = require('mongoose');

/* ===================================
   VJ (Video Jockey) Model
   Ugandan Movie Translators
   =================================== */

const vjSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: [true, 'Please provide VJ name'],
        unique: true,
        trim: true
    },
    
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    
    fullName: {
        type: String,
        trim: true
    },
    
    // Profile
    bio: {
        type: String,
        maxlength: [1000, 'Bio cannot exceed 1000 characters']
    },
    
    profileImage: {
        type: String,
        default: '/assets/images/default-vj.png'
    },
    
    coverImage: {
        type: String,
        default: null
    },
    
    // Contact & Social Media
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    
    phone: {
        type: String,
        trim: true
    },
    
    socialMedia: {
        facebook: String,
        youtube: String,
        instagram: String,
        twitter: String,
        tiktok: String,
        whatsapp: String
    },
    
    website: {
        type: String,
        trim: true
    },
    
    // Professional Info
    specialties: [{
        type: String,
        enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'animation', 'fantasy', 'documentary', 'crime', 'mystery', 'adventure', 'family', 'martial-arts', 'asian-cinema', 'classic-films', 'superhero', 'suspense', 'indie', 'biography', 'war', 'history', 'epic', 'korean-drama']
    }],
    
    languages: [{
        type: String,
        default: ['Luganda', 'English']
    }],
    
    yearsActive: {
        start: {
            type: Number,
            min: 2000,
            max: new Date().getFullYear()
        },
        end: {
            type: Number,
            min: 2000,
            max: new Date().getFullYear()
        }
    },
    
    // Statistics
    stats: {
        totalMovies: {
            type: Number,
            default: 0
        },
        totalSeries: {
            type: Number,
            default: 0
        },
        totalViews: {
            type: Number,
            default: 0
        },
        totalDownloads: {
            type: Number,
            default: 0
        },
        followers: {
            type: Number,
            default: 0
        }
    },
    
    // Ratings
    rating: {
        overall: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        translationQuality: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        audioQuality: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        consistency: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        }
    },
    
    // Verification
    verified: {
        type: Boolean,
        default: false
    },
    
    verifiedDate: {
        type: Date,
        default: null
    },
    
    // External Links
    kpSoundsProfile: {
        type: String,
        trim: true
    },
    
    kpSoundsId: {
        type: String,
        trim: true
    },
    
    // Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'retired'],
        default: 'active'
    },
    
    featured: {
        type: Boolean,
        default: false
    },
    
    popular: {
        type: Boolean,
        default: false
    },
    
    // Additional Info
    achievements: [{
        title: String,
        description: String,
        date: Date
    }],
    
    awards: [{
        name: String,
        year: Number,
        category: String
    }],
    
    // Translation Style
    translationStyle: {
        type: String,
        maxlength: [500, 'Translation style description cannot exceed 500 characters']
    },
    
    signature: {
        type: String,
        maxlength: [200, 'Signature phrase cannot exceed 200 characters']
    },
    
    // Metadata
    tags: [String],
    
    notes: {
        type: String,
        maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
}, {
    timestamps: true
});

// Create slug from name before saving
vjSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Instance Methods

// Update statistics
vjSchema.methods.updateStats = async function(stats) {
    Object.assign(this.stats, stats);
    return await this.save();
};

// Increment movie count
vjSchema.methods.incrementMovieCount = async function() {
    this.stats.totalMovies += 1;
    return await this.save();
};

// Increment views
vjSchema.methods.incrementViews = async function(count = 1) {
    this.stats.totalViews += count;
    return await this.save();
};

// Add rating
vjSchema.methods.addRating = async function(ratingData) {
    const { overall, translationQuality, audioQuality, consistency } = ratingData;
    const totalRatings = this.rating.totalRatings;
    
    if (overall) {
        this.rating.overall = ((this.rating.overall * totalRatings) + overall) / (totalRatings + 1);
    }
    if (translationQuality) {
        this.rating.translationQuality = ((this.rating.translationQuality * totalRatings) + translationQuality) / (totalRatings + 1);
    }
    if (audioQuality) {
        this.rating.audioQuality = ((this.rating.audioQuality * totalRatings) + audioQuality) / (totalRatings + 1);
    }
    if (consistency) {
        this.rating.consistency = ((this.rating.consistency * totalRatings) + consistency) / (totalRatings + 1);
    }
    
    this.rating.totalRatings += 1;
    return await this.save();
};

// Static Methods

// Get popular VJs
vjSchema.statics.getPopular = function(limit = 10) {
    return this.find({ status: 'active', popular: true })
        .sort('-stats.totalViews')
        .limit(limit);
};

// Get featured VJs
vjSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ status: 'active', featured: true })
        .sort('-rating.overall')
        .limit(limit);
};

// Get top rated VJs
vjSchema.statics.getTopRated = function(limit = 10) {
    return this.find({ status: 'active' })
        .sort('-rating.overall')
        .limit(limit);
};

// Get verified VJs
vjSchema.statics.getVerified = function() {
    return this.find({ status: 'active', verified: true })
        .sort('name');
};

// Search VJs
vjSchema.statics.searchVJs = function(query) {
    return this.find({
        status: 'active',
        $or: [
            { name: { $regex: query, $options: 'i' } },
            { fullName: { $regex: query, $options: 'i' } },
            { bio: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } }
        ]
    });
};

// Get VJs by specialty
vjSchema.statics.getBySpecialty = function(specialty) {
    return this.find({ 
        status: 'active',
        specialties: specialty 
    }).sort('-rating.overall');
};

// Indexes
vjSchema.index({ status: 1 });
vjSchema.index({ verified: 1 });
vjSchema.index({ 'stats.totalViews': -1 });
vjSchema.index({ 'rating.overall': -1 });
vjSchema.index({ name: 'text', fullName: 'text', bio: 'text', tags: 'text' });

module.exports = mongoose.model('VJ', vjSchema);
