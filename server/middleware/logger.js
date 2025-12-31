const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create transports array - always include console
const transports = [
    new winston.transports.Console({
        format: consoleFormat
    })
];

// Only add file transports in development (Railway has ephemeral filesystem)
if (process.env.NODE_ENV !== 'production') {
    try {
        const DailyRotateFile = require('winston-daily-rotate-file');
        const logsDir = path.join(__dirname, '../logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        transports.push(
            new DailyRotateFile({
                filename: path.join(logsDir, 'application-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                maxSize: '20m',
                maxFiles: '14d',
                format: logFormat
            }),
            new DailyRotateFile({
                filename: path.join(logsDir, 'error-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: 'error',
                maxSize: '20m',
                maxFiles: '30d',
                format: logFormat
            })
        );
    } catch (err) {
        console.log('⚠️  File logging disabled:', err.message);
    }
}

// Create Winston logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports
});

// Express middleware for request logging
const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    // Log request
    logger.info('Incoming request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    // Log response
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip
        };

        if (res.statusCode >= 400) {
            logger.error('Request failed', logData);
        } else {
            logger.info('Request completed', logData);
        }
    });

    next();
};

// Stream for Morgan integration
logger.stream = {
    write: (message) => {
        logger.info(message.trim());
    }
};

module.exports = {
    logger,
    requestLogger
};
