const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const airtelMoneyController = require('../controllers/airtelMoneyController');
const { protect } = require('../middleware/auth');
const { validatePayment } = require('../middleware/validation');

// Protected routes
router.post('/create-payment-intent', protect, validatePayment, paymentController.createPaymentIntent);
router.post('/stripe/confirm', protect, paymentController.confirmStripePayment);
router.post('/pesapal/initiate', protect, paymentController.initiatePesapalPayment);
router.get('/pesapal/callback', paymentController.pesapalCallback);
router.post('/pesapal/ipn', paymentController.pesapalIPN);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/:id', protect, paymentController.getPayment);

// Airtel Money Uganda routes
router.post('/airtel/initiate', protect, airtelMoneyController.initiateAirtelPayment);
router.get('/airtel/status/:transactionId', protect, airtelMoneyController.checkAirtelPaymentStatus);
router.post('/airtel/callback', airtelMoneyController.airtelCallback);
router.get('/airtel/config', airtelMoneyController.getAirtelConfig);

// Webhook routes (public)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), paymentController.stripeWebhook);

// Public test endpoints (for development/testing)
router.get('/test/config', (req, res) => {
    res.json({
        success: true,
        message: 'Payment configuration status',
        config: {
            pesapalConfigured: !!(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET),
            stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
            airtelConfigured: !!(process.env.AIRTEL_CLIENT_ID && process.env.AIRTEL_CLIENT_SECRET),
            environment: process.env.PESAPAL_ENVIRONMENT || 'not set',
            ipnUrl: process.env.PESAPAL_IPN_URL || 'not set'
        }
    });
});

// Test PesaPal token endpoint
router.get('/test/pesapal-token', async (req, res) => {
    const axios = require('axios');
    const baseUrl = process.env.PESAPAL_ENVIRONMENT === 'live' 
        ? 'https://pay.pesapal.com/v3'
        : 'https://cybqa.pesapal.com/pesapalv3';
    
    try {
        const response = await axios.post(
            `${baseUrl}/api/Auth/RequestToken`,
            {
                consumer_key: process.env.PESAPAL_CONSUMER_KEY,
                consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        res.json({
            success: true,
            message: 'PesaPal token retrieved',
            tokenReceived: !!response.data?.token,
            tokenLength: response.data?.token?.length || 0,
            expiryDate: response.data?.expiryDate,
            baseUrl: baseUrl,
            fullResponse: response.data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'PesaPal token error',
            error: error.message,
            response: error.response?.data,
            baseUrl: baseUrl
        });
    }
});

module.exports = router;
