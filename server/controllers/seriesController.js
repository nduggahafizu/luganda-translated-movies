const LugandaMovie = require('../models/LugandaMovie');

// Web push notifications — optional, won't crash if not configured
let notifyNewSeriesPush = async () => {};
try {
    notifyNewSeriesPush = require('../services/pushService').notifyNewSeriesPush;
} catch (e) {
    console.warn('Push service unavailable:', e.message);
}

// Helper function to transform LugandaMovie to series format for frontend compatibility
const transformToSeriesFormat = (movie) => {
    if (!movie) return null;
    
    const data = movie.toObject ? movie.toObject() : movie;
    
    return {
        _id: data._id,
        slug: data.slug,
        title: data.originalTitle || data.lugandaTitle,
        originalTitle: data.originalTitle,
        lugandaTitle: data.lugandaTitle,
        description: data.description,
        poster: data.poster,
        backdrop: data.backdrop,
        year: data.year,
        startYear: data.year,
        genres: data.genres || [],
        rating: data.rating,
        status: data.seriesStatus === 'Ended' ? 'completed' : 'ongoing',
        translator: {
            name: data.vjName || 'Unknown VJ'
        },
        vjName: data.vjName,
        seasons: data.seasons || [],
        totalSeasons: data.totalSeasons || 0,
        totalEpisodes: data.totalEpisodes || 0,
        cast: data.cast || [],
        director: data.director,
        networks: data.networks || [],
        views: data.views || 0,
        likes: data.likes || 0,
        isFeatured: data.featured,
        isTrending: data.trending,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
    };
};

// Get all series with pagination and filters
exports.getAllSeries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Build filter object - filter for series content type
        const filter = { 
            contentType: 'series'
        };
        
        // Only filter by status if explicitly requested (allow all series by default)
        if (req.query.published === 'true') {
            filter.status = 'published';
        }
        
        if (req.query.genre) {
            filter.genres = { $in: [new RegExp(req.query.genre, 'i')] };
        }
        
        if (req.query.year) {
            filter.year = parseInt(req.query.year);
        }
        
        if (req.query.status === 'ongoing') {
            filter.seriesStatus = { $ne: 'Ended' };
        } else if (req.query.status === 'completed') {
            filter.seriesStatus = 'Ended';
        }
        
        if (req.query.vj) {
            filter.vjName = new RegExp(req.query.vj, 'i');
        }
        
        // Build sort object
        let sort = { createdAt: -1 };
        if (req.query.sort === 'rating') {
            sort = { 'rating.imdb': -1 };
        } else if (req.query.sort === 'views') {
            sort = { views: -1 };
        } else if (req.query.sort === 'title') {
            sort = { originalTitle: 1 };
        } else if (req.query.sort === 'year') {
            sort = { year: -1 };
        }
        
        const series = await LugandaMovie.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-seasons.episodes.video');
            
        const total = await LugandaMovie.countDocuments(filter);
        
        res.json({
            success: true,
            data: series.map(transformToSeriesFormat),
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching series:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching series',
            error: error.message
        });
    }
};

// Get single series by ID or slug
exports.getSeriesById = async (req, res) => {
    try {
        const { id } = req.params;
        
        let series;
        // First try to find by ID with contentType series
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            series = await LugandaMovie.findOne({ _id: id, contentType: 'series' });
            // Fallback: try finding by ID without contentType filter
            if (!series) {
                series = await LugandaMovie.findOne({ _id: id });
            }
        } else {
            series = await LugandaMovie.findOne({ slug: id, contentType: 'series' });
            // Fallback: try finding by slug without contentType filter
            if (!series) {
                series = await LugandaMovie.findOne({ slug: id });
            }
        }
        
        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }
        
        // Increment views
        series.views = (series.views || 0) + 1;
        await series.save();
        
        res.json({
            success: true,
            data: transformToSeriesFormat(series)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching series',
            error: error.message
        });
    }
};

// Get episodes for a specific season
exports.getSeasonEpisodes = async (req, res) => {
    try {
        const { id, seasonNumber } = req.params;
        
        let series;
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            series = await LugandaMovie.findOne({ _id: id, contentType: 'series' });
        } else {
            series = await LugandaMovie.findOne({ slug: id, contentType: 'series' });
        }
        
        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }
        
        const season = series.seasons.find(s => s.seasonNumber === parseInt(seasonNumber));
        
        if (!season) {
            return res.status(404).json({
                success: false,
                message: 'Season not found'
            });
        }
        
        res.json({
            success: true,
            data: {
                seriesId: series._id,
                seriesTitle: series.originalTitle,
                seasonNumber: season.seasonNumber,
                seasonTitle: season.name,
                posterPath: season.posterPath,
                overview: season.overview,
                episodes: season.episodes
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching episodes',
            error: error.message
        });
    }
};

