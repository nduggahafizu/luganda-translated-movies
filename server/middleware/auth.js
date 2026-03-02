const jwt = require('jsonwebtoken');
const User = require('../models/User');
const TokenBlacklist = require('../models/TokenBlacklist');

// JWT Configuration with defaults (must match authController)
const JWT_SECRET = process.env.JWT_SECRET || 'unruly-movies-jwt-secret-key-2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'unruly-movies-jwt-refresh-secret-2024';

// Protect routes - verify JWT token with enhanced security
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in headers
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Not authorized to access this route. Please login.',
                code: 'NO_TOKEN'
            });
        }

        try {
            // Check if token is blacklisted
            const isBlacklisted = await TokenBlacklist.isBlacklisted(token);
            if (isBlacklisted) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token has been revoked. Please login again.',
                    code: 'TOKEN_REVOKED'
                });
            }

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found',
                    code: 'USER_NOT_FOUND'
                });
            }

            // Check if user is active
            if (!req.user.isActive) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Your account has been deactivated',
                    code: 'ACCOUNT_DEACTIVATED'
                });
            }

            // Check if user is banned
            if (req.user.status === 'banned') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your account has been banned. Please contact support.',
                    code: 'ACCOUNT_BANNED',
                    reason: req.user.statusReason || 'Violation of terms of service'
                });
            }

            // Check if user is restricted
            if (req.user.status === 'restricted') {
                return res.status(403).json({
                    status: 'error',
                    message: 'Your account has been restricted. Please contact support to restore access.',
                    code: 'ACCOUNT_RESTRICTED',
                    reason: req.user.statusReason || 'Account under review'
                });
            }

            // Update lastVisit
            req.user.lastVisit = new Date();
            await req.user.save({ validateBeforeSave: false });

            // Check if token was issued before last security update
            if (req.user.lastSecurityUpdate) {
                const tokenIssuedAt = new Date(decoded.iat * 1000);
                if (tokenIssuedAt < req.user.lastSecurityUpdate) {
                    return res.status(401).json({
                        status: 'error',
                        message: 'Your session has expired due to a security update. Please login again.',
                        code: 'SECURITY_UPDATE'
                    });
                }
            }

            // Store token for potential blacklisting on logout
            req.token = token;
            
            // Store device info
            req.deviceInfo = {
                userAgent: req.headers['user-agent'],
                ip: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']
            };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'error',
                    message: 'Token expired. Please refresh your token.',
                    code: 'TOKEN_EXPIRED'
                });
            }
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Authentication error',
            error: error.message
        });
    }
};

// Authorize roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

// Check subscription access
exports.checkSubscription = (requiredPlan) => {
    return (req, res, next) => {
        const planHierarchy = { free: 0, basic: 1, premium: 2 };
        const userPlanLevel = planHierarchy[req.user.subscription.plan];
        const requiredPlanLevel = planHierarchy[requiredPlan];

        // Check if user has active subscription
        if (!req.user.hasActiveSubscription()) {
            return res.status(403).json({
                status: 'error',
                message: 'Your subscription has expired. Please renew to continue.'
            });
        }

        // Check if user's plan meets requirement
        if (userPlanLevel < requiredPlanLevel) {
            return res.status(403).json({
                status: 'error',
                message: `This content requires a ${requiredPlan} subscription or higher`,
                requiredPlan,
                currentPlan: req.user.subscription.plan
            });
        }

        next();
    };
};

// Admin only middleware
exports.admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.user = await User.findById(decoded.id);
            } catch (error) {
                // Token invalid, but continue without user
                req.user = null;
            }
        }

        next();
    } catch (error) {
        next();
    }
};
