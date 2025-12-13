const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a movie title'],
        trim: true,
        maxlength: [200, 'Title cannot be more than 200 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Please provide a description'],
        maxlength: [2000, 'Description cannot be more than 2000 characters']
    },
    year: {
        type: Number,
        required: [true, 'Please provide release year']
    },
    duration: {
        type: Number,
        required: [true, 'Please provide duration in minutes']
    },
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
        }
    },
    genres: [{
        type: String,
        enum: ['action', 'comedy', 'drama', 'horror', 'sci-fi', 'romance', 'thriller', 'animation', 'fantasy', 'documentary', 'crime', 'mystery', 'adventure', 'family']
    }],
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
    language: {
        type: String,
        default: 'English'
    },
    country: {
        type: String,
        default: 'USA'
    },
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
    video: {
        url: {
            type: String,
            required: [true, 'Please provide video URL']
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
        }
    },
    subtitles: [{
        language: String,
        url: String
    }],
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
    views: {
        type: Number,
        default: 0
    },
    likes: {
        type: Number,
        default: 0
    },
    tags: [String],
    ageRating: {
        type: String,
        enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
        default: 'PG-13'
    },
    awards: [String],
    metaData: {
        tmdbId: String,
        imdbId: String
    }
}, {
    timestamps: true
});

// Create slug from title before saving
movieSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

// Increment views
movieSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Add user rating
movieSchema.methods.addRating = function(rating) {
    const totalRatings = this.rating.totalRatings;
    const currentRating = this.rating.userRating;
    
    this.rating.userRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);
    this.rating.totalRatings += 1;
    
    return this.save();
};

// Static method to get trending movies
movieSchema.statics.getTrending = function(limit = 10) {
    return this.find({ status: 'published', trending: true })
        .sort('-views')
        .limit(limit);
};

// Static method to get featured movies
movieSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ status: 'published', featured: true })
        .sort('-createdAt')
        .limit(limit);
};

// Static method to search movies
movieSchema.statics.searchMovies = function(query, filters = {}) {
    const searchQuery = {
        status: 'published',
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
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
    
    return this.find(searchQuery);
};

// Indexes for better query performance
movieSchema.index({ title: 'text', description: 'text', tags: 'text' });
movieSchema.index({ slug: 1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ year: -1 });
movieSchema.index({ views: -1 });
movieSchema.index({ 'rating.userRating': -1 });

module.exports = mongoose.model('Movie', movieSchema);