// Get featured/popular series
exports.getFeaturedSeries = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const series = await LugandaMovie.find({ 
            contentType: 'series', 
            status: 'published',
            featured: true 
        })
            .sort({ 'rating.imdb': -1 })
            .limit(limit)
            .select('-seasons.episodes.video');
            
        res.json({
            success: true,
            data: series.map(transformToSeriesFormat)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching featured series',
            error: error.message
        });
    }
};

// Get trending series
exports.getTrendingSeries = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const series = await LugandaMovie.find({ 
            contentType: 'series',
            status: 'published'
        })
            .sort({ views: -1, 'rating.imdb': -1 })
            .limit(limit)
            .select('-seasons.episodes.video');
            
        res.json({
            success: true,
            data: series.map(transformToSeriesFormat)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching trending series',
            error: error.message
        });
    }
};

// Create new series (Admin only)
exports.createSeries = async (req, res) => {
    try {
        const seriesData = {
            ...req.body,
            contentType: 'series'
        };
        
        const series = await LugandaMovie.create(seriesData);

        // Notify subscribed users — fire and forget, don't block the response
        notifyNewSeriesPush(series).catch(err =>
            console.warn('Series push notification failed:', err.message)
        );

        res.status(201).json({
            success: true,
            data: transformToSeriesFormat(series),
            message: 'Series created successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating series',
            error: error.message
        });
    }
};

// Update series (Admin only)
exports.updateSeries = async (req, res) => {
    try {
        const series = await LugandaMovie.findOneAndUpdate(
            { _id: req.params.id, contentType: 'series' },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }
        
        res.json({
            success: true,
            data: transformToSeriesFormat(series),
            message: 'Series updated successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating series',
            error: error.message
        });
    }
};

// Delete series (Admin only)
exports.deleteSeries = async (req, res) => {
    try {
        const series = await LugandaMovie.findOneAndDelete({ 
            _id: req.params.id, 
            contentType: 'series' 
        });
        
        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Series deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting series',
            error: error.message
        });
    }
};

// Add episode to season
exports.addEpisode = async (req, res) => {
    try {
        const { id, seasonNumber } = req.params;
        
        const series = await LugandaMovie.findOne({ _id: id, contentType: 'series' });
        
        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }
        
        const seasonIndex = series.seasons.findIndex(s => s.seasonNumber === parseInt(seasonNumber));
        
        if (seasonIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Season not found'
            });
        }
        
        series.seasons[seasonIndex].episodes.push(req.body);
        series.totalEpisodes = series.seasons.reduce((sum, s) => sum + s.episodes.length, 0);
        await series.save();
        
        res.status(201).json({
            success: true,
            data: series.seasons[seasonIndex],
            message: 'Episode added successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error adding episode',
            error: error.message
        });
    }
};

// Search series
exports.searchSeries = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query required'
            });
        }
        
        const series = await LugandaMovie.find({
            contentType: 'series',
            status: 'published',
            $or: [
                { originalTitle: { $regex: q, $options: 'i' } },
                { lugandaTitle: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { vjName: { $regex: q, $options: 'i' } }
            ]
        })
        .limit(20)
        .select('-seasons.episodes.video');
        
        res.json({
            success: true,
            data: series.map(transformToSeriesFormat),
            count: series.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching series',
            error: error.message
        });
    }
};

// Get series by genre
exports.getSeriesByGenre = async (req, res) => {
    try {
        const { genre } = req.params;
        const limit = parseInt(req.query.limit) || 20;
        
        const series = await LugandaMovie.find({ 
            contentType: 'series',
            status: 'published',
            genres: { $in: [new RegExp(genre, 'i')] } 
        })
            .sort({ 'rating.imdb': -1 })
            .limit(limit)
            .select('-seasons.episodes.video');
            
        res.json({
            success: true,
            data: series.map(transformToSeriesFormat),
            count: series.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching series by genre',
            error: error.message
        });
    }
};
