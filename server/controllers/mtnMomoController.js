/**
 * MTN Mobile Money Uganda Controller
 * Handles MTN MoMo payments for Uganda market
 * API Documentation: https://momodeveloper.mtn.com/
 */

const axios = require('axios');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../middleware/logger');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendPaymentReceipt, sendSubscriptionEmail } = require('../utils/email');

// MTN MoMo Configuration
const MOMO_CONFIG = {
    // Sandbox: https://sandbox.momodeveloper.mtn.com
    // Production: https://proxy.momoapi.mtn.com
    baseUrl: process.env.MTN_MOMO_ENVIRONMENT === 'production'
        ? 'https://proxy.momoapi.mtn.com'
        : 'https://sandbox.momodeveloper.mtn.com',
    subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY,
    apiUser: process.env.MTN_MOMO_API_USER,
    apiKey: process.env.MTN_MOMO_API_KEY,
    callbackUrl: process.env.MTN_MOMO_CALLBACK_URL || `${process.env.BACKEND_URL}/api/payments/mtn/callback`,
    environment: process.env.MTN_MOMO_ENVIRONMENT || 'sandbox',
    currency: 'UGX'
};

// Subscription pricing in UGX
const SUBSCRIPTION_PRICES_UGX = {
    basic: {
        weekly: 5000,
        monthly: 17000,
        yearly: 170000
    },
    premium: {
        weekly: 15000,
        monthly: 55000,
        yearly: 550000
    }
};

/**
 * Get MTN MoMo Access Token
 */
async function getMoMoToken() {
    try {
        const credentials = Buffer.from(
            `${MOMO_CONFIG.apiUser}:${MOMO_CONFIG.apiKey}`
        ).toString('base64');

        const response = await axios.post(
            `${MOMO_CONFIG.baseUrl}/collection/token/`,
            {},
            {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.access_token;
    } catch (error) {
        logger.error('MTN MoMo token error', { error: error.message });
        throw new Error('Failed to authenticate with MTN MoMo');
    }
}

/**
 * @desc    Get MTN MoMo configuration (public)
 * @route   GET /api/payments/mtn/config
 * @access  Public
 */
exports.getMtnConfig = (req, res) => {
    res.json({
        status: 'success',
        data: {
            configured: !!(MOMO_CONFIG.subscriptionKey && MOMO_CONFIG.apiKey),
            currency: MOMO_CONFIG.currency,
            environment: MOMO_CONFIG.environment,
            prices: SUBSCRIPTION_PRICES_UGX,
            supportedPlans: ['basic', 'premium'],
            supportedDurations: ['weekly', 'monthly', 'yearly']
        }
    });
};

/**
 * @desc    Initiate MTN MoMo payment
 * @route   POST /api/payments/mtn/initiate
 * @access  Private
 */
exports.initiateMtnPayment = async (req, res) => {
    try {
        const { phoneNumber, subscriptionPlan, subscriptionDuration = 'monthly' } = req.body;

        // Validate inputs
        if (!phoneNumber || !subscriptionPlan) {
            return res.status(400).json({
                status: 'error',
                message: 'Phone number and subscription plan are required'
            });
        }

        // Validate plan
        if (!SUBSCRIPTION_PRICES_UGX[subscriptionPlan]) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid subscription plan. Choose basic or premium.'
            });
        }

        // Validate duration
        if (!SUBSCRIPTION_PRICES_UGX[subscriptionPlan][subscriptionDuration]) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid duration. Choose weekly, monthly, or yearly.'
            });
        }

        // Format phone number (Uganda format: 256XXXXXXXXX)
        let formattedPhone = phoneNumber.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '256' + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('256')) {
            formattedPhone = '256' + formattedPhone;
        }

        // Validate Uganda MTN number (should be 256 7XX XXX XXX)
        const mtnPrefixes = ['256770', '256771', '256772', '256773', '256774', '256775', '256776', '256777', '256778', '256779', '25678'];
        const isValidMtn = mtnPrefixes.some(prefix => formattedPhone.startsWith(prefix));
        
        if (!isValidMtn || formattedPhone.length !== 12) {
            return res.status(400).json({
                status: 'error',
                message: 'Please enter a valid MTN Uganda number (e.g., 0771234567)'
            });
        }

        const amount = SUBSCRIPTION_PRICES_UGX[subscriptionPlan][subscriptionDuration];
        const referenceId = uuidv4();
        const externalId = `UNRULY-${Date.now()}-${req.user._id.toString().slice(-6)}`;

        // Get access token
        const accessToken = await getMoMoToken();

        // Create payment request
        const paymentPayload = {
            amount: amount.toString(),
            currency: MOMO_CONFIG.currency,
            externalId: externalId,
            payer: {
                partyIdType: 'MSISDN',
                partyId: formattedPhone
            },
            payerMessage: `Unruly Movies ${subscriptionPlan} subscription (${subscriptionDuration})`,
            payeeNote: `Payment for ${subscriptionPlan} plan - User: ${req.user.email}`
        };

        // Send payment request to MTN
        const response = await axios.post(
            `${MOMO_CONFIG.baseUrl}/collection/v1_0/requesttopay`,
            paymentPayload,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Reference-Id': referenceId,
                    'X-Target-Environment': MOMO_CONFIG.environment,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey,
                    'Content-Type': 'application/json',
                    'X-Callback-Url': MOMO_CONFIG.callbackUrl
                }
            }
        );

        // Create payment record
        const payment = await Payment.create({
            user: req.user._id,
            transactionId: referenceId,
            amount: amount,
            currency: 'UGX',
            paymentMethod: 'mobile_money',
            paymentProvider: 'mtn_momo',
            status: 'pending',
            subscriptionPlan,
            subscriptionDuration,
            paymentDetails: {
                mtnReferenceId: referenceId,
                externalId: externalId,
                phoneNumber: formattedPhone,
                payerEmail: req.user.email,
                payerName: req.user.fullName
            }
        });

        logger.info('MTN MoMo payment initiated', {
            userId: req.user._id,
            referenceId,
            amount,
            phone: formattedPhone.slice(0, 6) + '***'
        });

        res.json({
            status: 'success',
            message: 'Payment request sent. Please check your phone and enter your MTN MoMo PIN.',
            data: {
                paymentId: payment._id,
                referenceId: referenceId,
                amount: amount,
                currency: 'UGX',
                phoneNumber: formattedPhone.slice(0, 6) + '****' + formattedPhone.slice(-2)
            }
        });

    } catch (error) {
        logger.error('MTN MoMo initiate error', { 
            error: error.message,
            response: error.response?.data 
        });

        res.status(500).json({
            status: 'error',
            message: error.response?.data?.message || 'Failed to initiate MTN MoMo payment. Please try again.',
            code: error.response?.data?.code
        });
    }
};

