const express = require('express');
const router = express.Router();
const EmailSubscription = require('../models/EmailSubscription');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const { protect, admin } = require('../middleware/auth');
const { logger } = require('../middleware/logger');

// Email transporter configuration
const createTransporter = () => {
    // Use environment variables for email config
    // Supports Gmail, SendGrid, Mailgun, or generic SMTP.
    if (process.env.EMAIL_SERVICE === 'sendgrid') {
        return nodemailer.createTransport({
            host: 'smtp.sendgrid.net',
            port: 587,
            auth: {
                user: 'apikey',
                pass: process.env.SENDGRID_API_KEY
            }
        });
    } else if (process.env.EMAIL_SERVICE === 'mailgun') {
        return nodemailer.createTransport({
            host: 'smtp.mailgun.org',
            port: 587,
            auth: {
                user: process.env.MAILGUN_USER,
                pass: process.env.MAILGUN_PASS
            }
        });
    } else if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
            }
        });
    } else {
        // Generic SMTP by default — the exact same EMAIL_HOST/EMAIL_PORT/
        // EMAIL_USER/EMAIL_PASSWORD vars server/utils/email.js already
        // reads, so one set of provider credentials makes every email path
        // in this app work, not just this file's. (EMAIL_PASS still
        // accepted as a fallback for anything already relying on it.)
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS
            }
        });
    }
};

// True only when there's actually enough config to build a working
// transporter — mirrors server/utils/email.js's isEmailConfigured() so both
// systems agree on whether sending is possible right now.
function isEmailConfigured() {
    if (process.env.EMAIL_SERVICE === 'sendgrid') return !!process.env.SENDGRID_API_KEY;
    if (process.env.EMAIL_SERVICE === 'mailgun') return !!(process.env.MAILGUN_USER && process.env.MAILGUN_PASS);
    const pass = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
    if (process.env.EMAIL_SERVICE === 'gmail') return !!(process.env.EMAIL_USER && pass);
    return !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && pass);
}

// Subscribe to email notifications
router.post('/subscribe', async (req, res) => {
    try {
        const { email, preferences, source = 'website', genres = [] } = req.body;
        
        if (!email) {
            return res.status(400).json({
                status: 'error',
                message: 'Email is required'
            });
        }
        
        // Check if already subscribed
        let subscription = await EmailSubscription.findOne({ email });
        
        if (subscription) {
            // Update existing subscription
            subscription.isActive = true;
            subscription.preferences = { ...subscription.preferences, ...preferences };
            if (genres.length > 0) {
                subscription.favoriteGenres = genres;
            }
            await subscription.save();
            
            return res.json({
                status: 'success',
                message: 'Subscription updated successfully',
                data: { subscribed: true }
            });
        }
        
        // Create new subscription
        subscription = await EmailSubscription.create({
            email,
            preferences: preferences || { newMovies: true, weeklyDigest: true },
            source,
            favoriteGenres: genres,
            verified: true // Auto-verify since email sending is not configured
        });
        
        // Try to send verification email (optional - won't fail if email not configured)
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                await sendVerificationEmail(subscription);
            } else {
                console.log('Email not configured - subscriber auto-verified:', email);
            }
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue anyway - subscription is created and auto-verified
        }
        
        res.status(201).json({
            status: 'success',
            message: 'Successfully subscribed to Unruly Movies updates!',
            data: { subscribed: true, verified: true }
        });
        
    } catch (error) {
        console.error('Subscribe error:', error);
        
        // Handle duplicate email
        if (error.code === 11000) {
            return res.json({
                status: 'success',
                message: 'Email already subscribed',
                data: { subscribed: true }
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Failed to subscribe. Please try again.'
        });
    }
});

