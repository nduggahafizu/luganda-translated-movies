const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/seriesController');

// Public routes
router.get('/', seriesController.getAllSeries);
router.get('/featured', seriesController.getFeaturedSeries);
router.get('/trending', seriesController.getTrendingSeries);
router.get('/search', seriesController.searchSeries);
router.get('/genre/:genre', seriesController.getSeriesByGenre);
router.get('/:id', seriesController.getSeriesById);
router.get('/:id/season/:seasonNumber', seriesController.getSeasonEpisodes);

// Admin routes (you can add authentication middleware here)
router.post('/', seriesController.createSeries);
router.put('/:id', seriesController.updateSeries);
router.delete('/:id', seriesController.deleteSeries);
router.post('/:id/season/:seasonNumber/episode', seriesController.addEpisode);

module.exports = router;
