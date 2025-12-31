const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
    // For production, use configured SMTP
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }
    
    // For development, use Ethereal (fake SMTP service)
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
            user: process.env.DEV_EMAIL_USER || 'ethereal.user@ethereal.email',
            pass: process.env.DEV_EMAIL_PASS || 'ethereal_password'
        }
    });
};

const transporter = createTransporter();

// Email templates
const templates = {
    welcome: (user) => ({
        subject: 'Welcome to Unruly Movies! 🎬',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #7CFC00, #228B22); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: #000; margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #7CFC00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎬 Unruly Movies</h1>
                    </div>
                    <div class="content">
                        <h2>Welcome, ${user.fullName || user.name}! 🎉</h2>
                        <p>Thank you for joining Unruly Movies - your destination for the best Luganda-translated movies!</p>
                        <p>Here's what you can do:</p>
                        <ul>
                            <li>🎥 Stream thousands of movies translated by Uganda's best VJs</li>
                            <li>📱 Watch on any device, anytime</li>
                            <li>⭐ Save your favorites and create watchlists</li>
                            <li>💬 Join the community with reviews and comments</li>
                        </ul>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'https://watch.unrulymovies.com'}" class="button">Start Watching</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Unruly Movies. All rights reserved.</p>
                        <p>Kampala, Uganda</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    passwordReset: (user, resetUrl) => ({
        subject: 'Reset Your Password - Unruly Movies',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #7CFC00, #228B22); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: #000; margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #7CFC00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 10px 15px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.fullName || user.name},</h2>
                        <p>You requested to reset your password. Click the button below to create a new password:</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </p>
                        <div class="warning">
                            <strong>⚠️ Important:</strong> This link will expire in 1 hour.
                        </div>
                        <p>If you didn't request this, please ignore this email or contact support if you're concerned about your account security.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Unruly Movies. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    emailVerification: (user, verifyUrl) => ({
        subject: 'Verify Your Email - Unruly Movies',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #7CFC00, #228B22); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: #000; margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #7CFC00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>✉️ Verify Your Email</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.fullName || user.name},</h2>
                        <p>Please verify your email address to complete your registration and access all features.</p>
                        <p style="text-align: center; margin: 30px 0;">
                            <a href="${verifyUrl}" class="button">Verify Email</a>
                        </p>
                        <p>This link will expire in 24 hours.</p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Unruly Movies. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    subscriptionConfirmation: (user, plan) => ({
        subject: `You're Now ${plan.charAt(0).toUpperCase() + plan.slice(1)}! 🎉`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #FFD700, #FFA500); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: #000; margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 12px 30px; background: #7CFC00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    .plan-badge { display: inline-block; background: #FFD700; color: #000; padding: 5px 15px; border-radius: 20px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎬 Subscription Confirmed!</h1>
                    </div>
                    <div class="content">
                        <h2>Thank you, ${user.fullName || user.name}!</h2>
                        <p style="text-align: center;">
                            <span class="plan-badge">${plan.toUpperCase()} MEMBER</span>
                        </p>
                        <p>Your subscription is now active. Here's what you get:</p>
                        <ul>
                            ${plan === 'premium' ? `
                                <li>✅ Unlimited HD streaming</li>
                                <li>✅ Download movies for offline viewing</li>
                                <li>✅ Ad-free experience</li>
                                <li>✅ Early access to new releases</li>
                                <li>✅ Watch on 4 devices simultaneously</li>
                            ` : `
                                <li>✅ HD streaming</li>
                                <li>✅ Limited downloads</li>
                                <li>✅ Watch on 2 devices simultaneously</li>
                            `}
                        </ul>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'https://watch.unrulymovies.com'}" class="button">Start Watching</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Unruly Movies. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    }),
    
    newMovieNotification: (user, movie) => ({
        subject: `New Movie Added: ${movie.title} 🎬`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #7CFC00, #228B22); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .header h1 { color: #000; margin: 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .movie-card { background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .movie-poster { width: 100%; height: 300px; object-fit: cover; }
                    .movie-info { padding: 20px; }
                    .button { display: inline-block; padding: 12px 30px; background: #7CFC00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                    .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎬 New Movie Alert!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.fullName || user.name},</h2>
                        <p>A new movie has been added that you might like!</p>
                        <div class="movie-card">
                            <img src="${movie.poster}" alt="${movie.title}" class="movie-poster">
                            <div class="movie-info">
                                <h3>${movie.title}</h3>
                                <p>📅 ${movie.year} • ⭐ ${movie.rating}/10</p>
                                <p>🎙️ VJ: ${movie.vjName}</p>
                                <p>${movie.description?.substring(0, 150)}...</p>
                            </div>
                        </div>
                        <p style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL}/player.html?id=${movie._id}" class="button">Watch Now</a>
                        </p>
                    </div>
                    <div class="footer">
                        <p>© 2025 Unruly Movies. All rights reserved.</p>
                        <p><a href="${process.env.FRONTEND_URL}/unsubscribe?email=${user.email}">Unsubscribe</a></p>
                    </div>
                </div>
            </body>
            </html>
        `
    })
};

// Email service
const emailService = {
    // Send welcome email
    sendWelcomeEmail: async (user) => {
        const template = templates.welcome(user);
        return await emailService.send(user.email, template.subject, template.html);
    },
    
    // Send password reset email
    sendPasswordResetEmail: async (user, resetToken) => {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
        const template = templates.passwordReset(user, resetUrl);
        return await emailService.send(user.email, template.subject, template.html);
    },
    
    // Send email verification
    sendVerificationEmail: async (user, verifyToken) => {
        const verifyUrl = `${process.env.FRONTEND_URL}/verify-email.html?token=${verifyToken}`;
        const template = templates.emailVerification(user, verifyUrl);
        return await emailService.send(user.email, template.subject, template.html);
    },
    
    // Send subscription confirmation
    sendSubscriptionEmail: async (user, plan) => {
        const template = templates.subscriptionConfirmation(user, plan);
        return await emailService.send(user.email, template.subject, template.html);
    },
    
    // Send new movie notification
    sendNewMovieNotification: async (user, movie) => {
        const template = templates.newMovieNotification(user, movie);
        return await emailService.send(user.email, template.subject, template.html);
    },
    
    // Generic send email function
    send: async (to, subject, html, text = null) => {
        try {
            const mailOptions = {
                from: `"Unruly Movies" <${process.env.SMTP_FROM || 'noreply@unrulymovies.com'}>`,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, '')
            };
            
            const info = await transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.messageId}`);
            
            // For development, log Ethereal preview URL
            if (process.env.NODE_ENV !== 'production') {
                console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
            
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Bulk email sender (for notifications)
    sendBulk: async (users, subject, htmlGenerator) => {
        const results = [];
        
        for (const user of users) {
            try {
                const html = typeof htmlGenerator === 'function' 
                    ? htmlGenerator(user) 
                    : htmlGenerator;
                
                const result = await emailService.send(user.email, subject, html);
                results.push({ email: user.email, ...result });
                
                // Rate limiting - wait 100ms between emails
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.push({ email: user.email, success: false, error: error.message });
            }
        }
        
        return results;
    }
};

module.exports = emailService;