// Verify email subscription
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        
        const subscription = await EmailSubscription.findOne({
            verificationToken: token
        });
        
        if (!subscription) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Invalid Link</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #0d0d14; color: #fff;">
                    <h1>❌ Invalid or Expired Link</h1>
                    <p>This verification link is invalid or has expired.</p>
                    <a href="/" style="color: #66BB6A;">Go to Homepage</a>
                </body>
                </html>
            `);
        }
        
        subscription.verified = true;
        subscription.verificationToken = null;
        await subscription.save();
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Email Verified</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #0d0d14; color: #fff;">
                <h1>✅ Email Verified!</h1>
                <p>You're now subscribed to Unruly Movies updates.</p>
                <p style="color: #888;">You'll receive notifications about new movies, weekly digests, and more.</p>
                <a href="/" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #66BB6A; color: #fff; text-decoration: none; border-radius: 8px;">Browse Movies</a>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Verify error:', error);
        res.status(500).send('Error verifying email');
    }
});

// Unsubscribe
router.get('/unsubscribe/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { all = false } = req.query;
        
        const subscription = await EmailSubscription.findOne({
            unsubscribeToken: token
        });
        
        if (!subscription) {
            return res.status(404).send(`
                <!DOCTYPE html>
                <html>
                <head><title>Invalid Link</title></head>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #0d0d14; color: #fff;">
                    <h1>❌ Invalid Link</h1>
                    <p>This unsubscribe link is invalid.</p>
                    <a href="/" style="color: #66BB6A;">Go to Homepage</a>
                </body>
                </html>
            `);
        }
        
        if (all === 'true' || all === true) {
            subscription.isActive = false;
        }
        
        await subscription.save();
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Unsubscribed</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #0d0d14; color: #fff;">
                <h1>😢 You've been unsubscribed</h1>
                <p>You won't receive any more emails from Unruly Movies.</p>
                <p style="color: #888;">Changed your mind?</p>
                <a href="/subscribe" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #66BB6A; color: #fff; text-decoration: none; border-radius: 8px;">Resubscribe</a>
            </body>
            </html>
        `);
        
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).send('Error processing unsubscribe');
    }
});

// Update preferences (for logged in users)
router.put('/preferences', protect, async (req, res) => {
    try {
        const { preferences, genres } = req.body;
        
        let subscription = await EmailSubscription.findOne({
            email: req.user.email
        });
        
        if (!subscription) {
            // Create subscription for this user
            subscription = await EmailSubscription.create({
                email: req.user.email,
                user: req.user._id,
                preferences,
                favoriteGenres: genres || [],
                verified: true // Already logged in = verified
            });
        } else {
            subscription.preferences = { ...subscription.preferences, ...preferences };
            if (genres) {
                subscription.favoriteGenres = genres;
            }
            await subscription.save();
        }
        
        res.json({
            status: 'success',
            message: 'Preferences updated',
            data: { preferences: subscription.preferences }
        });
        
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to update preferences'
        });
    }
});

// Admin: Send new movie notification
router.post('/notify/new-movie', protect, admin, async (req, res) => {
    try {
        const { movieId, movieTitle, moviePoster, movieDescription } = req.body;
        
        // Get all active subscribers who want new movie notifications
        const subscribers = await EmailSubscription.getActiveSubscribers('newMovies');
        
        if (subscribers.length === 0) {
            return res.json({
                status: 'success',
                message: 'No active subscribers',
                data: { sent: 0 }
            });
        }
        
        const siteUrl = process.env.SITE_URL || 'https://unrulymovies.com';
        const apiUrl = process.env.API_URL || 'https://luganda-translated-movies-production.up.railway.app';
        const transporter = createTransporter();
        
        let sent = 0;
        let failed = 0;
        
        for (const subscriber of subscribers) {
            try {
                await transporter.sendMail({
                    from: `"Unruly Movies" <${process.env.EMAIL_USER || 'noreply@unrulymovies.com'}>`,
                    to: subscriber.email,
                    subject: `🎬 New Movie: ${movieTitle}`,
                    html: generateNewMovieEmail({
                        movieTitle,
                        moviePoster,
                        movieDescription,
                        movieUrl: `${siteUrl}/player.html?id=${movieId}`,
                        unsubscribeUrl: `${apiUrl}/api/email/unsubscribe/${subscriber.unsubscribeToken}`
                    })
                });
                
                sent++;
                
                // Update subscriber stats
                await EmailSubscription.updateOne(
                    { _id: subscriber._id },
                    { 
                        lastEmailSent: new Date(),
                        $inc: { emailsSent: 1 }
                    }
                );
                
            } catch (emailError) {
                console.error(`Failed to send to ${subscriber.email}:`, emailError);
                failed++;
            }
        }
        
        res.json({
            status: 'success',
            message: `Notification sent to ${sent} subscribers`,
            data: { sent, failed, total: subscribers.length }
        });
        
    } catch (error) {
        console.error('Notify new movie error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send notifications'
        });
    }
});

