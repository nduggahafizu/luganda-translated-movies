/**
 * Add a movie with Streamtape embed
 * Usage: node addStreamtapeMovie.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');

// MongoDB connection - Use production URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// LugandaMovie Schema (inline to avoid model conflicts)
const lugandaMovieSchema = new mongoose.Schema({
    tmdbId: { type: Number, unique: true, sparse: true },
    title: { type: String, required: true },
    originalTitle: String,
    overview: String,
    releaseDate: Date,
    runtime: Number,
    genres: [{ id: Number, name: String }],
    poster: String,
    backdrop: String,
    rating: Number,
    voteCount: Number,
    popularity: Number,
    originalLanguage: String,
    productionCountries: [{ iso_3166_1: String, name: String }],
    cast: [{
        id: Number,
        name: String,
        character: String,
        profilePath: String
    }],
    crew: [{
        id: Number,
        name: String,
        job: String,
        department: String,
        profilePath: String
    }],
    trailer: String,
    video: {
        originalVideoPath: String,
        lugandaVideoPath: String,
        lugandaAudioPath: String,
        embedUrl: String,
        streamtapeId: String,
        provider: { type: String, enum: ['local', 'streamtape', 'doodstream', 'filemoon', 'other'], default: 'local' },
        quality: { type: String, enum: ['sd', 'hd', 'fhd', '4k'], default: 'hd' },
        size: Number,
        duration: Number,
        format: String
    },
    lugandaTranslation: {
        title: String,
        overview: String,
        audioTrack: String,
        subtitleTrack: String,
        translatedBy: String,
        translationDate: Date
    },
    status: { type: String, enum: ['draft', 'processing', 'ready', 'published'], default: 'published' },
    viewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    categories: [String],
    tags: [String],
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const LugandaMovie = mongoose.model('LugandaMovie', lugandaMovieSchema);

/**
 * Search TMDB for a movie
 */
async function searchTMDB(query) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: query,
                language: 'en-US',
                page: 1
            }
        });
        return response.data.results;
    } catch (error) {
        console.error('TMDB search error:', error.message);
        return [];
    }
}

/**
 * Get full movie details from TMDB
 */
async function getMovieDetails(tmdbId) {
    try {
        const [movieRes, creditsRes, videosRes] = await Promise.all([
            axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
                params: { api_key: TMDB_API_KEY, language: 'en-US' }
            }),
            axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
                params: { api_key: TMDB_API_KEY }
            }),
            axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
                params: { api_key: TMDB_API_KEY }
            })
        ]);

        const movie = movieRes.data;
        const credits = creditsRes.data;
        const videos = videosRes.data;

        // Find trailer
        const trailer = videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');

        return {
            tmdbId: movie.id,
            title: movie.title,
            originalTitle: movie.original_title,
            overview: movie.overview,
            releaseDate: movie.release_date,
            runtime: movie.runtime,
            genres: movie.genres,
            poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
            backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
            rating: movie.vote_average,
            voteCount: movie.vote_count,
            popularity: movie.popularity,
            originalLanguage: movie.original_language,
            productionCountries: movie.production_countries,
            cast: credits.cast.slice(0, 15).map(c => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
            })),
            crew: credits.crew.filter(c => ['Director', 'Writer', 'Producer'].includes(c.job)).map(c => ({
                id: c.id,
                name: c.name,
                job: c.job,
                department: c.department,
                profilePath: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null
            })),
            trailer: trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null
        };
    } catch (error) {
        console.error('Error fetching movie details:', error.message);
        return null;
    }
}

/**
 * Add a movie with Streamtape embed
 */
async function addStreamtapeMovie(movieName, streamtapeId, options = {}) {
    console.log(`\n🎬 Adding movie: ${movieName}`);
    console.log(`📹 Streamtape ID: ${streamtapeId}`);

    // Search TMDB for the movie
    console.log('🔍 Searching TMDB...');
    const results = await searchTMDB(movieName);
    
    if (results.length === 0) {
        console.log('❌ Movie not found on TMDB');
        return null;
    }

    // Use the first result or the one specified
    const tmdbMovie = results[options.tmdbIndex || 0];
    console.log(`✅ Found: ${tmdbMovie.title} (${tmdbMovie.release_date?.substring(0, 4) || 'N/A'})`);

    // Get full details
    console.log('📥 Fetching full details...');
    const movieDetails = await getMovieDetails(tmdbMovie.id);
    
    if (!movieDetails) {
        console.log('❌ Failed to get movie details');
        return null;
    }

    // Check if already exists
    const existing = await LugandaMovie.findOne({ tmdbId: movieDetails.tmdbId });
    if (existing) {
        console.log('⚠️ Movie already exists in database');
        // Update with Streamtape embed
        existing.video.embedUrl = `https://streamtape.com/e/${streamtapeId}/`;
        existing.video.streamtapeId = streamtapeId;
        existing.video.provider = 'streamtape';
        existing.status = 'published';
        await existing.save();
        console.log('✅ Updated existing movie with Streamtape embed');
        return existing;
    }

    // Create new movie
    const newMovie = new LugandaMovie({
        ...movieDetails,
        video: {
            originalVideoPath: 'streamtape',
            lugandaVideoPath: null,
            lugandaAudioPath: null,
            embedUrl: `https://streamtape.com/e/${streamtapeId}/`,
            streamtapeId: streamtapeId,
            provider: 'streamtape',
            quality: options.quality || 'hd',
            size: 0,
            duration: movieDetails.runtime || 120,
            format: 'mp4'
        },
        lugandaTranslation: {
            title: options.lugandaTitle || null,
            overview: options.lugandaOverview || null,
            translatedBy: options.translatedBy || 'Unruly Movies',
            translationDate: new Date()
        },
        status: 'published',
        featured: options.featured || false,
        categories: options.categories || ['Action'],
        tags: options.tags || ['streamtape', 'luganda-translated']
    });

    await newMovie.save();
    console.log('✅ Movie added successfully!');
    console.log(`🆔 Movie ID: ${newMovie._id}`);
    console.log(`🎞️ Title: ${newMovie.title}`);
    console.log(`📅 Year: ${new Date(newMovie.releaseDate).getFullYear()}`);
    console.log(`📹 Embed URL: ${newMovie.video.embedUrl}`);

    return newMovie;
}

