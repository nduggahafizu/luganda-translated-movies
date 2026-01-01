/**
 * Script to add new Luganda translated movies to the database
 * Fetches movie data from TMDB and adds VJ translator information
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');
const tmdbService = require('../services/tmdbService');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/unruly-movies');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✓ Connected to MongoDB');
});

/**
 * Add a new Luganda movie to the database
 * @param {string} movieTitle - Original movie title to search on TMDB
 * @param {string} vjName - VJ translator name
 * @param {string} lugandaTitle - Luganda translated title (optional)
 * @param {object} customData - Additional custom data (optional)
 */
async function addMovie(movieTitle, vjName, lugandaTitle = null, customData = {}) {
    try {
        console.log(`\n🎬 Adding: ${movieTitle} (VJ ${vjName})`);

        // Search for movie on TMDB
        console.log('   Searching TMDB...');
        const searchResults = await tmdbService.searchMovies(movieTitle);
        
        if (!searchResults || searchResults.length === 0) {
            console.error(`   ✗ Movie not found on TMDB: ${movieTitle}`);
            return null;
        }

        // Get the first result (most relevant)
        const tmdbMovie = searchResults[0];
        console.log(`   ✓ Found: ${tmdbMovie.title} (${tmdbMovie.year})`);

        // Get full movie details
        console.log('   Fetching full details...');
        const movieDetails = await tmdbService.getMovieDetails(tmdbMovie.id);

        // Check if movie already exists
        const existingMovie = await LugandaMovie.findOne({
            'metaData.tmdbId': tmdbMovie.id.toString(),
            vjName: vjName
        });

        if (existingMovie) {
            console.log(`   ⚠ Movie already exists: ${existingMovie.originalTitle} by VJ ${vjName}`);
            return existingMovie;
        }

        // Prepare movie data
        const movieData = {
            // Original movie info
            originalTitle: movieDetails.title,
            lugandaTitle: lugandaTitle || `${movieDetails.title} (Luganda)`,
            vjName: vjName,
            vjId: vjName.toLowerCase().replace(/\s+/g, '-'),
            
            // Description
            description: movieDetails.overview || 'No description available',
            lugandaDescription: customData.lugandaDescription || null,
            
            // Movie details
            year: movieDetails.year,
            duration: movieDetails.runtime || 120,
            
            // Ratings
            rating: {
                imdb: movieDetails.rating || 0,
                userRating: 0,
                totalRatings: 0,
                translationRating: customData.translationRating || 4.5,
                totalTranslationRatings: 0
            },
            
            // Categories
            genres: movieDetails.genres || ['action'],
            
            // Cast and crew
            cast: movieDetails.cast || [],
            director: movieDetails.director || 'Unknown',
            writers: movieDetails.writers || [],
            
            // Language
            originalLanguage: movieDetails.language || 'English',
            availableLanguages: ['English', 'Luganda'],
            country: movieDetails.country || 'USA',
            
            // Media
            poster: movieDetails.poster || '',
            backdrop: movieDetails.backdrop || null,
            trailer: movieDetails.trailer || null,
            
            // Video info (placeholder - will be updated when video is uploaded)
            video: {
                originalVideoPath: customData.videoPath || customData.embedUrl || 'streamtape',
                lugandaVideoPath: null,
                lugandaAudioPath: null,
                embedUrl: customData.embedUrl || null,
                streamtapeId: customData.streamtapeId || null,
                provider: customData.provider || 'local',
                quality: customData.quality || 'hd',
                size: 0,
                duration: movieDetails.runtime || 120,
                format: 'mp4'
            },
            
            // Subtitles
            subtitles: [],
            
            // Access control
            requiredPlan: customData.requiredPlan || 'free',
            status: 'published',
            featured: customData.featured || false,
            trending: customData.trending || false,
            
            // Statistics
            views: 0,
            likes: 0,
            downloads: 0,
            
            // Tags
            tags: [vjName, 'luganda', 'translated', ...movieDetails.genres],
            ageRating: movieDetails.ageRating || 'PG-13',
            
            // Translation metadata
            translationDate: new Date(),
            translationNotes: customData.translationNotes || null,
            
            // External IDs
            metaData: {
                tmdbId: tmdbMovie.id.toString(),
                imdbId: movieDetails.imdbId || null
            },
            
            // Hosting (will be updated when uploaded to GCS)
            hosting: {
                provider: 'local',
                url: null,
                streamUrl: null
            }
        };

        // Create and save movie
        const movie = new LugandaMovie(movieData);
        await movie.save();

        console.log(`   ✓ Added successfully! ID: ${movie._id}`);
        console.log(`   Poster: ${movie.poster}`);
        
        return movie;

    } catch (error) {
        console.error(`   ✗ Error adding movie: ${error.message}`);
        return null;
    }
}