// Admin: Send weekly digest
router.post('/notify/weekly-digest', protect, admin, async (req, res) => {
    try {
        const { movies } = req.body; // Array of { id, title, poster }
        
        const subscribers = await EmailSubscription.getActiveSubscribers('weeklyDigest');
        
        if (subscribers.length === 0) {
            return res.json({
                status: 'success',
                message: 'No active subscribers',
                data: { sent: 0 }
            });
        }
        
        const siteUrl = process.env.SITE_URL || 'https://unrulymovies.com';
        const apiUrl = process.env.API_URL || 'https://luganda-translated-movies-production.up.railway.app';
        const transporter = createTransporter();
        
        let sent = 0;
        
        for (const subscriber of subscribers) {
            try {
                await transporter.sendMail({
                    from: `"Unruly Movies" <${process.env.EMAIL_USER || 'noreply@unrulymovies.com'}>`,
                    to: subscriber.email,
                    subject: `📺 This Week on Unruly Movies`,
                    html: generateWeeklyDigestEmail({
                        movies,
                        siteUrl,
                        unsubscribeUrl: `${apiUrl}/api/email/unsubscribe/${subscriber.unsubscribeToken}`
                    })
                });
                
                sent++;
                
            } catch (emailError) {
                console.error(`Failed to send to ${subscriber.email}:`, emailError);
            }
        }
        
        res.json({
            status: 'success',
            message: `Weekly digest sent to ${sent} subscribers`,
            data: { sent, total: subscribers.length }
        });
        
    } catch (error) {
        console.error('Weekly digest error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to send weekly digest'
        });
    }
});

// Escape user-authored text before it goes into HTML — this content is
// written by an admin, but it still ends up in an email sent to real
// people, so it gets the same treatment as any other untrusted input.
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Admin: send a free-form email — subject + plain-text message — to real
// registered accounts (not the separate, largely-unused EmailSubscription
// newsletter list). Every send respects preferences.notifications.email;
// every email carries a real one-click unsubscribe link that flips that
// flag without requiring login (see /unsubscribe-user/:token below).
const KNOWN_PLANS = ['free', 'daily', 'weekly', 'biweekly', 'monthly'];

// Resolves an audience selection to the actual list of recipients. Every
// audience still respects preferences.notifications.email — this tool is
// for announcements, not a way to force a message past someone who opted
// out, even when targeting them individually by email.
async function resolveRecipients(audience, targetEmail, recentLimit) {
    const filter = { 'preferences.notifications.email': { $ne: false } };
    const projection = '_id email fullName';

    if (audience === 'specific') {
        const email = String(targetEmail || '').toLowerCase().trim();
        if (!email) {
            const err = new Error('targetEmail is required when audience is "specific"');
            err.httpStatus = 400;
            throw err;
        }
        filter.email = email;
        return User.find(filter, projection);
    }

    if (audience === 'recent_free') {
        let limit = parseInt(recentLimit, 10);
        if (!Number.isFinite(limit) || limit <= 0) limit = 200;
        limit = Math.min(limit, 5000); // guard against an accidental huge/unbounded send
        filter['subscription.plan'] = 'free';
        return User.find(filter, projection).sort({ createdAt: -1 }).limit(limit);
    }

    if (audience === 'paid') {
        filter['subscription.plan'] = { $ne: 'free' };
    } else if (audience && audience !== 'all') {
        if (!KNOWN_PLANS.includes(audience)) {
            const err = new Error(`Unknown audience "${audience}"`);
            err.httpStatus = 400;
            throw err;
        }
        filter['subscription.plan'] = audience;
    }
    // audience === 'all' (or omitted) — no extra filter beyond the opt-out check.

    return User.find(filter, projection);
}

