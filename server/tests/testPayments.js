const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testPaymentEndpoints() {
    console.log('🧪 Testing Payment Endpoints...\n');
    
    const tests = [];
    let testTransactionId = null;
    
    // Test 1: Payment Initiation
    try {
        console.log('Test 1: Payment Initiation');
        const response = await axios.post(`${BASE_URL}/api/payments/initiate`, {
            amount: 5000,
            currency: 'UGX',
            description: 'Premium Subscription - Test',
            email: 'test@lugandamovies.com',
            firstName: 'Test',
            lastName: 'User',
            phoneNumber: '+256700000000'
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.transactionId) {
            testTransactionId = response.data.transactionId;
            console.log('✅ Transaction ID captured:', testTransactionId);
        }
        
        tests.push({ name: 'Payment Initiation', status: 'PASSED' });
    } catch (error) {
        console.log('❌ Payment Initiation Failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        tests.push({ name: 'Payment Initiation', status: 'FAILED', error: error.message });
    }
    
    console.log('\n---\n');
    
    // Test 2: Payment Verification (if we have a transaction ID)
    if (testTransactionId) {
        try {
            console.log('Test 2: Payment Verification');
            const response = await axios.get(`${BASE_URL}/api/payments/verify/${testTransactionId}`);
            
            console.log('✅ Status:', response.status);
            console.log('✅ Response:', JSON.stringify(response.data, null, 2));
            tests.push({ name: 'Payment Verification', status: 'PASSED' });
        } catch (error) {
            console.log('❌ Payment Verification Failed:', error.message);
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Data:', JSON.stringify(error.response.data, null, 2));
            }
            tests.push({ name: 'Payment Verification', status: 'FAILED', error: error.message });
        }
    } else {
        console.log('Test 2: Payment Verification - SKIPPED (no transaction ID)');
        tests.push({ name: 'Payment Verification', status: 'SKIPPED' });
    }
    
    console.log('\n---\n');
    
    // Test 3: Invalid Payment Initiation (validation test)
    try {
        console.log('Test 3: Payment Validation (Empty Body)');
        const response = await axios.post(`${BASE_URL}/api/payments/initiate`, {});
        
        console.log('❌ Should have returned validation error');
        tests.push({ name: 'Payment Validation', status: 'FAILED', error: 'No validation error' });
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Validation working (400 error expected)');
            console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
            tests.push({ name: 'Payment Validation', status: 'PASSED' });
        } else {
            console.log('❌ Payment Validation Failed:', error.message);
            tests.push({ name: 'Payment Validation', status: 'FAILED', error: error.message });
        }
    }
    
    console.log('\n---\n');
    
    // Test 4: Get User Payments (with test user ID)
    try {
        console.log('Test 4: Get User Payments');
        const testUserId = '507f1f77bcf86cd799439011'; // Test MongoDB ObjectId
        const response = await axios.get(`${BASE_URL}/api/payments/user/${testUserId}`);
        
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        tests.push({ name: 'Get User Payments', status: 'PASSED' });
    } catch (error) {
        console.log('❌ Get User Payments Failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        }
        tests.push({ name: 'Get User Payments', status: 'FAILED', error: error.message });
    }
    
    console.log('\n---\n');
    
    // Test 5: Payment Callback Structure (POST test)
    try {
        console.log('Test 5: Payment Callback Endpoint');
        const response = await axios.post(`${BASE_URL}/api/payments/callback`, {
            OrderTrackingId: 'TEST123',
            OrderMerchantReference: 'REF123',
            OrderNotificationType: 'CHANGE',
            pesapal_transaction_tracking_id: 'PESAPAL123'
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        tests.push({ name: 'Payment Callback', status: 'PASSED' });
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('✅ Callback validation working');
            console.log('✅ Response:', JSON.stringify(error.response.data, null, 2));
            tests.push({ name: 'Payment Callback', status: 'PASSED' });
        } else {
            console.log('❌ Payment Callback Failed:', error.message);
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Data:', JSON.stringify(error.response.data, null, 2));
            }
            tests.push({ name: 'Payment Callback', status: 'FAILED', error: error.message });
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('PAYMENT TESTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = tests.filter(t => t.status === 'PASSED').length;
    const failed = tests.filter(t => t.status === 'FAILED').length;
    const skipped = tests.filter(t => t.status === 'SKIPPED').length;
    
    tests.forEach(test => {
        let icon = '✅';
        if (test.status === 'FAILED') icon = '❌';
        if (test.status === 'SKIPPED') icon = '⏭️';
        
        console.log(`${icon} ${test.name}: ${test.status}`);
        if (test.error) {
            console.log(`   Error: ${test.error}`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped: ${skipped}`);
    console.log('='.repeat(50));
    
    if (failed === 0 && skipped === 0) {
        console.log('\n🎉 All payment tests passed!');
    } else if (failed === 0) {
        console.log(`\n✅ All executed tests passed (${skipped} skipped)`);
    } else {
        console.log(`\n⚠️  ${failed} test(s) failed`);
    }
    
    // Additional Info
    console.log('\n' + '='.repeat(50));
    console.log('PESAPAL CONFIGURATION STATUS');
    console.log('='.repeat(50));
    console.log('Environment:', process.env.PESAPAL_ENVIRONMENT || 'NOT SET');
    console.log('Consumer Key:', process.env.PESAPAL_CONSUMER_KEY ? '✅ SET' : '❌ NOT SET');
    console.log('Consumer Secret:', process.env.PESAPAL_CONSUMER_SECRET ? '✅ SET' : '❌ NOT SET');
    console.log('IPN URL:', process.env.PESAPAL_IPN_URL || 'NOT SET');
    console.log('='.repeat(50));
}

// Run tests
testPaymentEndpoints().catch(error => {
    console.error('Fatal error running payment tests:', error);
    process.exit(1);
});
