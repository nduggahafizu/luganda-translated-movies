const express = require('express');
const router = express.Router();
const VJ = require('../models/VJ');

// Get all VJs
router.get('/', async (req, res) => {
    try {
        const { 
            status = 'active',
            verified,
            featured,
            popular,
            specialty,
            limit = 50,
            page = 1,
            sort = '-rating.overall'
        } = req.query;

        const query = {};
        
        if (status) query.status = status;
        if (verified !== undefined) query.verified = verified === 'true';
        if (featured !== undefined) query.featured = featured === 'true';
        if (popular !== undefined) query.popular = popular === 'true';
        if (specialty) query.specialties = specialty;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const vjs = await VJ.find(query)
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        const total = await VJ.countDocuments(query);

        res.json({
            success: true,
            count: vjs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            data: vjs
        });
    } catch (error) {
        console.error('Error fetching VJs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching VJs',
            error: error.message
        });
    }
});

// Get VJ by slug
router.get('/:slug', async (req, res) => {
    try {
        const vj = await VJ.findOne({ slug: req.params.slug });

        if (!vj) {
            return res.status(404).json({
                success: false,
                message: 'VJ not found'
            });
        }

        res.json({
            success: true,
            data: vj
        });
    } catch (error) {
        console.error('Error fetching VJ:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching VJ',
            error: error.message
        });
    }
});

// Get popular VJs
router.get('/filter/popular', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const vjs = await VJ.getPopular(limit);

        res.json({
            success: true,
            count: vjs.length,
            data: vjs
        });
    } catch (error) {
        console.error('Error fetching popular VJs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching popular VJs',
            error: error.message
        });
    }
});

// Get featured VJs
router.get('/filter/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const vjs = await VJ.getFeatured(limit);

        res.json({
            success: true,
            count: vjs.length,
            data: vjs
        });
    } catch (error) {
        console.error('Error fetching featured VJs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching featured VJs',
            error: error.message
        });
    }
});

// Get top rated VJs
router.get('/filter/top-rated', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const vjs = await VJ.getTopRated(limit);

        res.json({
            success: true,
            count: vjs.length,
            data: vjs
        });
    } catch (error) {
        console.error('Error fetching top rated VJs:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching top rated VJs',
            error: error.message
        });
    }
});

// Search VJs
router.get('/search/:query', async (req, res) => {
    try {
        const vjs = await VJ.searchVJs(req.params.query);

        res.json({
            success: true,
            count: vjs.length,
            data: vjs
        });
    } catch (error) {
        console.error('Error searching VJs:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching VJs',
            error: error.message
        });
    }
});

module.exports = router;