router.post('/notify/custom', protect, admin, async (req, res) => {
    try {
        const { subject, message, testOnly, audience, targetEmail, recentLimit } = req.body;

        if (!subject || !message) {
            return res.status(400).json({
                status: 'error',
                message: 'subject and message are required'
            });
        }

        if (!isEmailConfigured()) {
            return res.status(503).json({
                status: 'error',
                message: 'No email provider is configured yet (EMAIL_HOST/EMAIL_USER/EMAIL_PASSWORD, or EMAIL_SERVICE=sendgrid/mailgun/gmail with the matching credentials). Nothing can be sent until that\'s set up.'
            });
        }

        const transporter = createTransporter();
        const siteUrl = process.env.SITE_URL || 'https://unrulymovies.com';
        const apiUrl = process.env.API_URL || 'https://luganda-translated-movies-production.up.railway.app';

        // Test send — just the admin's own inbox, awaited, so they can see
        // exactly what real recipients would get before committing to a
        // full broadcast.
        if (testOnly) {
            const unsubscribeUrl = buildUnsubscribeUrl(apiUrl, req.user._id);
            await transporter.sendMail({
                from: `"Unruly Movies" <${process.env.EMAIL_USER || 'noreply@unrulymovies.com'}>`,
                to: req.user.email,
                subject: `[TEST] ${subject}`,
                html: generateCustomEmail({ subject, message, siteUrl, unsubscribeUrl })
            });
            return res.json({
                status: 'success',
                message: `Test email sent to ${req.user.email}`
            });
        }

        const recipients = await resolveRecipients(audience, targetEmail, recentLimit);

        if (recipients.length === 0) {
            return res.json({
                status: 'success',
                message: audience === 'specific'
                    ? 'No matching recipient (no account with that email, or they\'ve opted out of email notifications)'
                    : 'No recipients match that audience',
                data: { recipientCount: 0 }
            });
        }

        // Respond immediately — sending to hundreds of recipients one at a
        // time (matching this file's existing pattern) can take minutes,
        // long past any reasonable HTTP timeout. The actual send continues
        // in the background after the response goes out.
        res.json({
            status: 'success',
            message: `Broadcast started — sending to ${recipients.length} users`,
            data: { recipientCount: recipients.length }
        });

        (async () => {
            let sent = 0;
            let failed = 0;
            for (const recipient of recipients) {
                try {
                    const unsubscribeUrl = buildUnsubscribeUrl(apiUrl, recipient._id);
                    await transporter.sendMail({
                        from: `"Unruly Movies" <${process.env.EMAIL_USER || 'noreply@unrulymovies.com'}>`,
                        to: recipient.email,
                        subject,
                        html: generateCustomEmail({ subject, message, siteUrl, unsubscribeUrl, fullName: recipient.fullName })
                    });
                    sent++;
                } catch (emailError) {
                    failed++;
                    logger.error('Custom broadcast: failed to send to one recipient', { email: recipient.email, error: emailError.message });
                }
                // A small pace between sends — avoids tripping provider
                // rate limits on a few-hundred-recipient blast.
                await new Promise(r => setTimeout(r, 200));
            }
            logger.info('Custom broadcast complete', { subject, sent, failed, total: recipients.length });
        })().catch(err => logger.error('Custom broadcast crashed', { error: err.message }));

    } catch (error) {
        logger.error('Custom broadcast error', { error: error.message });
        res.status(error.httpStatus || 500).json({
            status: 'error',
            message: error.httpStatus ? error.message : 'Failed to start broadcast'
        });
    }
});

function buildUnsubscribeUrl(apiUrl, userId) {
    const token = jwt.sign({ uid: String(userId), purpose: 'email-unsubscribe' }, process.env.JWT_SECRET, { expiresIn: '90d' });
    return `${apiUrl}/api/email/unsubscribe-user/${token}`;
}

