const Redis = require('ioredis');

const isCachingEnabled = String(process.env.ENABLE_CACHING || '').toLowerCase() === 'true';

let redisClient = null;
let isRedisAvailable = false;

if (isCachingEnabled) {
    // Redis client configuration
    redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        },
        maxRetriesPerRequest: 3
    });

    // Redis connection event handlers
    redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
        console.error('⚠️  Redis connection error:', err.message);
        console.log('⚠️  Server will continue without caching');
    });

    redisClient.on('ready', () => {
        console.log('✅ Redis is ready to accept commands');
    });

    // Check if Redis is available
    redisClient.ping()
        .then(() => {
            isRedisAvailable = true;
        })
        .catch(() => {
            isRedisAvailable = false;
            console.log('⚠️  Redis not available - caching disabled');
        });
} else {
    console.log('ℹ️  ENABLE_CACHING is not set to true - caching disabled');
}

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 */
const cache = (duration = 300) => {
    return async (req, res, next) => {
        if (!isCachingEnabled || !redisClient || !isRedisAvailable || req.method !== 'GET') {
            return next();
        }

        // Create cache key from URL and query params
        const key = `cache:${req.originalUrl || req.url}`;

        try {
            // Try to get cached data
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                // Cache hit
                console.log(`✅ Cache HIT: ${key}`);
                return res.json(JSON.parse(cachedData));
            }

            // Cache miss - store original res.json
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = (data) => {
                // Cache the response
                redisClient.setex(key, duration, JSON.stringify(data))
                    .then(() => {
                        console.log(`💾 Cached: ${key} (${duration}s)`);
                    })
                    .catch((err) => {
                        console.error('Cache set error:', err.message);
                    });

                // Send the response
                return originalJson(data);
            };

            next();
        } catch (error) {
            console.error('Cache middleware error:', error.message);
            next();
        }
    };
};

/**
 * Clear cache by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'cache:*', 'cache:/api/movies*')
 */
const clearCache = async (pattern = 'cache:*') => {
    if (!isCachingEnabled || !redisClient || !isRedisAvailable) {
        return { success: false, message: 'Caching disabled or Redis not available' };
    }

    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(...keys);
            console.log(`🗑️  Cleared ${keys.length} cache entries matching: ${pattern}`);
            return { success: true, cleared: keys.length };
        }
        return { success: true, cleared: 0 };
    } catch (error) {
        console.error('Clear cache error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Clear specific cache key
 * @param {string} key - Specific cache key to clear
 */
const clearCacheKey = async (key) => {
    if (!isCachingEnabled || !redisClient || !isRedisAvailable) {
        return { success: false, message: 'Caching disabled or Redis not available' };
    }

    try {
        const result = await redisClient.del(key);
        console.log(`🗑️  Cleared cache key: ${key}`);
        return { success: true, cleared: result };
    } catch (error) {
        console.error('Clear cache key error:', error.message);
        return { success: false, message: error.message };
    }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
    if (!isCachingEnabled || !redisClient || !isRedisAvailable) {
        return { available: false };
    }

    try {
        const info = await redisClient.info('stats');
        const keys = await redisClient.keys('cache:*');
        
        return {
            available: true,
            totalKeys: keys.length,
            info: info
        };
    } catch (error) {
        return { available: false, error: error.message };
    }
};

module.exports = {
    cache,
    clearCache,
    clearCacheKey,
    getCacheStats,
    redisClient,
    isCachingEnabled,
    isRedisAvailable: () => isRedisAvailable && isCachingEnabled
};
