#!/usr/bin/env node

/**
 * Frontend Server for Luganda Movies
 * Serves static files with proper MIME types
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.FRONTEND_PORT || 8080;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Parse URL and remove query parameters
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let filePath = '.' + url.pathname;

    // Default to index.html
    if (filePath === './') {
        filePath = './index.html';
    }

    // Security: prevent directory traversal
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // Get file extension
    const extname = String(path.extname(safePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(safePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1><p>The requested file was not found.</p>', 'utf-8');
            } else if (error.code === 'EISDIR') {
                // Try index.html in directory
                fs.readFile(path.join(safePath, 'index.html'), (err, content) => {
                    if (err) {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end('<h1>404 - Directory listing not allowed</h1>', 'utf-8');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log('🌐 Frontend Server Running');
    console.log('==========================');
    console.log(`Port: ${PORT}`);
    console.log(`URL:  http://localhost:${PORT}`);
    console.log('==========================');
    console.log('Press Ctrl+C to stop\n');
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down frontend server...');
    server.close(() => {
        console.log('Frontend server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Shutting down frontend server...');
    server.close(() => {
        console.log('Frontend server stopped');
        process.exit(0);
    });
});
