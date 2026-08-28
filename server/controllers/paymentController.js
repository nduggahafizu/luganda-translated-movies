const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { logger } = require('../middleware/logger');
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const UnmatchedPayment = require('../models/UnmatchedPayment');
const { sendPaymentReceipt, sendSubscriptionEmail } = require('../utils/email');

// Subscription pricing
const SUBSCRIPTION_PRICES = {
    daily:    { ugx: 1000,  days: 1 },
    weekly:   { ugx: 5000,  days: 7 },
    biweekly: { ugx: 7000,  days: 14 },
    monthly:  { ugx: 12000, days: 30 }
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
                const duration = SUBSCRIPTION_PRICES[payment.subscriptionPlan]?.days || 30;
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
        const planConfig = SUBSCRIPTION_PRICES[subscriptionPlan];
        const paymentAmount = amount || planConfig?.ugx;

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
            paymentMethod: 'pesapal',
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
            const ipnUrl = process.env.PESAPAL_IPN_URL || `http://localhost:5000/api/payments/pesapal/ipn`;
            
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
            }

            logger.info('IPN registered', { ipnId });

            // Submit order to PesaPal
            const userEmail = req.user.email || '';
            const userName = req.user.fullName || req.user.name || 'Customer';
            
            const orderData = {
                id: merchantReference,
                currency: 'UGX',
                amount: paymentAmount,
                description: description || `Unruly Movies ${subscriptionPlan || 'basic'} subscription (${subscriptionDuration || 'monthly'})`,
                callback_url: process.env.PESAPAL_CALLBACK_URL || `https://unrulymovies.com/payment-success.html?ref=${merchantReference}`,
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
                trackingId: orderResponse.data?.order_tracking_id,
                // Full body logged only when redirect_url is missing — PesaPal
                // often returns 200 with an error/message field describing why
                // (invalid billing field, unwhitelisted callback domain, amount
                // below minimum, etc.) instead of a non-2xx status, and the
                // previous logging didn't capture that, making failures like
                // this unguessable from logs alone.
                fullResponse: orderResponse.data?.redirect_url ? undefined : orderResponse.data
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
                const pesapalReason =
                    orderResponse.data?.error?.message ||
                    orderResponse.data?.message ||
                    JSON.stringify(orderResponse.data);
                throw new Error(`No redirect URL received from PesaPal: ${pesapalReason}`);
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
            return res.redirect('https://unrulymovies.com/payment-failed.html');
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
                res.redirect(`https://unrulymovies.com/payment-success.html?ref=${OrderMerchantReference}`);
            } else if (statusCode === 2) { // Failed
                payment.status = 'failed';
                payment.paymentDetails.failureReason = statusResponse.data?.message || 'Payment failed';
                await payment.save();
                res.redirect('https://unrulymovies.com/payment-failed.html');
            } else { // Pending
                res.redirect(`https://unrulymovies.com/payment-pending.html?ref=${OrderMerchantReference}`);
            }
        } catch (statusError) {
            logger.error('Status check error', { error: statusError.message });
            res.redirect(`https://unrulymovies.com/payment-pending.html?ref=${OrderMerchantReference}`);
        }
    } catch (error) {
        logger.error('PesaPal callback error', { error: error.message });
        res.redirect('https://unrulymovies.com/payment-failed.html');
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
        
        const duration = SUBSCRIPTION_PRICES[payment.subscriptionPlan]?.days || 30;
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

// Uganda mobile numbers vary in stored format (+256..., 256..., 07..., 7...).
// Compare only the last 9 digits (the subscriber number without country/trunk prefix).
function phoneSuffix(phone) {
    if (!phone) return null;
    const digits = String(phone).replace(/\D/g, '');
    return digits.length >= 9 ? digits.slice(-9) : null;
}

// A PesaPal transaction came back completed but has no local Payment record
// (checkout initiated outside our own /pesapal/initiate flow — a payment
// link, USSD push, etc.). Best-effort match it to a real user by the payer's
// mobile money number and the paid amount; if not confidently matched, log
// it for manual admin review instead of silently dropping it.
async function reconcileUnmatchedPesapalTransaction(statusData) {
    const trackingId = statusData.order_tracking_id;
    const merchantRef = statusData.merchant_reference;

    const existingLog = await UnmatchedPayment.findOne({ orderTrackingId: trackingId });
    if (existingLog) return; // already logged/handled on a previous IPN retry

    const suffix = phoneSuffix(statusData.payment_account);
    let candidateUser = null;
    if (suffix) {
        const matches = await User.find({ phone: { $regex: suffix + '$' } }).limit(2);
        if (matches.length === 1) candidateUser = matches[0];
    }

    // Only auto-activate when the phone match is unambiguous AND the amount
    // maps exactly to one known plan price — anything less certain gets
    // logged for a human to reconcile rather than guessed.
    const matchingPlan = Object.entries(SUBSCRIPTION_PRICES).find(
        ([, cfg]) => cfg.ugx === statusData.amount
    );

    if (candidateUser && matchingPlan) {
        const [planKey, planCfg] = matchingPlan;
        try {
            const payment = await Payment.create({
                user: candidateUser._id,
                transactionId: merchantRef || trackingId,
                amount: statusData.amount,
                currency: statusData.currency || 'UGX',
                paymentMethod: 'pesapal',
                paymentProvider: 'pesapal',
                status: 'pending',
                subscriptionPlan: planKey,
                subscriptionDuration: planKey,
                paymentDetails: {
                    pesapalMerchantReference: merchantRef,
                    pesapalOrderTrackingId: trackingId,
                    phoneNumber: statusData.payment_account || '',
                    payerEmail: candidateUser.email || '',
                    payerName: candidateUser.fullName || ''
                },
                description: 'Reconciled: paid outside site checkout flow'
            });
            await processSuccessfulPesapalPayment(payment, statusData);
            logger.info('Auto-reconciled external PesaPal payment to user', {
                trackingId, merchantRef, userId: candidateUser._id, plan: planKey
            });
            return;
        } catch (createError) {
            logger.error('Failed to create reconciled Payment record', { error: createError.message, trackingId });
            // fall through to logging as unmatched so it's not lost
        }
    }

    try {
        await UnmatchedPayment.create({
            orderTrackingId: trackingId,
            merchantReference: merchantRef,
            amount: statusData.amount,
            currency: statusData.currency,
            paymentAccount: statusData.payment_account,
            paymentMethod: statusData.payment_method,
            confirmationCode: statusData.confirmation_code,
            rawStatusData: statusData,
            candidateUser: candidateUser ? candidateUser._id : null,
            reason: !suffix ? 'no phone on transaction'
                : !candidateUser ? 'no unique user match for phone'
                : 'amount did not match a known plan price'
        });
        logger.warn('Completed PesaPal payment could not be auto-matched — logged for manual review', {
            trackingId, merchantRef, amount: statusData.amount, paymentAccount: statusData.payment_account
        });
    } catch (logError) {
        // Duplicate key on orderTrackingId (a concurrent IPN retry got there first) is fine to ignore.
        if (logError.code !== 11000) {
            logger.error('Failed to log unmatched PesaPal payment', { error: logError.message, trackingId });
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

        const ack = () => res.json({
            orderNotificationType: OrderNotificationType,
            orderTrackingId: OrderTrackingId,
            orderMerchantReference: OrderMerchantReference,
            status: 200
        });

        if (!payment) {
            // No local record — this may be a payment made outside our own checkout
            // flow. Don't just drop it: check PesaPal directly and try to reconcile
            // it to a real user before acknowledging.
            logger.warn('Payment not found for IPN — attempting reconciliation', { OrderTrackingId, OrderMerchantReference });
            try {
                const token = await getPesapalToken();
                const statusResponse = await axios.get(
                    `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                if (statusResponse.data?.status_code === 1) {
                    await reconcileUnmatchedPesapalTransaction(statusResponse.data);
                }
            } catch (reconcileError) {
                logger.error('Reconciliation check failed for unmatched IPN', { error: reconcileError.message, OrderTrackingId });
                return res.status(503).json({ status: 'error', message: 'Temporarily unable to verify transaction' });
            }
            return ack();
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
            // Don't falsely acknowledge — if we couldn't actually verify the
            // transaction, respond non-200 so PesaPal retries the IPN later
            // instead of considering it delivered.
            logger.error('IPN status check error — not acknowledging so PesaPal retries', { error: statusError.message, OrderMerchantReference });
            return res.status(503).json({ status: 'error', message: 'Temporarily unable to verify transaction' });
        }

        // Acknowledge receipt now that the transaction was actually checked
        ack();
    } catch (error) {
        logger.error('PesapalIPN error', { error: error.message });
        res.status(500).json({ status: 'error' });
    }
};

// Re-checks Payment records stuck in "pending" against PesaPal's live status
// and activates any that actually completed. Runs on a short interval (see
// server.js) so activation happens within about a minute regardless of
// whether IPN was delivered or the browser ever made it back to a redirect —
// this is the primary safety net, not a slow last-resort fallback.
exports.reconcilePendingPesapalPayments = async function reconcilePendingPesapalPayments() {
    const now = Date.now();
    const olderThan = new Date(now - 20 * 1000);            // let the order actually reach PesaPal first
    const newerThan = new Date(now - 48 * 60 * 60 * 1000);  // don't keep re-checking week-old abandoned carts

    const stuck = await Payment.find({
        status: 'pending',
        paymentMethod: 'pesapal',
        'paymentDetails.pesapalOrderTrackingId': { $exists: true, $ne: null },
        createdAt: { $lte: olderThan, $gte: newerThan }
    }).limit(50);

    if (stuck.length === 0) return { checked: 0, activated: 0 };

    let activated = 0;
    let token;
    try {
        token = await getPesapalToken();
    } catch (e) {
        logger.error('Reconciliation sweep: could not get PesaPal token', { error: e.message });
        return { checked: 0, activated: 0 };
    }

    for (const payment of stuck) {
        try {
            const statusResponse = await axios.get(
                `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${payment.paymentDetails.pesapalOrderTrackingId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const statusCode = statusResponse.data?.status_code;
            if (statusCode === 1) {
                await processSuccessfulPesapalPayment(payment, statusResponse.data);
                activated++;
                logger.info('Reconciliation sweep activated a stuck payment', {
                    transactionId: payment.transactionId, user: payment.user
                });
            } else if (statusCode === 2) {
                payment.status = 'failed';
                payment.paymentDetails.failureReason = statusResponse.data?.message || 'Payment failed';
                await payment.save();
            }
        } catch (e) {
            logger.error('Reconciliation sweep: status check failed for one payment', {
                transactionId: payment.transactionId, error: e.message
            });
        }
        await new Promise(r => setTimeout(r, 200)); // be gentle with PesaPal's API
    }

    if (activated > 0) {
        logger.info('Reconciliation sweep complete', { checked: stuck.length, activated });
    }
    return { checked: stuck.length, activated };
};

// @desc    Verify PesaPal payment (client-side check after redirect)
// @route   GET /api/payments/pesapal/verify/:ref
// @access  Private
exports.verifyPesapalPayment = async (req, res) => {
    try {
        const { ref } = req.params;

        const payment = await Payment.findOne({
            $or: [
                { transactionId: ref },
                { 'paymentDetails.pesapalMerchantReference': ref }
            ]
        });

        if (!payment) {
            return res.status(404).json({ status: 'error', message: 'Payment not found' });
        }

        if (payment.status === 'completed') {
            return res.json({ status: 'success', message: 'Payment already confirmed', plan: payment.subscriptionPlan });
        }

        const trackingId = payment.paymentDetails?.pesapalOrderTrackingId;
        if (!trackingId) {
            return res.status(400).json({ status: 'error', message: 'No tracking ID' });
        }

        const token = await getPesapalToken();
        const statusResponse = await axios.get(
            `${PESAPAL_CONFIG.baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${trackingId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        const statusCode = statusResponse.data?.status_code;
        logger.info('Verify payment status', { ref, statusCode, data: statusResponse.data });

        if (statusCode === 1) {
            await processSuccessfulPesapalPayment(payment, statusResponse.data);
            return res.json({ status: 'success', message: 'Payment confirmed', plan: payment.subscriptionPlan });
        } else if (statusCode === 2) {
            payment.status = 'failed';
            await payment.save();
            return res.json({ status: 'failed', message: 'Payment failed' });
        } else {
            return res.json({ status: 'pending', message: 'Payment still processing' });
        }
    } catch (error) {
        logger.error('Verify payment error', { error: error.message });
        res.status(500).json({ status: 'error', message: error.message });
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
                
                const duration = SUBSCRIPTION_PRICES[payment.subscriptionPlan]?.days || 30;
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

// @desc    Unified subscribe endpoint (web + mobile app)
// @route   POST /api/payments/subscribe
// @access  Private
// Body: { plan, paymentMethod, phoneNumber }
// Returns: { redirectUrl } for card/pesapal, or { status } for mobile money
exports.subscribe = async (req, res) => {
    const { plan, paymentMethod = 'pesapal', phoneNumber } = req.body;

    if (!plan || !SUBSCRIPTION_PRICES[plan]) {
        return res.status(400).json({
            status: 'error',
            message: `Invalid plan. Valid plans: ${Object.keys(SUBSCRIPTION_PRICES).join(', ')}`
        });
    }

    const planConfig = SUBSCRIPTION_PRICES[plan];

    // Build a fake req.body to reuse existing controllers
    req.body = {
        subscriptionPlan: plan,
        subscriptionDuration: plan,  // same as plan name (daily/weekly/biweekly/monthly)
        phoneNumber: phoneNumber || '',
        amount: planConfig.ugx,
        currency: 'UGX',
        description: `Unruly Movies ${plan} subscription - ${planConfig.days} day(s)`
    };

    // Route to correct payment provider — only PesaPal supported
    switch (paymentMethod) {
        case 'pesapal':
        case 'card':
        case 'mtn':
        case 'airtel':
            // All payment methods go through PesaPal (handles MTN, Airtel, Visa, Mastercard)
            return exports.initiatePesapalPayment(req, res);
        default:
            return res.status(400).json({
                status: 'error',
                message: 'Unsupported payment method. Please use PesaPal.'
            });
    }
};

// @desc    Check if current user has active paid subscription
// @route   GET /api/payments/check-access
// @access  Private
exports.checkAccess = async (req, res) => {
    const plan = req.user?.subscription?.plan || 'free';
    const hasAccess = plan !== 'free' && req.user.hasActiveSubscription();
    res.json({
        status: 'success',
        data: {
            hasAccess,
            plan,
            endDate: req.user?.subscription?.endDate || null,
            message: hasAccess ? 'Access granted' : 'Subscription required'
        }
    });
};

// @desc    Get available subscription plans
// @route   GET /api/payments/plans
// @access  Public
exports.getPlans = (req, res) => {
    res.json({
        status: 'success',
        data: {
            plans: Object.entries(SUBSCRIPTION_PRICES).map(([key, val]) => ({
                id: key,
                name: key.charAt(0).toUpperCase() + key.slice(1),
                price: val.ugx,
                currency: 'UGX',
                days: val.days,
                description: `${val.days} day${val.days > 1 ? 's' : ''} access`
            })),
            paymentMethods: ['pesapal']
        }
    });
};
