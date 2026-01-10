const axios = require('axios');
const crypto = require('crypto');
const { logger } = require('../middleware/logger');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendPaymentReceipt, sendSubscriptionEmail } = require('../utils/email');

// Airtel Money Uganda API Configuration
const AIRTEL_CONFIG = {
    baseUrl: process.env.AIRTEL_ENVIRONMENT === 'production' 
        ? 'https://openapi.airtel.africa' 
        : 'https://openapiuat.airtel.africa',
    clientId: process.env.AIRTEL_CLIENT_ID,
    clientSecret: process.env.AIRTEL_CLIENT_SECRET,
    merchantCode: process.env.AIRTEL_MERCHANT_CODE || '3HJPY2JK',
    countryCode: 'UG', // Uganda
    currency: 'UGX'
};

// Subscription pricing in UGX
const SUBSCRIPTION_PRICES_UGX = {
    basic: {
        monthly: 17000,
        yearly: 170000
    },
    premium: {
        monthly: 55000,
        yearly: 550000
    }
};

// Store access tokens (in production, use Redis)
let accessToken = null;
let tokenExpiry = null;

/**
 * Get Airtel Money OAuth2 Access Token
 */
const getAccessToken = async () => {
    try {
        // Check if we have a valid token
        if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
            return accessToken;
        }

        const response = await axios.post(
            `${AIRTEL_CONFIG.baseUrl}/auth/oauth2/token`,
            {
                client_id: AIRTEL_CONFIG.clientId,
                client_secret: AIRTEL_CONFIG.clientSecret,
                grant_type: 'client_credentials'
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.access_token) {
            accessToken = response.data.access_token;
            // Token typically expires in 3600 seconds, set expiry 5 mins before
            tokenExpiry = Date.now() + ((response.data.expires_in || 3600) - 300) * 1000;
            return accessToken;
        }

        throw new Error('Failed to get access token');
    } catch (error) {
        logger.error('Airtel OAuth error', { error: error.message });
        throw error;
    }
};

/**
 * @desc    Initiate Airtel Money Payment
 * @route   POST /api/payments/airtel/initiate
 * @access  Private
 */
exports.initiateAirtelPayment = async (req, res) => {
    try {
        const { subscriptionPlan, subscriptionDuration = 'monthly', phoneNumber } = req.body;

        // Validate inputs
        if (!subscriptionPlan || !phoneNumber) {
            return res.status(400).json({
                status: 'error',
                message: 'Subscription plan and phone number are required'
            });
        }

        // Validate phone number format (Uganda Airtel: 070, 075, 074)
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        let formattedPhone = cleanPhone;
        
        // Handle different phone formats
        if (cleanPhone.startsWith('256')) {
            formattedPhone = cleanPhone.substring(3); // Remove country code
        } else if (cleanPhone.startsWith('0')) {
            formattedPhone = cleanPhone.substring(1); // Remove leading 0
        }

        // Validate it's an Airtel number (70, 75, 74)
        if (!['70', '75', '74'].some(prefix => formattedPhone.startsWith(prefix))) {
            return res.status(400).json({
                status: 'error',
                message: 'Please enter a valid Airtel Uganda number (070, 074, 075)'
            });
        }

        // Get price
        const amount = SUBSCRIPTION_PRICES_UGX[subscriptionPlan]?.[subscriptionDuration];
        if (!amount) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid subscription plan or duration'
            });
        }

        // Generate unique transaction reference
        const transactionRef = `UNRULY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Get access token
        const token = await getAccessToken();

        // Create payment request to Airtel
        const paymentResponse = await axios.post(
            `${AIRTEL_CONFIG.baseUrl}/merchant/v1/payments/`,
            {
                reference: transactionRef,
                subscriber: {
                    country: AIRTEL_CONFIG.countryCode,
                    currency: AIRTEL_CONFIG.currency,
                    msisdn: formattedPhone
                },
                transaction: {
                    amount: amount,
                    country: AIRTEL_CONFIG.countryCode,
                    currency: AIRTEL_CONFIG.currency,
                    id: transactionRef
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': AIRTEL_CONFIG.countryCode,
                    'X-Currency': AIRTEL_CONFIG.currency,
                    'X-Merchant-Code': AIRTEL_CONFIG.merchantCode
                }
            }
        );

        const airtelResponse = paymentResponse.data;

        // Check if request was successful
        if (airtelResponse.status && airtelResponse.status.success) {
            // Create payment record
            const payment = await Payment.create({
                user: req.user.id,
                transactionId: transactionRef,
                amount: amount,
                currency: 'UGX',
                paymentMethod: 'airtel_money',
                paymentProvider: 'airtel',
                status: 'pending',
                subscriptionPlan,
                subscriptionDuration,
                paymentDetails: {
                    airtelTransactionId: airtelResponse.data?.transaction?.id || transactionRef,
                    phoneNumber: `256${formattedPhone}`,
                    payerEmail: req.user.email,
                    payerName: req.user.fullName,
                    reference: transactionRef
                }
            });

            res.json({
                status: 'success',
                message: 'Payment request sent. Please check your phone and enter your PIN to complete the payment.',
                data: {
                    paymentId: payment._id,
                    transactionRef: transactionRef,
                    amount: amount,
                    currency: 'UGX',
                    phoneNumber: `256${formattedPhone}`
                }
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: airtelResponse.status?.message || 'Failed to initiate payment',
                code: airtelResponse.status?.code
            });
        }

    } catch (error) {
        logger.error('Airtel payment initiation error', { 
            error: error.message, 
            response: error.response?.data,
            requestId: req.requestId 
        });

        // Handle specific Airtel errors
        if (error.response?.data?.status) {
            return res.status(400).json({
                status: 'error',
                message: error.response.data.status.message || 'Payment failed',
                code: error.response.data.status.code
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to process payment. Please try again.',
            requestId: req.requestId
        });
    }
};

/**
 * @desc    Check Airtel Payment Status
 * @route   GET /api/payments/airtel/status/:transactionId
 * @access  Private
 */
exports.checkAirtelPaymentStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;

        // Find payment record
        const payment = await Payment.findOne({ transactionId });
        if (!payment) {
            return res.status(404).json({
                status: 'error',
                message: 'Payment not found'
            });
        }

        // If already completed, return current status
        if (payment.status === 'completed') {
            return res.json({
                status: 'success',
                data: {
                    paymentStatus: 'completed',
                    payment
                }
            });
        }

        // Get access token
        const token = await getAccessToken();

        // Check status with Airtel
        const statusResponse = await axios.get(
            `${AIRTEL_CONFIG.baseUrl}/standard/v1/payments/${transactionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'X-Country': AIRTEL_CONFIG.countryCode,
                    'X-Currency': AIRTEL_CONFIG.currency
                }
            }
        );

        const airtelStatus = statusResponse.data;

        if (airtelStatus.status?.success && airtelStatus.data?.transaction) {
            const txnStatus = airtelStatus.data.transaction.status;

            if (txnStatus === 'TS') { // Transaction Successful
                await processSuccessfulPayment(payment);
                
                return res.json({
                    status: 'success',
                    message: 'Payment completed successfully!',
                    data: {
                        paymentStatus: 'completed',
                        payment: await Payment.findById(payment._id)
                    }
                });
            } else if (txnStatus === 'TF') { // Transaction Failed
                payment.status = 'failed';
                payment.paymentDetails.failureReason = airtelStatus.data.transaction.message || 'Transaction failed';
                await payment.save();

                return res.json({
                    status: 'error',
                    message: 'Payment failed',
                    data: {
                        paymentStatus: 'failed',
                        reason: payment.paymentDetails.failureReason
                    }
                });
            } else { // Still pending (TIP - Transaction In Progress)
                return res.json({
                    status: 'success',
                    data: {
                        paymentStatus: 'pending',
                        message: 'Payment is being processed. Please enter your PIN on your phone.'
                    }
                });
            }
        }

        res.json({
            status: 'success',
            data: {
                paymentStatus: payment.status,
                message: 'Payment status check completed'
            }
        });

    } catch (error) {
        logger.error('Airtel status check error', { 
            error: error.message, 
            requestId: req.requestId 
        });
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to check payment status',
            requestId: req.requestId
        });
    }
};

