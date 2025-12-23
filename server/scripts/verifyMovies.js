/**
 * Script to verify movies were added to the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unruly-movies', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✓ Connected to MongoDB');
});

async function verifyMovies() {
    try {
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('Verifying Movies in Database');
        console.log('═══════════════════════════════════════════════════════\n');

        // Get total count
        const totalCount = await LugandaMovie.countDocuments();
        console.log(`📊 Total movies in database: ${totalCount}\n`);

        // Get movies by VJ
        const vjNames = ['VJ Ice P', 'VJ Junior', 'VJ Emmy', 'VJ Soul'];
        
        for (const vjName of vjNames) {
            const movies = await LugandaMovie.find({ vjName: vjName })
                .select('originalTitle lugandaTitle year genres featured trending')
                .sort('-translationDate')
                .limit(20);
            
            if (movies.length > 0) {
                console.log(`\n🎬 ${vjName} - ${movies.length} movies:`);
                console.log('─'.repeat(60));
                movies.forEach((movie, index) => {
                    const featured = movie.featured ? '⭐' : '';
                    const trending = movie.trending ? '🔥' : '';
                    console.log(`${index + 1}. ${movie.originalTitle} (${movie.year}) ${featured}${trending}`);
                    console.log(`   Luganda: ${movie.lugandaTitle}`);
                    console.log(`   Genres: ${movie.genres.join(', ')}`);
                });
            } else {
                console.log(`\n${vjName}: No movies found`);
            }
        }

        // Get featured movies
        console.log('\n\n⭐ Featured Movies:');
        console.log('─'.repeat(60));
        const featuredMovies = await LugandaMovie.find({ featured: true })
            .select('originalTitle vjName year')
            .sort('-translationDate')
            .limit(10);
        
        featuredMovies.forEach((movie, index) => {
            console.log(`${index + 1}. ${movie.originalTitle} (${movie.year}) - ${movie.vjName}`);
        });

        // Get trending movies
        console.log('\n\n🔥 Trending Movies:');
        console.log('─'.repeat(60));
        const trendingMovies = await LugandaMovie.find({ trending: true })
            .select('originalTitle vjName year')
            .sort('-translationDate')
            .limit(10);
        
        trendingMovies.forEach((movie, index) => {
            console.log(`${index + 1}. ${movie.originalTitle} (${movie.year}) - ${movie.vjName}`);
        });

        // Get latest movies
        console.log('\n\n🆕 Latest Movies (Most Recent):');
        console.log('─'.repeat(60));
        const latestMovies = await LugandaMovie.find()
            .select('originalTitle vjName year translationDate')
            .sort('-translationDate')
            .limit(10);
        
        latestMovies.forEach((movie, index) => {
            const date = new Date(movie.translationDate).toLocaleDateString();
            console.log(`${index + 1}. ${movie.originalTitle} (${movie.year}) - ${movie.vjName} - Added: ${date}`);
        });

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✅ Verification Complete!');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('✓ Database connection closed\n');
        process.exit(0);
    }
}

// Run if executed directly
if (require.main === module) {
    // Wait for MongoDB connection
    setTimeout(verifyMovies, 2000);
}

module.exports = { verifyMovies };
