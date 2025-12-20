/**
 * Comprehensive Test Suite for Google Auth and Movie Playback
 * Tests both localhost and production (Netlify) configurations
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const LOCALHOST_API = 'http://localhost:5000/api';
const LOCALHOST_FRONTEND = 'http://localhost:8000';

// Test Results Storage
const testResults = {
    timestamp: new Date().toISOString(),
    environment: 'localhost',
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

// Helper function to add test result
function addTestResult(name, status, details, error = null) {
    const result = {
        name,
        status, // 'pass', 'fail', 'warning'
        details,
        error: error ? error.message : null,
        timestamp: new Date().toISOString()
    };
    
    testResults.tests.push(result);
    testResults.summary.total++;
    
    if (status === 'pass') testResults.summary.passed++;
    else if (status === 'fail') testResults.summary.failed++;
    else if (status === 'warning') testResults.summary.warnings++;
    
    return result;
}

// Test Cases
const tests = {
    // ===== GOOGLE AUTH TESTS =====
    async testGoogleAuthEndpoint() {
        console.log('\n📝 Test: Google Auth Endpoint Availability');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.post(`${LOCALHOST_API}/auth/google`, {
                token: 'invalid-test-token'
            }, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 401 && response.data.message.includes('Invalid Google token')) {
                console.log('   ✅ PASS: Endpoint correctly validates tokens');
                addTestResult('Google Auth Endpoint', 'pass', 'Endpoint operational and validating correctly');
                return true;
            } else if (response.status === 400) {
                console.log('   ✅ PASS: Endpoint validates input');
                addTestResult('Google Auth Endpoint', 'pass', 'Input validation working');
                return true;
            } else {
                console.log('   ❌ FAIL: Unexpected response');
                addTestResult('Google Auth Endpoint', 'fail', 'Unexpected response', new Error('Unexpected status'));
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Google Auth Endpoint', 'fail', 'Endpoint not accessible', error);
            return false;
        }
    },

    async testEmailRegistration() {
        console.log('\n📝 Test: Email/Password Registration');
        console.log('─'.repeat(70));
        
        try {
            const testUser = {
                fullName: 'Test User ' + Date.now(),
                email: `test${Date.now()}@example.com`,
                password: 'TestPassword123!'
            };
            
            const response = await axios.post(`${LOCALHOST_API}/auth/register`, testUser, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 201 && response.data.status === 'success') {
                console.log('   ✅ PASS: Registration successful');
                console.log('   User ID:', response.data.data.user.id);
                console.log('   Token:', response.data.data.token ? 'Generated' : 'Missing');
                addTestResult('Email Registration', 'pass', `User created: ${testUser.email}`);
                return { success: true, user: testUser, token: response.data.data.token };
            } else {
                console.log('   ❌ FAIL: Registration failed');
                addTestResult('Email Registration', 'fail', response.data.message, new Error(response.data.error));
                return { success: false };
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Email Registration', 'fail', 'Registration endpoint error', error);
            return { success: false };
        }
    },

    async testEmailLogin() {
        console.log('\n📝 Test: Email/Password Login');
        console.log('─'.repeat(70));
        
        try {
            // First register a user
            const testUser = {
                fullName: 'Login Test ' + Date.now(),
                email: `logintest${Date.now()}@example.com`,
                password: 'TestPassword123!'
            };
            
            const regResponse = await axios.post(`${LOCALHOST_API}/auth/register`, testUser, {
                validateStatus: () => true
            });
            
            if (regResponse.status !== 201) {
                console.log('   ⚠️  WARNING: Could not create test user');
                addTestResult('Email Login', 'warning', 'Could not create test user for login test');
                return false;
            }
            
            // Now try to login
            const loginResponse = await axios.post(`${LOCALHOST_API}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            }, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', loginResponse.status);
            console.log('   Response:', JSON.stringify(loginResponse.data, null, 2));
            
            if (loginResponse.status === 200 && loginResponse.data.status === 'success') {
                console.log('   ✅ PASS: Login successful');
                console.log('   Token:', loginResponse.data.data.token ? 'Generated' : 'Missing');
                addTestResult('Email Login', 'pass', `Login successful for ${testUser.email}`);
                return true;
            } else {
                console.log('   ❌ FAIL: Login failed');
                addTestResult('Email Login', 'fail', loginResponse.data.message);
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Email Login', 'fail', 'Login endpoint error', error);
            return false;
        }
    },

    async testInvalidCredentials() {
        console.log('\n📝 Test: Invalid Credentials Handling');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.post(`${LOCALHOST_API}/auth/login`, {
                email: 'nonexistent@example.com',
                password: 'wrongpassword'
            }, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            
            if (response.status === 401 && response.data.message.includes('Invalid')) {
                console.log('   ✅ PASS: Correctly rejected invalid credentials');
                addTestResult('Invalid Credentials', 'pass', 'Security validation working');
                return true;
            } else {
                console.log('   ❌ FAIL: Should reject invalid credentials');
                addTestResult('Invalid Credentials', 'fail', 'Security validation not working');
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Invalid Credentials', 'fail', 'Endpoint error', error);
            return false;
        }
    },

    // ===== MOVIE PLAYBACK TESTS =====
    async testMovieDataRetrieval() {
        console.log('\n📝 Test: Movie Data Retrieval');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.get(`${LOCALHOST_API}/luganda-movies`, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            console.log('   Movies Count:', response.data.count || 0);
            
            if (response.status === 200 && response.data.success) {
                console.log('   ✅ PASS: Movies retrieved successfully');
                console.log('   Total Movies:', response.data.total);
                console.log('   Sample Movie:', response.data.data[0]?.originalTitle || 'None');
                addTestResult('Movie Data Retrieval', 'pass', `Retrieved ${response.data.total} movies`);
                return { success: true, movies: response.data.data };
            } else {
                console.log('   ❌ FAIL: Could not retrieve movies');
                addTestResult('Movie Data Retrieval', 'fail', response.data.message);
                return { success: false };
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Movie Data Retrieval', 'fail', 'API error', error);
            return { success: false };
        }
    },

    async testMovieById() {
        console.log('\n📝 Test: Get Movie by ID');
        console.log('─'.repeat(70));
        
        try {
            // First get all movies to get an ID
            const moviesResponse = await axios.get(`${LOCALHOST_API}/luganda-movies`);
            
            if (!moviesResponse.data.data || moviesResponse.data.data.length === 0) {
                console.log('   ⚠️  WARNING: No movies in database');
                addTestResult('Get Movie by ID', 'warning', 'No movies available for testing');
                return false;
            }
            
            const movieId = moviesResponse.data.data[0]._id;
            console.log('   Testing with Movie ID:', movieId);
            
            const response = await axios.get(`${LOCALHOST_API}/luganda-movies/${movieId}`, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            
            if (response.status === 200 && response.data.success) {
                console.log('   ✅ PASS: Movie retrieved successfully');
                console.log('   Movie:', response.data.data.originalTitle);
                console.log('   VJ:', response.data.data.vjName);
                console.log('   Video Path:', response.data.data.video?.originalVideoPath || 'Not set');
                addTestResult('Get Movie by ID', 'pass', `Retrieved: ${response.data.data.originalTitle}`);
                return { success: true, movie: response.data.data };
            } else {
                console.log('   ❌ FAIL: Could not retrieve movie');
                addTestResult('Get Movie by ID', 'fail', response.data.message);
                return { success: false };
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Get Movie by ID', 'fail', 'API error', error);
            return { success: false };
        }
    },

    async testPlayerPageLoad() {
        console.log('\n📝 Test: Player Page Load');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.get(`${LOCALHOST_FRONTEND}/player.html`, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            
            if (response.status === 200) {
                const html = response.data;
                
                // Check for essential player elements
                const hasVideoElement = html.includes('<video');
                const hasHlsJs = html.includes('hls.js');
                const hasControls = html.includes('player-controls');
                const hasConfigJs = html.includes('config.js');
                
                console.log('   Video Element:', hasVideoElement ? '✅' : '❌');
                console.log('   HLS.js Library:', hasHlsJs ? '✅' : '❌');
                console.log('   Player Controls:', hasControls ? '✅' : '❌');
                console.log('   Config.js:', hasConfigJs ? '✅' : '❌');
                
                if (hasVideoElement && hasHlsJs && hasControls) {
                    console.log('   ✅ PASS: Player page has all required elements');
                    addTestResult('Player Page Load', 'pass', 'All player elements present');
                    return true;
                } else {
                    console.log('   ❌ FAIL: Missing player elements');
                    addTestResult('Player Page Load', 'fail', 'Missing required elements');
                    return false;
                }
            } else {
                console.log('   ❌ FAIL: Page not accessible');
                addTestResult('Player Page Load', 'fail', `HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Player Page Load', 'fail', 'Page load error', error);
            return false;
        }
    },

    async testConfigJsLoad() {
        console.log('\n📝 Test: Config.js Configuration');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.get(`${LOCALHOST_FRONTEND}/js/config.js`, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            
            if (response.status === 200) {
                const configContent = response.data;
                
                // Check for essential configuration
                const hasBackendUrl = configContent.includes('BACKEND_URL');
                const hasGoogleClientId = configContent.includes('GOOGLE_CLIENT_ID');
                const hasEnvironmentDetection = configContent.includes('isLocalhost');
                const hasNetlifyDetection = configContent.includes('isNetlify');
                
                console.log('   Backend URL Config:', hasBackendUrl ? '✅' : '❌');
                console.log('   Google Client ID:', hasGoogleClientId ? '✅' : '❌');
                console.log('   Environment Detection:', hasEnvironmentDetection ? '✅' : '❌');
                console.log('   Netlify Detection:', hasNetlifyDetection ? '✅' : '❌');
                
                if (hasBackendUrl && hasGoogleClientId && hasEnvironmentDetection) {
                    console.log('   ✅ PASS: Config.js properly configured');
                    addTestResult('Config.js Load', 'pass', 'Configuration file complete');
                    return true;
                } else {
                    console.log('   ❌ FAIL: Missing configuration');
                    addTestResult('Config.js Load', 'fail', 'Incomplete configuration');
                    return false;
                }
            } else {
                console.log('   ❌ FAIL: Config.js not accessible');
                addTestResult('Config.js Load', 'fail', `HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Config.js Load', 'fail', 'File load error', error);
            return false;
        }
    },

    async testLoginPageGoogleButton() {
        console.log('\n📝 Test: Login Page Google Sign-In Button');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.get(`${LOCALHOST_FRONTEND}/login.html`, {
                validateStatus: () => true
            });
            
            if (response.status === 200) {
                const html = response.data;
                
                // Check for Google Sign-In elements
                const hasGoogleScript = html.includes('accounts.google.com/gsi/client');
                const hasGoogleButton = html.includes('google-signin-btn');
                const hasAuthJs = html.includes('auth.js');
                const hasConfigJs = html.includes('config.js');
                
                console.log('   Google GSI Script:', hasGoogleScript ? '✅' : '❌');
                console.log('   Google Button Element:', hasGoogleButton ? '✅' : '❌');
                console.log('   Auth.js Loaded:', hasAuthJs ? '✅' : '❌');
                console.log('   Config.js Loaded:', hasConfigJs ? '✅' : '❌');
                
                if (hasGoogleScript && hasGoogleButton && hasAuthJs) {
                    console.log('   ✅ PASS: Google Sign-In properly integrated');
                    addTestResult('Login Page Google Button', 'pass', 'All Google Auth elements present');
                    return true;
                } else {
                    console.log('   ❌ FAIL: Missing Google Sign-In elements');
                    addTestResult('Login Page Google Button', 'fail', 'Missing required elements');
                    return false;
                }
            } else {
                console.log('   ❌ FAIL: Login page not accessible');
                addTestResult('Login Page Google Button', 'fail', `HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Login Page Google Button', 'fail', 'Page load error', error);
            return false;
        }
    },

    async testVJsEndpoint() {
        console.log('\n📝 Test: VJs Endpoint');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.get(`${LOCALHOST_API}/vjs`, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            console.log('   VJs Count:', response.data.count || 0);
            
            if (response.status === 200 && response.data.success) {
                console.log('   ✅ PASS: VJs retrieved successfully');
                console.log('   Total VJs:', response.data.total);
                if (response.data.data && response.data.data.length > 0) {
                    console.log('   Sample VJ:', response.data.data[0].name);
                }
                addTestResult('VJs Endpoint', 'pass', `Retrieved ${response.data.total} VJs`);
                return true;
            } else {
                console.log('   ❌ FAIL: Could not retrieve VJs');
                addTestResult('VJs Endpoint', 'fail', response.data.message);
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('VJs Endpoint', 'fail', 'API error', error);
            return false;
        }
    },

    async testHealthEndpoint() {
        console.log('\n📝 Test: Health Check Endpoint');
        console.log('─'.repeat(70));
        
        try {
            const response = await axios.get(`${LOCALHOST_API}/health`, {
                validateStatus: () => true
            });
            
            console.log('   Status Code:', response.status);
            
            if (response.status === 200) {
                const health = response.data;
                console.log('   Overall Status:', health.status);
                console.log('   Database:', health.services?.database?.status || 'unknown');
                console.log('   Cache:', health.services?.cache?.status || 'unknown');
                
                addTestResult('Health Check', 'pass', `Status: ${health.status}`);
                return true;
            } else {
                console.log('   ❌ FAIL: Health check failed');
                addTestResult('Health Check', 'fail', `HTTP ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('   ❌ FAIL:', error.message);
            addTestResult('Health Check', 'fail', 'Endpoint error', error);
            return false;
        }
    }
};

// Main test runner
async function runAllTests() {
    console.log('\n╔══════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                      ║');
    console.log('║        LUGANDA MOVIES - GOOGLE AUTH & PLAYBACK TEST SUITE            ║');
    console.log('║                                                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════════════╝');
    
    console.log('\n📍 Testing Environment: Localhost');
    console.log('   Backend API:', LOCALHOST_API);
    console.log('   Frontend:', LOCALHOST_FRONTEND);
    
    // Check if backend is running
    console.log('\n🔍 Checking backend availability...');
    try {
        const healthCheck = await axios.get(`${LOCALHOST_API}/health`, { timeout: 3000 });
        console.log('   ✅ Backend is running');
    } catch (error) {
        console.log('   ❌ Backend is not running');
        console.log('   Please start the backend: cd /vercel/sandbox/server && node server.js');
        process.exit(1);
    }
    
    // Check if frontend is running
    console.log('\n🔍 Checking frontend availability...');
    try {
        await axios.get(LOCALHOST_FRONTEND, { timeout: 3000 });
        console.log('   ✅ Frontend is running');
    } catch (error) {
        console.log('   ❌ Frontend is not running');
        console.log('   Please start the frontend: python3 -m http.server 8000');
        process.exit(1);
    }
    
    console.log('\n' + '═'.repeat(70));
    console.log('                        RUNNING TESTS');
    console.log('═'.repeat(70));
    
    // Run all tests
    await tests.testConfigJsLoad();
    await tests.testHealthEndpoint();
    await tests.testGoogleAuthEndpoint();
    await tests.testLoginPageGoogleButton();
    await tests.testEmailRegistration();
    await tests.testEmailLogin();
    await tests.testInvalidCredentials();
    await tests.testVJsEndpoint();
    await tests.testMovieDataRetrieval();
    await tests.testMovieById();
    await tests.testPlayerPageLoad();
    
    // Print summary
    console.log('\n' + '═'.repeat(70));
    console.log('                        TEST SUMMARY');
    console.log('═'.repeat(70));
    console.log(`  Total Tests:    ${testResults.summary.total}`);
    console.log(`  ✅ Passed:      ${testResults.summary.passed}`);
    console.log(`  ❌ Failed:      ${testResults.summary.failed}`);
    console.log(`  ⚠️  Warnings:    ${testResults.summary.warnings}`);
    console.log(`  Success Rate:   ${Math.round((testResults.summary.passed / testResults.summary.total) * 100)}%`);
    console.log('═'.repeat(70));
    
    // Save results to file
    const reportPath = path.join(__dirname, 'TEST_RESULTS_DETAILED.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: TEST_RESULTS_DETAILED.json`);
    
    // Final verdict
    if (testResults.summary.failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! System is fully operational.\n');
    } else if (testResults.summary.passed > testResults.summary.failed) {
        console.log('\n⚠️  MOST TESTS PASSED. Some issues need attention.\n');
    } else {
        console.log('\n❌ MULTIPLE FAILURES. Please review the errors above.\n');
    }
    
    return testResults;
}

// Run tests
runAllTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
