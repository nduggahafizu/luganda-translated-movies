const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Plan & access endpoints
router.get('/plans', paymentController.getPlans);
router.get('/check-access', protect, paymentController.checkAccess);
router.post('/subscribe', protect, paymentController.subscribe);

// PesaPal routes
router.post('/pesapal/initiate', protect, paymentController.initiatePesapalPayment);
router.get('/pesapal/callback', paymentController.pesapalCallback);
router.post('/pesapal/ipn', paymentController.pesapalIPN);
router.post('/pesapal/notify', paymentController.pesapalIPN);
router.get('/pesapal/verify/:ref', protect, paymentController.verifyPesapalPayment);

// Payment history
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/:id', protect, paymentController.getPayment);

module.exports = router;