/**
 * @desc    Airtel Money Callback/IPN
 * @route   POST /api/payments/airtel/callback
 * @access  Public
 */
exports.airtelCallback = async (req, res) => {
    try {
        logger.info('Airtel callback received', { body: req.body });

        const { transaction } = req.body;

        if (!transaction || !transaction.id) {
            return res.status(400).json({ status: 'error', message: 'Invalid callback data' });
        }

        // Find payment by transaction reference
        const payment = await Payment.findOne({ 
            $or: [
                { transactionId: transaction.id },
                { 'paymentDetails.reference': transaction.id }
            ]
        });

        if (!payment) {
            logger.warn('Payment not found for Airtel callback', { transactionId: transaction.id });
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        // Process based on status
        if (transaction.status === 'TS') { // Success
            await processSuccessfulPayment(payment);
            logger.info('Airtel payment completed via callback', { transactionId: transaction.id });
        } else if (transaction.status === 'TF') { // Failed
            payment.status = 'failed';
            payment.paymentDetails.failureReason = transaction.message || 'Transaction failed';
            await payment.save();
            logger.info('Airtel payment failed via callback', { transactionId: transaction.id });
        }

        // Always respond with 200 to acknowledge receipt
        res.json({ status: 'success', message: 'Callback processed' });

    } catch (error) {
        logger.error('Airtel callback error', { error: error.message });
        res.status(500).json({ status: 'error', message: 'Callback processing failed' });
    }
};

/**
 * Process successful payment - update user subscription
 */
async function processSuccessfulPayment(payment) {
    if (payment.status === 'completed') {
        return; // Already processed
    }

    // Update payment status
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Update user subscription
    const user = await User.findById(payment.user);
    if (user) {
        user.subscription.plan = payment.subscriptionPlan;
        user.subscription.status = 'active';
        user.subscription.startDate = new Date();
        
        // Calculate end date
        const duration = payment.subscriptionDuration === 'yearly' ? 365 : 30;
        user.subscription.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        
        await user.save();

        // Send confirmation emails
        try {
            await sendPaymentReceipt(user, payment);
            await sendSubscriptionEmail(user, payment.subscriptionPlan, payment.amount);
        } catch (emailError) {
            logger.error('Airtel payment email error', { error: emailError.message });
        }
    }
}

/**
 * @desc    Get Airtel Money Configuration Status
 * @route   GET /api/payments/airtel/config
 * @access  Public
 */
exports.getAirtelConfig = (req, res) => {
    res.json({
        status: 'success',
        data: {
            configured: !!(AIRTEL_CONFIG.clientId && AIRTEL_CONFIG.clientSecret),
            environment: process.env.AIRTEL_ENVIRONMENT || 'sandbox',
            currency: AIRTEL_CONFIG.currency,
            country: AIRTEL_CONFIG.countryCode,
            supportedPrefixes: ['070', '074', '075'],
            prices: SUBSCRIPTION_PRICES_UGX
        }
    });
};

module.exports = exports;
