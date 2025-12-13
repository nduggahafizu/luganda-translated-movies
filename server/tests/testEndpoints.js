const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testEndpoints() {
    console.log('🧪 Testing API Endpoints...\n');
    
    const tests = [];
    
    // Test 1: Health Check
    try {
        console.log('Test 1: Health Check Endpoint');
        const response = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        tests.push({ name: 'Health Check', status: 'PASSED' });
    } catch (error) {
        console.log('❌ Health Check Failed:', error.message);
        tests.push({ name: 'Health Check', status: 'FAILED', error: error.message });
    }
    
    console.log('\n---\n');
    
    // Test 2: Root Endpoint
    try {
        console.log('Test 2: Root Endpoint');
        const response = await axios.get(`${BASE_URL}/`);
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        tests.push({ name: 'Root Endpoint', status: 'PASSED' });
    } catch (error) {
        console.log('❌ Root Endpoint Failed:', error.message);
        tests.push({ name: 'Root Endpoint', status: 'FAILED', error: error.message });
    }
    
    console.log('\n---\n');
    
    // Test 3: Luganda Movies Endpoint
    try {
        console.log('Test 3: Luganda Movies Endpoint');
        const response = await axios.get(`${BASE_URL}/api/luganda-movies`);
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        tests.push({ name: 'Luganda Movies', status: 'PASSED' });
    } catch (error) {
        console.log('❌ Luganda Movies Failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        tests.push({ name: 'Luganda Movies', status: 'FAILED', error: error.message });
    }
    
    console.log('\n---\n');
    
    // Test 4: VJs Endpoint (if exists)
    try {
        console.log('Test 4: VJs Endpoint');
        const response = await axios.get(`${BASE_URL}/api/vjs`);
        console.log('✅ Status:', response.status);
        console.log('✅ Number of VJs:', response.data.length || response.data.data?.length || 'N/A');
        console.log('✅ Sample VJ:', JSON.stringify(response.data[0] || response.data.data?.[0] || 'N/A', null, 2));
        tests.push({ name: 'VJs Endpoint', status: 'PASSED' });
    } catch (error) {
        console.log('❌ VJs Endpoint Failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
        }
        tests.push({ name: 'VJs Endpoint', status: 'FAILED', error: error.message });
    }
    
    console.log('\n---\n');
    
    // Test 5: Auth Register Endpoint (POST)
    try {
        console.log('Test 5: Auth Register Endpoint Structure');
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            // Intentionally incomplete to test validation
        });
        console.log('✅ Status:', response.status);
        tests.push({ name: 'Auth Register', status: 'PASSED' });
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Validation working (400 error expected)');
            console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
            tests.push({ name: 'Auth Register Validation', status: 'PASSED' });
        } else {
            console.log('❌ Auth Register Failed:', error.message);
            tests.push({ name: 'Auth Register', status: 'FAILED', error: error.message });
        }
    }
    
    console.log('\n---\n');
    
    // Test 6: 404 Handler
    try {
        console.log('Test 6: 404 Handler');
        const response = await axios.get(`${BASE_URL}/api/nonexistent`);
        console.log('❌ Should have returned 404');
        tests.push({ name: '404 Handler', status: 'FAILED', error: 'Did not return 404' });
    } catch (error) {
        if (error.response && error.response.status === 404) {
            console.log('✅ 404 Handler working correctly');
            console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
            tests.push({ name: '404 Handler', status: 'PASSED' });
        } else {
            console.log('❌ 404 Handler Failed:', error.message);
            tests.push({ name: '404 Handler', status: 'FAILED', error: error.message });
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    
    const passed = tests.filter(t => t.status === 'PASSED').length;
    const failed = tests.filter(t => t.status === 'FAILED').length;
    
    tests.forEach(test => {
        const icon = test.status === 'PASSED' ? '✅' : '❌';
        console.log(`${icon} ${test.name}: ${test.status}`);
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed!');
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed`);
    }
}

// Run tests
testEndpoints().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
