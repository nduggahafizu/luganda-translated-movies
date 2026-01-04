const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET || 'unruly-movies-jwt-secret-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'unruly-movies-jwt-refresh-secret-2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRE });
};

async function registerUser({ fullName, email, password, clientUrl }) {
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return { error: 'User already exists with this email' };
    }
    // Create user
    const user = await User.create({ fullName, email, password });
    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();
    // Send verification email
    const verificationUrl = `${clientUrl}/verify-email/${verificationToken}`;
    try {
        await sendEmail({
            to: user.email,
            subject: 'Verify Your Email - Unruly Movies',
            html: `<h1>Welcome to Unruly Movies!</h1><p>Please verify your email by clicking the link below:</p><a href="${verificationUrl}">Verify Email</a><p>This link expires in 24 hours.</p>`
        });
    } catch (error) {
        // Email send error is not fatal for registration
    }
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    return {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            subscription: user.subscription
        },
        token,
        refreshToken
    };
}

async function loginUser({ email, password }) {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return { error: 'Invalid email or password' };
    }
    if (user.provider === 'google' || user.googleId) {
        return { error: 'This account uses Google Sign-In. Please use the Google button to login.' };
    }
    if (!user.isActive) {
        return { error: 'Your account has been deactivated. Please contact support.' };
    }
    if (!user.password) {
        return { error: 'Invalid email or password' };
    }
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
        return { error: 'Invalid email or password' };
    }
    user.lastLogin = Date.now();
    await user.save();
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    return {
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            subscription: user.subscription,
            isEmailVerified: user.isEmailVerified
        },
        token,
        refreshToken
    };
}

async function forgotPassword({ email, clientUrl }) {
    const user = await User.findOne({ email });
    if (!user) {
        return { error: 'No user found with this email' };
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();
    // Send reset email
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
    try {
        await sendEmail({
            to: user.email,
            subject: 'Password Reset - Unruly Movies',
            html: `<h1>Password Reset Request</h1><p>You requested a password reset. Click the link below to reset your password:</p><a href="${resetUrl}">Reset Password</a><p>This link expires in 1 hour.</p><p>If you didn't request this, please ignore this email.</p>`
        });
        return { success: true };
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        return { error: 'Something went wrong' };
    }
}

async function resetPassword({ token, password }) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
        return { error: 'Invalid or expired reset token' };
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    const jwtToken = generateToken(user._id);
    return { token: jwtToken };
}

async function updateProfile({ userId, fullName, preferences }) {
    const user = await User.findById(userId);
    if (!user) return { error: 'User not found' };
    if (fullName) user.fullName = fullName;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    await user.save();
    return { user };
}

async function verifyEmail({ token }) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpire: { $gt: Date.now() }
    });
    if (!user) return { error: 'Invalid or expired verification token' };
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();
    return { success: true };
}

async function refreshTokenService({ refreshToken }) {
    try {
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        const newToken = generateToken(decoded.id);
        const newRefreshToken = generateRefreshToken(decoded.id);
        return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
        return { error: 'Invalid refresh token' };
    }
}
    const user = await User.findById(userId).select('+password');
    if (!user) return { error: 'User not found' };
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return { error: 'Current password is incorrect' };
    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id);
    return { token };
}

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    verifyEmail,
    refreshTokenService
};
