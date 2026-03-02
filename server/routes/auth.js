const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');
const TokenBlacklist = require('../models/TokenBlacklist');
const User = require('../models/User');
const pushService = require('../services/pushService');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/google', googleAuthController.googleSignIn);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', protect, authController.getMe);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/update-password', protect, authController.updatePassword);
router.post('/refresh-token', authController.refreshToken);

// Enhanced logout with token blacklisting
router.post('/logout', protect, async (req, res) => {
    try {
        // Blacklist the current token
        await TokenBlacklist.blacklistToken(
            req.token,
            req.user._id,
            'access',
            'logout',
            req.deviceInfo
        );

        res.json({
            status: 'success',
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error during logout'
        });
    }
});

// Logout from all devices (security feature)
router.post('/logout-all', protect, async (req, res) => {
    try {
        // Set security update timestamp - invalidates all existing tokens
        await User.findByIdAndUpdate(req.user._id, {
            lastSecurityUpdate: new Date()
        });

        // Optionally blacklist current token too
        await TokenBlacklist.blacklistToken(
            req.token,
            req.user._id,
            'access',
            'security_breach',
            req.deviceInfo
        );

        // Send security alert
        if (pushService.isPushConfigured()) {
            await pushService.sendSecurityAlertPush(req.user._id, 'password_changed', {
                action: 'All sessions logged out'
            });
        }

        res.json({
            status: 'success',
            message: 'Logged out from all devices'
        });
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error during logout'
        });
    }
});

// Get active sessions/devices
router.get('/sessions', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('trustedDevices lastLogin');

        res.json({
            status: 'success',
            data: {
                devices: user.trustedDevices || [],
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Get sessions error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error getting sessions'
        });
    }
});

// Check if user is admin (for frontend admin access)
router.get('/check-admin', protect, (req, res) => {
    res.json({
        success: true,
        isAdmin: req.user.role === 'admin',
        user: {
            id: req.user._id,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router;
