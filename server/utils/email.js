const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send email function
exports.sendEmail = async (options) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: `Unruly Movies <${process.env.EMAIL_FROM}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email error:', error);
        throw error;
    }
};

// Send welcome email
exports.sendWelcomeEmail = async (user) => {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #7CFC00, #5CB300); padding: 30px; text-align: center; color: #000; }
                .content { padding: 30px; background: #f9f9f9; }
                .button { display: inline-block; padding: 12px 30px; background: #7CFC00; color: #000; text-decoration: none; border-radius: 5px; font-weight: bold; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Unruly Movies!</h1>
                </div>
                <div class="content">
                    <h2>Hi ${user.fullName},</h2>
                    <p>Thank you for joining Unruly Movies! We're excited to have you on board.</p>
                    <p>You now have access to thousands of movies and TV shows. Start exploring our collection today!</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.CLIENT_URL}" class="button">Start Watching</a>
                    </p>
                    <p>If you have any questions, feel free to contact our support team.</p>
                    <p>Happy streaming!</p>
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
        subject: 'Welcome to Unruly Movies!',
        html
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
                .header { background: linear-gradient(135deg, #7CFC00, #5CB300); padding: 30px; text-align: center; color: #000; }
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
                .header { background: linear-gradient(135deg, #7CFC00, #5CB300); padding: 30px; text-align: center; color: #000; }
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
