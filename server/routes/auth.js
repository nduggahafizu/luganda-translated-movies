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
        const user = await User.findById(req.user._id).select('activeDevices lastLogin role');

        res.json({
            status: 'success',
            data: {
                devices: user.activeDevices || [],
                lastLogin: user.lastLogin,
                maxDevices: (user.role === 'admin') ? 10 : 1
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

const { enforceDeviceLimit } = require('../middleware/auth');

// Remove a specific device
router.delete('/devices/:deviceId', protect, async (req, res) => {
    try {
        const user = req.user;
        const before = user.activeDevices.length;
        user.activeDevices = user.activeDevices.filter(d => d.deviceId !== req.params.deviceId);
        await user.save({ validateBeforeSave: false });
        res.json({ success: true, removed: before - user.activeDevices.length, activeDevices: user.activeDevices.length });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

// Remove all devices except current
router.delete('/devices', protect, async (req, res) => {
    try {
        const crypto = require('crypto');
        const ua = req.headers['user-agent'] || '';
        const ip = req.ip || req.headers['x-forwarded-for'] || '';
        const currentDeviceId = crypto.createHash('md5').update(ua + ip).digest('hex');

        const user = req.user;
        user.activeDevices = user.activeDevices.filter(d => d.deviceId === currentDeviceId);
        await user.save({ validateBeforeSave: false });
        res.json({ success: true, message: 'All other devices logged out', activeDevices: user.activeDevices.length });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
});

router.get('/check-access', protect, enforceDeviceLimit, (req, res) => {
    const user = req.user;
    const plan = user.subscription.plan || 'free';
    const isActive = user.hasActiveSubscription();
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    res.json({
        success: true,
        access: {
            plan,
            isActive,
            isAdmin,
            canWatch: isActive && plan !== 'free',
            freeUser: plan === 'free',
            endDate: user.subscription.endDate,
            maxDevices: user.getMaxDevices(),
            activeDevices: user.activeDevices.length
        }
    });
});

module.exports = router;
