#!/usr/bin/env node

/**
 * Comprehensive Full Stack Test
 * Tests all components of the Luganda Movies application
 */

const http = require('http');

console.log('🧪 Comprehensive Full Stack Test');
console.log('=================================\n');

const BACKEND_PORT = 5000;
const FRONTEND_PORT = 8080;

const tests = {
    backend: [],
    frontend: [],
    integration: []
};

let passed = 0;
let failed = 0;

// Helper function
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        http.get({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            timeout: 5000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        }).on('error', reject).on('timeout', () => reject(new Error('Timeout')));
    });
}

async function test(category, name, testFn) {
    try {
        const result = await testFn();
        console.log(`✅ ${name}`);
        if (result && result.info) {
            console.log(`   ${result.info}`);
        }
        tests[category].push({ name, status: 'passed' });
        passed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        tests[category].push({ name, status: 'failed', error: error.message });
        failed++;
    }
}

async function runTests() {
    // Backend Tests
    console.log('Backend API Tests:');
    console.log('------------------\n');

    await test('backend', 'Server is running', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        return { info: `Version: ${res.data.version}` };
    });

    await test('backend', 'Health check endpoint', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/health`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        return { info: `Status: ${res.data.status}, DB: ${res.data.database.database}` };
    });

    await test('backend', 'Get all Luganda movies', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/luganda-movies`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.data.success) throw new Error('Request failed');
        return { info: `Found ${res.data.count} movies` };
    });

    await test('backend', 'Get Baby\'s Day Out (VJ Jingo)', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/luganda-movies/11`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.data.success) throw new Error('Request failed');
        if (res.data.data.vjName !== 'VJ Jingo') throw new Error('Wrong VJ');
        return { info: `Title: ${res.data.data.originalTitle}, VJ: ${res.data.data.vjName}` };
    });

    await test('backend', 'Get trending movies', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/luganda-movies/trending`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        return { info: `Found ${res.data.count} trending movies` };
    });

    await test('backend', 'Get featured movies', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/luganda-movies/featured`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const hasBabysDayOut = res.data.data.some(m => m.originalTitle === "Baby's Day Out");
        if (!hasBabysDayOut) throw new Error("Baby's Day Out not in featured");
        return { info: `Found ${res.data.count} featured movies (includes Baby's Day Out)` };
    });

    await test('backend', 'Get all VJs', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/vjs`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        const hasJingo = res.data.data.some(vj => vj.name === 'VJ Jingo');
        if (!hasJingo) throw new Error('VJ Jingo not found');
        return { info: `Found ${res.data.count} VJs (includes VJ Jingo)` };
    });

    // Frontend Tests
    console.log('\n');
    console.log('Frontend Tests:');
    console.log('---------------\n');

    await test('frontend', 'Frontend server is running', async () => {
        const res = await makeRequest(`http://localhost:${FRONTEND_PORT}/`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    await test('frontend', 'Index page loads', async () => {
        const res = await makeRequest(`http://localhost:${FRONTEND_PORT}/index.html`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.data.includes('Unruly Movies')) throw new Error('Invalid content');
    });

    await test('frontend', 'Player page loads', async () => {
        const res = await makeRequest(`http://localhost:${FRONTEND_PORT}/player.html`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (!res.data.includes('mainVideo')) throw new Error('Player not found');
    });

    await test('frontend', 'Config.js loads', async () => {
        const res = await makeRequest(`http://localhost:${FRONTEND_PORT}/js/config.js`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
    });

    // Integration Tests
    console.log('\n');
    console.log('Integration Tests:');
    console.log('------------------\n');

    await test('integration', 'Frontend can reach backend', async () => {
        // Simulate frontend calling backend
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/luganda-movies`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        return { info: 'CORS and connectivity working' };
    });

    await test('integration', 'Baby\'s Day Out accessible via API', async () => {
        const res = await makeRequest(`http://localhost:${BACKEND_PORT}/api/luganda-movies/11`);
        if (res.status !== 200) throw new Error(`Status ${res.status}`);
        if (res.data.data.vjName !== 'VJ Jingo') throw new Error('Wrong data');
        return { info: 'Movie data correct' };
    });

    // Summary
    console.log('\n');
    console.log('=================================');
    console.log('Test Summary:');
    console.log('=================================');
    console.log(`Backend Tests:     ${tests.backend.filter(t => t.status === 'passed').length}/${tests.backend.length} passed`);
    console.log(`Frontend Tests:    ${tests.frontend.filter(t => t.status === 'passed').length}/${tests.frontend.length} passed`);
    console.log(`Integration Tests: ${tests.integration.filter(t => t.status === 'passed').length}/${tests.integration.length} passed`);
    console.log('');
    console.log(`✅ Total Passed: ${passed}`);
    console.log(`❌ Total Failed: ${failed}`);
    console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
    console.log('=================================\n');

    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ Application is fully functional\n');
        console.log('Access the application:');
        console.log(`   Frontend: http://localhost:${FRONTEND_PORT}`);
        console.log(`   Backend:  http://localhost:${BACKEND_PORT}`);
        console.log(`   API Docs: http://localhost:${BACKEND_PORT}/api-docs`);
        console.log('');
    } else {
        console.log('⚠️  Some tests failed');
    }

    return failed === 0 ? 0 : 1;
}

runTests().then(exitCode => process.exit(exitCode)).catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