/**
 * Add multiple movies at once
 */
async function addMultipleMovies(moviesList) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('Adding Luganda Translated Movies');
    console.log('═══════════════════════════════════════════════════════');

    const results = {
        success: [],
        failed: [],
        skipped: []
    };

    for (const movieInfo of moviesList) {
        const result = await addMovie(
            movieInfo.title,
            movieInfo.vj,
            movieInfo.lugandaTitle,
            movieInfo.customData || {}
        );

        if (result) {
            results.success.push(movieInfo.title);
        } else {
            results.failed.push(movieInfo.title);
        }

        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✓ Successfully added: ${results.success.length}`);
    console.log(`✗ Failed: ${results.failed.length}`);
    console.log(`⚠ Skipped (already exists): ${results.skipped.length}`);
    
    if (results.success.length > 0) {
        console.log('\nSuccessfully added:');
        results.success.forEach(title => console.log(`  - ${title}`));
    }
    
    if (results.failed.length > 0) {
        console.log('\nFailed:');
        results.failed.forEach(title => console.log(`  - ${title}`));
    }

    return results;
}

// Movies to add based on your request
const moviesToAdd = [
    // VJ Ice P Movies
    {
        title: 'Lokah',
        vj: 'VJ Ice P',
        lugandaTitle: 'Lokah (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true,
            trending: true
        }
    },
    {
        title: 'Running Man',
        vj: 'VJ Ice P',
        lugandaTitle: 'Running Man (Luganda)',
        customData: {
            translationRating: 4.7
        }
    },
    {
        title: 'Kantara',
        vj: 'VJ Ice P',
        lugandaTitle: 'Kantara (Luganda)',
        customData: {
            translationRating: 4.9,
            featured: true
        }
    },
    {
        title: 'Frankenstein',
        vj: 'VJ Ice P',
        lugandaTitle: 'Frankenstein (Luganda)',
        customData: {
            translationRating: 4.5
        }
    },
    {
        title: 'Predator Badlands',
        vj: 'VJ Ice P',
        lugandaTitle: 'Predator Badlands (Luganda)',
        customData: {
            translationRating: 4.6,
            trending: true
        }
    },
    {
        title: 'Fist of Fury',
        vj: 'VJ Ice P',
        lugandaTitle: 'Fist of Fury (Luganda)',
        customData: {
            translationRating: 4.7
        }
    }
];

// Series to add (VJ Soul)
const seriesToAdd = [
    {
        title: 'War',
        vj: 'VJ Soul',
        lugandaTitle: 'War Season 1 (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true
        }
    }
];

// Run the script
async function main() {
    try {
        // Wait for MongoDB connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Add movies
        console.log('\n📽️  Adding Movies by VJ Ice P...\n');
        await addMultipleMovies(moviesToAdd);

        // Add series
        console.log('\n📺 Adding Series by VJ Soul...\n');
        await addMultipleMovies(seriesToAdd);

        console.log('\n✅ All done!');
        console.log('\nNext steps:');
        console.log('1. Upload video files to Google Cloud Storage');
        console.log('2. Update movie records with video paths');
        console.log('3. Movies will be visible on your website');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        process.exit(0);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { addMovie, addMultipleMovies };
