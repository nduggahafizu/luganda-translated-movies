const express = require('express');
const router = express.Router();
const {
    getAllMovies,
    getMovie,
    searchMovies,
    getTrending,
    getFeatured,
    getLatest,
    getByVJ,
    getAllVJs,
    rateMovie,
    rateTranslation,
    createMovie,
    updateMovie,
    deleteMovie,
    getStreamUrl
} = require('../controllers/lugandaMovieController');

// Import auth middleware (if exists)
// const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllMovies);
router.get('/search', searchMovies);
router.get('/trending', getTrending);
router.get('/featured', getFeatured);
router.get('/latest', getLatest);
router.get('/vjs', getAllVJs);
router.get('/vj/:vjName', getByVJ);
router.get('/:id', getMovie);

// Protected routes (require authentication)
// Uncomment when auth middleware is ready
// router.post('/:id/rate', protect, rateMovie);
// router.post('/:id/rate-translation', protect, rateTranslation);
// router.get('/:id/stream', protect, getStreamUrl);

// Temporary public access for development
router.post('/:id/rate', rateMovie);
router.post('/:id/rate-translation', rateTranslation);
router.get('/:id/stream', getStreamUrl);

// Admin routes (require authentication and admin role)
// Uncomment when auth middleware is ready
// router.post('/', protect, authorize('admin'), createMovie);
// router.put('/:id', protect, authorize('admin'), updateMovie);
// router.delete('/:id', protect, authorize('admin'), deleteMovie);

// Temporary public access for development
router.post('/', createMovie);
router.put('/:id', updateMovie);
router.delete('/:id', deleteMovie);

module.exports = router;
