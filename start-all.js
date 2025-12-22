#!/usr/bin/env node

/**
 * Start All Services - Frontend and Backend
 * This script starts both the backend server and a frontend server
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const fs = require('fs');

console.log('🚀 Starting Luganda Movies Application');
console.log('=====================================\n');

// Configuration
const BACKEND_PORT = process.env.PORT || 5000;
const FRONTEND_PORT = 8080;
const BACKEND_DIR = path.join(__dirname, 'server');

// Check if backend directory exists
if (!fs.existsSync(BACKEND_DIR)) {
    console.error('❌ Backend directory not found:', BACKEND_DIR);
    process.exit(1);
}

// MIME types for serving files
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
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
};

// Start Backend Server
function startBackend() {
    return new Promise((resolve, reject) => {
        console.log('📦 Starting Backend Server...');
        console.log(`   Directory: ${BACKEND_DIR}`);
        console.log(`   Port: ${BACKEND_PORT}\n`);

        const backend = spawn('node', ['server.js'], {
            cwd: BACKEND_DIR,
            stdio: 'inherit',
            env: { ...process.env, PORT: BACKEND_PORT }
        });

        backend.on('error', (error) => {
            console.error('❌ Backend Error:', error);
            reject(error);
        });

        backend.on('exit', (code) => {
            if (code !== 0) {
                console.error(`❌ Backend exited with code ${code}`);
            }
        });

        // Wait a bit for backend to start
        setTimeout(() => {
            console.log('✅ Backend Server Started\n');
            resolve(backend);
        }, 2000);
    });
}

// Start Frontend Server
function startFrontend() {
    console.log('🌐 Starting Frontend Server...');
    console.log(`   Port: ${FRONTEND_PORT}\n`);

    const server = http.createServer((req, res) => {
        // Parse URL
        const url = new URL(req.url, `http://localhost:${FRONTEND_PORT}`);
        let filePath = '.' + url.pathname;

        // Default to index.html
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

    server.listen(FRONTEND_PORT, () => {
        console.log('✅ Frontend Server Started\n');
        console.log('=====================================');
        console.log('🎉 Application Ready!');
        console.log('=====================================');
        console.log(`Frontend: http://localhost:${FRONTEND_PORT}`);
        console.log(`Backend:  http://localhost:${BACKEND_PORT}`);
        console.log(`API Docs: http://localhost:${BACKEND_PORT}/api-docs`);
        console.log(`Health:   http://localhost:${BACKEND_PORT}/api/health`);
        console.log('=====================================');
        console.log('\nPress Ctrl+C to stop all servers\n');
    });

    return server;
}

// Check Backend Health
async function checkBackendHealth() {
    return new Promise((resolve) => {
        const maxAttempts = 10;
        let attempts = 0;

        const check = () => {
            attempts++;
            http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ Backend Health Check: OK\n');
                    resolve(true);
                } else if (attempts < maxAttempts) {
                    setTimeout(check, 1000);
                } else {
                    console.log('⚠️  Backend Health Check: Failed (continuing anyway)\n');
                    resolve(false);
                }
            }).on('error', () => {
                if (attempts < maxAttempts) {
                    setTimeout(check, 1000);
                } else {
                    console.log('⚠️  Backend Health Check: Failed (continuing anyway)\n');
                    resolve(false);
                }
            });
        };

        setTimeout(check, 2000);
    });
}

// Main function
async function main() {
    try {
        // Start backend
        const backend = await startBackend();

        // Check backend health
        await checkBackendHealth();

        // Start frontend
        const frontend = startFrontend();

        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Shutting down servers...');
            backend.kill();
            frontend.close();
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\n\n🛑 Shutting down servers...');
            backend.kill();
            frontend.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}

// Run
main();