/**
 * Add a movie manually without TMDB (when API key not available)
 */
async function addMovieManually(movieData) {
    console.log(`\n🎬 Adding movie manually: ${movieData.title}`);

    // Check if already exists
    const existing = await LugandaMovie.findOne({ 
        $or: [
            { title: movieData.title },
            { tmdbId: movieData.tmdbId }
        ]
    });
    
    if (existing) {
        console.log('⚠️ Movie already exists in database');
        // Update with new embed info
        if (movieData.video) {
            existing.video = { ...existing.video, ...movieData.video };
        }
        existing.status = 'published';
        await existing.save();
        console.log('✅ Updated existing movie');
        return existing;
    }

    const newMovie = new LugandaMovie({
        ...movieData,
        status: 'published',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    await newMovie.save();
    console.log('✅ Movie added successfully!');
    console.log(`🆔 Movie ID: ${newMovie._id}`);
    console.log(`🎞️ Title: ${newMovie.title}`);
    console.log(`📹 Embed URL: ${newMovie.video?.embedUrl || 'N/A'}`);

    return newMovie;
}

// Main execution
async function main() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Try with TMDB first, fallback to manual
        if (TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here') {
            await addStreamtapeMovie('Song of the Assassins', '8J1MmpAjBGtlb8', {
                quality: 'hd',
                categories: ['Action', 'Martial Arts'],
                tags: ['streamtape', 'luganda-translated', 'chinese', 'action'],
                featured: true
            });
        } else {
            console.log('ℹ️ TMDB API key not configured, adding movie manually...');
            
            // Add "Song of the Assassins" (2022 Chinese martial arts film)
            await addMovieManually({
                tmdbId: 955916,
                title: 'Song of the Assassins',
                originalTitle: '刺杀小说家',
                overview: 'In the Ming Dynasty, a skilled female assassin is sent on a dangerous mission to infiltrate the imperial palace. As she gets closer to her target, she discovers a conspiracy that threatens the entire kingdom. Caught between duty and conscience, she must make a choice that will determine her fate.',
                releaseDate: new Date('2022-02-12'),
                runtime: 130,
                genres: [
                    { id: 28, name: 'Action' },
                    { id: 12, name: 'Adventure' },
                    { id: 14, name: 'Fantasy' }
                ],
                poster: 'https://image.tmdb.org/t/p/w500/wLkZyXB3jNA1Y4jC7cZVAg0SFxN.jpg',
                backdrop: 'https://image.tmdb.org/t/p/original/8vLuqnVFN8ewzNkuQBDDgFCEJR7.jpg',
                rating: 7.2,
                voteCount: 450,
                popularity: 85.5,
                originalLanguage: 'zh',
                productionCountries: [{ iso_3166_1: 'CN', name: 'China' }],
                cast: [
                    { id: 1, name: 'Lei Jiayin', character: 'Protagonist', profilePath: null },
                    { id: 2, name: 'Yang Mi', character: 'Female Lead', profilePath: null }
                ],
                crew: [
                    { id: 3, name: 'Lu Yang', job: 'Director', department: 'Directing', profilePath: null }
                ],
                trailer: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                video: {
                    originalVideoPath: 'streamtape',
                    lugandaVideoPath: null,
                    lugandaAudioPath: null,
                    embedUrl: 'https://streamtape.com/e/8J1MmpAjBGtlb8/',
                    streamtapeId: '8J1MmpAjBGtlb8',
                    provider: 'streamtape',
                    quality: 'hd',
                    size: 0,
                    duration: 130,
                    format: 'mp4'
                },
                lugandaTranslation: {
                    title: 'Oluyimba lw\'Abassi',
                    overview: null,
                    translatedBy: 'Unruly Movies',
                    translationDate: new Date()
                },
                featured: true,
                categories: ['Action', 'Martial Arts', 'Chinese'],
                tags: ['streamtape', 'luganda-translated', 'chinese', 'action', 'martial-arts', 'assassin']
            });
        }

        console.log('\n✨ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { addStreamtapeMovie };
