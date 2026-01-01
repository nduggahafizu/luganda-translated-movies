const mongoose = require('mongoose');

const lugandaMovieSchema = new mongoose.Schema({
    // Original Movie Information
    originalTitle: {
        type: String,
        required: [true, 'Please provide the original movie title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    
    // Luganda Translation Information
    lugandaTitle: {
        type: String,
        required: [true, 'Please provide the Luganda title'],
        trim: true,
        maxlength: [200, 'Luganda title cannot be more than 200 characters']
    },
    
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    
    // VJ Translator Information
    vjName: {
        type: String,
        required: [true, 'Please provide VJ translator name'],
        trim: true
    },
    
    vjId: {
        type: String,
        trim: true
    },
    
    translationQuality: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    
    // Movie Details
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    
    lugandaDescription: {
        type: String,
        maxlength: [2000, 'Luganda description cannot be more than 2000 characters']
    },
    
    year: {
        type: Number,
        required: [true, 'Please provide release year']
    },
    
    duration: {
        type: Number,
        required: [true, 'Please provide duration in minutes']
    },
    
    // Ratings
    rating: {
        imdb: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        userRating: {
            type: Number,
            min: 0,
            max: 10,
            default: 0
        },
        totalRatings: {
            type: Number,
            default: 0
        },
        translationRating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        totalTranslationRatings: {
            type: Number,
            default: 0
        }
    },
    
    // Categories
    genres: [{
        type: String,
        enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'animation', 'fantasy', 'documentary', 'crime', 'mystery', 'adventure', 'family']
    }],
    
    // Cast and Crew
    cast: [{
        name: String,
        character: String,
        image: String
    }],
    
    director: {
        type: String,
        required: [true, 'Please provide director name']
    },
    
    writers: [String],
    
    // Language Information
    originalLanguage: {
        type: String,
        default: 'English'
    },
    
    availableLanguages: [{
        type: String,
        default: ['English', 'Luganda']
    }],
    
    country: {
        type: String,
        default: 'USA'
    },
    
    // Media Files
    poster: {
        type: String,
        required: [true, 'Please provide poster image']
    },
    
    backdrop: {
        type: String,
        default: null
    },
    
    trailer: {
        type: String,
        default: null
    },
    
    // Video Files (supports local paths until hosting is set up)
    video: {
        originalVideoPath: {
            type: String,
            required: [true, 'Please provide original video path']
        },
        lugandaVideoPath: {
            type: String,
            default: null
        },
        lugandaAudioPath: {
            type: String,
            default: null
        },
        // Embed URLs for external video hosts (Streamtape, etc.)
        embedUrl: {
            type: String,
            default: null
        },
        streamtapeId: {
            type: String,
            default: null
        },
        provider: {
            type: String,
            enum: ['local', 'streamtape', 'doodstream', 'filemoon', 'other'],
            default: 'local'
        },
        quality: {
            type: String,
            enum: ['sd', 'hd', '4k'],
            default: 'hd'
        },
        size: {
            type: Number,
            default: 0
        },
        duration: {
            type: Number,
            default: 0
        },
        format: {
            type: String,
            default: 'mp4'
        }
    },
    
    // Subtitles
    subtitles: [{
        language: {
            type: String,
            enum: ['English', 'Luganda', 'Swahili']
        },
        url: String,
        format: {
            type: String,
            default: 'srt'
        }
    }],
    
    // Access Control
    requiredPlan: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free'
    },
    
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published'
    },
    
    featured: {
        type: Boolean,
        default: false
    },
    
    trending: {
        type: Boolean,
        default: false
    },
    
    // Statistics
    views: {
        type: Number,
        default: 0
    },
    
    likes: {
        type: Number,
        default: 0
    },
    
    downloads: {
        type: Number,
        default: 0
    },
    
    // Tags and Metadata
    tags: [String],
    
    ageRating: {
        type: String,
        enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
        default: 'PG-13'
    },
    
    awards: [String],
    
    // Translation Metadata
    translationDate: {
        type: Date,
        default: Date.now
    },
    
    translationNotes: {
        type: String,
        maxlength: [500, 'Translation notes cannot exceed 500 characters']
    },
    
    // External IDs
    metaData: {
        tmdbId: String,
        imdbId: String
    },
    
    // File hosting info (for future use)
    hosting: {
        provider: {
            type: String,
            enum: ['local', 'cloudinary', 'aws', 'youtube', 'vimeo', 'custom'],
            default: 'local'
        },
        url: String,
        streamUrl: String
    }
}, {
    timestamps: true
});

