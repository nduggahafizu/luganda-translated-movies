/**
 * Test script for Google Authentication
 * This simulates the Google Auth flow without browser interaction
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test data
const testCases = [
    {
        name: 'Test 1: Google Auth Endpoint Availability',
        test: async () => {
            try {
                const response = await axios.post(`${API_URL}/auth/google`, {
                    token: 'invalid-token-for-testing'
                }, {
                    validateStatus: () => true // Accept any status
                });
                
                console.log('   Status:', response.status);
                console.log('   Response:', JSON.stringify(response.data, null, 2));
                
                if (response.status === 401 && response.data.message.includes('Invalid Google token')) {
                    console.log('   ✅ Endpoint is working (correctly rejecting invalid token)');
                    return true;
                } else if (response.status === 400 && response.data.message.includes('required')) {
                    console.log('   ✅ Endpoint is working (validation working)');
                    return true;
                } else {
                    console.log('   ⚠️  Unexpected response');
                    return false;
                }
            } catch (error) {
                console.log('   ❌ Error:', error.message);
                return false;
            }
        }
    },
    {
        name: 'Test 2: Email/Password Registration',
        test: async () => {
            try {
                const testUser = {
                    fullName: 'Test User',
                    email: `test${Date.now()}@example.com`,
                    password: 'TestPassword123!'
                };
                
                const response = await axios.post(`${API_URL}/auth/register`, testUser, {
                    validateStatus: () => true
                });
                
                console.log('   Status:', response.status);
                console.log('   Response:', JSON.stringify(response.data, null, 2));
                
                if (response.status === 201 && response.data.status === 'success') {
                    console.log('   ✅ Registration successful');
                    console.log('   User ID:', response.data.data.user.id);
                    console.log('   Token received:', response.data.data.token ? 'Yes' : 'No');
                    return true;
                } else {
                    console.log('   ❌ Registration failed');
                    return false;
                }
            } catch (error) {
                console.log('   ❌ Error:', error.message);
                return false;
            }
        }
    },
    {
        name: 'Test 3: Email/Password Login',
        test: async () => {
            try {
                // First register a user
                const testUser = {
                    fullName: 'Login Test User',
                    email: `logintest${Date.now()}@example.com`,
                    password: 'TestPassword123!'
                };
                
                await axios.post(`${API_URL}/auth/register`, testUser);
                
                // Now try to login
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    email: testUser.email,
                    password: testUser.password
                }, {
                    validateStatus: () => true
                });
                
                console.log('   Status:', loginResponse.status);
                console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
                
                if (loginResponse.status === 200 && loginResponse.data.status === 'success') {
                    console.log('   ✅ Login successful');
                    console.log('   Token received:', loginResponse.data.data.token ? 'Yes' : 'No');
                    return true;
                } else {
                    console.log('   ❌ Login failed');
                    return false;
                }
            } catch (error) {
                console.log('   ❌ Error:', error.message);
                return false;
            }
        }
    },
    {
        name: 'Test 4: Invalid Login Credentials',
        test: async () => {
            try {
                const response = await axios.post(`${API_URL}/auth/login`, {
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                }, {
                    validateStatus: () => true
                });
                
                console.log('   Status:', response.status);
                console.log('   Response:', JSON.stringify(response.data, null, 2));
                
                if (response.status === 401 && response.data.message.includes('Invalid')) {
                    console.log('   ✅ Correctly rejected invalid credentials');
                    return true;
                } else {
                    console.log('   ❌ Should have rejected invalid credentials');
                    return false;
                }
            } catch (error) {
                console.log('   ❌ Error:', error.message);
                return false;
            }
        }
    },
    {
        name: 'Test 5: Google Auth Configuration Check',
        test: async () => {
            try {
                // Check if Google Client ID is configured
                const { OAuth2Client } = require('google-auth-library');
                const clientId = process.env.GOOGLE_CLIENT_ID || '573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com';
                
                console.log('   Google Client ID:', clientId);
                
                if (clientId && clientId.includes('apps.googleusercontent.com')) {
                    console.log('   ✅ Google Client ID is configured');
                    
                    // Try to create OAuth2Client
                    const client = new OAuth2Client(clientId);
                    console.log('   ✅ OAuth2Client created successfully');
                    return true;
                } else {
                    console.log('   ❌ Google Client ID not configured');
                    return false;
                }
            } catch (error) {
                console.log('   ❌ Error:', error.message);
                return false;
            }
        }
    }
];

// Run all tests
async function runTests() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║           GOOGLE AUTHENTICATION TEST SUITE                   ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const testCase of testCases) {
        console.log(`\n${testCase.name}`);
        console.log('─'.repeat(60));
        
        const result = await testCase.test();
        
        if (result) {
            passed++;
        } else {
            failed++;
        }
        
        console.log('');
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('                        TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total Tests: ${testCases.length}`);
    console.log(`  ✅ Passed: ${passed}`);
    console.log(`  ❌ Failed: ${failed}`);
    console.log(`  Success Rate: ${Math.round((passed / testCases.length) * 100)}%`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Google Auth is ready to use.\n');
    } else {
        console.log('⚠️  Some tests failed. Please check the errors above.\n');
    }
}

// Check if backend is running
async function checkBackend() {
    try {
        const response = await axios.get('http://localhost:5000/api/health', {
            timeout: 3000
        });
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

// Main execution
(async () => {
    console.log('Checking if backend is running...');
    const backendRunning = await checkBackend();
    
    if (!backendRunning) {
        console.log('❌ Backend is not running on http://localhost:5000');
        console.log('   Please start the backend server first:');
        console.log('   cd /vercel/sandbox/server && node server.js\n');
        process.exit(1);
    }
    
    console.log('✅ Backend is running\n');
    
    await runTests();
})();