// One-click unsubscribe for real accounts — no login required (the JWT
// itself is the credential, scoped to exactly this purpose, expiring in
// 90 days so an old email doesn't carry a permanently-valid link).
router.get('/unsubscribe-user/:token', async (req, res) => {
    try {
        const payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
        if (payload.purpose !== 'email-unsubscribe') throw new Error('wrong token purpose');

        await User.updateOne(
            { _id: payload.uid },
            { $set: { 'preferences.notifications.email': false } }
        );

        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Unsubscribed</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #0d0d14; color: #fff;">
                <h1>You've been unsubscribed</h1>
                <p>You won't receive email announcements from Unruly Movies anymore.</p>
                <p style="color: #888;">You can turn this back on anytime from your profile settings.</p>
                <a href="/" style="color: #66BB6A;">Go to Homepage</a>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Invalid Link</title></head>
            <body style="font-family: Arial; text-align: center; padding: 50px; background: #0d0d14; color: #fff;">
                <h1>Invalid or expired link</h1>
                <a href="/" style="color: #66BB6A;">Go to Homepage</a>
            </body>
            </html>
        `);
    }
});

// Helper: Generate a branded email around an admin-authored subject/message
function generateCustomEmail({ subject, message, siteUrl, unsubscribeUrl, fullName }) {
    const paragraphs = String(message)
        .split(/\n{2,}/)
        .map(p => `<p style="color: #ddd; line-height: 1.7; margin: 0 0 16px;">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
        .join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d0d14; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #66BB6A; margin: 0;">🎬 Unruly Movies</h1>
                </div>
                <div style="background: #1a1a2e; border-radius: 16px; padding: 30px;">
                    ${fullName ? `<p style="color: #888; margin: 0 0 20px;">Hi ${escapeHtml(fullName)},</p>` : ''}
                    <h2 style="color: #fff; margin: 0 0 20px;">${escapeHtml(subject)}</h2>
                    ${paragraphs}
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${siteUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #66BB6A, #4CAF50); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Visit Unruly Movies</a>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #666; font-size: 12px;">
                        <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from email announcements
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Admin: Get subscriber stats
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const total = await EmailSubscription.countDocuments();
        const active = await EmailSubscription.countDocuments({ isActive: true, verified: true });
        const unverified = await EmailSubscription.countDocuments({ verified: false });
        const registeredUserRecipients = await User.countDocuments({ 'preferences.notifications.email': { $ne: false } });

        // Recipient count per audience option the broadcast tool offers —
        // lets the UI show a real number for whichever one is selected
        // without a round-trip per change.
        const optedIn = { 'preferences.notifications.email': { $ne: false } };
        const recipientsByAudience = { all: registeredUserRecipients };
        recipientsByAudience.paid = await User.countDocuments({ ...optedIn, 'subscription.plan': { $ne: 'free' } });
        for (const plan of KNOWN_PLANS) {
            recipientsByAudience[plan] = await User.countDocuments({ ...optedIn, 'subscription.plan': plan });
        }

        const bySource = await EmailSubscription.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        res.json({
            status: 'success',
            data: {
                total,
                active,
                unverified,
                registeredUserRecipients,
                recipientsByAudience,
                bySource: bySource.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get stats'
        });
    }
});

// Admin: Manually verify a subscriber
router.post('/verify-manual/:id', protect, admin, async (req, res) => {
    try {
        const subscription = await EmailSubscription.findById(req.params.id);
        
        if (!subscription) {
            return res.status(404).json({
                status: 'error',
                message: 'Subscriber not found'
            });
        }
        
        subscription.verified = true;
        subscription.verificationToken = null;
        await subscription.save();
        
        res.json({
            status: 'success',
            message: `${subscription.email} has been verified`,
            data: subscription
        });
        
    } catch (error) {
        console.error('Manual verify error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify subscriber'
        });
    }
});

// Admin: Verify all unverified subscribers
router.post('/verify-all', protect, admin, async (req, res) => {
    try {
        const result = await EmailSubscription.updateMany(
            { verified: false },
            { $set: { verified: true, verificationToken: null } }
        );
        
        res.json({
            status: 'success',
            message: `${result.modifiedCount} subscribers have been verified`,
            data: { verified: result.modifiedCount }
        });
        
    } catch (error) {
        console.error('Verify all error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to verify subscribers'
        });
    }
});