/**
 * @desc    Check MTN MoMo payment status
 * @route   GET /api/payments/mtn/status/:referenceId
 * @access  Private
 */
exports.checkMtnPaymentStatus = async (req, res) => {
    try {
        const { referenceId } = req.params;

        // Find payment
        const payment = await Payment.findOne({
            'paymentDetails.mtnReferenceId': referenceId,
            user: req.user._id
        });

        if (!payment) {
            return res.status(404).json({
                status: 'error',
                message: 'Payment not found'
            });
        }

        // If already completed, return status
        if (payment.status === 'completed') {
            return res.json({
                status: 'success',
                data: {
                    paymentStatus: 'SUCCESSFUL',
                    subscriptionActivated: true,
                    payment: payment
                }
            });
        }

        // Get fresh status from MTN
        const accessToken = await getMoMoToken();

        const response = await axios.get(
            `${MOMO_CONFIG.baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-Target-Environment': MOMO_CONFIG.environment,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey
                }
            }
        );

        const mtnStatus = response.data.status;

        // Update payment based on MTN status
        if (mtnStatus === 'SUCCESSFUL') {
            await processSuccessfulPayment(payment, response.data);
            
            return res.json({
                status: 'success',
                data: {
                    paymentStatus: 'SUCCESSFUL',
                    subscriptionActivated: true,
                    message: 'Payment successful! Your subscription is now active.'
                }
            });
        } else if (mtnStatus === 'FAILED') {
            payment.status = 'failed';
            payment.paymentDetails.failureReason = response.data.reason || 'Payment failed';
            await payment.save();

            return res.json({
                status: 'success',
                data: {
                    paymentStatus: 'FAILED',
                    reason: response.data.reason || 'Payment was not completed',
                    message: 'Payment failed. Please try again.'
                }
            });
        } else if (mtnStatus === 'REJECTED') {
            payment.status = 'failed';
            payment.paymentDetails.failureReason = 'User rejected the payment';
            await payment.save();

            return res.json({
                status: 'success',
                data: {
                    paymentStatus: 'REJECTED',
                    message: 'Payment was rejected. Please try again.'
                }
            });
        } else {
            // Still pending
            return res.json({
                status: 'success',
                data: {
                    paymentStatus: 'PENDING',
                    message: 'Payment is still processing. Please complete on your phone.'
                }
            });
        }

    } catch (error) {
        logger.error('MTN MoMo status check error', { 
            error: error.message,
            referenceId: req.params.referenceId 
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to check payment status'
        });
    }
};

/**
 * @desc    MTN MoMo callback handler
 * @route   POST /api/payments/mtn/callback
 * @access  Public (webhook)
 */
exports.mtnCallback = async (req, res) => {
    try {
        logger.info('MTN MoMo callback received', { body: req.body });

        const { externalId, status, financialTransactionId, reason } = req.body;

        // Find payment by external ID
        const payment = await Payment.findOne({
            'paymentDetails.externalId': externalId
        });

        if (!payment) {
            logger.warn('MTN callback - Payment not found', { externalId });
            return res.status(200).send('OK'); // Always return 200 to MTN
        }

        if (status === 'SUCCESSFUL') {
            payment.paymentDetails.mtnFinancialTransactionId = financialTransactionId;
            await processSuccessfulPayment(payment, req.body);
        } else if (status === 'FAILED' || status === 'REJECTED') {
            payment.status = 'failed';
            payment.paymentDetails.failureReason = reason || status;
            await payment.save();
        }

        res.status(200).send('OK');

    } catch (error) {
        logger.error('MTN callback error', { error: error.message });
        res.status(200).send('OK'); // Always return 200 to MTN
    }
};

/**
 * Process successful payment - activate subscription
 */
async function processSuccessfulPayment(payment, mtnData) {
    try {
        // Update payment status
        payment.status = 'completed';
        payment.completedAt = new Date();
        if (mtnData.financialTransactionId) {
            payment.paymentDetails.mtnFinancialTransactionId = mtnData.financialTransactionId;
        }
        await payment.save();

        // Update user subscription
        const user = await User.findById(payment.user);
        
        if (user) {
            user.subscription.plan = payment.subscriptionPlan;
            user.subscription.status = 'active';
            user.subscription.startDate = new Date();
            
            // Calculate end date based on duration
            let durationDays;
            switch (payment.subscriptionDuration) {
                case 'weekly':
                    durationDays = 7;
                    break;
                case 'monthly':
                    durationDays = 30;
                    break;
                case 'yearly':
                    durationDays = 365;
                    break;
                default:
                    durationDays = 30;
            }
            
            user.subscription.endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
            await user.save();

            // Send confirmation emails
            try {
                await sendPaymentReceipt(user, payment);
                await sendSubscriptionEmail(user, payment.subscriptionPlan, payment.amount);
            } catch (emailError) {
                logger.error('Payment email error', { error: emailError.message });
            }

            logger.info('MTN MoMo payment completed', {
                userId: user._id,
                plan: payment.subscriptionPlan,
                duration: payment.subscriptionDuration,
                amount: payment.amount
            });
        }

        return true;
    } catch (error) {
        logger.error('Process payment error', { error: error.message });
        throw error;
    }
}

/**
 * @desc    Get MTN MoMo payment history
 * @route   GET /api/payments/mtn/history
 * @access  Private
 */
exports.getMtnPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({
            user: req.user._id,
            paymentProvider: 'mtn_momo'
        }).sort({ createdAt: -1 }).limit(20);

        res.json({
            status: 'success',
            data: { payments }
        });
    } catch (error) {
        logger.error('Get MTN history error', { error: error.message });
        res.status(500).json({
            status: 'error',
            message: 'Failed to get payment history'
        });
    }
};

/**
 * @desc    Create MTN MoMo API User (Sandbox setup)
 * @route   POST /api/payments/mtn/setup-sandbox
 * @access  Admin only (for initial setup)
 */
exports.setupSandbox = async (req, res) => {
    try {
        const referenceId = uuidv4();
        
        // Create API User
        await axios.post(
            `${MOMO_CONFIG.baseUrl}/v1_0/apiuser`,
            {
                providerCallbackHost: new URL(MOMO_CONFIG.callbackUrl).host
            },
            {
                headers: {
                    'X-Reference-Id': referenceId,
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Get API Key
        const keyResponse = await axios.post(
            `${MOMO_CONFIG.baseUrl}/v1_0/apiuser/${referenceId}/apikey`,
            {},
            {
                headers: {
                    'Ocp-Apim-Subscription-Key': MOMO_CONFIG.subscriptionKey
                }
            }
        );

        res.json({
            status: 'success',
            message: 'Sandbox credentials created. Add these to your .env file:',
            data: {
                MTN_MOMO_API_USER: referenceId,
                MTN_MOMO_API_KEY: keyResponse.data.apiKey
            }
        });

    } catch (error) {
        logger.error('MTN sandbox setup error', { 
            error: error.message,
            response: error.response?.data 
        });
        res.status(500).json({
            status: 'error',
            message: 'Failed to setup sandbox',
            error: error.response?.data || error.message
        });
    }
};
