const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Configuration with defaults (must match authController)
const JWT_SECRET = process.env.JWT_SECRET || 'unruly-movies-jwt-secret-key-2024';

// Protect routes - verify JWT token
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
                message: 'Not authorized to access this route. Please login.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Get user from token
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({
                    status: 'error',
                    message: 'User not found'
                });
            }

            // Check if user is active
            if (!req.user.isActive) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Your account has been deactivated'
                });
            }

            next();
        } catch (error) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid or expired token'
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
