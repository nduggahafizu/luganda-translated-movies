/* ===================================
   Create Admin User Script
   Creates a default admin user for testing
   =================================== */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdmin() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';
        console.log('📦 Connecting to MongoDB...');
        
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@unrulymovies.com' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Role: ${existingAdmin.role}`);
            await mongoose.connection.close();
            process.exit(0);
        }
        
        // Create admin user
        const adminUser = await User.create({
            fullName: 'Admin User',
            email: 'admin@unrulymovies.com',
            password: 'Admin@123',
            role: 'admin',
            isActive: true,
            isEmailVerified: true,
            subscription: {
                plan: 'premium',
                status: 'active',
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }
        });
        
        console.log('\n========================================');
        console.log('✅ Admin user created successfully!');
        console.log('========================================');
        console.log(`   Email: admin@unrulymovies.com`);
        console.log(`   Password: Admin@123`);
        console.log(`   Role: admin`);
        console.log('========================================\n');
        
        // Also create a test user
        const existingTest = await User.findOne({ email: 'test@unrulymovies.com' });
        if (!existingTest) {
            await User.create({
                fullName: 'Test User',
                email: 'test@unrulymovies.com',
                password: 'Test@123',
                role: 'user',
                isActive: true,
                isEmailVerified: true,
                subscription: {
                    plan: 'free',
                    status: 'active'
                }
            });
            console.log('✅ Test user also created:');
            console.log(`   Email: test@unrulymovies.com`);
            console.log(`   Password: Test@123`);
            console.log(`   Role: user`);
            console.log('========================================\n');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Database connection closed');
        process.exit(0);
    }
}

createAdmin();
