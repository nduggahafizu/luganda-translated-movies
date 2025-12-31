const Redis = require('ioredis');

// Redis client configuration with lazy connect (won't block startup)
let redisClient = null;
let isRedisAvailable = false;

// Initialize Redis only if REDIS_HOST is configured
const initRedis = () => {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
    
    if (!redisUrl) {
        console.log('⚠️  Redis not configured - caching disabled');
        console.log('   Set REDIS_URL or REDIS_HOST environment variable to enable caching');
        return null;
    }

    try {
        const client = new Redis(process.env.REDIS_URL || {
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            lazyConnect: true, // Don't connect automatically
            retryStrategy: (times) => {
                if (times > 3) {
                    console.log('⚠️  Redis connection failed after 3 retries - caching disabled');
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 100, 2000);
                return delay;
            },
            maxRetriesPerRequest: 1,
            enableOfflineQueue: false // Don't queue commands when disconnected
        });

        // Redis connection event handlers
        client.on('connect', () => {
            console.log('✅ Redis connected successfully');
            isRedisAvailable = true;
        });

        client.on('error', (err) => {
            console.error('⚠️  Redis error:', err.message);
            isRedisAvailable = false;
        });

        client.on('close', () => {
            console.log('⚠️  Redis connection closed');
            isRedisAvailable = false;
        });

        client.on('ready', () => {
            console.log('✅ Redis is ready to accept commands');
            isRedisAvailable = true;
        });

        // Try to connect (non-blocking)
        client.connect().catch((err) => {
            console.log('⚠️  Redis connection failed:', err.message);
            isRedisAvailable = false;
        });

        return client;
    } catch (error) {
        console.log('⚠️  Redis initialization error:', error.message);
        return null;
    }
};

// Initialize Redis client
redisClient = initRedis();

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
