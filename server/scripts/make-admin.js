/**
 * Make User Admin Script
 * 
 * Run this script to promote a user to admin status.
 * Usage: node scripts/make-admin.js <email>
 * 
 * Example: node scripts/make-admin.js admin@example.com
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const email = process.argv[2];

if (!email) {
    console.error('❌ Please provide an email address');
    console.log('\nUsage: node scripts/make-admin.js <email>');
    console.log('Example: node scripts/make-admin.js admin@example.com');
    process.exit(1);
}

async function makeAdmin() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.error(`❌ User with email "${email}" not found`);
            console.log('\n📋 Available users:');
            const users = await User.find({}).select('email fullName role').limit(10);
            users.forEach(u => {
                console.log(`   - ${u.email} (${u.fullName}) [${u.role}]`);
            });
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`✅ User "${user.fullName}" is already an admin`);
        } else {
            user.role = 'admin';
            await user.save();
            console.log(`✅ Successfully promoted "${user.fullName}" (${user.email}) to admin!`);
        }

        console.log('\n📌 Admin Access:');
        console.log('   1. Login with this email at /login.html');
        console.log('   2. Navigate to /admin.html');
        console.log('   3. Only admins can access admin pages');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

makeAdmin();