// Admin: Get all subscribers with pagination
router.get('/subscribers', protect, admin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const verified = req.query.verified;
        
        const filter = {};
        if (verified === 'true') filter.verified = true;
        if (verified === 'false') filter.verified = false;
        
        const subscribers = await EmailSubscription.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-verificationToken -unsubscribeToken');
        
        const total = await EmailSubscription.countDocuments(filter);
        
        res.json({
            status: 'success',
            data: {
                subscribers,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
        
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get subscribers'
        });
    }
});

// Helper: Send verification email
async function sendVerificationEmail(subscription) {
    const siteUrl = process.env.SITE_URL || 'https://unrulymovies.com';
    const apiUrl = process.env.API_URL || 'https://luganda-translated-movies-production.up.railway.app';
    const transporter = createTransporter();
    
    await transporter.sendMail({
        from: `"Unruly Movies" <${process.env.EMAIL_USER || 'noreply@unrulymovies.com'}>`,
        to: subscription.email,
        subject: '✅ Verify your Unruly Movies subscription',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0d0d14; font-family: Arial, sans-serif;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #66BB6A; margin: 0;">🎬 Unruly Movies</h1>
                    </div>
                    <div style="background: #1a1a2e; border-radius: 16px; padding: 30px; text-align: center;">
                        <h2 style="color: #fff; margin-bottom: 15px;">Verify Your Email</h2>
                        <p style="color: #aaa; margin-bottom: 30px;">Click the button below to confirm your subscription and start receiving updates about new Luganda-translated movies.</p>
                        <a href="${apiUrl}/api/email/verify/${subscription.verificationToken}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #66BB6A, #4CAF50); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">If you didn't sign up for this, just ignore this email.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    });
}

// Helper: Generate new movie email
function generateNewMovieEmail({ movieTitle, moviePoster, movieDescription, movieUrl, unsubscribeUrl }) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d0d14; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #66BB6A; margin: 0;">🎬 Unruly Movies</h1>
                </div>
                <div style="background: #1a1a2e; border-radius: 16px; overflow: hidden;">
                    ${moviePoster ? `<img src="${moviePoster}" alt="${movieTitle}" style="width: 100%; height: auto;">` : ''}
                    <div style="padding: 25px;">
                        <h2 style="color: #fff; margin: 0 0 10px;">New Movie Alert! 🔥</h2>
                        <h3 style="color: #66BB6A; margin: 0 0 15px;">${movieTitle}</h3>
                        <p style="color: #aaa; margin: 0 0 25px; line-height: 1.6;">${movieDescription || 'A new Luganda-translated movie is now available!'}</p>
                        <a href="${movieUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #66BB6A, #4CAF50); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Watch Now</a>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #666; font-size: 12px;">
                        <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a> from new movie notifications
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Helper: Generate weekly digest email
function generateWeeklyDigestEmail({ movies, siteUrl, unsubscribeUrl }) {
    const movieCards = movies.map(movie => `
        <div style="display: inline-block; width: 45%; margin: 10px 2%; vertical-align: top; text-align: center;">
            <img src="${movie.poster}" alt="${movie.title}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
            <h4 style="color: #fff; margin: 0 0 10px; font-size: 14px;">${movie.title}</h4>
            <a href="${siteUrl}/player.html?id=${movie.id}" style="color: #66BB6A; font-size: 12px;">Watch Now →</a>
        </div>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0d0d14; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #66BB6A; margin: 0;">🎬 Unruly Movies</h1>
                    <p style="color: #aaa; margin: 10px 0 0;">Your Weekly Movie Digest</p>
                </div>
                <div style="background: #1a1a2e; border-radius: 16px; padding: 25px;">
                    <h2 style="color: #fff; margin: 0 0 20px; text-align: center;">This Week's Picks 🍿</h2>
                    <div style="text-align: center;">
                        ${movieCards}
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${siteUrl}" style="display: inline-block; padding: 14px 30px; background: linear-gradient(135deg, #66BB6A, #4CAF50); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">Browse All Movies</a>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #666; font-size: 12px;">
                        <a href="${unsubscribeUrl}?all=true" style="color: #666;">Unsubscribe</a> from all emails
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

module.exports = router;
