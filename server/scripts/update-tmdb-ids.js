/**
 * Script to update all movies in the database with TMDB IDs
 * This searches TMDB for each movie by title and year, then updates the database
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

// Define a simple movie schema for this script
const movieSchema = new mongoose.Schema({
    originalTitle: String,
    lugandaTitle: String,
    year: Number,
    tmdbId: String,
    metaData: {
        tmdbId: String,
        imdbId: String
    },
    poster: String,
    backdrop: String,
    description: String
}, { strict: false });

const Movie = mongoose.model('LugandaMovie', movieSchema, 'lugandamovies');

// Search TMDB for a movie
async function searchTMDB(title, year) {
    try {
        const params = {
            api_key: TMDB_API_KEY,
            query: title,
            language: 'en-US',
            page: 1
        };
        
        if (year) {
            params.year = year;
        }

        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, { params });
        
        if (response.data.results && response.data.results.length > 0) {
            // Return the first (most relevant) result
            return response.data.results[0];
        }
        return null;
    } catch (error) {
        console.error(`  ⚠️ TMDB search error for "${title}":`, error.message);
        return null;
    }
}

// Get movie details from TMDB
async function getTMDBDetails(tmdbId) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
            params: {
                api_key: TMDB_API_KEY,
                language: 'en-US',
                append_to_response: 'videos,images'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`  ⚠️ TMDB details error for ID ${tmdbId}:`, error.message);
        return null;
    }
}

// Main function to update all movies
async function updateAllMovies() {
    console.log('\n🎬 TMDB ID Update Script');
    console.log('========================\n');

    if (!TMDB_API_KEY) {
        console.error('❌ TMDB_API_KEY not found in environment variables!');
        process.exit(1);
    }

    await connectDB();

    // Fetch all movies
    const movies = await Movie.find({});
    console.log(`📊 Found ${movies.length} movies in database\n`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;

    for (let i = 0; i < movies.length; i++) {
        const movie = movies[i];
        const title = movie.originalTitle || movie.lugandaTitle;
        
        // Check if movie already has TMDB ID
        const existingTmdbId = movie.tmdbId || movie.metaData?.tmdbId;
        
        if (existingTmdbId) {
            console.log(`⏭️  [${i + 1}/${movies.length}] "${title}" - Already has TMDB ID: ${existingTmdbId}`);
            skipped++;
            continue;
        }

        console.log(`🔍 [${i + 1}/${movies.length}] Searching for: "${title}" (${movie.year || 'unknown year'})`);

        // Search TMDB
        const tmdbResult = await searchTMDB(title, movie.year);

        if (tmdbResult) {
            const tmdbId = tmdbResult.id.toString();
            
            // Get additional details
            const details = await getTMDBDetails(tmdbId);
            
            // Update the movie
            const updateData = {
                tmdbId: tmdbId,
                'metaData.tmdbId': tmdbId
            };

            // Optionally update poster and backdrop if missing
            if (!movie.poster && tmdbResult.poster_path) {
                updateData.poster = `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}`;
            }
            if (!movie.backdrop && tmdbResult.backdrop_path) {
                updateData.backdrop = `https://image.tmdb.org/t/p/original${tmdbResult.backdrop_path}`;
            }
            if (details?.imdb_id) {
                updateData['metaData.imdbId'] = details.imdb_id;
            }

            await Movie.updateOne({ _id: movie._id }, { $set: updateData });
            
            console.log(`   ✅ Found: "${tmdbResult.title}" (${tmdbResult.release_date?.substring(0, 4) || 'N/A'}) - TMDB ID: ${tmdbId}`);
            updated++;
        } else {
            console.log(`   ❌ Not found on TMDB`);
            notFound++;
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    console.log('\n========== SUMMARY ==========');
    console.log(`✅ Updated: ${updated} movies`);
    console.log(`⏭️  Skipped (already had ID): ${skipped} movies`);
    console.log(`❌ Not found on TMDB: ${notFound} movies`);
    console.log(`⚠️  Errors: ${errors} movies`);
    console.log('==============================\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
}

// Run the script
updateAllMovies().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
