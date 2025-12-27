 const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const responseTime = require('response-time');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

// Import middleware
const { logger, requestLogger } = require('./middleware/logger');
const { cache, clearCache, getCacheStats } = require('./middleware/cache');
const { metricsMiddleware, getHealthCheck, getApiMetrics } = require('./utils/monitoring');
const { refreshTokenHandler } = require('./middleware/jwtAuth');

// Import Swagger configuration
const swaggerSpec = require('./config/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payments');
const lugandaMoviesRoutes = require('./routes/luganda-movies');
const vjRoutes = require('./routes/vjs');
const moviesApiRoutes = require('./routes/movies-api');
const watchProgressRoutes = require('./routes/watch-progress');
const playlistRoutes = require('./routes/playlist');
const tmdbProxyRoutes = require('./routes/tmdb-proxy');

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Response time header
app.use(responseTime());

// Metrics tracking
app.use(metricsMiddleware);

// Security middleware with enhanced configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Enhanced CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',')
            : [
                'http://localhost:3000', 
                'http://localhost:5000',
                'https://watch.unrulymovies.com',
                'https://unrulymovies.com',
                'https://www.unrulymovies.com'
            ];
        
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            logger.warn('CORS blocked origin:', origin);
            callback(null, true); // Allow all origins in production for now
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Response-Time'],
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging with Winston
app.use(requestLogger);

// Enhanced Rate limiting with multiple tiers
const createRateLimiter = (windowMinutes, maxRequests) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            status: 'error',
            message: 'Too many requests from this IP, please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.warn('Rate limit exceeded', {
                ip: req.ip,
                url: req.url
            });
            res.status(429).json({
                status: 'error',
                message: 'Too many requests, please try again later.'
            });
        }
    });
};

// Apply different rate limits to different routes
const generalLimiter = createRateLimiter(15, 100); // 100 requests per 15 minutes
const authLimiter = createRateLimiter(15, 5);      // 5 requests per 15 minutes for auth
const apiLimiter = createRateLimiter(1, 30);       // 30 requests per minute for API

app.use('/api/auth', authLimiter);
app.use('/api/', generalLimiter);

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection with fallback support
const dbManager = require('./config/database');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';

// Connect to database (with fallback to in-memory mode)
dbManager.connect(MONGODB_URI).then((connected) => {
    if (!connected) {
        console.log('⚠️  Running in IN-MEMORY mode');
        console.log('⚠️  Data will not persist between restarts\n');
    }
}).catch((err) => {
    console.error('❌ Database initialization error:', err);
});

// Session middleware for watch progress and playlists
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET || 'luganda-movies-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
}));

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Luganda Movies API Documentation'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/luganda-movies', cache(300), lugandaMoviesRoutes); // Cache for 5 minutes
app.use('/api/vjs', cache(600), vjRoutes); // Cache for 10 minutes
app.use('/api/movies', cache(300), moviesApiRoutes); // Cache for 5 minutes
app.use('/api/watch-progress', watchProgressRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/tmdb', cache(600), tmdbProxyRoutes); // TMDB proxy with 10 min cache

// Token refresh endpoint
app.post('/api/auth/refresh', refreshTokenHandler);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running
 */
app.get('/api/health', async (req, res) => {
    try {
        const health = await getHealthCheck();
        const dbStatus = dbManager.getStatus();
        
        res.json({
            ...health,
            database: dbStatus
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get API metrics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API metrics
 */
app.get('/api/metrics', (req, res) => {
    const metrics = getApiMetrics();
    res.json({
        status: 'success',
        metrics
    });
});

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache statistics
 */
app.get('/api/cache/stats', async (req, res) => {
    try {
        const stats = await getCacheStats();
        res.json({
            status: 'success',
            cache: stats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to get cache stats',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear cache
 *     tags: [Cache]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 example: "cache:*"
 *     responses:
 *       200:
 *         description: Cache cleared
 */
app.post('/api/cache/clear', async (req, res) => {
    try {
        const { pattern } = req.body;
        const result = await clearCache(pattern || 'cache:*');
        res.json({
            status: 'success',
            message: 'Cache cleared',
            result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to clear cache',
            error: error.message
        });
    }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Luganda Movies API',
        version: '1.0.0',
        description: 'API for Luganda translated movies streaming platform',
        documentation: '/api-docs',
        endpoints: {
            health: '/api/health',
            metrics: '/api/metrics',
            documentation: '/api-docs',
            lugandaMovies: '/api/luganda-movies',
            movies: '/api/movies',
            vjs: '/api/vjs',
            auth: '/api/auth',
            payments: '/api/payments',
            watchProgress: '/api/watch-progress',
            playlist: '/api/playlist',
            tmdb: '/api/tmdb',
            cache: {
                stats: '/api/cache/stats',
                clear: '/api/cache/clear'
            }
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

module.exports = app;
