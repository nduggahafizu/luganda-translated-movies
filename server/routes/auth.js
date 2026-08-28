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

// Check device status — tells frontend if another device needs to be logged out
router.get('/device-check', protect, async (req, res) => {
    const user = req.user;
    const maxDevices = user.getMaxDevices();

    // Clean stale devices (>24h)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    user.activeDevices = user.activeDevices.filter(d => d.lastActive > cutoff);
    await user.save({ validateBeforeSave: false });

    if (user.activeDevices.length > maxDevices) {
        const devices = user.activeDevices.map(d => {
            const browser = (d.userAgent || '').match(/(Chrome|Firefox|Safari|Edge|Opera|Mobile)/i)?.[1] || 'Browser';
            const os = (d.userAgent || '').match(/(Windows|Mac|Linux|Android|iPhone|iPad)/i)?.[1] || 'Unknown';
            return { deviceId: d.deviceId, label: `${browser} on ${os}`, ip: d.ip, lastActive: d.lastActive };
        });
        return res.json({
            status: 'device_limit',
            message: `Your account is active on ${user.activeDevices.length} devices. Maximum is ${maxDevices}.`,
            maxDevices,
            devices
        });
    }

    res.json({ status: 'ok', activeDevices: user.activeDevices.length, maxDevices });
});

// Force switch — logout all other devices and register current one
router.post('/device-switch', protect, async (req, res) => {
    try {
        const crypto = require('crypto');
        const ua = req.headers['user-agent'] || '';
        const ip = req.ip || req.headers['x-forwarded-for'] || '';
        const deviceId = crypto.createHash('md5').update(ua + ip).digest('hex');

        const user = req.user;
        user.activeDevices = [{ deviceId, userAgent: ua, ip, lastActive: new Date() }];
        await user.save({ validateBeforeSave: false });

        res.json({ status: 'success', message: 'Switched to this device', activeDevices: 1 });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

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
    const isAdmin = user.role === 'admin';

    res.json({
        success: true,
        access: {
            plan,
            isActive,
            isAdmin,
            canWatch: (isActive && plan !== 'free') || user.isInTrialPeriod(),
            canDownload: user.hasDownloadAccess(),
            showAds: user.shouldSeeAds(),
            freeUser: plan === 'free',
            endDate: user.subscription.endDate,
            maxDevices: user.getMaxDevices(),
            activeDevices: user.activeDevices.length
        }
    });
});

module.exports = router;
