/**
 * Script to add new Luganda translated movies to the database
 * Fetches movie data from TMDB and adds VJ translator information
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');
const tmdbService = require('../services/tmdbService');

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
        const searchResponse = await tmdbService.searchMovies(movieTitle);
        
        if (!searchResponse || !searchResponse.results || searchResponse.results.length === 0) {
            console.error(`   ✗ Movie not found on TMDB: ${movieTitle}`);
            return null;
        }

        // Get the first result (most relevant)
        const tmdbMovie = searchResponse.results[0];
        const movieYear = tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 'N/A';
        console.log(`   ✓ Found: ${tmdbMovie.title} (${movieYear})`);

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

        // Format movie data from TMDB
        const formattedMovie = tmdbService.formatMovieForDatabase(movieDetails);

        // Prepare movie data
        const movieData = {
            // Original movie info
            originalTitle: formattedMovie.originalTitle,
            lugandaTitle: lugandaTitle || `${formattedMovie.originalTitle} (Luganda)`,
            vjName: vjName,
            vjId: vjName.toLowerCase().replace(/\s+/g, '-'),
            
            // Description
            description: formattedMovie.description || 'No description available',
            lugandaDescription: customData.lugandaDescription || null,
            
            // Movie details
            year: formattedMovie.year,
            duration: formattedMovie.duration || 120,
            
            // Ratings
            rating: {
                imdb: formattedMovie.rating.imdb || 0,
                userRating: 0,
                totalRatings: formattedMovie.rating.totalRatings || 0,
                translationRating: customData.translationRating || 4.5,
                totalTranslationRatings: 0
            },
            
            // Categories
            genres: formattedMovie.genres || ['action'],
            
            // Cast and crew
            cast: formattedMovie.cast || [],
            director: formattedMovie.director || 'Unknown',
            writers: [],
            
            // Language
            originalLanguage: formattedMovie.originalLanguage || 'en',
            availableLanguages: ['English', 'Luganda'],
            country: formattedMovie.country || 'USA',
            
            // Media
            poster: formattedMovie.poster || '',
            backdrop: formattedMovie.backdrop || null,
            trailer: formattedMovie.trailer || null,
            
            // Video info (placeholder - will be updated when video is uploaded)
            video: {
                originalVideoPath: customData.videoPath || 'pending-upload',
                lugandaVideoPath: null,
                lugandaAudioPath: null,
                quality: customData.quality || 'hd',
                size: 0,
                duration: formattedMovie.duration || 120,
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
            
            // Tags (only string values)
            tags: [vjName, 'luganda', 'translated', ...formattedMovie.genres],
            ageRating: 'PG-13',
            
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

// Latest Movies to add from kpsounds.com (December 2025)
const moviesToAdd = [
    // VJ ICE P - Latest 2025 Movies
    {
        title: '28 Years Later',
        vj: 'VJ Ice P',
        lugandaTitle: '28 Years Later (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true,
            trending: true
        }
    },
    {
        title: 'Ghost Killer',
        vj: 'VJ Ice P',
        lugandaTitle: 'Ghost Killer (Luganda)',
        customData: {
            translationRating: 4.7,
            trending: true
        }
    },
    {
        title: 'Desert Dawn',
        vj: 'VJ Ice P',
        lugandaTitle: 'Desert Dawn (Luganda)',
        customData: {
            translationRating: 4.6,
            featured: true
        }
    },
    {
        title: 'Bhairavam',
        vj: 'VJ Ice P',
        lugandaTitle: 'Bhairavam Part 1 & 2 (Luganda)',
        customData: {
            translationRating: 4.8,
            trending: true
        }
    },
    {
        title: 'Reign of Assassins',
        vj: 'VJ Ice P',
        lugandaTitle: 'Reign of Assassins (Luganda)',
        customData: {
            translationRating: 4.7,
            featured: true
        }
    },
    {
        title: 'Blood of Youth',
        vj: 'VJ Ice P',
        lugandaTitle: 'Blood of Youth (Luganda)',
        customData: {
            translationRating: 4.6
        }
    },
    {
        title: 'The Old Way',
        vj: 'VJ Ice P',
        lugandaTitle: 'The Old Way (Luganda)',
        customData: {
            translationRating: 4.5
        }
    },
    
    // VJ JUNIOR - Latest 2025 Movies
    {
        title: 'Follow',
        vj: 'VJ Junior',
        lugandaTitle: 'Follow (Luganda)',
        customData: {
            translationRating: 4.7,
            trending: true
        }
    },
    {
        title: 'Tornado',
        vj: 'VJ Junior',
        lugandaTitle: 'Tornado (Luganda)',
        customData: {
            translationRating: 4.6,
            featured: true
        }
    },
    {
        title: 'The Shadow\'s Edge',
        vj: 'VJ Junior',
        lugandaTitle: 'The Shadow\'s Edge (Luganda)',
        customData: {
            translationRating: 4.8,
            trending: true
        }
    },
    {
        title: 'The Family Plan 2',
        vj: 'VJ Junior',
        lugandaTitle: 'The Family Plan 2 (Luganda)',
        customData: {
            translationRating: 4.7,
            featured: true
        }
    },
    {
        title: 'Escobank',
        vj: 'VJ Junior',
        lugandaTitle: 'Escobank (Luganda)',
        customData: {
            translationRating: 4.5
        }
    },
    {
        title: 'All of You',
        vj: 'VJ Junior',
        lugandaTitle: 'All of You (Luganda)',
        customData: {
            translationRating: 4.6
        }
    },
    {
        title: 'Jurassic World Rebirth',
        vj: 'VJ Junior',
        lugandaTitle: 'Jurassic World Rebirth (Luganda)',
        customData: {
            translationRating: 4.9,
            featured: true,
            trending: true
        }
    },
    {
        title: 'The Pickup',
        vj: 'VJ Junior',
        lugandaTitle: 'The Pickup (Luganda)',
        customData: {
            translationRating: 4.5
        }
    },
    
    // VJ EMMY - Latest 2025 Movies
    {
        title: 'How to Train Your Dragon',
        vj: 'VJ Emmy',
        lugandaTitle: 'How to Train Your Dragon (Luganda)',
        customData: {
            translationRating: 4.9,
            featured: true,
            trending: true
        }
    },
    {
        title: 'Predator: Badlands',
        vj: 'VJ Emmy',
        lugandaTitle: 'Predator: Badlands (Luganda)',
        customData: {
            translationRating: 4.8,
            trending: true
        }
    },
    {
        title: 'The Sandman',
        vj: 'VJ Emmy',
        lugandaTitle: 'The Sandman (Luganda)',
        customData: {
            translationRating: 4.7,
            featured: true
        }
    },
    {
        title: 'Muzzle',
        vj: 'VJ Emmy',
        lugandaTitle: 'Muzzle: City of Wolves (Luganda)',
        customData: {
            translationRating: 4.6
        }
    },
    {
        title: 'Dora and the Lost City of Gold',
        vj: 'VJ Emmy',
        lugandaTitle: 'Dora and the Search for Sol Dorado (Luganda)',
        customData: {
            translationRating: 4.5
        }
    },
    
    // VJ SOUL - Latest Movies
    {
        title: 'Superman',
        vj: 'VJ Soul',
        lugandaTitle: 'Superman (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true,
            trending: true
        }
    }
];

// Series to add
const seriesToAdd = [
    {
        title: 'Last Samurai Standing',
        vj: 'VJ Ice P',
        lugandaTitle: 'Last Samurai Standing (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true
        }
    },
    {
        title: 'Ever Night',
        vj: 'VJ Ice P',
        lugandaTitle: 'Ever Night Season 2 (Luganda)',
        customData: {
            translationRating: 4.7,
            trending: true
        }
    },
    {
        title: 'Land of Warriors',
        vj: 'VJ Ice P',
        lugandaTitle: 'Land of Warriors 2 (Luganda)',
        customData: {
            translationRating: 4.6
        }
    },
    {
        title: 'Love and Sword',
        vj: 'VJ Ice P',
        lugandaTitle: 'Love and Sword 2025 (Luganda)',
        customData: {
            translationRating: 4.7,
            featured: true
        }
    },
    {
        title: 'Man vs Baby',
        vj: 'VJ Junior',
        lugandaTitle: 'Man vs Baby (Luganda)',
        customData: {
            translationRating: 4.5
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
