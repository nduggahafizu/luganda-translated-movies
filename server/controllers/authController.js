const User = require('../models/User');
const { logger } = require('../middleware/logger');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');

// JWT Configuration with defaults
const JWT_SECRET = process.env.JWT_SECRET || 'unruly-movies-jwt-secret-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'unruly-movies-jwt-refresh-secret-2024';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, {
        expiresIn: JWT_EXPIRE
    });
};

// Generate Refresh Token
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRE
    });
};

const { registerUser } = require('../services/userService');
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const result = await registerUser({ fullName, email, password, clientUrl: process.env.CLIENT_URL });
        if (result.error) {
            return res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
        res.status(201).json({
            status: 'success',
            message: 'Registration successful. Please check your email to verify your account.',
            data: result
        });
    } catch (error) {
        logger.error('Register error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { loginUser } = require('../services/userService');
    try {
        const { email, password } = req.body;
        const result = await loginUser({ email, password });
        if (result.error) {
            return res.status(401).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        logger.error('Login error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        logger.error('GetMe error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
    try {
        // In a production app, you might want to blacklist the token
        res.json({
            status: 'success',
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error('Logout error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await forgotPassword({ email, clientUrl: process.env.CLIENT_URL });
        if (result.error) {
            return res.status(404).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            message: 'Password reset email sent'
        });
    } catch (error) {
        logger.error('ForgotPassword error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const token = req.params.token;
        const result = await resetPassword({ token, password });
        if (result.error) {
            return res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            message: 'Password reset successful',
            data: { token: result.token }
        });
    } catch (error) {
        logger.error('ResetPassword error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
    try {
        const token = req.params.token;
        const result = await verifyEmail({ token });
        if (result.error) {
            return res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            message: 'Email verified successfully'
        });
    } catch (error) {
        logger.error('VerifyEmail error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, preferences } = req.body;
        const result = await updateProfile({ userId: req.user.id, fullName, preferences });
        if (result.error) {
            return res.status(404).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            message: 'Profile updated successfully',
            data: { user: result.user }
        });
    } catch (error) {
        logger.error('UpdateProfile error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const result = await updatePassword({ userId: req.user.id, currentPassword, newPassword });
        if (result.error) {
            return res.status(401).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            message: 'Password updated successfully',
            data: { token: result.token }
        });
    } catch (error) {
        logger.error('UpdatePassword error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                status: 'error',
                message: 'Refresh token required'
            });
        }
        const result = await refreshTokenService({ refreshToken });
        if (result.error) {
            return res.status(401).json({
                status: 'error',
                message: result.error
            });
        }
        res.json({
            status: 'success',
            data: result
        });
    } catch (error) {
        logger.error('RefreshToken error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};
