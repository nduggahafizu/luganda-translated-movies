/**
 * Add More Movies Script
 * Adds more popular movies from kpsounds.com to database
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

// More movies to add (from kpsounds.com)
const moviesToAdd = [
    // More VJ Junior Movies
    { title: "Avatar", vj: "VJ Junior", year: 2009, genres: ["action", "sci-fi"], tmdbSearch: "Avatar 2009" },
    { title: "Avatar The Way of Water", vj: "VJ Junior", year: 2022, genres: ["action", "sci-fi"], tmdbSearch: "Avatar The Way of Water" },
    { title: "Top Gun Maverick", vj: "VJ Junior", year: 2022, genres: ["action", "drama"], tmdbSearch: "Top Gun Maverick" },
    { title: "The Batman", vj: "VJ Junior", year: 2022, genres: ["action", "crime"], tmdbSearch: "The Batman 2022" },
    { title: "Black Adam", vj: "VJ Junior", year: 2022, genres: ["action", "fantasy"], tmdbSearch: "Black Adam" },
    { title: "Shazam Fury of the Gods", vj: "VJ Junior", year: 2023, genres: ["action", "comedy"], tmdbSearch: "Shazam Fury of the Gods" },
    { title: "The Flash", vj: "VJ Junior", year: 2023, genres: ["action", "adventure"], tmdbSearch: "The Flash 2023" },
    { title: "Blue Beetle", vj: "VJ Junior", year: 2023, genres: ["action", "sci-fi"], tmdbSearch: "Blue Beetle" },
    { title: "Wonka", vj: "VJ Junior", year: 2023, genres: ["adventure", "comedy"], tmdbSearch: "Wonka" },
    { title: "Dune Part Two", vj: "VJ Junior", year: 2024, genres: ["action", "sci-fi"], tmdbSearch: "Dune Part Two" },
    { title: "Godzilla x Kong", vj: "VJ Junior", year: 2024, genres: ["action", "sci-fi"], tmdbSearch: "Godzilla x Kong The New Empire" },
    { title: "Kingdom of the Planet of the Apes", vj: "VJ Junior", year: 2024, genres: ["action", "sci-fi"], tmdbSearch: "Kingdom of the Planet of the Apes" },
    { title: "Furiosa", vj: "VJ Junior", year: 2024, genres: ["action", "adventure"], tmdbSearch: "Furiosa A Mad Max Saga" },
    { title: "Twisters", vj: "VJ Junior", year: 2024, genres: ["action", "thriller"], tmdbSearch: "Twisters" },
    { title: "Deadpool and Wolverine", vj: "VJ Junior", year: 2024, genres: ["action", "comedy"], tmdbSearch: "Deadpool Wolverine" },
    
    // More VJ Ice P Movies (Indian/Korean)
    { title: "Kalki 2898 AD", vj: "VJ Ice P", year: 2024, genres: ["action", "sci-fi"], tmdbSearch: "Kalki 2898 AD" },
    { title: "Hanuman", vj: "VJ Ice P", year: 2024, genres: ["action", "fantasy"], tmdbSearch: "Hanuman 2024" },
    { title: "Bajirao Mastani", vj: "VJ Ice P", year: 2015, genres: ["action", "drama"], tmdbSearch: "Bajirao Mastani" },
    { title: "Padmaavat", vj: "VJ Ice P", year: 2018, genres: ["action", "drama"], tmdbSearch: "Padmaavat" },
    { title: "Baahubali The Beginning", vj: "VJ Ice P", year: 2015, genres: ["action", "drama"], tmdbSearch: "Baahubali The Beginning" },
    { title: "Baahubali 2 The Conclusion", vj: "VJ Ice P", year: 2017, genres: ["action", "drama"], tmdbSearch: "Baahubali 2 The Conclusion" },
    { title: "War", vj: "VJ Ice P", year: 2019, genres: ["action", "thriller"], tmdbSearch: "War 2019" },
    { title: "Parasite", vj: "VJ Ice P", year: 2019, genres: ["drama", "thriller"], tmdbSearch: "Parasite" },
    { title: "Train to Busan", vj: "VJ Ice P", year: 2016, genres: ["action", "horror"], tmdbSearch: "Train to Busan" },
    { title: "Oldboy", vj: "VJ Ice P", year: 2003, genres: ["action", "drama"], tmdbSearch: "Oldboy 2003" },
    { title: "The Raid", vj: "VJ Ice P", year: 2011, genres: ["action", "thriller"], tmdbSearch: "The Raid Redemption" },
    { title: "The Raid 2", vj: "VJ Ice P", year: 2014, genres: ["action", "thriller"], tmdbSearch: "The Raid 2" },
    { title: "Ip Man", vj: "VJ Ice P", year: 2008, genres: ["action", "biography"], tmdbSearch: "Ip Man" },
    { title: "Ip Man 2", vj: "VJ Ice P", year: 2010, genres: ["action", "biography"], tmdbSearch: "Ip Man 2" },
    { title: "Ip Man 3", vj: "VJ Ice P", year: 2015, genres: ["action", "biography"], tmdbSearch: "Ip Man 3" },
    { title: "Ip Man 4", vj: "VJ Ice P", year: 2019, genres: ["action", "biography"], tmdbSearch: "Ip Man 4 The Finale" },
    
    // More VJ Emmy Movies (Classics)
    { title: "Die Hard", vj: "VJ Emmy", year: 1988, genres: ["action", "thriller"], tmdbSearch: "Die Hard" },
    { title: "Die Hard 2", vj: "VJ Emmy", year: 1990, genres: ["action", "thriller"], tmdbSearch: "Die Hard 2" },
    { title: "Die Hard 3", vj: "VJ Emmy", year: 1995, genres: ["action", "thriller"], tmdbSearch: "Die Hard With a Vengeance" },
    { title: "Lethal Weapon", vj: "VJ Emmy", year: 1987, genres: ["action", "comedy"], tmdbSearch: "Lethal Weapon" },
    { title: "Lethal Weapon 2", vj: "VJ Emmy", year: 1989, genres: ["action", "comedy"], tmdbSearch: "Lethal Weapon 2" },
    { title: "Lethal Weapon 3", vj: "VJ Emmy", year: 1992, genres: ["action", "comedy"], tmdbSearch: "Lethal Weapon 3" },
    { title: "Beverly Hills Cop", vj: "VJ Emmy", year: 1984, genres: ["action", "comedy"], tmdbSearch: "Beverly Hills Cop" },
    { title: "Beverly Hills Cop 2", vj: "VJ Emmy", year: 1987, genres: ["action", "comedy"], tmdbSearch: "Beverly Hills Cop 2" },
    { title: "Bad Boys", vj: "VJ Emmy", year: 1995, genres: ["action", "comedy"], tmdbSearch: "Bad Boys 1995" },
    { title: "Bad Boys 2", vj: "VJ Emmy", year: 2003, genres: ["action", "comedy"], tmdbSearch: "Bad Boys II" },
    { title: "Bad Boys for Life", vj: "VJ Emmy", year: 2020, genres: ["action", "comedy"], tmdbSearch: "Bad Boys for Life" },
    { title: "Bad Boys Ride or Die", vj: "VJ Emmy", year: 2024, genres: ["action", "comedy"], tmdbSearch: "Bad Boys Ride or Die" },
    { title: "Coming to America", vj: "VJ Emmy", year: 1988, genres: ["comedy", "romance"], tmdbSearch: "Coming to America" },
    { title: "Coming 2 America", vj: "VJ Emmy", year: 2021, genres: ["comedy"], tmdbSearch: "Coming 2 America" },
    
    // More VJ Jingo Movies
    { title: "Nobody", vj: "VJ Jingo", year: 2021, genres: ["action", "thriller"], tmdbSearch: "Nobody 2021" },
    { title: "Bullet Train", vj: "VJ Jingo", year: 2022, genres: ["action", "comedy"], tmdbSearch: "Bullet Train" },
    { title: "The Gray Man", vj: "VJ Jingo", year: 2022, genres: ["action", "thriller"], tmdbSearch: "The Gray Man" },
    { title: "Shooter", vj: "VJ Jingo", year: 2007, genres: ["action", "thriller"], tmdbSearch: "Shooter 2007" },
    { title: "Safe House", vj: "VJ Jingo", year: 2012, genres: ["action", "thriller"], tmdbSearch: "Safe House" },
    { title: "The Bourne Identity", vj: "VJ Jingo", year: 2002, genres: ["action", "thriller"], tmdbSearch: "The Bourne Identity" },
    { title: "The Bourne Supremacy", vj: "VJ Jingo", year: 2004, genres: ["action", "thriller"], tmdbSearch: "The Bourne Supremacy" },
    { title: "The Bourne Ultimatum", vj: "VJ Jingo", year: 2007, genres: ["action", "thriller"], tmdbSearch: "The Bourne Ultimatum" },
    { title: "Jason Bourne", vj: "VJ Jingo", year: 2016, genres: ["action", "thriller"], tmdbSearch: "Jason Bourne" },
    { title: "Taken", vj: "VJ Jingo", year: 2008, genres: ["action", "thriller"], tmdbSearch: "Taken" },
    { title: "Taken 2", vj: "VJ Jingo", year: 2012, genres: ["action", "thriller"], tmdbSearch: "Taken 2" },
    { title: "Taken 3", vj: "VJ Jingo", year: 2014, genres: ["action", "thriller"], tmdbSearch: "Taken 3" },
    
    // More VJ Mark Movies (Sci-Fi/Mind-benders)
    { title: "Tenet", vj: "VJ Mark", year: 2020, genres: ["action", "sci-fi"], tmdbSearch: "Tenet" },
    { title: "Arrival", vj: "VJ Mark", year: 2016, genres: ["drama", "sci-fi"], tmdbSearch: "Arrival" },
    { title: "Blade Runner 2049", vj: "VJ Mark", year: 2017, genres: ["action", "sci-fi"], tmdbSearch: "Blade Runner 2049" },
    { title: "Ex Machina", vj: "VJ Mark", year: 2014, genres: ["drama", "sci-fi"], tmdbSearch: "Ex Machina" },
    { title: "Gravity", vj: "VJ Mark", year: 2013, genres: ["drama", "sci-fi"], tmdbSearch: "Gravity" },
    { title: "The Martian", vj: "VJ Mark", year: 2015, genres: ["adventure", "sci-fi"], tmdbSearch: "The Martian" },
    { title: "Edge of Tomorrow", vj: "VJ Mark", year: 2014, genres: ["action", "sci-fi"], tmdbSearch: "Edge of Tomorrow" },
    { title: "Looper", vj: "VJ Mark", year: 2012, genres: ["action", "sci-fi"], tmdbSearch: "Looper" },
    { title: "Oblivion", vj: "VJ Mark", year: 2013, genres: ["action", "sci-fi"], tmdbSearch: "Oblivion" },
    { title: "Elysium", vj: "VJ Mark", year: 2013, genres: ["action", "sci-fi"], tmdbSearch: "Elysium" },
    
    // Horror Movies (Various VJs)
    { title: "A Quiet Place", vj: "VJ Junior", year: 2018, genres: ["horror", "drama"], tmdbSearch: "A Quiet Place" },
    { title: "A Quiet Place Part 2", vj: "VJ Junior", year: 2020, genres: ["horror", "drama"], tmdbSearch: "A Quiet Place Part II" },
    { title: "A Quiet Place Day One", vj: "VJ Junior", year: 2024, genres: ["horror", "drama"], tmdbSearch: "A Quiet Place Day One" },
    { title: "The Conjuring", vj: "VJ Emmy", year: 2013, genres: ["horror", "thriller"], tmdbSearch: "The Conjuring" },
    { title: "The Conjuring 2", vj: "VJ Emmy", year: 2016, genres: ["horror", "thriller"], tmdbSearch: "The Conjuring 2" },
    { title: "Annabelle", vj: "VJ Emmy", year: 2014, genres: ["horror", "thriller"], tmdbSearch: "Annabelle" },
    { title: "It", vj: "VJ Jingo", year: 2017, genres: ["horror"], tmdbSearch: "It 2017" },
    { title: "It Chapter Two", vj: "VJ Jingo", year: 2019, genres: ["horror"], tmdbSearch: "It Chapter Two" },
    { title: "The Nun", vj: "VJ Emmy", year: 2018, genres: ["horror", "thriller"], tmdbSearch: "The Nun" },
    { title: "The Nun II", vj: "VJ Emmy", year: 2023, genres: ["horror", "thriller"], tmdbSearch: "The Nun II" },
    
    // Comedy Movies
    { title: "Central Intelligence", vj: "VJ Emmy", year: 2016, genres: ["action", "comedy"], tmdbSearch: "Central Intelligence" },
    { title: "Jumanji Welcome to the Jungle", vj: "VJ Emmy", year: 2017, genres: ["action", "comedy"], tmdbSearch: "Jumanji Welcome to the Jungle" },
    { title: "Jumanji The Next Level", vj: "VJ Emmy", year: 2019, genres: ["action", "comedy"], tmdbSearch: "Jumanji The Next Level" },
    { title: "San Andreas", vj: "VJ Emmy", year: 2015, genres: ["action", "thriller"], tmdbSearch: "San Andreas" },
    { title: "Rampage", vj: "VJ Emmy", year: 2018, genres: ["action", "adventure"], tmdbSearch: "Rampage 2018" },
    { title: "Skyscraper", vj: "VJ Emmy", year: 2018, genres: ["action", "thriller"], tmdbSearch: "Skyscraper" },
    { title: "The Meg", vj: "VJ Emmy", year: 2018, genres: ["action", "horror"], tmdbSearch: "The Meg" },
    { title: "Red Notice", vj: "VJ Jingo", year: 2021, genres: ["action", "comedy"], tmdbSearch: "Red Notice" },
    { title: "Free Guy", vj: "VJ Junior", year: 2021, genres: ["action", "comedy"], tmdbSearch: "Free Guy" },
    { title: "The Adam Project", vj: "VJ Junior", year: 2022, genres: ["action", "sci-fi"], tmdbSearch: "The Adam Project" }
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
