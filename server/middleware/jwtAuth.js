const jwt = require('jsonwebtoken');
const { logger } = require('./logger');

// JWT Secret from environment or default (must match authController and auth middleware)
const JWT_SECRET = process.env.JWT_SECRET || 'unruly-movies-jwt-secret-key-2024';
// No expiry for persistent login
const JWT_EXPIRES_IN = null;
const JWT_REFRESH_EXPIRES_IN = null;

/**
 * Generate JWT access token (no expiry for persistent login)
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        issuer: 'luganda-movies-api'
        // No expiresIn = token never expires
    });
};

/**
 * Generate JWT refresh token (no expiry)
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        issuer: 'luganda-movies-api'
        // No expiresIn = token never expires
    });
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User object
 * @returns {Object} Object containing access and refresh tokens
 */
const generateTokens = (user) => {
    const payload = {
        id: user._id || user.id,
        email: user.email,
        role: user.role || 'user'
    };

    return {
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        expiresIn: 'never'
    };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * JWT Authentication Middleware
 * Protects routes by requiring valid JWT token
 */
const authenticateJWT = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            logger.warn('Authentication failed: No authorization header', {
                ip: req.ip,
                url: req.url
            });
            return res.status(401).json({
                status: 'error',
                message: 'Access denied. No token provided.'
            });
        }

        // Check if Bearer token
        if (!authHeader.startsWith('Bearer ')) {
            logger.warn('Authentication failed: Invalid token format', {
                ip: req.ip,
                url: req.url
            });
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token format. Use Bearer token.'
            });
        }

        // Extract token
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach user info to request
        req.user = decoded;

        logger.info('User authenticated successfully', {
            userId: decoded.id,
            email: decoded.email,
            url: req.url
        });

        next();
    } catch (error) {
        logger.error('Authentication error', {
            error: error.message,
            ip: req.ip,
            url: req.url
        });

        return res.status(403).json({
            status: 'error',
            message: 'Invalid or expired token',
            error: error.message
        });
    }
};

/**
 * Optional JWT Authentication
 * Attaches user if token is valid, but doesn't block if missing
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            req.user = decoded;
        }
        
        next();
    } catch (error) {
        // Continue without user authentication
        next();
    }
};

/**
 * Role-based authorization middleware
 * @param {Array} roles - Array of allowed roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'error',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            logger.warn('Authorization failed', {
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: roles,
                url: req.url
            });

            return res.status(403).json({
                status: 'error',
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

/**
 * Refresh token endpoint handler
 */
const refreshTokenHandler = (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                status: 'error',
                message: 'Refresh token required'
            });
        }

        // Verify refresh token
        const decoded = verifyToken(refreshToken);

        // Generate new access token
        const newAccessToken = generateAccessToken({
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        });

        logger.info('Token refreshed successfully', {
            userId: decoded.id
        });

        res.json({
            status: 'success',
            accessToken: newAccessToken,
            expiresIn: JWT_EXPIRES_IN
        });
    } catch (error) {
        logger.error('Token refresh failed', {
            error: error.message
        });

        res.status(403).json({
            status: 'error',
            message: 'Invalid refresh token',
            error: error.message
        });
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateTokens,
    verifyToken,
    authenticateJWT,
    optionalAuth,
    authorize,
    refreshTokenHandler
};
