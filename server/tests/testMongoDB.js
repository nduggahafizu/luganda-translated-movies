require('dotenv').config();
const mongoose = require('mongoose');

/* ===================================
   MongoDB Connection Test
   =================================== */

async function testMongoDBConnection() {
    console.log('🧪 Testing MongoDB Connection...\n');
    
    try {
        const mongoUri = process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MONGODB_URI not found in .env file');
        }
        
        console.log('Connecting to MongoDB Atlas...');
        console.log(`URI: ${mongoUri.replace(/:[^:@]+@/, ':****@')}`);
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!\n');
        
        // Test database operations
        console.log('Testing database operations...');
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`✅ Found ${collections.length} collections in database`);
        
        if (collections.length > 0) {
            console.log('Collections:');
            collections.forEach(col => {
                console.log(`  - ${col.name}`);
            });
        }
        
        console.log('\n✅ MongoDB connection test passed!\n');
        
        await mongoose.connection.close();
        console.log('Connection closed.');
        
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.error('\n💡 Tip: Check your MongoDB Atlas password');
            console.error('   - Go to MongoDB Atlas > Database Access');
            console.error('   - Verify user credentials');
            console.error('   - Update password if needed');
        } else if (error.message.includes('ENOTFOUND')) {
            console.error('\n💡 Tip: Check your internet connection');
            console.error('   - Verify you can access MongoDB Atlas');
            console.error('   - Check firewall settings');
        } else if (error.message.includes('IP')) {
            console.error('\n💡 Tip: Whitelist your IP address');
            console.error('   - Go to MongoDB Atlas > Network Access');
            console.error('   - Add your current IP address');
            console.error('   - Or allow access from anywhere (0.0.0.0/0)');
        }
        
        return false;
    }
}

// Run test
if (require.main === module) {
    testMongoDBConnection()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = testMongoDBConnection;
