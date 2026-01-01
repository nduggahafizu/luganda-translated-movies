/**
 * Update Production Database Posters
 * This script updates all movie posters in the production MongoDB database
 * using real TMDB poster URLs.
 */

const mongoose = require('mongoose');

// TMDB API token
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3NzEzYzkxMGI5NTAzYTFkYTBkMGU2ZTQ0OGJmODkwZSIsIm5iZiI6MTc2NTM2NzkxNS4wNDQsInN1YiI6IjY5Mzk2MDZiMDVjNWU1ODRkMmViMmMwMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.XIEb1EqUvntduCCKYVYzMrBfj0KhXkBI8gXEdkqbiz4';

// Production MongoDB URI (from MONGODB_SETUP.md)
const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

// Define a simple movie schema (matching LugandaMovie model)
const movieSchema = new mongoose.Schema({
    originalTitle: String,
    lugandaTitle: String,
    year: Number,
    poster: String
}, { collection: 'lugandamovies', strict: false });

const Movie = mongoose.model('Movie', movieSchema);

// Placeholder colors for movies not found on TMDB
const PLACEHOLDER_COLORS = ['FF6B6B', 'FFE66D', '4ECDC4', 'EC4899', '9333EA', '10B981', 'F59E0B'];

function getPlaceholderUrl(title, index) {
    const color = PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length];
    const shortTitle = title.substring(0, 15).replace(/[^a-zA-Z0-9 ]/g, '');
    return `https://placehold.co/500x750/1a1a2e/${color}?text=${encodeURIComponent(shortTitle)}`;
}

async function searchTMDB(title, year) {
    // Clean the title for better search results
    const cleanTitle = title
        .replace(/Part \d+/i, '')
        .replace(/Hindi|Luganda|English/gi, '')
        .replace(/\d+$/, '')
        .trim();
    
    const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(cleanTitle)}&year=${year}&include_adult=false`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${TMDB_TOKEN}`,
                'accept': 'application/json'
            }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Try to find exact match first
            let match = data.results.find(m => 
                m.title.toLowerCase() === title.toLowerCase()
            );
            
            // If no exact match, take first result with a poster
            if (!match) {
                match = data.results.find(m => m.poster_path);
            }
            
            if (match && match.poster_path) {
                return {
                    title: match.title,
                    poster: `https://image.tmdb.org/t/p/w500${match.poster_path}`
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error(`   Error searching: ${error.message}`);
        return null;
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function updatePosters() {
    console.log('🔌 Connecting to production MongoDB...');
    
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to production database\n');
        
        // Fetch all movies
        const movies = await Movie.find({}).sort({ createdAt: -1 });
        console.log(`📊 Found ${movies.length} movies to process\n`);
        
        let updated = 0;
        let notFound = 0;
        let alreadyValid = 0;
        
        for (let i = 0; i < movies.length; i++) {
            const movie = movies[i];
            const title = movie.originalTitle || movie.lugandaTitle || 'Unknown';
            const currentPoster = movie.poster || '';
            
            // Check if poster is already a valid TMDB URL with full path
            // Skip validation and always update - current posters are invalid
            const needsUpdate = !currentPoster.includes('image.tmdb.org') || 
                                currentPoster.includes('6EYPKlfzJ9OLvuW4bNbRZBHGvl7') || // Known fake path
                                !currentPoster.startsWith('https://image.tmdb.org');
            
            if (!needsUpdate && currentPoster.includes('image.tmdb.org')) {
                console.log(`⏭️ "${title}" - Already has valid poster`);
                alreadyValid++;
                continue;
            }
            
            process.stdout.write(`🔍 [${i+1}/${movies.length}] Searching: "${title}" (${movie.year})...`);
            
            // Rate limiting
            await sleep(250);
            
            const result = await searchTMDB(title, movie.year);
            
            if (result) {
                // Update in database
                await Movie.updateOne(
                    { _id: movie._id },
                    { $set: { poster: result.poster } }
                );
                console.log(`\r✅ [${i+1}/${movies.length}] "${title}" -> Updated with TMDB poster`);
                updated++;
            } else {
                // Use placeholder
                const placeholder = getPlaceholderUrl(title, i);
                await Movie.updateOne(
                    { _id: movie._id },
                    { $set: { poster: placeholder } }
                );
                console.log(`\r⚠️ [${i+1}/${movies.length}] "${title}" -> Using placeholder`);
                notFound++;
            }
        }
        
        console.log('\n========================================');
        console.log('📊 SUMMARY:');
        console.log(`   ✅ Updated with TMDB posters: ${updated}`);
        console.log(`   ⚠️ Using placeholders: ${notFound}`);
        console.log(`   ⏭️ Already valid: ${alreadyValid}`);
        console.log('========================================');
        console.log('\n✅ All posters updated in production database!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from database');
    }
}

// Run the update
updatePosters();
