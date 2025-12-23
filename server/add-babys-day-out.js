#!/usr/bin/env node

/**
 * Add Baby's Day Out (VJ Jingo) to Luganda Movies Database
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/unruly-movies';

// Movie data for Baby's Day Out
const babysDayOutData = {
    originalTitle: "Baby's Day Out",
    lugandaTitle: "Baby's Day Out (Luganda)",
    vjName: "VJ Jingo",
    vjId: "vj-jingo",
    
    description: "Three bumbling criminals kidnap a baby for ransom, but the clever infant escapes and embarks on an adventurous day exploring the city. The baby's innocent journey through Chicago becomes a hilarious chase as the incompetent kidnappers try to recapture him, encountering one mishap after another.",
    
    lugandaDescription: "Abazzi basatu abatalina magezi bakwata omwana omuto nga bamwetaaga ensimbi. Naye omwana omugezi adduka n'atambula mu kibuga nga yeeyagalira. Olugendo lw'omwana mu Chicago lufuuka okugoba okw'amasanyalaze nga abazzi bagezaako okumukwata nate, nga basanga emitawaana.",
    
    year: 1994,
    duration: 99,
    
    rating: {
        imdb: 6.2,
        userRating: 7.5,
        totalRatings: 0,
        translationRating: 4.7,
        totalTranslationRatings: 0
    },
    
    genres: ['comedy', 'family', 'adventure'],
    
    cast: [
        {
            name: "Joe Mantegna",
            character: "Eddie",
            image: ""
        },
        {
            name: "Lara Flynn Boyle",
            character: "Laraine Cotwell",
            image: ""
        },
        {
            name: "Joe Pantoliano",
            character: "Norby",
            image: ""
        },
        {
            name: "Brian Haley",
            character: "Veeko",
            image: ""
        }
    ],
    
    director: "Patrick Read Johnson",
    writers: ["John Hughes"],
    
    originalLanguage: "English",
    availableLanguages: ["English", "Luganda"],
    country: "USA",
    
    poster: "https://image.tmdb.org/t/p/w500/uKQB3HjGLGKyYqxwGlz5l8p5Yvz.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/aQs8OT4JqGJhH9JyJWkSZbqJqQh.jpg",
    trailer: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    
    video: {
        originalVideoPath: "/videos/luganda/babys-day-out-original.mp4",
        lugandaVideoPath: "/videos/luganda/babys-day-out-luganda.mp4",
        lugandaAudioPath: "/videos/luganda/babys-day-out-luganda-audio.mp3",
        quality: "hd",
        size: 1024,
        duration: 99,
        format: "mp4"
    },
    
    subtitles: [
        {
            language: "English",
            url: "/subtitles/babys-day-out-en.srt",
            format: "srt"
        },
        {
            language: "Luganda",
            url: "/subtitles/babys-day-out-lg.srt",
            format: "srt"
        }
    ],
    
    requiredPlan: "free",
    status: "published",
    featured: true,
    trending: true,
    
    views: 0,
    likes: 0,
    downloads: 0,
    
    tags: ["comedy", "family", "baby", "adventure", "chicago", "kidnapping", "funny", "classic"],
    ageRating: "PG",
    
    translationDate: new Date(),
    translationNotes: "High-quality Luganda translation by VJ Jingo. Perfect for family viewing.",
    translationQuality: 4.7,
    
    metaData: {
        tmdbId: "11212",
        imdbId: "tt0109190"
    },
    
    hosting: {
        provider: "local",
        url: "",
        streamUrl: ""
    }
};

async function addMovie() {
    try {
        console.log('🎬 Adding Baby\'s Day Out (VJ Jingo) to Database');
        console.log('================================================\n');
        
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, );
        console.log('✓ Connected to MongoDB\n');
        
        // Load the model
        const LugandaMovie = require('./models/LugandaMovie');
        
        // Check if movie already exists
        const existingMovie = await LugandaMovie.findOne({
            originalTitle: "Baby's Day Out",
            vjName: "VJ Jingo"
        });
        
        if (existingMovie) {
            console.log('⚠ Movie already exists in database');
            console.log('Movie ID:', existingMovie._id);
            console.log('Title:', existingMovie.lugandaTitle);
            console.log('VJ:', existingMovie.vjName);
            console.log('\nUpdating existing movie...');
            
            // Update the existing movie
            const updatedMovie = await LugandaMovie.findByIdAndUpdate(
                existingMovie._id,
                babysDayOutData,
                { new: true, runValidators: true }
            );
            
            console.log('✓ Movie updated successfully!\n');
            console.log('Updated Movie Details:');
            console.log('=====================');
            console.log('ID:', updatedMovie._id);
            console.log('Original Title:', updatedMovie.originalTitle);
            console.log('Luganda Title:', updatedMovie.lugandaTitle);
            console.log('VJ:', updatedMovie.vjName);
            console.log('Year:', updatedMovie.year);
            console.log('Duration:', updatedMovie.duration, 'minutes');
            console.log('Genres:', updatedMovie.genres.join(', '));
            console.log('Rating:', updatedMovie.rating.imdb, '/ 10');
            console.log('Translation Rating:', updatedMovie.rating.translationRating, '/ 5');
            console.log('Status:', updatedMovie.status);
            console.log('Featured:', updatedMovie.featured);
            console.log('Trending:', updatedMovie.trending);
            
        } else {
            // Create new movie
            console.log('Creating new movie entry...');
            const movie = await LugandaMovie.create(babysDayOutData);
            
            console.log('✓ Movie added successfully!\n');
            console.log('Movie Details:');
            console.log('==============');
            console.log('ID:', movie._id);
            console.log('Original Title:', movie.originalTitle);
            console.log('Luganda Title:', movie.lugandaTitle);
            console.log('VJ:', movie.vjName);
            console.log('Year:', movie.year);
            console.log('Duration:', movie.duration, 'minutes');
            console.log('Genres:', movie.genres.join(', '));
            console.log('Rating:', movie.rating.imdb, '/ 10');
            console.log('Translation Rating:', movie.rating.translationRating, '/ 5');
            console.log('Status:', movie.status);
            console.log('Featured:', movie.featured);
            console.log('Trending:', movie.trending);
        }
        
        console.log('\n================================================');
        console.log('✓ Operation completed successfully!');
        console.log('================================================\n');
        
        // Close connection
        await mongoose.connection.close();
        console.log('Database connection closed.\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('✗ Error adding movie:', error.message);
        console.error('\nFull error:', error);
        
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
        }
        
        process.exit(1);
    }
}

// Run the script
addMovie();
