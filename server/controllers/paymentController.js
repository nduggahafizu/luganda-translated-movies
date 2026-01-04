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

// @desc    Initiate Pesapal payment (Uganda Mobile Money)
// @route   POST /api/payments/pesapal/initiate
// @access  Private
exports.initiatePesapalPayment = async (req, res) => {
    try {
        const { subscriptionPlan, subscriptionDuration = 'monthly', phoneNumber, network } = req.body;

        // Validate network
        if (!['MTN', 'AIRTEL'].includes(network)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid network. Must be MTN or AIRTEL'
            });
        }

        // Get price in UGX
        const amount = SUBSCRIPTION_PRICES[subscriptionPlan][`ugx_${subscriptionDuration}`];

        // Generate unique merchant reference
        const merchantReference = `UNR-${Date.now()}-${req.user.id}`;

        // Create payment record
        const payment = await Payment.create({
            user: req.user.id,
            transactionId: merchantReference,
            amount,
            currency: 'UGX',
            paymentMethod: network === 'MTN' ? 'mtn_mobile_money' : 'airtel_money',
            paymentProvider: 'pesapal',
            status: 'pending',
            subscriptionPlan,
            subscriptionDuration,
            paymentDetails: {
                pesapalMerchantReference: merchantReference,
                phoneNumber,
                network,
                payerEmail: req.user.email,
                payerName: req.user.fullName
            }
        });

        // Prepare Pesapal request
        const pesapalData = {
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
            amount,
            currency: 'UGX',
            description: `Unruly Movies ${subscriptionPlan} subscription`,
            callback_url: `${process.env.CLIENT_URL}/payment/callback`,
            notification_id: payment._id.toString(),
            reference: merchantReference,
            email: req.user.email,
            phone_number: phoneNumber,
            payment_method: network === 'MTN' ? 'MTN Mobile Money' : 'Airtel Money'
        };

        try {
            // Make request to Pesapal API
            const response = await axios.post(
                `${process.env.PESAPAL_API_URL}/PostPesapalDirectOrderV4`,
                pesapalData
            );

            if (response.data && response.data.pesapal_tracking_id) {
                // Update payment with tracking ID
                payment.paymentDetails.pesapalTrackingId = response.data.pesapal_tracking_id;
                await payment.save();

                res.json({
                    status: 'success',
                    message: 'Payment initiated. Please complete on your phone.',
                    data: {
                        paymentId: payment._id,
                        trackingId: response.data.pesapal_tracking_id,
                        redirectUrl: response.data.redirect_url
                    }
                });
            } else {
                await payment.markAsFailed('Pesapal API error');
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to initiate payment with Pesapal'
                });
            }
        } catch (pesapalError) {
            logger.error('Pesapal API error', { error: pesapalError, requestId: req.requestId });
            await payment.markAsFailed('Pesapal connection error');
            
            res.status(500).json({
                status: 'error',
                message: 'Error connecting to payment gateway',
                error: pesapalError.message
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

// @desc    Pesapal callback
// @route   GET /api/payments/pesapal/callback
// @access  Public
exports.pesapalCallback = async (req, res) => {
    try {
        const { pesapal_merchant_reference, pesapal_transaction_tracking_id } = req.query;

        // Find payment
        const payment = await Payment.findOne({
            'paymentDetails.pesapalMerchantReference': pesapal_merchant_reference
        });

        if (!payment) {
            return res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
        }

        // Query Pesapal for payment status
        const statusResponse = await axios.get(
            `${process.env.PESAPAL_API_URL}/QueryPaymentStatus`,
            {
                params: {
                    pesapal_merchant_reference,
                    pesapal_transaction_tracking_id
                }
            }
        );

        const status = statusResponse.data.status;

        if (status === 'COMPLETED') {
            await payment.markAsCompleted();

            // Update user subscription
            const user = await User.findById(payment.user);
            user.subscription.plan = payment.subscriptionPlan;
            user.subscription.status = 'active';
            user.subscription.startDate = Date.now();
            
            const duration = payment.subscriptionDuration === 'yearly' ? 365 : 30;
            user.subscription.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
            
            await user.save();

            // Send emails
            try {
                await sendPaymentReceipt(user, payment);
                await sendSubscriptionEmail(user, payment.subscriptionPlan, payment.amount);
            } catch (emailError) {
                console.error('Email error:', emailError);
            }

            res.redirect(`${process.env.CLIENT_URL}/payment/success?payment=${payment._id}`);
        } else if (status === 'FAILED') {
            await payment.markAsFailed('Payment failed');
            res.redirect(`${process.env.CLIENT_URL}/payment/failed`);
        } else {
            res.redirect(`${process.env.CLIENT_URL}/payment/pending`);
        }
    } catch (error) {
        logger.error('PesapalCallback error', { error, requestId: req.requestId });
        res.redirect(`${process.env.CLIENT_URL}/payment/error`);
    }
};

// @desc    Pesapal IPN (Instant Payment Notification)
// @route   POST /api/payments/pesapal/ipn
// @access  Public
exports.pesapalIPN = async (req, res) => {
    try {
        const { pesapal_notification_type, pesapal_transaction_tracking_id, pesapal_merchant_reference } = req.body;

        if (pesapal_notification_type === 'CHANGE') {
            // Query payment status
            const statusResponse = await axios.get(
                `${process.env.PESAPAL_API_URL}/QueryPaymentStatus`,
                {
                    params: {
                        pesapal_merchant_reference,
                        pesapal_transaction_tracking_id
                    }
                }
            );

            const payment = await Payment.findOne({
                'paymentDetails.pesapalMerchantReference': pesapal_merchant_reference
            });

            if (payment && statusResponse.data.status === 'COMPLETED') {
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

        res.json({ status: 'success' });
    } catch (error) {
        logger.error('PesapalIPN error', { error, requestId: req.requestId });
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
