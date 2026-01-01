/**
 * Fix Movie Posters Script
 * Uses reliable placeholder images for movies without working posters
 */

require('dotenv').config();
const mongoose = require('mongoose');
const https = require('https');
const LugandaMovie = require('../models/LugandaMovie');

// Movie posters - curated from working TMDB URLs
const MOVIE_POSTERS = {
    'Tommy Boy': 'https://image.tmdb.org/t/p/w500/sZgBhOvT2Vj0Ds0mJNvuPLEaKCf.jpg',
    'To the Limit': 'https://image.tmdb.org/t/p/w500/rMHmXqxVBdLgzCdjpVPQRhTcz8x.jpg',
    'Secret Admirer': 'https://image.tmdb.org/t/p/w500/8LN4hXtCYnqhWxZWdpFmDhD3a9u.jpg',
    'Prom Night': 'https://image.tmdb.org/t/p/w500/6EYPKlfzJ9OLvuW4bNbRZBHGvl7.jpg',
    'Cobra': 'https://image.tmdb.org/t/p/w500/oVkSBMCgdR9aNMxvS9N5EUWFdLt.jpg',
    'Predator: Badlands': 'https://image.tmdb.org/t/p/w500/2QL5j1RZNAucqRU9r7PX5EGSuS8.jpg', // Predator 2018
    'Muzzle: City of Wolves': 'https://image.tmdb.org/t/p/w500/jnVkqLqxMZF2FxL1K6qdEYpevRb.jpg',
    'Dracula': 'https://image.tmdb.org/t/p/w500/fYEOjAQpZGCKAUPU0XuICYhJPMo.jpg', // Dracula Untold
    'Hunting Jessica Brok': 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', // Action poster
    'Desert Lone Hero': 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', // Desert themed
    'Madharaasi Part 1 Hindi': 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    'Madharaasi Part 2 Hindi': 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
    'Thanal Part 1 Hindi': 'https://image.tmdb.org/t/p/w500/rSAmfZgJCKzMrufNTZCqABEvLgS.jpg',
    'Thanal Part 2 Hindi': 'https://image.tmdb.org/t/p/w500/rSAmfZgJCKzMrufNTZCqABEvLgS.jpg',
    'Kantara: A Legend Chapter 1 Part 2': 'https://image.tmdb.org/t/p/w500/ss0Os3uWGfMtypN8aJVDfW7C1SJ.jpg', // Kantara
    'Office Christmas Party': 'https://image.tmdb.org/t/p/w500/cSNwEOIGTIkFhWGBDT6dksdW2PH.jpg',
    'Now You See Me 3: Now You Dont': 'https://image.tmdb.org/t/p/w500/lxSzRZ49NXwsiyHuvMNEyrwKkMV.jpg', // Now You See Me 2
    'Basic Instinct': 'https://image.tmdb.org/t/p/w500/ubCOBSbJ1fRnFUfxSk0DxJV5SfF.jpg',
    'A Christmas Treasure': 'https://image.tmdb.org/t/p/w500/pKiuTcjnQAyU8t4sMxDLfyKhKMT.jpg',
    'Welcome Home Roscoe Jenkins': 'https://image.tmdb.org/t/p/w500/rOJhcqpuYu2FZYL06XVd84L8zRs.jpg',
    'Waiting to Exhale': 'https://image.tmdb.org/t/p/w500/uAbmFBHvYuOXPL9HGMEfhY6QzYM.jpg',
    'Sisu 2: Road to Revenge': 'https://image.tmdb.org/t/p/w500/aOVr8bGpwuHVMFR9WKBP0qgZtT1.jpg', // Sisu
    'Margaux': 'https://image.tmdb.org/t/p/w500/dLWZnq0q5qWZ3xvYx1oZAoQbQJb.jpg',
    'A Jazzmans Blues': 'https://image.tmdb.org/t/p/w500/bODOvp4sEPuCYLNdIwZKtP0zbnC.jpg',
    'The Thomas Crown Affair': 'https://image.tmdb.org/t/p/w500/8raMYleijfLMU19FJStlpnh9Xkv.jpg',
    'Walking on Thin Ice': 'https://image.tmdb.org/t/p/w500/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg', // Ice themed
    'Alex Rider': 'https://image.tmdb.org/t/p/w500/c6BTDQ87rQYDMCOI3vJWsHrkJ57.jpg',
    'Mr. Queen': 'https://image.tmdb.org/t/p/w500/6GZdOzfDH7Q3RXgGD7LwFmQkYOG.jpg',
    'Coyote': 'https://image.tmdb.org/t/p/w500/nngX8zAtj8OkHLhTcz8lbPYAJA4.jpg',
    'Man vs Baby': 'https://image.tmdb.org/t/p/w500/A1X3nB3B7lM0jLbnPWlkh4HF9zB.jpg',
    'Rabbit Hole': 'https://image.tmdb.org/t/p/w500/qLfWKpV7zfYPj4YWxVG9pzXOj9f.jpg',
    'Genie, Make a Wish': 'https://image.tmdb.org/t/p/w500/iJhHgaKpk4K18Fq6SBqMaLwg0Bn.jpg', // Aladdin themed
    'Chasing in the Wild': 'https://image.tmdb.org/t/p/w500/j2F43xCNGqjQeYdlNblO5t8l6CJ.jpg', // Wild themed
    'Dear X': 'https://image.tmdb.org/t/p/w500/1NhwLTVIqCrKn7wvQo6KtXuT3jN.jpg',
    'Last Samurai Standing': 'https://image.tmdb.org/t/p/w500/pL7A3fGoMv9dVKBUXK2fiHKAHHS.jpg' // Last Samurai
};

