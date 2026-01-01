/**
 * Add Movies from TMDB to Unruly Movies Database
 * Uses TMDB API for movie metadata and posters
 * 
 * Usage: node addMoviesFromTMDB.js
 * 
 * TMDB API Key: Get free at https://www.themoviedb.org/settings/api
 */

const mongoose = require('mongoose');
const https = require('https');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

// TMDB API - Get your free API key at https://www.themoviedb.org/settings/api
const TMDB_API_KEY = '6a9c11c6e0a3dabf93029529e2613845'; // Free API key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// VJ Translators available
const VJS = ['VJ Junior', 'VJ Ice P', 'VJ Emmy', 'VJ Jingo', 'VJ Mark', 'VJ Fredy', 'VJ Soul'];

// Popular movies to add (TMDB IDs)
// You can find TMDB IDs at themoviedb.org
const MOVIES_TO_ADD = [
    // Action Movies
    { tmdbId: 575264, vj: 'VJ Junior', embedUrl: '' }, // Mission: Impossible - Dead Reckoning
    { tmdbId: 667538, vj: 'VJ Ice P', embedUrl: '' },  // Transformers: Rise of the Beasts
    { tmdbId: 385687, vj: 'VJ Emmy', embedUrl: '' },   // Fast X
    { tmdbId: 298618, vj: 'VJ Junior', embedUrl: '' }, // The Flash
    { tmdbId: 447365, vj: 'VJ Ice P', embedUrl: '' },  // Guardians of the Galaxy Vol. 3
    { tmdbId: 640146, vj: 'VJ Junior', embedUrl: '' }, // Ant-Man and the Wasp: Quantumania
    { tmdbId: 502356, vj: 'VJ Emmy', embedUrl: '' },   // The Super Mario Bros. Movie
    { tmdbId: 493529, vj: 'VJ Ice P', embedUrl: '' },  // Dungeons & Dragons: Honor Among Thieves
    { tmdbId: 76600, vj: 'VJ Junior', embedUrl: '' },  // Avatar: The Way of Water
    { tmdbId: 505642, vj: 'VJ Emmy', embedUrl: '' },   // Black Panther: Wakanda Forever
    
    // Horror/Thriller
    { tmdbId: 758323, vj: 'VJ Ice P', embedUrl: '' },  // The Pope's Exorcist
    { tmdbId: 1008042, vj: 'VJ Emmy', embedUrl: '' },  // Talk to Me
    { tmdbId: 614479, vj: 'VJ Junior', embedUrl: '' }, // Insidious: The Red Door
    { tmdbId: 830784, vj: 'VJ Ice P', embedUrl: '' },  // The Boogeyman
    { tmdbId: 713704, vj: 'VJ Emmy', embedUrl: '' },   // Evil Dead Rise
    
    // Comedy
    { tmdbId: 385687, vj: 'VJ Jingo', embedUrl: '' },  // Barbie
    { tmdbId: 872585, vj: 'VJ Junior', embedUrl: '' }, // Oppenheimer
    { tmdbId: 346698, vj: 'VJ Emmy', embedUrl: '' },   // Barbie (2023)
    
    // Korean Movies (Popular with VJ Ice P)
    { tmdbId: 496243, vj: 'VJ Ice P', embedUrl: '' },  // Parasite
    { tmdbId: 626735, vj: 'VJ Ice P', embedUrl: '' },  // Dog Days (Korean)
    { tmdbId: 677179, vj: 'VJ Ice P', embedUrl: '' },  // Concrete Utopia
    
    // Indian Movies
    { tmdbId: 614934, vj: 'VJ Ice P', embedUrl: '' },  // RRR
    { tmdbId: 634649, vj: 'VJ Ice P', embedUrl: '' },  // KGF Chapter 2
    { tmdbId: 505379, vj: 'VJ Junior', embedUrl: '' }, // Jawan
    { tmdbId: 961268, vj: 'VJ Ice P', embedUrl: '' },  // Pathaan
    { tmdbId: 862552, vj: 'VJ Junior', embedUrl: '' }, // Salaar
    
    // Classic Action
    { tmdbId: 603, vj: 'VJ Emmy', embedUrl: '' },      // The Matrix
    { tmdbId: 27205, vj: 'VJ Junior', embedUrl: '' },  // Inception
    { tmdbId: 155, vj: 'VJ Ice P', embedUrl: '' },     // The Dark Knight
    { tmdbId: 24428, vj: 'VJ Junior', embedUrl: '' },  // The Avengers
    { tmdbId: 299536, vj: 'VJ Emmy', embedUrl: '' },   // Avengers: Infinity War
];

// Define Mongoose Schema
const lugandaMovieSchema = new mongoose.Schema({
    originalTitle: String,
    lugandaTitle: String,
    title: String,
    slug: String,
    overview: String,
    description: String,
    releaseDate: Date,
    year: Number,
    runtime: Number,
    duration: Number,
    genres: [String],
    poster: String,
    backdrop: String,
    originalLanguage: String,
    country: String,
    director: String,
    vjName: String,
    status: { type: String, default: 'published' },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    video: {
        embedUrl: String,
        streamtapeId: String,
        provider: String,
        quality: String,
        duration: Number,
        format: String,
        size: Number,
        originalVideoPath: String,
        lugandaVideoPath: String,
        lugandaAudioPath: String
    },
    rating: {
        imdb: Number,
        userRating: Number,
        totalRatings: Number,
        translationRating: Number,
        totalTranslationRatings: Number
    },
    cast: [{ name: String, character: String, profilePath: String }],
    tmdbId: Number,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'lugandamovies' });

