const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger } = require('../middleware/logger');
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendPaymentReceipt, sendSubscriptionEmail } = require('../utils/email');

// Subscription pricing
const SUBSCRIPTION_PRICES = {
    basic: {
        monthly: 7.99,
        yearly: 77.99,
        ugx_monthly: 17000,
        ugx_yearly: 170000
    },
    premium: {
        monthly: 14.99,
        yearly: 149.99,
        ugx_monthly: 55000,
        ugx_yearly: 550000
    }
};

// @desc    Create Stripe payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
exports.createPaymentIntent = async (req, res) => {
    try {
        const { subscriptionPlan, subscriptionDuration = 'monthly' } = req.body;
        
        // Get price
        const amount = SUBSCRIPTION_PRICES[subscriptionPlan][subscriptionDuration];
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                userId: req.user.id.toString(),
                subscriptionPlan,
                subscriptionDuration
            }
        });

        // Create payment record
        const payment = await Payment.create({
            user: req.user.id,
            transactionId: paymentIntent.id,
            amount,
            currency: 'USD',
            paymentMethod: 'stripe',
            paymentProvider: 'stripe',
            status: 'pending',
            subscriptionPlan,
            subscriptionDuration,
            paymentDetails: {
                stripePaymentIntentId: paymentIntent.id,
                payerEmail: req.user.email,
                payerName: req.user.fullName
            }
        });

        res.json({
            status: 'success',
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentId: payment._id
            }
        });
    } catch (error) {
        logger.error('PaymentIntent error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Confirm Stripe payment
// @route   POST /api/payments/stripe/confirm
// @access  Private
exports.confirmStripePayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === 'succeeded') {
            // Find payment record
            const payment = await Payment.findOne({
                'paymentDetails.stripePaymentIntentId': paymentIntentId
            });

            if (payment) {
                // Update payment status
                await payment.markAsCompleted();

                // Update user subscription
                const user = await User.findById(payment.user);
                user.subscription.plan = payment.subscriptionPlan;
                user.subscription.status = 'active';
                user.subscription.startDate = Date.now();
                
                // Calculate end date
                const duration = payment.subscriptionDuration === 'yearly' ? 365 : 30;
                user.subscription.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
                
                await user.save();

                // Send confirmation emails
                try {
                    await sendPaymentReceipt(user, payment);
                    await sendSubscriptionEmail(user, payment.subscriptionPlan, payment.amount);
                } catch (emailError) {
                    logger.error('Payment confirmation email error', { error: emailError, requestId: req.requestId });
                }

                res.json({
                    status: 'success',
                    message: 'Payment confirmed successfully',
                    data: {
                        payment,
                        subscription: user.subscription
                    }
                });
            } else {
                res.status(404).json({
                    status: 'error',
                    message: 'Payment record not found'
                });
            }
        } else {
            res.status(400).json({
                status: 'error',
                message: 'Payment not successful',
                paymentStatus: paymentIntent.status
            });
        }
    } catch (error) {
        logger.error('ConfirmPayment error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// PesaPal 3.0 API Configuration
const PESAPAL_CONFIG = {
    baseUrl: process.env.PESAPAL_ENVIRONMENT === 'live' 
        ? 'https://pay.pesapal.com/v3'
        : 'https://cybqa.pesapal.com/pesapalv3',
    consumerKey: process.env.PESAPAL_CONSUMER_KEY,
    consumerSecret: process.env.PESAPAL_CONSUMER_SECRET
};

// Get PesaPal OAuth Token
let pesapalToken = null;
let pesapalTokenExpiry = null;

async function getPesapalToken() {
    // Return cached token if still valid
    if (pesapalToken && pesapalTokenExpiry && Date.now() < pesapalTokenExpiry) {
        return pesapalToken;
    }
    
    try {
        const response = await axios.post(
            `${PESAPAL_CONFIG.baseUrl}/api/Auth/RequestToken`,
            {
                consumer_key: PESAPAL_CONFIG.consumerKey,
                consumer_secret: PESAPAL_CONFIG.consumerSecret
            },
            {
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
        if (response.data && response.data.token) {
            pesapalToken = response.data.token;
            // Token valid for 5 minutes, cache for 4
            pesapalTokenExpiry = Date.now() + (4 * 60 * 1000);
            return pesapalToken;
        }
        throw new Error('Failed to get PesaPal token');
    } catch (error) {
        logger.error('PesaPal token error', { error: error.message });
        throw error;
    }
}

// @desc    Initiate Pesapal payment (Uganda Mobile Money)
// @route   POST /api/payments/pesapal/initiate
// @access  Private
exports.initiatePesapalPayment = async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                status: 'error',
                message: 'User not authenticated'
            });
        }

        const { subscriptionPlan, subscriptionDuration = 'monthly', phoneNumber, amount, currency = 'UGX', description } = req.body;

        logger.info('PesaPal initiate request', { 
            userId: req.user.id,
            email: req.user.email,
            subscriptionPlan,
            subscriptionDuration,
            amount,
            phoneNumber: phoneNumber ? '***' + phoneNumber.slice(-4) : 'none'
        });

        // Get price in UGX
        const paymentAmount = amount || SUBSCRIPTION_PRICES[subscriptionPlan]?.[`ugx_${subscriptionDuration}`] || SUBSCRIPTION_PRICES[subscriptionPlan]?.ugx_monthly;

        if (!paymentAmount) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid subscription plan or amount'
            });
        }

        // Generate unique merchant reference
        const merchantReference = `UNRULY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Create payment record
        const payment = await Payment.create({
            user: req.user.id,
            transactionId: merchantReference,
            amount: paymentAmount,
            currency: 'UGX',
            paymentMethod: 'mobile_money',
            paymentProvider: 'pesapal',
            status: 'pending',
            subscriptionPlan: subscriptionPlan || 'basic',
            subscriptionDuration: subscriptionDuration || 'monthly',
            paymentDetails: {
                pesapalMerchantReference: merchantReference,
                phoneNumber: phoneNumber || '',
                payerEmail: req.user.email || '',
                payerName: req.user.fullName || req.user.name || 'Customer'
            }
        });

        try {
            // Get OAuth token
            const token = await getPesapalToken();
            
            logger.info('PesaPal token obtained', { tokenLength: token?.length });
            
            // Register IPN URL first (required by PesaPal 3.0)
            const ipnUrl = process.env.PESAPAL_IPN_URL || `https://luganda-translated-movies-production.up.railway.app/api/payments/pesapal/ipn`;
            
            let ipnId;
            try {
                const ipnResponse = await axios.post(
                    `${PESAPAL_CONFIG.baseUrl}/api/URLSetup/RegisterIPN`,
                    {
                        url: ipnUrl,
                        ipn_notification_type: 'POST'
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                ipnId = ipnResponse.data?.ipn_id;
            } catch (ipnError) {
                // IPN might already be registered, try to get existing
                logger.warn('IPN registration warning', { error: ipnError.message });
                const ipnListResponse = await axios.get(
                    `${PESAPAL_CONFIG.baseUrl}/api/URLSetup/GetIpnList`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }
                );
                ipnId = ipnListResponse.data?.[0]?.ipn_id;
            logger.info('IPN registered', { ipnId });

            // Submit order to PesaPal
            const userEmail = req.user.email || '';
            const userName = req.user.fullName || req.user.name || 'Customer';
            
            const orderData = {
                id: merchantReference,
                currency: 'UGX',
                amount: paymentAmount,
                description: description || `Unruly Movies ${subscriptionPlan || 'basic'} subscription (${subscriptionDuration || 'monthly'})`,
                callback_url: `https://watch.unrulymovies.com/payment-success.html?ref=${merchantReference}`,
                notification_id: ipnId,
                billing_address: {
                    email_address: userEmail,
                    phone_number: phoneNumber || '',
                    first_name: userName.split(' ')[0] || 'Customer',
                    last_name: userName.split(' ').slice(1).join(' ') || ''
                }
            };

            logger.info('Submitting order to PesaPal', { merchantReference, amount: paymentAmount });

            const orderResponse = await axios.post(
                `${PESAPAL_CONFIG.baseUrl}/api/Transactions/SubmitOrderRequest`,
                orderData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logger.info('PesaPal order response', { 
                status: orderResponse.status,
                hasRedirectUrl: !!orderResponse.data?.redirect_url,
                trackingId: orderResponse.data?.order_tracking_id
            });

            if (orderResponse.data && orderResponse.data.redirect_url) {
                // Update payment with tracking ID
                payment.paymentDetails.pesapalOrderTrackingId = orderResponse.data.order_tracking_id;
                await payment.save();

                res.json({
                    status: 'success',
                    message: 'Payment initiated successfully',
                    data: {
                        paymentId: payment._id,
                        merchantReference: merchantReference,
                        orderTrackingId: orderResponse.data.order_tracking_id,
                        redirectUrl: orderResponse.data.redirect_url
                    }
                });
            } else {
                throw new Error('No redirect URL received from PesaPal');
            }
        } catch (pesapalError) {
            logger.error('PesaPal API error', { 
                error: pesapalError.message, 
                response: pesapalError.response?.data,
                requestId: req.requestId 
            });
            
            payment.status = 'failed';
            payment.paymentDetails.failureReason = pesapalError.message;
            await payment.save();
            
            res.status(500).json({
                status: 'error',
                message: 'Error connecting to payment gateway: ' + (pesapalError.response?.data?.message || pesapalError.message),
                error: pesapalError.response?.data || pesapalError.message
            });
        }
    } catch (error) {
        logger.error('InitiatePesapalPayment error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Pesapal callback (redirect after payment)
// @route   GET /api/payments/pesapal/callback
// @access  Public
exports.pesapalCallback = async (req, res) => {
    try {
        const { OrderTrackingId, OrderMerchantReference } = req.query;
        
        logger.info('PesaPal callback received', { OrderTrackingId, OrderMerchantReference });

        // Find payment by merchant reference or tracking ID
        const payment = await Payment.findOne({
            $or: [
                { transactionId: OrderMerchantReference },
                { 'paymentDetails.pesapalMerchantReference': OrderMerchantReference },
                { 'paymentDetails.pesapalOrderTrackingId': OrderTrackingId }
            ]
        });

        if (!payment) {
            logger.warn('Payment not found for callback', { OrderTrackingId, OrderMerchantReference });
            return res.redirect('https://watch.unrulymovies.com/payment-failed.html');
        }

        try {
            // Get token and check transaction status
            const token = await getPesapalToken();
            
            const statusResponse = await axios.get(
                `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            const statusCode = statusResponse.data?.status_code;
            logger.info('PesaPal status check', { statusCode, data: statusResponse.data });

            if (statusCode === 1) { // Completed
                await processSuccessfulPesapalPayment(payment, statusResponse.data);
                res.redirect(`https://watch.unrulymovies.com/payment-success.html?ref=${OrderMerchantReference}`);
            } else if (statusCode === 2) { // Failed
                payment.status = 'failed';
                payment.paymentDetails.failureReason = statusResponse.data?.message || 'Payment failed';
                await payment.save();
                res.redirect('https://watch.unrulymovies.com/payment-failed.html');
            } else { // Pending
                res.redirect(`https://watch.unrulymovies.com/payment-pending.html?ref=${OrderMerchantReference}`);
            }
        } catch (statusError) {
            logger.error('Status check error', { error: statusError.message });
            res.redirect(`https://watch.unrulymovies.com/payment-pending.html?ref=${OrderMerchantReference}`);
        }
    } catch (error) {
        logger.error('PesaPal callback error', { error: error.message });
        res.redirect('https://watch.unrulymovies.com/payment-failed.html');
    }
};

// Process successful PesaPal payment
async function processSuccessfulPesapalPayment(payment, transactionData) {
    if (payment.status === 'completed') return; // Already processed
    
    payment.status = 'completed';
    payment.completedAt = new Date();
    if (transactionData) {
        payment.paymentDetails.pesapalConfirmationCode = transactionData.confirmation_code;
        payment.paymentDetails.paymentMethod = transactionData.payment_method;
    }
    await payment.save();

    // Update user subscription
    const user = await User.findById(payment.user);
    if (user) {
        user.subscription.plan = payment.subscriptionPlan;
        user.subscription.status = 'active';
        user.subscription.startDate = new Date();
        
        const duration = payment.subscriptionDuration === 'yearly' ? 365 : 30;
        user.subscription.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        
        await user.save();

        // Send emails
        try {
            await sendPaymentReceipt(user, payment);
            await sendSubscriptionEmail(user, payment.subscriptionPlan, payment.amount);
        } catch (emailError) {
            logger.error('Email error', { error: emailError.message });
        }
    }
}

// @desc    Pesapal IPN (Instant Payment Notification) - PesaPal 3.0
// @route   POST /api/payments/pesapal/ipn
// @access  Public
exports.pesapalIPN = async (req, res) => {
    try {
        const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.body;
        
        logger.info('PesaPal IPN received', { OrderTrackingId, OrderMerchantReference, OrderNotificationType });

        // Find payment
        const payment = await Payment.findOne({
            $or: [
                { transactionId: OrderMerchantReference },
                { 'paymentDetails.pesapalMerchantReference': OrderMerchantReference },
                { 'paymentDetails.pesapalOrderTrackingId': OrderTrackingId }
            ]
        });

        if (!payment) {
            logger.warn('Payment not found for IPN', { OrderTrackingId, OrderMerchantReference });
            return res.json({ 
                orderNotificationType: OrderNotificationType,
                orderTrackingId: OrderTrackingId,
                orderMerchantReference: OrderMerchantReference,
                status: 200
            });
        }

        // Get token and check transaction status
        try {
            const token = await getPesapalToken();
            
            const statusResponse = await axios.get(
                `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            const statusCode = statusResponse.data?.status_code;
            logger.info('IPN status check', { statusCode, data: statusResponse.data });

            if (statusCode === 1) { // Completed
                await processSuccessfulPesapalPayment(payment, statusResponse.data);
                logger.info('Payment completed via IPN', { OrderMerchantReference });
            } else if (statusCode === 2) { // Failed
                payment.status = 'failed';
                payment.paymentDetails.failureReason = statusResponse.data?.message || 'Payment failed';
                await payment.save();
                logger.info('Payment failed via IPN', { OrderMerchantReference });
            }
        } catch (statusError) {
            logger.error('IPN status check error', { error: statusError.message });
        }

        // Always respond with success to acknowledge receipt
        res.json({ 
            orderNotificationType: OrderNotificationType,
            orderTrackingId: OrderTrackingId,
            orderMerchantReference: OrderMerchantReference,
            status: 200
        });
    } catch (error) {
        logger.error('PesapalIPN error', { error: error.message });
        res.status(500).json({ status: 'error' });
    }
};

// @desc    Stripe webhook
// @route   POST /api/payments/stripe/webhook
// @access  Public
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        if (event.type === 'payment_intent.succeeded') {
            const paymentIntent = event.data.object;
            
            // Handle successful payment
            const payment = await Payment.findOne({
                'paymentDetails.stripePaymentIntentId': paymentIntent.id
            });

            if (payment && payment.status === 'pending') {
                await payment.markAsCompleted();

                // Update user subscription
                const user = await User.findById(payment.user);
                user.subscription.plan = payment.subscriptionPlan;
                user.subscription.status = 'active';
                user.subscription.startDate = Date.now();
                
                const duration = payment.subscriptionDuration === 'yearly' ? 365 : 30;
                user.subscription.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
                
                await user.save();
            }
        }

        res.json({ received: true });
    } catch (error) {
        logger.error('StripeWebhook error', { error, requestId: req.requestId });
        res.status(400).send('Webhook Error');
    }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const payments = await Payment.find({ user: req.user.id })
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        const total = await Payment.countDocuments({ user: req.user.id });

        res.json({
            status: 'success',
            data: {
                payments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('GetPaymentHistory error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!payment) {
            return res.status(404).json({
                status: 'error',
                message: 'Payment not found'
            });
        }

        res.json({
            status: 'success',
            data: { payment }
        });
    } catch (error) {
        logger.error('GetPayment error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};
