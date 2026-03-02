const { OAuth2Client } = require('google-auth-library');
const { logger } = require('../middleware/logger');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendWelcomeNotification } = require('../utils/notificationService');

// Google Client ID - from env or fallback to hardcoded
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * @desc    Google Sign-In
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                status: 'error',
                message: 'Google token is required'
            });
        }
        
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId, email_verified } = payload;
        
        console.log('Google Sign-In:', { email, name, googleId });
        
        // Check if user exists
        let user = await User.findOne({ email });
        let isNewUser = false;
        
        if (!user) {
            isNewUser = true;
            // Create new user
            user = await User.create({
                fullName: name,
                email,
                profileImage: picture,
                googleId,
                provider: 'google',
                verified: email_verified || true, // Google emails are pre-verified
                isEmailVerified: true,
                subscription: {
                    plan: 'free',
                    status: 'active',
                    startDate: new Date()
                }
            });
            
            console.log('New user created:', user._id);
            
            // Send welcome notification
            try {
                await sendWelcomeNotification(user._id, user.fullName);
            } catch (err) {
                console.error('Failed to send welcome notification:', err);
            }
        } else {
            // Update existing user with Google info
            user.googleId = googleId;
            user.profileImage = picture || user.profileImage;
            user.lastLogin = new Date();
            user.provider = user.provider || 'google';
            
            // If user wasn't verified, mark as verified
            if (!user.verified) {
                user.verified = true;
            }
            if (!user.isEmailVerified) {
                user.isEmailVerified = true;
            }
            
            await user.save();
            console.log('Existing user updated:', user._id);
        }
        
        // Generate JWT token
        const jwtToken = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                subscription: user.subscription.plan
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Google sign-in successful',
            data: {
                token: jwtToken,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    profileImage: user.profileImage,
                    subscription: user.subscription,
                    verified: user.verified,
                    role: user.role
                }
            }
        });
        
    } catch (error) {
        console.error('Google Sign-In Error:', error.message);
        console.error('Google Sign-In Full Error:', error);
        logger.error('GoogleSignIn error', { error: error.message, stack: error.stack, requestId: req.requestId });
        
        // Provide more specific error messages
        let errorMessage = 'Google sign-in failed';
        if (error.message.includes('Token used too late')) {
            errorMessage = 'Login session expired. Please try again.';
        } else if (error.message.includes('Invalid token')) {
            errorMessage = 'Invalid Google token. Please try again.';
        } else if (error.message.includes('audience') || error.message.includes('Wrong recipient')) {
            errorMessage = 'Google OAuth configuration error. The app is not authorized for this domain.';
            console.error('AUDIENCE MISMATCH - Check Google Cloud Console. Expected Client ID:', GOOGLE_CLIENT_ID);
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection.';
        }
        
        res.status(401).json({
            status: 'error',
            message: errorMessage,
            requestId: req.requestId
        });
    }
};

/**
 * @desc    Regular email/password login
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Email and password are required'
            });
        }
        
        // Find user
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }
        
        // Check password
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                subscription: user.subscription.plan
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    profileImage: user.profileImage,
                    subscription: user.subscription,
                    verified: user.verified
                }
            }
        });
        
    } catch (error) {
        logger.error('GoogleLogin error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        
        if (!fullName || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            });
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already registered'
            });
        }
        
        // Create new user
        const user = await User.create({
            fullName,
            email,
            password,
            provider: 'email',
            subscription: {
                plan: 'free',
                status: 'active',
                startDate: new Date()
            }
        });
        
        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user._id, 
                email: user.email,
                subscription: user.subscription.plan
            },
            process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );
        
        res.status(201).json({
            status: 'success',
            message: 'Registration successful',
            data: {
                token,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    profileImage: user.profileImage,
                    subscription: user.subscription,
                    verified: user.verified
                }
            }
        });
        
    } catch (error) {
        logger.error('GoogleRegister error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            requestId: req.requestId
        });
    }
};

module.exports = {
    googleSignIn: exports.googleSignIn,
    login: exports.login,
    register: exports.register
};
