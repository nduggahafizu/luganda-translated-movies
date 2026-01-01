/**
 * Bulk Add Movies Script
 * Adds popular movies from kpsounds.com to our database
 * Uses TMDB API for posters and metadata
 */

const mongoose = require('mongoose');

// TMDB API Key (free tier)
const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// MongoDB Connection
const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

// Movie schema (simplified for bulk insert)
const movieSchema = new mongoose.Schema({
    originalTitle: String,
    lugandaTitle: String,
    title: String,
    slug: { type: String, unique: true },
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
    rating: {
        imdb: Number,
        userRating: Number,
        totalRatings: { type: Number, default: 0 },
        translationRating: { type: Number, default: 0 },
        totalTranslationRatings: { type: Number, default: 0 }
    },
    video: {
        embedUrl: String,
        streamtapeId: String,
        provider: { type: String, default: 'local' },
        quality: { type: String, default: 'hd' },
        duration: Number,
        format: { type: String, default: 'mp4' }
    },
    requiredPlan: { type: String, default: 'free' },
    ageRating: { type: String, default: 'PG-13' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { collection: 'lugandamovies' });

const Movie = mongoose.model('Movie', movieSchema);

// Movies to add (from kpsounds.com with TMDB search terms)
const moviesToAdd = [
    // VJ Junior Movies
    { title: "Now You See Me 3", vj: "VJ Junior", year: 2025, genres: ["action", "thriller"], tmdbSearch: "Now You See Me" },
    { title: "Office Christmas Party", vj: "VJ Junior", year: 2016, genres: ["comedy"], tmdbSearch: "Office Christmas Party" },
    { title: "The Thomas Crown Affair", vj: "VJ Junior", year: 1999, genres: ["drama", "romance"], tmdbSearch: "Thomas Crown Affair 1999" },
    { title: "The Hitcher", vj: "VJ Junior", year: 2007, genres: ["horror", "thriller"], tmdbSearch: "The Hitcher 2007" },
    { title: "Ricochet", vj: "VJ Junior", year: 1991, genres: ["action", "thriller"], tmdbSearch: "Ricochet 1991" },
    { title: "Margaux", vj: "VJ Junior", year: 2022, genres: ["horror", "sci-fi"], tmdbSearch: "Margaux 2022" },
    { title: "A Jazzman's Blues", vj: "VJ Junior", year: 2022, genres: ["drama", "music"], tmdbSearch: "A Jazzman's Blues" },
    { title: "Lamb Game", vj: "VJ Junior", year: 2024, genres: ["crime", "thriller"], tmdbSearch: "Lamb Game" },
    { title: "John Wick", vj: "VJ Junior", year: 2014, genres: ["action", "thriller"], tmdbSearch: "John Wick" },
    { title: "John Wick 2", vj: "VJ Junior", year: 2017, genres: ["action", "thriller"], tmdbSearch: "John Wick Chapter 2" },
    { title: "John Wick 3", vj: "VJ Junior", year: 2019, genres: ["action", "thriller"], tmdbSearch: "John Wick Chapter 3" },
    { title: "John Wick 4", vj: "VJ Junior", year: 2023, genres: ["action", "thriller"], tmdbSearch: "John Wick Chapter 4" },
    { title: "Fast X", vj: "VJ Junior", year: 2023, genres: ["action"], tmdbSearch: "Fast X" },
    { title: "The Equalizer 3", vj: "VJ Junior", year: 2023, genres: ["action", "thriller"], tmdbSearch: "The Equalizer 3" },
    { title: "Extraction 2", vj: "VJ Junior", year: 2023, genres: ["action"], tmdbSearch: "Extraction 2" },
    { title: "Oppenheimer", vj: "VJ Junior", year: 2023, genres: ["drama", "history"], tmdbSearch: "Oppenheimer" },
    { title: "Mission Impossible Dead Reckoning", vj: "VJ Junior", year: 2023, genres: ["action"], tmdbSearch: "Mission Impossible Dead Reckoning" },
    { title: "The Meg 2", vj: "VJ Junior", year: 2023, genres: ["action", "horror"], tmdbSearch: "Meg 2 The Trench" },
    { title: "Aquaman 2", vj: "VJ Junior", year: 2023, genres: ["action", "adventure"], tmdbSearch: "Aquaman and the Lost Kingdom" },
    { title: "Barbie", vj: "VJ Junior", year: 2023, genres: ["comedy", "fantasy"], tmdbSearch: "Barbie 2023" },
    
    // VJ Ice P Movies
    { title: "Hunting Jessica Brok", vj: "VJ Ice P", year: 2025, genres: ["action", "thriller"], tmdbSearch: "Hunting" },
    { title: "Desert Lone Hero", vj: "VJ Ice P", year: 2025, genres: ["action", "western"], tmdbSearch: "Desert" },
    { title: "Madharaasi Part 2", vj: "VJ Ice P", year: 2025, genres: ["action", "drama"], tmdbSearch: "Madras" },
    { title: "KGF Chapter 1", vj: "VJ Ice P", year: 2018, genres: ["action", "drama"], tmdbSearch: "KGF Chapter 1" },
    { title: "KGF Chapter 2", vj: "VJ Ice P", year: 2022, genres: ["action", "drama"], tmdbSearch: "KGF Chapter 2" },
    { title: "RRR", vj: "VJ Ice P", year: 2022, genres: ["action", "drama"], tmdbSearch: "RRR" },
    { title: "Pushpa The Rise", vj: "VJ Ice P", year: 2021, genres: ["action", "thriller"], tmdbSearch: "Pushpa The Rise" },
    { title: "Pushpa 2 The Rule", vj: "VJ Ice P", year: 2024, genres: ["action", "thriller"], tmdbSearch: "Pushpa 2" },
    { title: "Salaar", vj: "VJ Ice P", year: 2023, genres: ["action", "thriller"], tmdbSearch: "Salaar" },
    { title: "Animal", vj: "VJ Ice P", year: 2023, genres: ["action", "crime"], tmdbSearch: "Animal 2023" },
    { title: "Jawan", vj: "VJ Ice P", year: 2023, genres: ["action", "thriller"], tmdbSearch: "Jawan" },
    { title: "Pathaan", vj: "VJ Ice P", year: 2023, genres: ["action", "thriller"], tmdbSearch: "Pathaan" },
    { title: "Tiger 3", vj: "VJ Ice P", year: 2023, genres: ["action", "thriller"], tmdbSearch: "Tiger 3" },
    { title: "Dunki", vj: "VJ Ice P", year: 2023, genres: ["comedy", "drama"], tmdbSearch: "Dunki" },
    { title: "Fighter", vj: "VJ Ice P", year: 2024, genres: ["action"], tmdbSearch: "Fighter 2024" },
    
    // VJ Emmy Movies  
    { title: "Tommy Boy", vj: "VJ Emmy", year: 1995, genres: ["comedy"], tmdbSearch: "Tommy Boy" },
    { title: "Commando", vj: "VJ Emmy", year: 1985, genres: ["action"], tmdbSearch: "Commando 1985" },
    { title: "Predator", vj: "VJ Emmy", year: 1987, genres: ["action", "sci-fi"], tmdbSearch: "Predator 1987" },
    { title: "Predator 2", vj: "VJ Emmy", year: 1990, genres: ["action", "sci-fi"], tmdbSearch: "Predator 2" },
    { title: "Total Recall", vj: "VJ Emmy", year: 1990, genres: ["action", "sci-fi"], tmdbSearch: "Total Recall 1990" },
    { title: "Terminator", vj: "VJ Emmy", year: 1984, genres: ["action", "sci-fi"], tmdbSearch: "Terminator 1984" },
    { title: "Terminator 2", vj: "VJ Emmy", year: 1991, genres: ["action", "sci-fi"], tmdbSearch: "Terminator 2 Judgment Day" },
    { title: "Rambo First Blood", vj: "VJ Emmy", year: 1982, genres: ["action", "thriller"], tmdbSearch: "First Blood" },
    { title: "Rambo 2", vj: "VJ Emmy", year: 1985, genres: ["action"], tmdbSearch: "Rambo First Blood Part II" },
    { title: "Rocky", vj: "VJ Emmy", year: 1976, genres: ["drama", "sport"], tmdbSearch: "Rocky 1976" },
    { title: "Rocky 2", vj: "VJ Emmy", year: 1979, genres: ["drama", "sport"], tmdbSearch: "Rocky II" },
    { title: "Rocky 3", vj: "VJ Emmy", year: 1982, genres: ["drama", "sport"], tmdbSearch: "Rocky III" },
    { title: "Rocky 4", vj: "VJ Emmy", year: 1985, genres: ["drama", "sport"], tmdbSearch: "Rocky IV" },
    { title: "Bloodsport", vj: "VJ Emmy", year: 1988, genres: ["action"], tmdbSearch: "Bloodsport" },
    { title: "Kickboxer", vj: "VJ Emmy", year: 1989, genres: ["action"], tmdbSearch: "Kickboxer 1989" },
    
    // VJ Jingo Movies
    { title: "The Expendables", vj: "VJ Jingo", year: 2010, genres: ["action"], tmdbSearch: "The Expendables" },
    { title: "The Expendables 2", vj: "VJ Jingo", year: 2012, genres: ["action"], tmdbSearch: "The Expendables 2" },
    { title: "The Expendables 3", vj: "VJ Jingo", year: 2014, genres: ["action"], tmdbSearch: "The Expendables 3" },
    { title: "The Expendables 4", vj: "VJ Jingo", year: 2023, genres: ["action"], tmdbSearch: "Expend4bles" },
    { title: "Red", vj: "VJ Jingo", year: 2010, genres: ["action", "comedy"], tmdbSearch: "Red 2010" },
    { title: "Red 2", vj: "VJ Jingo", year: 2013, genres: ["action", "comedy"], tmdbSearch: "Red 2" },
    
    // VJ Mark Movies
    { title: "The Matrix", vj: "VJ Mark", year: 1999, genres: ["action", "sci-fi"], tmdbSearch: "The Matrix" },
    { title: "The Matrix Reloaded", vj: "VJ Mark", year: 2003, genres: ["action", "sci-fi"], tmdbSearch: "The Matrix Reloaded" },
    { title: "The Matrix Resurrections", vj: "VJ Mark", year: 2021, genres: ["action", "sci-fi"], tmdbSearch: "The Matrix Resurrections" },
    { title: "Inception", vj: "VJ Mark", year: 2010, genres: ["action", "sci-fi"], tmdbSearch: "Inception" },
    { title: "Interstellar", vj: "VJ Mark", year: 2014, genres: ["sci-fi", "drama"], tmdbSearch: "Interstellar" },
    { title: "The Dark Knight", vj: "VJ Mark", year: 2008, genres: ["action", "crime"], tmdbSearch: "The Dark Knight" },
    
    // VJ Litle T Movies
    { title: "Spider-Man No Way Home", vj: "VJ Litle T", year: 2021, genres: ["action", "adventure"], tmdbSearch: "Spider-Man No Way Home" },
    { title: "Black Panther Wakanda Forever", vj: "VJ Litle T", year: 2022, genres: ["action", "adventure"], tmdbSearch: "Black Panther Wakanda Forever" },
    { title: "Thor Love and Thunder", vj: "VJ Litle T", year: 2022, genres: ["action", "comedy"], tmdbSearch: "Thor Love and Thunder" },
    { title: "Doctor Strange Multiverse", vj: "VJ Litle T", year: 2022, genres: ["action", "fantasy"], tmdbSearch: "Doctor Strange Multiverse of Madness" },
    { title: "Guardians of the Galaxy 3", vj: "VJ Litle T", year: 2023, genres: ["action", "comedy"], tmdbSearch: "Guardians of the Galaxy Vol 3" },
    { title: "Ant-Man Quantumania", vj: "VJ Litle T", year: 2023, genres: ["action", "adventure"], tmdbSearch: "Ant-Man and the Wasp Quantumania" }
];

async function fetchTMDBData(searchQuery) {
    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&include_adult=false`
        );
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const movie = data.results[0];
            return {
                tmdbId: movie.id,
                overview: movie.overview,
                poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
                backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
                releaseDate: movie.release_date,
                rating: movie.vote_average,
                originalLanguage: movie.original_language
            };
        }
        return null;
    } catch (error) {
        console.log(`TMDB fetch failed for ${searchQuery}:`, error.message);
        return null;
    }
}

function createSlug(title, vj) {
    return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${vj.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

async function addMovies() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');
    
    let added = 0;
    let skipped = 0;
    let failed = 0;
    
    for (const movie of moviesToAdd) {
        try {
            const slug = createSlug(movie.title, movie.vj);
            
            // Check if already exists
            const exists = await Movie.findOne({ slug });
            if (exists) {
                console.log(`SKIP: ${movie.title} by ${movie.vj} already exists`);
                skipped++;
                continue;
            }
            
            // Fetch TMDB data
            console.log(`Fetching TMDB data for: ${movie.title}...`);
            const tmdbData = await fetchTMDBData(movie.tmdbSearch);
            
            const movieDoc = new Movie({
                originalTitle: movie.title,
                lugandaTitle: `${movie.title} - Luganda`,
                title: movie.title,
                slug: slug,
                overview: tmdbData?.overview || `${movie.title} translated to Luganda by ${movie.vj}`,
                description: tmdbData?.overview?.substring(0, 200) || `Watch ${movie.title} in Luganda translation.`,
                releaseDate: tmdbData?.releaseDate ? new Date(tmdbData.releaseDate) : null,
                year: movie.year,
                runtime: 120,
                duration: 120,
                genres: movie.genres,
                poster: tmdbData?.poster || `https://placehold.co/500x750/1a1a2e/7CFC00?text=${encodeURIComponent(movie.title)}`,
                backdrop: tmdbData?.backdrop,
                originalLanguage: tmdbData?.originalLanguage || 'en',
                country: 'USA',
                director: 'Various',
                vjName: movie.vj,
                status: 'published',
                featured: Math.random() > 0.8,
                trending: Math.random() > 0.7,
                views: Math.floor(Math.random() * 10000),
                rating: {
                    imdb: tmdbData?.rating || (5 + Math.random() * 4),
                    userRating: 5 + Math.random() * 4,
                    totalRatings: 0,
                    translationRating: 0,
                    totalTranslationRatings: 0
                },
                video: {
                    provider: 'local',
                    quality: 'hd',
                    format: 'mp4'
                },
                requiredPlan: Math.random() > 0.7 ? 'premium' : 'free',
                ageRating: 'PG-13'
            });
            
            await movieDoc.save();
            console.log(`ADDED: ${movie.title} by ${movie.vj}`);
            added++;
            
            // Small delay to avoid rate limiting
            await new Promise(r => setTimeout(r, 300));
            
        } catch (error) {
            console.error(`FAILED: ${movie.title} - ${error.message}`);
            failed++;
        }
    }
    
    console.log('\n=== SUMMARY ===');
    console.log(`Added: ${added}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${moviesToAdd.length}`);
    
    await mongoose.connection.close();
    console.log('Done!');
}

addMovies().catch(console.error);