// Create slug from Luganda title before saving
lugandaMovieSchema.pre('save', function(next) {
    if (this.isModified('lugandaTitle')) {
        this.slug = this.lugandaTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Increment views
lugandaMovieSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Increment downloads
lugandaMovieSchema.methods.incrementDownloads = function() {
    this.downloads += 1;
    return this.save();
};

// Add user rating for movie
lugandaMovieSchema.methods.addMovieRating = function(rating) {
    const totalRatings = this.rating.totalRatings;
    const currentRating = this.rating.userRating;
    
    this.rating.userRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);
    this.rating.totalRatings += 1;
    
    return this.save();
};

// Add translation quality rating
lugandaMovieSchema.methods.addTranslationRating = function(rating) {
    const totalRatings = this.rating.totalTranslationRatings;
    const currentRating = this.rating.translationRating;
    
    this.rating.translationRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);
    this.rating.totalTranslationRatings += 1;
    
    return this.save();
};

// Static method to get trending Luganda movies
lugandaMovieSchema.statics.getTrending = function(limit = 10) {
    return this.find({ status: 'published', trending: true })
        .sort('-views')
        .limit(limit);
};

// Static method to get featured Luganda movies
lugandaMovieSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ status: 'published', featured: true })
        .sort('-createdAt')
        .limit(limit);
};

// Static method to get latest Luganda translations
lugandaMovieSchema.statics.getLatest = function(limit = 10) {
    return this.find({ status: 'published' })
        .sort('-translationDate')
        .limit(limit);
};

// Static method to get movies by VJ
lugandaMovieSchema.statics.getByVJ = function(vjName, limit = 20) {
    return this.find({ status: 'published', vjName: vjName })
        .sort('-translationDate')
        .limit(limit);
};

// Static method to search Luganda movies
lugandaMovieSchema.statics.searchMovies = function(query, filters = {}) {
    const searchQuery = {
        status: 'published',
        $or: [
            { originalTitle: { $regex: query, $options: 'i' } },
            { lugandaTitle: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { vjName: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } }
        ]
    };
    
    if (filters.genre) {
        searchQuery.genres = filters.genre;
    }
    
    if (filters.year) {
        searchQuery.year = filters.year;
    }
    
    if (filters.quality) {
        searchQuery['video.quality'] = filters.quality;
    }
    
    if (filters.vjName) {
        searchQuery.vjName = filters.vjName;
    }
    
    if (filters.minTranslationRating) {
        searchQuery['rating.translationRating'] = { $gte: filters.minTranslationRating };
    }
    
    return this.find(searchQuery);
};

// Indexes for better query performance
lugandaMovieSchema.index({ originalTitle: 'text', lugandaTitle: 'text', description: 'text', tags: 'text', vjName: 'text' });
lugandaMovieSchema.index({ genres: 1 });
lugandaMovieSchema.index({ year: -1 });
lugandaMovieSchema.index({ views: -1 });
lugandaMovieSchema.index({ vjName: 1 });
lugandaMovieSchema.index({ translationDate: -1 });
lugandaMovieSchema.index({ 'rating.userRating': -1 });
lugandaMovieSchema.index({ 'rating.translationRating': -1 });

module.exports = mongoose.model('LugandaMovie', lugandaMovieSchema);
