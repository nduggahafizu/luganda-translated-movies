const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const googleAuthController = require('../controllers/googleAuthController');
const { protect } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/google', googleAuthController.googleSignIn);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', protect, authController.getMe);
router.post('/logout', protect, authController.logout);
router.put('/update-profile', protect, authController.updateProfile);
router.put('/update-password', protect, authController.updatePassword);
router.post('/refresh-token', authController.refreshToken);

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
