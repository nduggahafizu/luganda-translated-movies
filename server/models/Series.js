const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
    episodeNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        maxlength: 1000
    },
    duration: {
        type: Number,
        required: true
    },
    video: {
        url: {
            type: String,
            required: true
        },
        quality: {
            type: String,
            enum: ['sd', 'hd', '4k'],
            default: 'hd'
        },
        size: Number
    },
    thumbnail: String,
    airDate: Date,
    views: {
        type: Number,
        default: 0
    }
}, { _id: true });

const seasonSchema = new mongoose.Schema({
    seasonNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    episodes: [episodeSchema],
    releaseYear: Number,
    poster: String
}, { _id: true });

const seriesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide a series title'],
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
    startYear: {
        type: Number,
        required: [true, 'Please provide start year']
    },
    endYear: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['ongoing', 'completed', 'cancelled'],
        default: 'ongoing'
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
    creators: [String],
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
    seasons: [seasonSchema],
    totalSeasons: {
        type: Number,
        default: 0
    },
    totalEpisodes: {
        type: Number,
        default: 0
    },
    episodeDuration: {
        type: Number,
        default: 45
    },
    network: String,
    requiredPlan: {
        type: String,
        enum: ['free', 'basic', 'premium'],
        default: 'free'
    },
    publishStatus: {
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
seriesSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    
    // Update total seasons and episodes
    this.totalSeasons = this.seasons.length;
    this.totalEpisodes = this.seasons.reduce((total, season) => {
        return total + season.episodes.length;
    }, 0);
    
    next();
});

// Increment views
seriesSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Increment episode views
seriesSchema.methods.incrementEpisodeViews = function(seasonNumber, episodeNumber) {
    const season = this.seasons.find(s => s.seasonNumber === seasonNumber);
    if (season) {
        const episode = season.episodes.find(e => e.episodeNumber === episodeNumber);
        if (episode) {
            episode.views += 1;
            return this.save();
        }
    }
    return Promise.resolve(this);
};

// Add user rating
seriesSchema.methods.addRating = function(rating) {
    const totalRatings = this.rating.totalRatings;
    const currentRating = this.rating.userRating;
    
    this.rating.userRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);
    this.rating.totalRatings += 1;
    
    return this.save();
};

// Get specific episode
seriesSchema.methods.getEpisode = function(seasonNumber, episodeNumber) {
    const season = this.seasons.find(s => s.seasonNumber === seasonNumber);
    if (season) {
        return season.episodes.find(e => e.episodeNumber === episodeNumber);
    }
    return null;
};

// Add new season
seriesSchema.methods.addSeason = function(seasonData) {
    this.seasons.push(seasonData);
    return this.save();
};

// Add episode to season
seriesSchema.methods.addEpisode = function(seasonNumber, episodeData) {
    const season = this.seasons.find(s => s.seasonNumber === seasonNumber);
    if (season) {
        season.episodes.push(episodeData);
        return this.save();
    }
    return Promise.reject(new Error('Season not found'));
};

// Static method to get trending series
seriesSchema.statics.getTrending = function(limit = 10) {
    return this.find({ publishStatus: 'published', trending: true })
        .sort('-views')
        .limit(limit);
};

// Static method to get featured series
seriesSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ publishStatus: 'published', featured: true })
        .sort('-createdAt')
        .limit(limit);
};

// Static method to search series
seriesSchema.statics.searchSeries = function(query, filters = {}) {
    const searchQuery = {
        publishStatus: 'published',
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
        searchQuery.startYear = filters.year;
    }
    
    if (filters.status) {
        searchQuery.status = filters.status;
    }
    
    return this.find(searchQuery);
};

// Indexes for better query performance
seriesSchema.index({ title: 'text', description: 'text', tags: 'text' });
seriesSchema.index({ slug: 1 });
seriesSchema.index({ genres: 1 });
seriesSchema.index({ startYear: -1 });
seriesSchema.index({ views: -1 });
seriesSchema.index({ 'rating.userRating': -1 });

module.exports = mongoose.model('Series', seriesSchema);
