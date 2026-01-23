/**
 * Simple HTTP server to serve Uganda TV application
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ROOT_DIR = __dirname;

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
    '.m3u8': 'application/vnd.apple.mpegurl',
    '.ts': 'video/mp2t',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Parse URL
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './index.html';
    }
    
    // Get file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`, 'utf-8');
            }
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*'
            });
            res.end(content, 'utf-8');
        }
    });
});

function printStartupInfo(port) {
    console.log('='.repeat(60));
    console.log('🚀 Uganda TV Server Started!');
    console.log('='.repeat(60));
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`\nAvailable pages:`);
    console.log(`  🎬 Movies: http://localhost:${port}/movies.html`);
    console.log(`  📺 Uganda TV: http://localhost:${port}/uganda-tv.html`);
    console.log(`  🎬 Home: http://localhost:${port}/index.html`);
    console.log(`  ▶️  Player: http://localhost:${port}/player.html`);
    console.log('\nPress Ctrl+C to stop the server');
    console.log('='.repeat(60));
}

function startListening(port) {
    server.listen(port, () => printStartupInfo(port));
}

startListening(BASE_PORT);

// Handle errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        const fallbackPort = BASE_PORT + 1;
        console.error(`❌ Port ${BASE_PORT} is already in use`);
        console.log(`➡️  Trying port ${fallbackPort}...`);
        startListening(fallbackPort);
    } else {
        console.error('❌ Server error:', error);
    }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});
