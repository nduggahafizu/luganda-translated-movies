const os = require('os');
const mongoose = require('mongoose');
const { isRedisAvailable, getCacheStats } = require('../middleware/cache');

/**
 * Get system health metrics
 */
const getSystemHealth = async () => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: {
            seconds: Math.floor(uptime),
            formatted: formatUptime(uptime)
        },
        memory: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external)
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: formatBytes(os.totalmem()),
            freeMemory: formatBytes(os.freemem()),
            loadAverage: os.loadavg()
        }
    };
};

/**
 * Get database health status
 */
const getDatabaseHealth = async () => {
    try {
        const state = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        const health = {
            status: state === 1 ? 'healthy' : 'unhealthy',
            state: states[state],
            name: mongoose.connection.name,
            host: mongoose.connection.host,
            port: mongoose.connection.port
        };

        if (state === 1) {
            // Get database stats
            const admin = mongoose.connection.db.admin();
            const serverStatus = await admin.serverStatus();
            
            health.version = serverStatus.version;
            health.connections = serverStatus.connections;
            health.uptime = serverStatus.uptime;
        }

        return health;
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

/**
 * Get cache health status
 */
const getCacheHealth = async () => {
    try {
        const available = isRedisAvailable();
        
        if (!available) {
            return {
                status: 'unavailable',
                message: 'Redis not configured or not running'
            };
        }

        const stats = await getCacheStats();
        
        return {
            status: 'healthy',
            available: true,
            totalKeys: stats.totalKeys
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            error: error.message
        };
    }
};

/**
 * Get comprehensive health check
 */
const getHealthCheck = async () => {
    const [system, database, cache] = await Promise.all([
        getSystemHealth(),
        getDatabaseHealth(),
        getCacheHealth()
    ]);

    const overallStatus = 
        database.status === 'healthy' && system.status === 'healthy'
            ? 'healthy'
            : 'degraded';

    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
            system,
            database,
            cache
        }
    };
};

/**
 * Get API metrics
 */
const getApiMetrics = () => {
    return {
        requests: {
            total: global.requestCount || 0,
            successful: global.successCount || 0,
            failed: global.errorCount || 0
        },
        responseTime: {
            average: global.avgResponseTime || 0,
            min: global.minResponseTime || 0,
            max: global.maxResponseTime || 0
        }
    };
};

/**
 * Middleware to track API metrics
 */
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    // Initialize global counters
    if (!global.requestCount) global.requestCount = 0;
    if (!global.successCount) global.successCount = 0;
    if (!global.errorCount) global.errorCount = 0;
    if (!global.responseTimes) global.responseTimes = [];

    global.requestCount++;

    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Track response time
        global.responseTimes.push(duration);
        if (global.responseTimes.length > 1000) {
            global.responseTimes.shift(); // Keep only last 1000
        }

        // Calculate metrics
        global.avgResponseTime = 
            global.responseTimes.reduce((a, b) => a + b, 0) / global.responseTimes.length;
        global.minResponseTime = Math.min(...global.responseTimes);
        global.maxResponseTime = Math.max(...global.responseTimes);

        // Track success/error
        if (res.statusCode >= 200 && res.statusCode < 400) {
            global.successCount++;
        } else {
            global.errorCount++;
        }
    });

    next();
};

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format uptime to human readable format
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
}

module.exports = {
    getSystemHealth,
    getDatabaseHealth,
    getCacheHealth,
    getHealthCheck,
    getApiMetrics,
    metricsMiddleware
};
