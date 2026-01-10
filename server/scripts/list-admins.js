/**
 * List Admin Users Script
 * 
 * Run this script to see all admin users.
 * Usage: node scripts/list-admins.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function listAdmins() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const admins = await User.find({ role: 'admin' }).select('email fullName createdAt');

        if (admins.length === 0) {
            console.log('⚠️  No admin users found');
            console.log('\nTo make a user admin, run:');
            console.log('   node scripts/make-admin.js <email>');
        } else {
            console.log(`👑 Admin Users (${admins.length}):`);
            console.log('─'.repeat(50));
            admins.forEach((admin, i) => {
                console.log(`${i + 1}. ${admin.fullName}`);
                console.log(`   Email: ${admin.email}`);
                console.log(`   Since: ${admin.createdAt.toLocaleDateString()}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

listAdmins();
