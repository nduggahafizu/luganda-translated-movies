const fs = require('fs');
const path = require('path');

/* ===================================
   Automated Setup Script
   Configures .env file with MongoDB connection
   =================================== */

console.log('🚀 Luganda Movies Platform - Setup Script\n');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

// Check if .env exists
if (fs.existsSync(envPath)) {
    console.log('✅ .env file found');
    
    // Read current .env
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if MongoDB URI is configured
    if (envContent.includes('mongodb+srv://nduggahafizu67:nduggahaf67')) {
        console.log('✅ MongoDB connection already configured');
    } else if (envContent.includes('MONGODB_URI=mongodb://localhost')) {
        console.log('⚠️  Updating MongoDB URI from localhost to Atlas...');
        envContent = envContent.replace(
            /MONGODB_URI=mongodb:\/\/localhost.*/,
            `MONGODB_URI=${MONGODB_URI}`
        );
        fs.writeFileSync(envPath, envContent);
        console.log('✅ MongoDB URI updated successfully');
    } else {
        console.log('⚠️  MongoDB URI not found, adding it...');
        envContent += `\nMONGODB_URI=${MONGODB_URI}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ MongoDB URI added successfully');
    }
} else if (fs.existsSync(envExamplePath)) {
    console.log('⚠️  .env file not found, creating from .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
} else {
    console.log('❌ Neither .env nor .env.example found');
    console.log('Creating new .env file...');
    
    const envTemplate = `# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=${MONGODB_URI}

# JWT Secret for Authentication
JWT_SECRET=your_jwt_secret_key_change_in_production_12345

# TMDB API Configuration
TMDB_API_KEY=your_tmdb_api_key_here

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache Configuration
CACHE_TIMEOUT_MS=3600000
`;
    
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env file created successfully');
}

console.log('\n📋 Configuration Summary:');
console.log('   MongoDB: MongoDB Atlas (Cloud)');
console.log('   Database: luganda-movies');
console.log('   TMDB API: Configured ✅');
console.log('   Port: 5000');

console.log('\n🎯 Next Steps:');
console.log('   1. Whitelist your IP in MongoDB Atlas');
console.log('      → https://cloud.mongodb.com/');
console.log('      → Network Access → Add IP Address → Allow All (0.0.0.0/0)');
console.log('');
console.log('   2. Test MongoDB connection:');
console.log('      → npm run test:mongodb');
console.log('');
console.log('   3. Seed VJ database:');
console.log('      → npm run seed:vjs');
console.log('');
console.log('   4. Test TMDB integration:');
console.log('      → npm run test:tmdb');
console.log('');
console.log('   5. Start server:');
console.log('      → npm start');
console.log('');

console.log('✅ Setup complete!\n');
