const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
    return process.env.EMAIL_HOST && 
           process.env.EMAIL_USER && 
           process.env.EMAIL_PASSWORD;
};

// Create transporter
const createTransporter = () => {
    if (!isEmailConfigured()) {
        return null;
    }
    
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send email function
exports.sendEmail = async (options) => {
    try {
        // Skip if email not configured (development mode)
        if (!isEmailConfigured()) {
            console.log('📧 Email skipped (not configured):', {
                to: options.to,
                subject: options.subject
            });
            return { messageId: 'email-not-configured', skipped: true };
        }
        
        const transporter = createTransporter();

        const mailOptions = {
            from: `Unruly Movies <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
            // Inline images referenced from the HTML as src="cid:<cid>"
            attachments: options.attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email error:', error);
        // Don't throw in development - just log the error
        if (process.env.NODE_ENV !== 'production') {
            console.log('📧 Email failed but continuing (dev mode)');
            return { messageId: 'email-failed', error: error.message };
        }
        throw error;
    }
};

// ---------- Welcome email ----------
// Sent once when a new account is created (email sign-up or first Google
// sign-in). The banner is embedded in the email itself (cid:) rather than
// linked, so it shows even before a deploy and in clients that block remote
// images by default. Its source design is server/email-templates/
// welcome-banner.html — re-render that with headless Chrome to change it.
const path = require('path');
const WELCOME_BANNER_PATH = path.join(__dirname, '../../assets/images/email/welcome-banner.jpg');
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.unruly.movies';

function escapeHtml(str) {
    return String(str == null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Latest 4 movies with real TMDB artwork, for the "New this week" row.
// Returns [] on any failure — the email still sends without the row.
async function getLatestMoviesForEmail(limit = 4) {
    try {
        const LugandaMovie = require('../models/LugandaMovie');
        const candidates = await LugandaMovie.find(
            { contentType: { $ne: 'series' }, poster: /^https:\/\/image\.tmdb\.org\// },
            { originalTitle: 1, title: 1, poster: 1, vjName: 1 }
        ).sort({ createdAt: -1 }).limit(limit * 3).lean();

        const seen = new Set();
        const picks = [];
        for (const m of candidates) {
            if (seen.has(m.poster)) continue; // catalogue has a few duplicate entries sharing one poster
            seen.add(m.poster);
            picks.push(m);
            if (picks.length === limit) break;
        }
        return picks;
    } catch (e) {
        console.error('Welcome email: could not load latest movies:', e.message);
        return [];
    }
}

function buildWelcomeEmailHtml({ firstName, siteUrl, movies }) {
    const movieCells = movies.map(m => {
        const title = escapeHtml(m.originalTitle || m.title || '');
        const vj = escapeHtml((m.vjName || '').replace(/^vj\s*/i, '').trim());
        const poster = m.poster.replace('/w500/', '/w342/').replace('/original/', '/w342/');
        return `
            <td width="25%" valign="top" style="padding:0 6px;">
                <a href="${siteUrl}/player.html?id=${m._id}" style="text-decoration:none;">
                    <img src="${poster}" width="128" alt="${title}" style="display:block;width:100%;max-width:128px;height:auto;border-radius:10px;border:0;">
                    <div style="color:#ffffff;font-size:13px;font-weight:700;line-height:1.3;margin-top:8px;">${title}</div>
                    ${vj ? `<div style="color:#4ade80;font-size:11px;font-weight:700;margin-top:3px;text-transform:uppercase;letter-spacing:0.04em;">VJ ${vj}</div>` : ''}
                </a>
            </td>`;
    }).join('');

    const newRow = movies.length ? `
        <tr><td style="padding:8px 28px 0;">
            <div style="color:#ffffff;font-size:18px;font-weight:800;margin-bottom:14px;">New on Unruly Movies</div>
        </td></tr>
        <tr><td style="padding:0 22px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${movieCells}</tr></table>
        </td></tr>` : '';

    const feature = (icon, title, text) => `
        <tr><td style="padding:0 28px 16px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                <td valign="top" style="width:40px;"><div style="width:32px;height:32px;border-radius:9px;background:rgba(74,222,128,0.14);color:#4ade80;font-size:16px;line-height:32px;text-align:center;">${icon}</div></td>
                <td valign="top" style="padding-left:12px;">
                    <div style="color:#ffffff;font-size:15px;font-weight:700;">${title}</div>
                    <div style="color:#a1a1aa;font-size:13px;line-height:1.5;margin-top:2px;">${text}</div>
                </td>
            </tr></table>
        </td></tr>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Welcome to Unruly Movies</title>
</head>
<body style="margin:0;padding:0;background:#09090f;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090f;">
<tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#12121a;border:1px solid #23232f;border-radius:18px;overflow:hidden;">
        <tr><td><a href="${siteUrl}"><img src="cid:welcome-banner" width="600" alt="Unruly Movies — Movies you love, in Luganda" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>

        <tr><td style="padding:30px 28px 8px;">
            <div style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;">Hi ${escapeHtml(firstName)}, welcome to the family 🎬</div>
            <div style="color:#a1a1aa;font-size:15px;line-height:1.6;margin-top:10px;">Your Unruly Movies account is ready. Here's what's waiting for you:</div>
        </td></tr>

        <tr><td style="height:14px;"></td></tr>
        ${feature('🎙️', 'Luganda translations by top VJs', 'Hollywood, Bollywood and more — narrated by VJ Junior, VJ Ice P, VJ Emmy and many others.')}
        ${feature('📱', 'Watch anywhere', 'Stream on your phone, laptop or TV, or get the Android app.')}
        ${feature('💳', 'Plans from UGX 1,000', 'Pay with MTN or Airtel Mobile Money — daily, weekly, 2-week and monthly plans.')}

        <tr><td align="center" style="padding:14px 28px 30px;">
            <a href="${siteUrl}" style="display:inline-block;background:#4ade80;color:#06240f;font-size:16px;font-weight:800;text-decoration:none;padding:14px 34px;border-radius:12px;">▶&nbsp; Start Watching</a>
            <div style="margin-top:14px;"><a href="${PLAY_STORE_URL}" style="color:#4ade80;font-size:13px;font-weight:700;text-decoration:none;">Get the Android app →</a></div>
        </td></tr>

        ${newRow}

        <tr><td style="padding:20px 28px 26px;border-top:1px solid #23232f;">
            <div style="color:#71717a;font-size:12px;line-height:1.6;text-align:center;">
                Questions? Just reply to this email or reach us on <a href="https://wa.me/256743311809" style="color:#4ade80;">WhatsApp</a>.<br>
                You're receiving this because you just created an account on <a href="${siteUrl}" style="color:#71717a;">unrulymovies.com</a>.<br>
                © ${new Date().getFullYear()} Unruly Movies
            </div>
        </td></tr>
    </table>
</td></tr>
</table>
</body>
</html>`;
}

exports.sendWelcomeEmail = async (user) => {
    const siteUrl = (process.env.CLIENT_URL || 'https://unrulymovies.com').replace(/\/$/, '');
    const firstName = (user.fullName || '').trim().split(/\s+/)[0] || 'there';
    const movies = await getLatestMoviesForEmail(4);

    const text = [
        `Hi ${firstName}, welcome to Unruly Movies!`,
        '',
        'Your account is ready. Watch Hollywood, Bollywood and more, translated into Luganda by top VJs.',
        'Plans start from UGX 1,000 — pay with MTN or Airtel Mobile Money.',
        '',
        `Start watching: ${siteUrl}`,
        `Android app: ${PLAY_STORE_URL}`
    ].join('\n');

    return exports.sendEmail({
        to: user.email,
        subject: `Welcome to Unruly Movies, ${firstName}! 🎬`,
        html: buildWelcomeEmailHtml({ firstName, siteUrl, movies }),
        text,
        attachments: [{ filename: 'welcome-banner.jpg', path: WELCOME_BANNER_PATH, cid: 'welcome-banner' }]
    });
};

// Send subscription confirmation email
exports.sendSubscriptionEmail = async (user, plan, amount) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4ade80, #22c55e); padding: 30px; text-align: center; color: #000; }
                .content { padding: 30px; background: #f9f9f9; }
                .details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Subscription Confirmed!</h1>
                </div>
                <div class="content">
                    <h2>Hi ${user.fullName},</h2>
                    <p>Your subscription has been successfully activated!</p>
                    <div class="details">
                        <h3>Subscription Details:</h3>
                        <p><strong>Plan:</strong> ${plan.toUpperCase()}</p>
                        <p><strong>Amount:</strong> UGX ${amount.toLocaleString()}</p>
                        <p><strong>Status:</strong> Active</p>
                        <p><strong>Next Billing:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                    </div>
                    <p>You now have full access to all ${plan} features. Enjoy unlimited streaming!</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Unruly Movies. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return this.sendEmail({
        to: user.email,
        subject: 'Subscription Confirmed - Unruly Movies',
        html
    });
};

// Send payment receipt email
exports.sendPaymentReceipt = async (user, payment) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4ade80, #22c55e); padding: 30px; text-align: center; color: #000; }
                .content { padding: 30px; background: #f9f9f9; }
                .receipt { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Receipt</h1>
                </div>
                <div class="content">
                    <h2>Hi ${user.fullName},</h2>
                    <p>Thank you for your payment. Here are your transaction details:</p>
                    <div class="receipt">
                        <h3>Transaction Details:</h3>
                        <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
                        <p><strong>Amount:</strong> ${payment.currency} ${payment.amount.toLocaleString()}</p>
                        <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
                        <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleString()}</p>
                        <p><strong>Status:</strong> ${payment.status.toUpperCase()}</p>
                    </div>
                    <p>Keep this email for your records.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Unruly Movies. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return this.sendEmail({
        to: user.email,
        subject: 'Payment Receipt - Unruly Movies',
        html
    });
};
