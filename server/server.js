 const express = require('express');
const mongoose = require('mongoose');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const responseTime = require('response-time');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import middleware
const { logger, requestLogger } = require('./middleware/logger');
const requestIdMiddleware = require('./middleware/requestId');
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
const tvRoutes = require('./routes/tv');
const videoProxyRoutes = require('./routes/video-proxy');
const r2UploadRoutes = require('./routes/r2-upload');
const requestsRoutes = require('./routes/requests');
const seriesRoutes = require('./routes/series');

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Response time header
app.use(responseTime());

// Metrics tracking
app.use(metricsMiddleware);

// Security middleware with CSP disabled for development
app.use(helmet({
    contentSecurityPolicy: false,  // CSP disabled to allow all external resources
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false  // Disable COOP to allow Google OAuth popups
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
                'http://localhost:5000',
                'http://localhost:8000'
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

        // Allow in development mode
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Log blocked origins for debugging
        logger.warn('CORS blocked origin:', origin);

        // Deny by default
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['X-Response-Time'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Explicit OPTIONS handler for preflight requests
app.options('*', cors(corsOptions));

// Body parser middleware with stricter limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Compression middleware
app.use(compression());

// Attach requestId to every request
app.use(requestIdMiddleware);
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

mongoose.connect(MONGODB_URI)
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

// Configure session store - use MongoDB in production, memory in development
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'luganda-movies-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
};

// Use MongoDB store in production to avoid memory leaks
if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI) {
    try {
        const MongoStore = require('connect-mongo');
        // Handle both default export and named export patterns
        const Store = MongoStore.default || MongoStore;
        sessionConfig.store = Store.create({
            mongoUrl: MONGODB_URI,
            ttl: 30 * 24 * 60 * 60, // 30 days
            autoRemove: 'native'
        });
        console.log('📦 Using MongoDB session store');
    } catch (err) {
        console.warn('⚠️ Could not initialize MongoDB session store:', err.message);
        console.warn('⚠️ Falling back to MemoryStore (not recommended for production)');
    }
}

app.use(session(sessionConfig));

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
app.use('/api/tv', cache(600), tvRoutes); // TV stations with 10 min cache
app.use('/api/video', videoProxyRoutes); // Video URL extraction proxy
app.use('/api/r2', r2UploadRoutes); // Cloudflare R2 video uploads
app.use('/api/requests', requestsRoutes); // User requests/contact form
app.use('/api/series', cache(300), seriesRoutes); // TV Series with 5 min cache

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
        logger.error('Health check error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
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
        logger.error('Cache stats error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
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
        logger.error('Clear cache error', { error, requestId: req.requestId });
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
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

// S3 pre-signed video URL endpoint
app.get('/api/video-url', async (req, res) => {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: 'Missing video key' });

    // Configure AWS SDK v3 S3 Client
    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
    });

    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
    });

    try {
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
        res.json({ url });
    } catch (err) {
        res.status(500).json({ error: 'Could not generate URL', details: err.message });
    }
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
    logger.error('Unhandled error', { error: err, requestId: req.requestId });
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: 'Something went wrong',
        requestId: req.requestId
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
    
    // Keep-alive ping to prevent cold starts (every 5 minutes)
    if (process.env.NODE_ENV === 'production' && process.env.KEEP_ALIVE_URL) {
        const https = require('https');
        const keepAliveUrl = process.env.KEEP_ALIVE_URL;
        
        setInterval(() => {
            https.get(keepAliveUrl, (res) => {
                console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
            }).on('error', (err) => {
                console.error('Keep-alive error:', err.message);
            });
        }, 5 * 60 * 1000); // Every 5 minutes
        
        console.log('🔄 Keep-alive enabled');
    }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    // Don't exit in development - just log
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Don't exit in development - just log
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

module.exports = app;