// Fallback: Generate placeholder based on movie title
function generatePlaceholder(title, genre) {
    const colors = {
        'action': '8B0000/FFFFFF',      // Dark red
        'comedy': 'FFD700/000000',      // Gold
        'horror': '2F4F4F/FF0000',      // Dark gray with red text
        'romance': 'FF69B4/FFFFFF',     // Pink
        'sci-fi': '191970/00FFFF',      // Navy with cyan
        'thriller': '1C1C1C/FF4500',    // Black with orange
        'crime': '36454F/FFFFFF',       // Charcoal
        'drama': '4A4A4A/FFFFFF',       // Gray
        'default': '2D2D2D/7CFC00'      // Dark with green (Unruly theme)
    };
    
    const color = colors[genre] || colors['default'];
    const encodedTitle = encodeURIComponent(title.substring(0, 20));
    return `https://placehold.co/500x750/${color}?text=${encodedTitle}&font=roboto`;
}

async function checkUrl(url) {
    return new Promise((resolve) => {
        const request = https.request(url, { method: 'HEAD', timeout: 5000 }, (response) => {
            resolve(response.statusCode === 200);
        });
        request.on('error', () => resolve(false));
        request.on('timeout', () => {
            request.destroy();
            resolve(false);
        });
        request.end();
    });
}

async function fixMoviePosters() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        
        // Get all movies
        const movies = await LugandaMovie.find({});
        console.log(`📽️  Found ${movies.length} movies to check\n`);
        
        let updated = 0;
        let alreadyWorking = 0;
        let usedPlaceholder = 0;
        
        for (const movie of movies) {
            const title = movie.originalTitle;
            console.log(`🔍 Checking: "${title}"`);
            
            // First check if current poster works
            if (movie.poster) {
                const works = await checkUrl(movie.poster);
                if (works) {
                    console.log(`   ✅ Current poster works`);
                    alreadyWorking++;
                    continue;
                }
            }
            
            // Try curated poster
            let newPoster = MOVIE_POSTERS[title];
            let posterWorks = false;
            
            if (newPoster) {
                posterWorks = await checkUrl(newPoster);
                if (posterWorks) {
                    console.log(`   📷 Using curated poster`);
                }
            }
            
            // Fallback to placeholder
            if (!posterWorks) {
                const genre = movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'default';
                newPoster = generatePlaceholder(title, genre);
                console.log(`   🎨 Using placeholder image`);
                usedPlaceholder++;
            }
            
            // Update the movie
            await LugandaMovie.findByIdAndUpdate(movie._id, {
                poster: newPoster
            });
            
            console.log(`   ✅ Updated: ${newPoster.substring(0, 60)}...`);
            updated++;
        }
        
        console.log(`\n📊 Results:`);
        console.log(`   Already working: ${alreadyWorking}`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Used placeholders: ${usedPlaceholder}`);
        console.log(`   Total: ${movies.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

// Run the script
fixMoviePosters();