const LugandaMovie = mongoose.model('LugandaMovie', lugandaMovieSchema);

// Fetch movie details from TMDB
async function fetchMovieFromTMDB(tmdbId) {
    return new Promise((resolve, reject) => {
        const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const movie = JSON.parse(data);
                    
                    if (movie.success === false) {
                        console.log(`Movie ${tmdbId} not found on TMDB`);
                        resolve(null);
                        return;
                    }
                    
                    // Get director from credits
                    const director = movie.credits?.crew?.find(c => c.job === 'Director')?.name || 'Unknown';
                    
                    // Get top cast
                    const cast = (movie.credits?.cast || []).slice(0, 10).map(c => ({
                        name: c.name,
                        character: c.character,
                        profilePath: c.profile_path ? `${TMDB_IMAGE_BASE}/w185${c.profile_path}` : null
                    }));
                    
                    resolve({
                        tmdbId: movie.id,
                        originalTitle: movie.title,
                        overview: movie.overview,
                        releaseDate: movie.release_date,
                        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
                        runtime: movie.runtime,
                        genres: (movie.genres || []).map(g => g.name.toLowerCase()),
                        poster: movie.poster_path ? `${TMDB_IMAGE_BASE}/w500${movie.poster_path}` : null,
                        backdrop: movie.backdrop_path ? `${TMDB_IMAGE_BASE}/original${movie.backdrop_path}` : null,
                        originalLanguage: movie.original_language,
                        voteAverage: movie.vote_average,
                        director,
                        cast,
                        productionCountries: movie.production_countries || []
                    });
                } catch (error) {
                    console.error(`Error parsing TMDB response for ${tmdbId}:`, error.message);
                    resolve(null);
                }
            });
        }).on('error', (error) => {
            console.error(`Error fetching TMDB movie ${tmdbId}:`, error.message);
            resolve(null);
        });
    });
}

// Create slug from title
function createSlug(title, vjName) {
    const slug = `${title}-${vjName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug;
}

// Add a movie to database
async function addMovie(tmdbId, vjName, embedUrl = '') {
    const tmdbData = await fetchMovieFromTMDB(tmdbId);
    if (!tmdbData) return null;
    
    // Check if movie already exists
    const existing = await LugandaMovie.findOne({ 
        $or: [
            { tmdbId: tmdbId },
            { originalTitle: tmdbData.originalTitle, vjName: vjName }
        ]
    });
    
    if (existing) {
        console.log(`Movie already exists: ${tmdbData.originalTitle} by ${vjName}`);
        return null;
    }
    
    const slug = createSlug(tmdbData.originalTitle, vjName);
    const country = tmdbData.productionCountries[0]?.name || 'USA';
    
    const movie = new LugandaMovie({
        originalTitle: tmdbData.originalTitle,
        lugandaTitle: `${tmdbData.originalTitle} - Luganda`,
        title: tmdbData.originalTitle,
        slug: slug,
        overview: tmdbData.overview,
        description: tmdbData.overview?.substring(0, 300) || '',
        releaseDate: tmdbData.releaseDate ? new Date(tmdbData.releaseDate) : null,
        year: tmdbData.year,
        runtime: tmdbData.runtime,
        duration: tmdbData.runtime,
        genres: tmdbData.genres,
        poster: tmdbData.poster,
        backdrop: tmdbData.backdrop,
        originalLanguage: tmdbData.originalLanguage,
        country: country,
        director: tmdbData.director,
        vjName: vjName,
        status: 'published',
        featured: Math.random() > 0.7, // 30% chance of being featured
        trending: Math.random() > 0.6, // 40% chance of being trending
        views: Math.floor(Math.random() * 10000),
        video: {
            embedUrl: embedUrl || null,
            provider: embedUrl ? 'streamtape' : 'local',
            quality: 'hd',
            duration: tmdbData.runtime,
            format: 'mp4',
            size: 0,
            originalVideoPath: embedUrl ? 'streamtape' : null
        },
        rating: {
            imdb: tmdbData.voteAverage || 0,
            userRating: (tmdbData.voteAverage || 6) + (Math.random() - 0.5),
            totalRatings: 0,
            translationRating: 0,
            totalTranslationRatings: 0
        },
        cast: tmdbData.cast,
        tmdbId: tmdbData.tmdbId
    });
    
    await movie.save();
    console.log(`✅ Added: ${tmdbData.originalTitle} by ${vjName}`);
    return movie;
}

// Main function
async function main() {
    console.log('🎬 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    console.log(`\n📥 Adding ${MOVIES_TO_ADD.length} movies from TMDB...\n`);
    
    let added = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const movieConfig of MOVIES_TO_ADD) {
        try {
            const result = await addMovie(movieConfig.tmdbId, movieConfig.vj, movieConfig.embedUrl);
            if (result) {
                added++;
            } else {
                skipped++;
            }
            // Rate limit - TMDB allows 40 requests per 10 seconds
            await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
            console.error(`❌ Failed to add movie ${movieConfig.tmdbId}:`, error.message);
            failed++;
        }
    }
    
    console.log('\n📊 Summary:');
    console.log(`   Added: ${added}`);
    console.log(`   Skipped (already exists): ${skipped}`);
    console.log(`   Failed: ${failed}`);
    
    // Show total count
    const total = await LugandaMovie.countDocuments();
    console.log(`\n📈 Total movies in database: ${total}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
}

main().catch(console.error);
