const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
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

        // This device no longer holds a place on the plan, so signing in on
        // another device afterwards doesn't ask to log this one out
        if (req.deviceId && req.user.activeDevices.some(d => d.deviceId === req.deviceId)) {
            req.user.activeDevices = req.user.activeDevices.filter(d => d.deviceId !== req.deviceId);
            await req.user.save({ validateBeforeSave: false });
        }

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

const deviceIdFor = require('../utils/deviceId');

// Device limit for API replies: a number, or null when there is no limit
// (every plan except Daily — see PLAN_CONFIG in models/User.js)
function deviceLimitForApi(max) {
    return Number.isFinite(max) ? max : null;
}

// Get active sessions/devices
router.get('/sessions', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('activeDevices lastLogin role subscription trialEndsAt');

        res.json({
            status: 'success',
            data: {
                devices: user.activeDevices || [],
                lastLogin: user.lastLogin,
                maxDevices: deviceLimitForApi(user.getMaxDevices())
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
const { otherDeviceInfo } = require('../utils/deviceLimit');

// Checked right after signing in (js/auth.js). A Daily plan (1 device) that is
// signed in on another device answers 'device_limit', and the site asks
// "Log out your other device?": Yes = POST /device-switch, No = this new
// sign-in is cancelled (POST /logout). protect has already tried to register
// this device; req.deviceLimitExceeded means the other device holds the plan.
router.get('/device-check', protect, async (req, res) => {
    const user = req.user;
    const maxDevices = user.getMaxDevices();

    if (req.deviceLimitExceeded) {
        return res.json({
            status: 'device_limit',
            message: `The ${user.subscription?.plan === 'daily' ? 'Daily ' : ''}plan plays on ${maxDevices} device at a time, and your account is signed in on another device.`,
            maxDevices: deviceLimitForApi(maxDevices),
            otherDevice: otherDeviceInfo(user)
        });
    }

    res.json({
        status: 'ok',
        activeDevices: user.activeDevices.length,
        maxDevices: deviceLimitForApi(maxDevices)
    });
});

// "Yes, log out the other device": this device keeps the plan and every other
// device is signed out (their tokens stop working, refresh tokens included).
// Returns a fresh token for this device, which the site stores in place of
// the old one.
router.post('/device-switch', protect, async (req, res) => {
    try {
        const ua = req.headers['user-agent'] || '';
        const ip = req.ip || req.headers['x-forwarded-for'] || '';
        const deviceId = deviceIdFor(req);

        const user = req.user;
        // Whole seconds, like a token's issue time, so the new token below
        // (issued now or later) passes protect's lastSecurityUpdate check and
        // every token issued before this moment doesn't
        user.lastSecurityUpdate = new Date(Math.floor(Date.now() / 1000) * 1000);
        user.activeDevices = [{ deviceId, userAgent: ua, ip, lastActive: new Date() }];
        await user.save({ validateBeforeSave: false });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({
            status: 'success',
            message: 'Your other device was signed out',
            activeDevices: 1,
            data: { token }
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Could not switch devices. Please try again.' });
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
        const currentDeviceId = deviceIdFor(req);

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
            maxDevices: deviceLimitForApi(user.getMaxDevices()),
            activeDevices: user.activeDevices.length,
            // Daily (1 device): true when the plan is in use on another
            // device. The players ask "Watch on this device?" and, while a
            // video plays, check this every few minutes so only one plays.
            deviceLimitReached: !!req.deviceLimitExceeded,
            otherDevice: req.deviceLimitExceeded ? otherDeviceInfo(user) : null
        }
    });
});

module.exports = router;
