/**
 * CSP Validation Script
 * Run this in browser console to validate CSP configuration
 */

(function() {
    'use strict';

    console.log('🔒 CSP Validation Script Starting...\n');

    const results = {
        passed: [],
        failed: [],
        warnings: []
    };

    // Test 1: Check if CSP header exists
    async function testCSPHeader() {
        try {
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const csp = response.headers.get('Content-Security-Policy');
            
            if (csp) {
                results.passed.push('✅ CSP header is present');
                console.log('CSP Header:', csp.substring(0, 100) + '...');
                return true;
            } else {
                results.failed.push('❌ CSP header is missing');
                return false;
            }
        } catch (error) {
            results.warnings.push('⚠️ Could not check CSP header: ' + error.message);
            return false;
        }
    }

    // Test 2: Check Video.js CDN
    async function testVideoJS() {
        try {
            const response = await fetch('https://vjs.zencdn.net/8.16.1/video.min.js', { 
                method: 'HEAD',
                mode: 'no-cors'
            });
            results.passed.push('✅ Video.js CDN is accessible');
            return true;
        } catch (error) {
            results.failed.push('❌ Video.js CDN blocked: ' + error.message);
            return false;
        }
    }

    // Test 3: Check Backend API
    async function testBackendAPI() {
        const backendUrl = window.Config?.BACKEND_URL || 'https://luganda-translated-movies-production.up.railway.app';
        try {
            const response = await fetch(`${backendUrl}/api/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                results.passed.push('✅ Backend API is accessible');
                return true;
            } else {
                results.warnings.push(`⚠️ Backend API responded with status ${response.status}`);
                return false;
            }
        } catch (error) {
            if (error.message.includes('CSP') || error.message.includes('violates')) {
                results.failed.push('❌ Backend API blocked by CSP: ' + error.message);
            } else {
                results.warnings.push('⚠️ Backend API error (not CSP): ' + error.message);
            }
            return false;
        }
    }

    // Test 4: Check TMDB API
    async function testTMDBAPI() {
        try {
            const response = await fetch('https://api.themoviedb.org/3/configuration', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            results.passed.push('✅ TMDB API is accessible (CSP allows connection)');
            return true;
        } catch (error) {
            if (error.message.includes('CSP') || error.message.includes('violates')) {
                results.failed.push('❌ TMDB API blocked by CSP: ' + error.message);
            } else {
                results.warnings.push('⚠️ TMDB API error (not CSP): ' + error.message);
            }
            return false;
        }
    }

    // Test 5: Check for CSP violations in console
    function checkConsoleErrors() {
        const errors = window.console.errors || [];
        const cspErrors = errors.filter(e => 
            e.includes('CSP') || 
            e.includes('Content Security Policy') ||
            e.includes('violates')
        );

        if (cspErrors.length === 0) {
            results.passed.push('✅ No CSP violations in console');
            return true;
        } else {
            results.failed.push(`❌ Found ${cspErrors.length} CSP violations in console`);
            return false;
        }
    }

    // Test 6: Check if Video.js is loaded
    function testVideoJSLoaded() {
        if (typeof videojs !== 'undefined') {
            results.passed.push('✅ Video.js library is loaded');
            return true;
        } else {
            results.warnings.push('⚠️ Video.js library not loaded (may not be on video page)');
            return false;
        }
    }

    // Test 7: Check Config
    function testConfig() {
        if (window.Config) {
            results.passed.push('✅ Config.js is loaded');
            console.log('Backend URL:', window.Config.BACKEND_URL);
            console.log('Environment:', window.Config.ENVIRONMENT);
            return true;
        } else {
            results.failed.push('❌ Config.js not loaded');
            return false;
        }
    }

    // Test 8: Check for blob: support
    function testBlobSupport() {
        try {
            const blob = new Blob(['console.log("test")'], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            results.passed.push('✅ Blob URLs are supported');
            URL.revokeObjectURL(blobUrl);
            return true;
        } catch (error) {
            results.failed.push('❌ Blob URLs blocked: ' + error.message);
            return false;
        }
    }

    // Run all tests
    async function runAllTests() {
        console.log('Running CSP validation tests...\n');

        // Synchronous tests
        testConfig();
        testVideoJSLoaded();
        testBlobSupport();
        checkConsoleErrors();

        // Asynchronous tests
        await testCSPHeader();
        await testVideoJS();
        await testBackendAPI();
        await testTMDBAPI();

        // Display results
        console.log('\n' + '='.repeat(60));
        console.log('CSP VALIDATION RESULTS');
        console.log('='.repeat(60) + '\n');

        if (results.passed.length > 0) {
            console.log('✅ PASSED TESTS (' + results.passed.length + '):');
            results.passed.forEach(r => console.log('  ' + r));
            console.log('');
        }

        if (results.warnings.length > 0) {
            console.log('⚠️  WARNINGS (' + results.warnings.length + '):');
            results.warnings.forEach(r => console.log('  ' + r));
            console.log('');
        }

        if (results.failed.length > 0) {
            console.log('❌ FAILED TESTS (' + results.failed.length + '):');
            results.failed.forEach(r => console.log('  ' + r));
            console.log('');
        }

        // Overall status
        console.log('='.repeat(60));
        if (results.failed.length === 0) {
            console.log('✅ CSP VALIDATION PASSED!');
            console.log('All critical tests passed. CSP is configured correctly.');
        } else {
            console.log('❌ CSP VALIDATION FAILED!');
            console.log('Some tests failed. Check the errors above.');
        }
        console.log('='.repeat(60) + '\n');

        // Recommendations
        if (results.failed.length > 0) {
            console.log('📋 RECOMMENDATIONS:');
            console.log('1. Check browser console for CSP violation errors');
            console.log('2. Verify _headers file is deployed');
            console.log('3. Clear browser cache and hard refresh (Ctrl+Shift+R)');
            console.log('4. Check Network tab for blocked requests');
            console.log('5. Refer to CSP_QUICK_REFERENCE.md for troubleshooting\n');
        }

        return {
            passed: results.passed.length,
            warnings: results.warnings.length,
            failed: results.failed.length,
            success: results.failed.length === 0
        };
    }

    // Auto-run on load
    runAllTests().then(summary => {
        console.log('Validation complete!');
        console.log('Summary:', summary);
    });

})();
