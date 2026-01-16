const express = require('express');
const router = express.Router();
const EmailSubscription = require('../models/EmailSubscription');
const nodemailer = require('nodemailer');
const { protect, admin } = require('../middleware/auth');

// Email transporter configuration
const createTransporter = () => {
    // Use environment variables for email config
    // Supports Gmail, SendGrid, Mailgun, etc.
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
    } else {
        // Default: Gmail (for testing)
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }
};

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
            verified: false // Require email verification
        });
        
        // Send verification email
        try {
            await sendVerificationEmail(subscription);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Continue anyway - subscription is created
        }
        
        res.status(201).json({
            status: 'success',
            message: 'Subscribed! Please check your email to verify.',
            data: { subscribed: true, requiresVerification: true }
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
        
        const siteUrl = process.env.SITE_URL || 'https://watch.unrulymovies.com';
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
        
        const siteUrl = process.env.SITE_URL || 'https://watch.unrulymovies.com';
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

// Admin: Get subscriber stats
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const total = await EmailSubscription.countDocuments();
        const active = await EmailSubscription.countDocuments({ isActive: true, verified: true });
        const unverified = await EmailSubscription.countDocuments({ verified: false });
        
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

// Helper: Send verification email
async function sendVerificationEmail(subscription) {
    const siteUrl = process.env.SITE_URL || 'https://watch.unrulymovies.com';
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
