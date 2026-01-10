const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// User Schema (simplified for this script)
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    fullName: String,
    role: String
});

const User = mongoose.model('User', userSchema);

// Update admin password
const updateAdminPassword = async () => {
    try {
        await connectDB();

        const adminEmail = 'nduggahafizu@gmail.com'; // Your admin email
        const newPassword = 'Adminhaf67@';

        // Find admin user
        const user = await User.findOne({ email: adminEmail });

        if (!user) {
            console.log(`User with email ${adminEmail} not found.`);
            console.log('Creating new admin user...');
            
            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Create new admin user
            const newUser = await User.create({
                email: adminEmail,
                password: hashedPassword,
                fullName: 'Nduga Hafizu',
                role: 'admin',
                isEmailVerified: true,
                isGoogleUser: false
            });

            console.log('Admin user created successfully!');
            console.log('Email:', adminEmail);
            console.log('Password:', newPassword);
        } else {
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password
            user.password = hashedPassword;
            user.isGoogleUser = false; // Allow password login
            await user.save();

            console.log('Password updated successfully!');
            console.log('Email:', adminEmail);
            console.log('Password:', newPassword);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating password:', error);
        process.exit(1);
    }
};

updateAdminPassword();
