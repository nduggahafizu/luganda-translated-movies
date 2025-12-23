/**
 * Database Configuration with Fallback Support
 * Handles MongoDB connection with graceful fallback to in-memory storage
 */

const mongoose = require('mongoose');

class DatabaseManager {
    constructor() {
        this.isConnected = false;
        this.useInMemory = false;
        this.inMemoryStore = {
            lugandaMovies: [],
            users: [],
            vjs: [],
            watchProgress: [],
            playlists: []
        };
    }

    /**
     * Connect to MongoDB with fallback support
     */
    async connect(uri) {
        try {
            console.log('🔌 Attempting MongoDB connection...');
            console.log(`   URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

            await mongoose.connect(uri, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 10000,
            });

            this.isConnected = true;
            this.useInMemory = false;

            console.log('✅ MongoDB Connected Successfully');
            console.log(`   Database: ${mongoose.connection.name}`);
            console.log(`   Host: ${mongoose.connection.host}`);
            
            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB Error:', err.message);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️  MongoDB Disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                console.log('✅ MongoDB Reconnected');
                this.isConnected = true;
            });

            return true;

        } catch (error) {
            console.error('⚠️  MongoDB Connection Failed:', error.message);
            console.log('');
            console.log('📝 Switching to In-Memory Mode');
            console.log('   - Data will not persist between restarts');
            console.log('   - Sample data will be used');
            console.log('   - All features will work with mock data');
            console.log('');
            console.log('💡 To use MongoDB:');
            console.log('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
            console.log('   2. Start MongoDB service');
            console.log('   3. Or use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas');
            console.log('   4. Update MONGODB_URI in server/.env');
            console.log('');

            this.isConnected = false;
            this.useInMemory = true;
            
            // Disable Mongoose buffering to prevent timeout errors
            mongoose.set('bufferCommands', false);
            mongoose.set('bufferTimeoutMS', 0);
            
            // Load sample data
            this.loadSampleData();
            
            return false;
        }
    }

    /**
     * Load sample data for in-memory mode
     */
    loadSampleData() {
        console.log('📦 Loading sample data...');
        
        // Load sample Luganda movies
        try {
            const sampleMovies = require('../seeds/sampleLugandaMovies');
            this.inMemoryStore.lugandaMovies = sampleMovies;
            console.log(`   ✓ Loaded ${sampleMovies.length} sample movies`);
        } catch (error) {
            console.log('   ⚠ Sample movies not found, using empty array');
            this.inMemoryStore.lugandaMovies = [];
        }

        console.log('✅ Sample data loaded\n');
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            inMemoryMode: this.useInMemory,
            database: this.isConnected ? mongoose.connection.name : 'in-memory',
            host: this.isConnected ? mongoose.connection.host : 'localhost',
            readyState: mongoose.connection.readyState,
            readyStateText: this.getReadyStateText(mongoose.connection.readyState)
        };
    }

    /**
     * Get readable ready state text
     */
    getReadyStateText(state) {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[state] || 'unknown';
    }

    /**
     * Get in-memory store (for fallback mode)
     */
    getInMemoryStore() {
        return this.inMemoryStore;
    }

    /**
     * Check if using in-memory mode
     */
    isInMemoryMode() {
        return this.useInMemory;
    }

    /**
     * Disconnect from database
     */
    async disconnect() {
        if (this.isConnected) {
            await mongoose.connection.close();
            this.isConnected = false;
            console.log('🔌 MongoDB Disconnected');
        }
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = dbManager;
