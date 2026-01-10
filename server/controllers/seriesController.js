const Series = require('../models/Series');

// Get all series with pagination and filters
exports.getAllSeries = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        
        if (req.query.genre) {
            filter.genres = { $in: [req.query.genre] };
        }
        
        if (req.query.year) {
            filter.startYear = parseInt(req.query.year);
        }
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.vj) {
            filter['translator.name'] = new RegExp(req.query.vj, 'i');
        }
        
        // Build sort object
        let sort = { createdAt: -1 };
        if (req.query.sort === 'rating') {
            sort = { 'rating.imdb': -1 };
        } else if (req.query.sort === 'views') {
            sort = { views: -1 };
        } else if (req.query.sort === 'title') {
            sort = { title: 1 };
        } else if (req.query.sort === 'year') {
            sort = { startYear: -1 };
        }
        
        const series = await Series.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-seasons.episodes.video');
            
        const total = await Series.countDocuments(filter);
        
        res.json({
            success: true,
            data: series,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
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
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            series = await Series.findById(id);
        } else {
            series = await Series.findOne({ slug: id });
        }
        
        if (!series) {
            return res.status(404).json({
                success: false,
                message: 'Series not found'
            });
        }
        
        // Increment views
        series.views += 1;
        await series.save();
        
        res.json({
            success: true,
            data: series
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
        
        const series = await Series.findById(id);
        
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
                seriesTitle: series.title,
                seasonNumber: season.seasonNumber,
                seasonTitle: season.title,
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
        
        const series = await Series.find({ isFeatured: true })
            .sort({ 'rating.imdb': -1 })
            .limit(limit)
            .select('-seasons.episodes.video');
            
        res.json({
            success: true,
            data: series
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
        
        const series = await Series.find()
            .sort({ views: -1, 'rating.imdb': -1 })
            .limit(limit)
            .select('-seasons.episodes.video');
            
        res.json({
            success: true,
            data: series
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
        const series = await Series.create(req.body);
        
        res.status(201).json({
            success: true,
            data: series,
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
        const series = await Series.findByIdAndUpdate(
            req.params.id,
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
            data: series,
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
        const series = await Series.findByIdAndDelete(req.params.id);
        
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
        
        const series = await Series.findById(id);
        
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
        
        const series = await Series.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } },
                { 'translator.name': { $regex: q, $options: 'i' } }
            ]
        })
        .limit(20)
        .select('-seasons.episodes.video');
        
        res.json({
            success: true,
            data: series,
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
        
        const series = await Series.find({ genres: { $in: [genre] } })
            .sort({ 'rating.imdb': -1 })
            .limit(limit)
            .select('-seasons.episodes.video');
            
        res.json({
            success: true,
            data: series,
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
