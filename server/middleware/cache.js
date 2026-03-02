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
        return { 
            available: false, 
            message: 'Redis not configured - using in-memory cache',
            memoryCache: {
                keys: Object.keys(memoryCache).length,
                maxSize: MEMORY_CACHE_MAX_SIZE
            }
        };
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

// ============================================
// IN-MEMORY CACHE (Fallback when Redis unavailable)
// ============================================
const memoryCache = {};
const memoryCacheTimers = {};
const MEMORY_CACHE_MAX_SIZE = 100;

/**
 * Simple in-memory cache middleware (fast fallback)
 * @param {number} duration - Cache duration in seconds
 */
const memCache = (duration = 60) => {
    return (req, res, next) => {
        if (req.method !== 'GET') return next();
        
        const key = req.originalUrl || req.url;
        const cached = memoryCache[key];
        
        if (cached && cached.expires > Date.now()) {
            res.setHeader('X-Cache', 'HIT-MEMORY');
            return res.json(cached.data);
        }
        
        // Override res.json to cache response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Clean old entries if cache is full
            const keys = Object.keys(memoryCache);
            if (keys.length >= MEMORY_CACHE_MAX_SIZE) {
                // Remove oldest 20%
                const toRemove = keys.slice(0, Math.floor(keys.length * 0.2));
                toRemove.forEach(k => {
                    delete memoryCache[k];
                    if (memoryCacheTimers[k]) {
                        clearTimeout(memoryCacheTimers[k]);
                        delete memoryCacheTimers[k];
                    }
                });
            }
            
            // Store in cache
            memoryCache[key] = {
                data,
                expires: Date.now() + (duration * 1000)
            };
            
            // Auto-cleanup after expiry
            memoryCacheTimers[key] = setTimeout(() => {
                delete memoryCache[key];
                delete memoryCacheTimers[key];
            }, duration * 1000);
            
            res.setHeader('X-Cache', 'MISS');
            return originalJson(data);
        };
        
        next();
    };
};

/**
 * Clear in-memory cache
 */
const clearMemoryCache = (pattern = null) => {
    if (pattern) {
        Object.keys(memoryCache).forEach(key => {
            if (key.includes(pattern)) {
                delete memoryCache[key];
                if (memoryCacheTimers[key]) {
                    clearTimeout(memoryCacheTimers[key]);
                    delete memoryCacheTimers[key];
                }
            }
        });
    } else {
        Object.keys(memoryCache).forEach(key => {
            delete memoryCache[key];
            if (memoryCacheTimers[key]) {
                clearTimeout(memoryCacheTimers[key]);
                delete memoryCacheTimers[key];
            }
        });
    }
};

module.exports = {
    cache,
    memCache,
    clearCache,
    clearCacheKey,
    clearMemoryCache,
    getCacheStats,
    redisClient: redisClient,
    isRedisAvailable: () => isRedisAvailable
};
