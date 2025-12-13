const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testPaymentConfig() {
    console.log('🧪 Testing Payment Configuration...\n');
    
    try {
        console.log('Test: Payment Configuration Status');
        const response = await axios.get(`${BASE_URL}/api/payments/test/config`);
        
        console.log('✅ Status:', response.status);
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        
        const config = response.data.config;
        
        console.log('\n' + '='.repeat(50));
        console.log('PAYMENT CONFIGURATION STATUS');
        console.log('='.repeat(50));
        console.log('PesaPal Configured:', config.pesapalConfigured ? '✅ YES' : '❌ NO');
        console.log('Stripe Configured:', config.stripeConfigured ? '✅ YES' : '❌ NO');
        console.log('Environment:', config.environment);
        console.log('IPN URL:', config.ipnUrl);
        console.log('='.repeat(50));
        
        if (!config.pesapalConfigured) {
            console.log('\n⚠️  PesaPal credentials not configured!');
            console.log('\nTo configure PesaPal:');
            console.log('1. Open server/.env file');
            console.log('2. Add these lines:');
            console.log('   PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN');
            console.log('   PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=');
            console.log('   PESAPAL_ENVIRONMENT=sandbox');
            console.log('   PESAPAL_IPN_URL=http://localhost:5000/api/payments/pesapal/ipn');
            console.log('3. Restart the server');
        } else {
            console.log('\n✅ PesaPal is configured and ready!');
        }
        
    } catch (error) {
        console.log('❌ Test Failed:', error.message);
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testPaymentConfig();
