const { body, validationResult } = require('express-validator');

// Admin user update validation
exports.validateAdminUserUpdate = [
    body('role')
        .optional()
        .isIn(['user', 'admin', 'moderator']).withMessage('Invalid role'),
    body('isActive')
        .optional()
        .isBoolean().withMessage('isActive must be a boolean'),
    body('subscription')
        .optional()
        .isObject().withMessage('Subscription must be an object'),
    body('subscription.plan')
        .optional()
        .isIn(['free', 'basic', 'premium']).withMessage('Invalid subscription plan'),
    body('subscription.status')
        .optional()
        .isIn(['active', 'inactive', 'canceled']).withMessage('Invalid subscription status'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Notification broadcast validation
exports.validateNotificationBroadcast = [
    body('title')
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('message')
        .notEmpty().withMessage('Message is required')
        .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters'),
    body('link')
        .optional()
        .isURL().withMessage('Link must be a valid URL'),
    body('image')
        .optional()
        .isURL().withMessage('Image must be a valid URL'),
    body('userFilter')
        .optional()
        .isObject().withMessage('userFilter must be an object'),
    body('userFilter.plan')
        .optional()
        .isIn(['free', 'basic', 'premium']).withMessage('Invalid userFilter plan'),
    body('userFilter.status')
        .optional()
        .isIn(['active', 'inactive', 'canceled']).withMessage('Invalid userFilter status'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Validation middleware
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// Register validation rules
exports.validateRegister = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Login validation rules
exports.validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    
    body('password')
        .notEmpty().withMessage('Password is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Movie validation rules
exports.validateMovie = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    
    body('year')
        .notEmpty().withMessage('Release year is required')
        .isInt({ min: 1900, max: new Date().getFullYear() + 2 }).withMessage('Invalid year'),
    
    body('duration')
        .notEmpty().withMessage('Duration is required')
        .isInt({ min: 1 }).withMessage('Duration must be a positive number'),
    
    body('director')
        .trim()
        .notEmpty().withMessage('Director is required'),
    
    body('poster')
        .notEmpty().withMessage('Poster image is required')
        .isURL().withMessage('Poster must be a valid URL'),
    
    body('video.url')
        .notEmpty().withMessage('Video URL is required')
        .isURL().withMessage('Video URL must be valid'),
    
    body('genres')
        .isArray({ min: 1 }).withMessage('At least one genre is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Series validation rules
exports.validateSeries = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    
    body('startYear')
        .notEmpty().withMessage('Start year is required')
        .isInt({ min: 1900, max: new Date().getFullYear() + 2 }).withMessage('Invalid year'),
    
    body('poster')
        .notEmpty().withMessage('Poster image is required')
        .isURL().withMessage('Poster must be a valid URL'),
    
    body('genres')
        .isArray({ min: 1 }).withMessage('At least one genre is required'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Payment validation rules
exports.validatePayment = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
    
    body('paymentMethod')
        .notEmpty().withMessage('Payment method is required')
        .isIn(['stripe', 'pesapal', 'mtn_mobile_money', 'airtel_money', 'card']).withMessage('Invalid payment method'),
    
    body('subscriptionPlan')
        .notEmpty().withMessage('Subscription plan is required')
        .isIn(['basic', 'premium']).withMessage('Invalid subscription plan'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];

// Rating validation
exports.validateRating = [
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                status: 'error',
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        next();
    }
];
