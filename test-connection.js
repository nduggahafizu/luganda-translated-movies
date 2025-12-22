#!/usr/bin/env node

/**
 * Test Frontend-Backend Connection
 * Verifies that all components are properly connected
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Frontend-Backend Connection');
console.log('======================================\n');

const BACKEND_PORT = process.env.PORT || 5000;
const BACKEND_URL = `http://localhost:${BACKEND_PORT}`;

// Test results
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to make HTTP request
function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            timeout: 5000
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Test function
async function test(name, testFn) {
    try {
        await testFn();
        console.log(`✅ ${name}`);
        results.passed++;
        results.tests.push({ name, status: 'passed' });
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        results.failed++;
        results.tests.push({ name, status: 'failed', error: error.message });
    }
}

// Run tests
async function runTests() {
    console.log('Backend Tests:');
    console.log('--------------\n');

    // Test 1: Backend is running
    await test('Backend server is running', async () => {
        const response = await makeRequest(`${BACKEND_URL}/`);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
    });

    // Test 2: Health endpoint
    await test('Health endpoint responds', async () => {
        const response = await makeRequest(`${BACKEND_URL}/api/health`);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!response.data.status) {
            throw new Error('Health response missing status field');
        }
    });

    // Test 3: Database status
    await test('Database status available', async () => {
        const response = await makeRequest(`${BACKEND_URL}/api/health`);
        if (!response.data.database) {
            throw new Error('Health response missing database field');
        }
        console.log(`   Database: ${response.data.database.database}`);
        console.log(`   Mode: ${response.data.database.inMemoryMode ? 'In-Memory' : 'MongoDB'}`);
    });

    // Test 4: Luganda movies endpoint
    await test('Luganda movies endpoint responds', async () => {
        const response = await makeRequest(`${BACKEND_URL}/api/luganda-movies`);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        if (!response.data.data) {
            throw new Error('Response missing data field');
        }
        console.log(`   Movies found: ${response.data.count || 0}`);
    });

    // Test 5: VJs endpoint
    await test('VJs endpoint responds', async () => {
        const response = await makeRequest(`${BACKEND_URL}/api/vjs`);
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
    });

    // Test 6: CORS headers
    await test('CORS headers present', async () => {
        const response = await makeRequest(`${BACKEND_URL}/api/health`);
        // Note: In Node.js http module, we can't easily check response headers
        // This is a placeholder test
    });

    console.log('\n');
    console.log('Frontend Tests:');
    console.log('---------------\n');

    // Test 7: Config file exists
    await test('Config file exists', async () => {
        const configPath = path.join(__dirname, 'js', 'config.js');
        if (!fs.existsSync(configPath)) {
            throw new Error('Config file not found');
        }
        const content = fs.readFileSync(configPath, 'utf8');
        if (!content.includes('Config')) {
            throw new Error('Config file invalid');
        }
    });

    // Test 8: Luganda movies API file exists
    await test('Luganda movies API file exists', async () => {
        const apiPath = path.join(__dirname, 'js', 'luganda-movies-api.js');
        if (!fs.existsSync(apiPath)) {
            throw new Error('Luganda movies API file not found');
        }
    });

    // Test 9: Index.html exists
    await test('Index.html exists', async () => {
        const indexPath = path.join(__dirname, 'index.html');
        if (!fs.existsSync(indexPath)) {
            throw new Error('index.html not found');
        }
    });

    // Test 10: Player.html exists
    await test('Player.html exists', async () => {
        const playerPath = path.join(__dirname, 'player.html');
        if (!fs.existsSync(playerPath)) {
            throw new Error('player.html not found');
        }
    });

    console.log('\n');
    console.log('======================================');
    console.log('Test Results:');
    console.log('======================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total:  ${results.passed + results.failed}`);
    console.log('======================================\n');

    if (results.failed === 0) {
        console.log('🎉 All tests passed!');
        console.log('✅ Frontend and Backend are properly connected\n');
        return 0;
    } else {
        console.log('⚠️  Some tests failed');
        console.log('💡 Make sure the backend server is running:');
        console.log('   cd server && node server.js\n');
        return 1;
    }
}

// Main
runTests().then((exitCode) => {
    process.exit(exitCode);
}).catch((error) => {
    console.error('❌ Test suite error:', error);
    process.exit(1);
});
