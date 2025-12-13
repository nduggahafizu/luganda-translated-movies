require('dotenv').config();
const tmdbService = require('../services/tmdbService');

/* ===================================
   TMDB Service Test Suite
   =================================== */

async function testTMDBService() {
    console.log('🧪 Testing TMDB Service...\n');
    
    try {
        // Test 1: Search Movies
        console.log('Test 1: Search Movies');
        console.log('Searching for "Spider-Man"...');
        const searchResults = await tmdbService.searchMovies('Spider-Man');
        console.log(`✅ Found ${searchResults.results.length} movies`);
        console.log(`First result: ${searchResults.results[0].title} (${searchResults.results[0].release_date})`);
        console.log('');

        // Test 2: Get Movie Details
        console.log('Test 2: Get Movie Details');
        const movieId = searchResults.results[0].id;
        console.log(`Getting details for movie ID: ${movieId}...`);
        const movieDetails = await tmdbService.getMovieDetails(movieId);
        console.log(`✅ Title: ${movieDetails.title}`);
        console.log(`   Overview: ${movieDetails.overview.substring(0, 100)}...`);
        console.log(`   Rating: ${movieDetails.vote_average}/10`);
        console.log(`   Runtime: ${movieDetails.runtime} minutes`);
        console.log('');

        // Test 3: Get Trending Movies
        console.log('Test 3: Get Trending Movies');
        const trending = await tmdbService.getTrendingMovies('week');
        console.log(`✅ Found ${trending.results.length} trending movies`);
        console.log(`Top trending: ${trending.results[0].title}`);
        console.log('');

        // Test 4: Get Popular Movies
        console.log('Test 4: Get Popular Movies');
        const popular = await tmdbService.getPopularMovies();
        console.log(`✅ Found ${popular.results.length} popular movies`);
        console.log(`Most popular: ${popular.results[0].title}`);
        console.log('');

        // Test 5: Get Genres
        console.log('Test 5: Get Genres');
        const genres = await tmdbService.getGenres();
        console.log(`✅ Found ${genres.genres.length} genres`);
        console.log(`Genres: ${genres.genres.map(g => g.name).join(', ')}`);
        console.log('');

        // Test 6: Image URLs
        console.log('Test 6: Image URL Generation');
        const posterUrl = tmdbService.getPosterUrl(movieDetails.poster_path);
        const backdropUrl = tmdbService.getBackdropUrl(movieDetails.backdrop_path);
        console.log(`✅ Poster URL: ${posterUrl}`);
        console.log(`   Backdrop URL: ${backdropUrl}`);
        console.log('');

        // Test 7: Format Movie for Database
        console.log('Test 7: Format Movie for Database');
        const formattedMovie = tmdbService.formatMovieForDatabase(movieDetails);
        console.log(`✅ Formatted movie data:`);
        console.log(`   TMDB ID: ${formattedMovie.tmdbId}`);
        console.log(`   Title: ${formattedMovie.originalTitle}`);
        console.log(`   Year: ${formattedMovie.year}`);
        console.log(`   Genres: ${formattedMovie.genres.join(', ')}`);
        console.log(`   Cast: ${formattedMovie.cast.length} actors`);
        console.log('');

        // Test 8: Cache Statistics
        console.log('Test 8: Cache Statistics');
        const cacheStats = tmdbService.getCacheStats();
        console.log(`✅ Cache size: ${cacheStats.size} entries`);
        console.log(`   Cache timeout: ${cacheStats.timeout}ms`);
        console.log('');

        console.log('✅ All TMDB tests passed!\n');
        return true;
    } catch (error) {
        console.error('❌ TMDB Test Failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Run tests
if (require.main === module) {
    testTMDBService()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = testTMDBService;
