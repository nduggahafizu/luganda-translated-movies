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
const reviewsRoutes = require('./routes/reviews');
const commentsRoutes = require('./routes/comments');
const notificationsRoutes = require('./routes/notifications');
const statsRoutes = require('./routes/stats');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

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
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'",
                "https://vjs.zencdn.net",
                "https://www.youtube.com",
                "https://s.ytimg.com",
                "https://pagead2.googlesyndication.com",
                "https://googleads.g.doubleclick.net",
                "https://www.googletagservices.com",
                "https://adservice.google.com",
                "https://tpc.googlesyndication.com",
                "https://ep2.adtrafficquality.google",
                "https://accounts.google.com",
                "https://apis.google.com",
                "https://fonts.googleapis.com",
                "https://fonts.gstatic.com",
                "https://*.googleapis.com",
                "https://*.google.com",
                "https://*.doubleclick.net",
                "blob:"
            ],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "https://fonts.googleapis.com", 
                "https://vjs.zencdn.net"
            ],
            imgSrc: [
                "'self'", 
                "data:", 
                "https:", 
                "blob:",
                "https://image.tmdb.org",
                "https://pagead2.googlesyndication.com",
                "https://*.google.com",
                "https://*.doubleclick.net"
            ],
            connectSrc: [
                "'self'",
                "https://image.tmdb.org",
                "https://luganda-translated-movies-production.up.railway.app",
                "https://watch.unrulymovies.com",
                "https://unrulymovies.com",
                "https://*.netlify.app",
                "https://www.youtube.com",
                "https://s.ytimg.com",
                "https://www.googleapis.com",
                "https://accounts.google.com",
                "https://pagead2.googlesyndication.com",
                "https://ep1.adtrafficquality.google",
                "https://ep2.adtrafficquality.google",
                "https://googleads.g.doubleclick.net",
                "https://www.googletagservices.com",
                "https://*.googleapis.com",
                "https://*.google.com"
            ],
            frameSrc: [
                "'self'",
                "https://www.youtube.com",
                "https://accounts.google.com",
                "https://googleads.g.doubleclick.net"
            ],
            fontSrc: [
                "'self'",
                "data:",
                "https://fonts.gstatic.com"
            ],
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Always allow production domains and all subdomains
        const productionRegex = /^https:\/\/(.+\.)?(unrulymovies\.com|watch\.unrulymovies\.com)$/;
        const allowedOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',')
            : [
                'http://localhost:3000',
                'http://localhost:5000'
              ];

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Allow explicit matches
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Allow all subdomains of unrulymovies.com and watch.unrulymovies.com
        if (productionRegex.test(origin)) {
            return callback(null, true);
        }

        // Allow Netlify preview URLs and Railway preview URLs (flexible for deploy previews)
        if (origin.includes('netlify.app') || origin.includes('up.railway.app') || process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Deny by default
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Response-Time'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight requests
app.options('*', cors(corsOptions));

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
const authLimiter = createRateLimiter(15, 50);     // 50 requests per 15 minutes for auth (increased for development)
const apiLimiter = createRateLimiter(1, 30);       // 30 requests per minute for API

app.use('/api/auth', authLimiter);
app.use('/api/', generalLimiter);

// Static files
app.use('/uploads', express.static('uploads'));

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';

// Debug: Log environment variable presence (not the actual value for security)
console.log(`🔧 MONGODB_URI from env: ${process.env.MONGODB_URI ? 'SET (' + MONGODB_URI.substring(0, 30) + '...)' : 'NOT SET - using default'}`);
console.log(`🔧 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📦 Database: ${MONGODB_URI}`);
})
.catch((err) => {
    console.error('⚠️  MongoDB Connection Warning:', err.message);
    console.log('⚠️  Server will continue without MongoDB');
    console.log('⚠️  Some features may not work until MongoDB is connected');
    console.log('');
    console.log('💡 To fix this:');
    console.log('   1. Start MongoDB: net start MongoDB');
    console.log('   2. Or use MongoDB Atlas (cloud): Update MONGODB_URI in .env');
    console.log('');
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
app.use('/api/reviews', reviewsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

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
        res.json(health);
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
