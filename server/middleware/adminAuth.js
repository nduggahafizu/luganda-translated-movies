const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to check if user is admin
const adminOnly = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId || decoded.id).select('+role');
        
        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Add user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'Token expired'
            });
        }
        
        res.status(500).json({
            status: 'error',
            message: 'Authorization failed'
        });
    }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId || decoded.id);
        
        req.user = user;
        next();
    } catch (error) {
        // Don't fail, just proceed without user
        req.user = null;
        next();
    }
};

// Export both functions
module.exports = { adminOnly, optionalAuth };
