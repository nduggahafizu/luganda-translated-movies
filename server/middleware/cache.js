// Redis client configuration - DISABLED unless explicitly configured
let redisClient = null;
let isRedisAvailable = false;

// Only initialize Redis if REDIS_URL is explicitly set
const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
    try {
        const Redis = require('ioredis');
        redisClient = new Redis(REDIS_URL, {
            lazyConnect: true,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 2) {
                    console.log('⚠️  Redis: Max retries reached, disabling cache');
                    isRedisAvailable = false;
                    return null;
                }
                return Math.min(times * 100, 1000);
            },
            enableOfflineQueue: false
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected');
            isRedisAvailable = true;
        });

        redisClient.on('error', () => {
            isRedisAvailable = false;
        });

        redisClient.on('close', () => {
            isRedisAvailable = false;
        });

        redisClient.connect().catch(() => {
            isRedisAvailable = false;
        });
    } catch (err) {
        console.log('⚠️  Redis init failed:', err.message);
        redisClient = null;
    }
} else {
    console.log('ℹ️  Redis not configured (REDIS_URL not set) - caching disabled');
}

// Initialize Redis client
// redisClient is already set above

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 300 = 5 minutes)
 */
const cache = (duration = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests and only if Redis is available
        if (req.method !== 'GET' || !isRedisAvailable || !redisClient) {
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
                // Cache the response (only if Redis is still available)
                if (redisClient && isRedisAvailable) {
                    redisClient.setex(key, duration, JSON.stringify(data))
                        .then(() => {
                            console.log(`💾 Cached: ${key} (${duration}s)`);
                        })
                        .catch((err) => {
                            console.error('Cache set error:', err.message);
                        });
                }

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
    if (!isRedisAvailable || !redisClient) {
        return { success: false, message: 'Redis not available' };
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
    if (!isRedisAvailable || !redisClient) {
        return { success: false, message: 'Redis not available' };
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
    if (!isRedisAvailable || !redisClient) {
        return { available: false, message: 'Redis not configured or unavailable' };
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
    redisClient: redisClient,
    isRedisAvailable: () => isRedisAvailable
};
