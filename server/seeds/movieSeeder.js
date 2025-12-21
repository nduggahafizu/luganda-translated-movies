/**
 * Movie Seeder Script
 * Seeds the database with sample Luganda movies
 * Run with: npm run seed:movies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';

// Sample movies data (from frontend js/luganda-movies-api.js)
const sampleMovies = [
    {
        originalTitle: 'Lokah',
        lugandaTitle: 'Lokah (Luganda)',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        year: 2023,
        duration: 135,
        director: 'Unknown',
        description: 'An intense Indian action drama that follows the journey of a fearless protagonist.',
        genres: ['action', 'drama'],
        rating: {
            imdb: 7.5,
            userRating: 8.2,
            translationRating: 4.8,
            totalRatings: 150,
            totalTranslationRatings: 120
        },
        video: {
            originalVideoPath: '/videos/lokah.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
        translationQuality: 4.8,
        views: 25420,
        featured: true,
        trending: true,
        status: 'published',
        originalLanguage: 'Hindi',
        country: 'India'
    },
    {
        originalTitle: 'Running Man',
        lugandaTitle: 'Running Man (Luganda)',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        year: 2013,
        duration: 127,
        director: 'Unknown',
        description: 'A man wrongly accused of murder must run for his life while trying to prove his innocence.',
        genres: ['action', 'thriller'],
        rating: {
            imdb: 6.9,
            userRating: 7.8,
            translationRating: 4.7,
            totalRatings: 98,
            totalTranslationRatings: 85
        },
        video: {
            originalVideoPath: '/videos/running-man.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/jfINh7Wr6vWwNq5k0jZF6o5YpXA.jpg',
        translationQuality: 4.7,
        views: 18900,
        featured: true,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'Kantara',
        lugandaTitle: 'Kantara (Luganda)',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        year: 2022,
        duration: 148,
        director: 'Rishab Shetty',
        description: 'A legendary Indian film that explores the conflict between man and nature in a small village.',
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.2,
            userRating: 8.9,
            translationRating: 4.9,
            totalRatings: 250,
            totalTranslationRatings: 200
        },
        video: {
            originalVideoPath: '/videos/kantara.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/8I37NtDffNV7AZlDa7uDvvqhovU.jpg',
        translationQuality: 4.9,
        views: 32100,
        featured: true,
        trending: true,
        status: 'published',
        originalLanguage: 'Kannada',
        country: 'India'
    },
    {
        originalTitle: 'Frankenstein',
        lugandaTitle: 'Frankenstein (Luganda)',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        year: 2015,
        duration: 110,
        director: 'Bernard Rose',
        description: 'A modern retelling of Mary Shelley\'s classic tale of a scientist who creates a monster.',
        genres: ['horror', 'sci-fi', 'thriller'],
        rating: {
            imdb: 6.2,
            userRating: 7.1,
            translationRating: 4.5,
            totalRatings: 75,
            totalTranslationRatings: 60
        },
        video: {
            originalVideoPath: '/videos/frankenstein.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/4WnZkVlFxMkQ7XhGKFJPKPGVLqL.jpg',
        translationQuality: 4.5,
        views: 14200,
        featured: false,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'Predator: Badlands',
        lugandaTitle: 'Predator: Badlands (Luganda)',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        year: 2025,
        duration: 120,
        director: 'Dan Trachtenberg',
        description: 'The latest installment in the Predator franchise brings the hunt to the badlands.',
        genres: ['action', 'sci-fi', 'thriller'],
        rating: {
            imdb: 7.8,
            userRating: 8.3,
            translationRating: 4.6,
            totalRatings: 180,
            totalTranslationRatings: 150
        },
        video: {
            originalVideoPath: '/videos/predator-badlands.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/sR0SpCrXamlIkw5qnbfth0p0aQi.jpg',
        translationQuality: 4.6,
        views: 28500,
        featured: true,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'Fist of Fury',
        lugandaTitle: 'Fist of Fury (Luganda)',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        year: 1972,
        duration: 106,
        director: 'Lo Wei',
        description: 'Bruce Lee stars in this classic martial arts film about a student seeking revenge for his master\'s death.',
        genres: ['action', 'drama'],
        rating: {
            imdb: 7.3,
            userRating: 8.1,
            translationRating: 4.7,
            totalRatings: 320,
            totalTranslationRatings: 280
        },
        video: {
            originalVideoPath: '/videos/fist-of-fury.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/nJQFZPi9z8cAKmK4JMl4hGDhGd.jpg',
        translationQuality: 4.7,
        views: 21500,
        featured: false,
        trending: true,
        status: 'published',
        originalLanguage: 'Cantonese',
        country: 'Hong Kong'
    },
    {
        originalTitle: 'War Season 1',
        lugandaTitle: 'War Season 1 (Luganda)',
        vjName: 'VJ Soul',
        vjId: 'vj-soul',
        year: 2024,
        duration: 480,
        director: 'Unknown',
        description: 'An epic war series that follows soldiers through intense battles and personal struggles. Season 1.',
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.1,
            userRating: 8.7,
            translationRating: 4.8,
            totalRatings: 420,
            totalTranslationRatings: 380
        },
        video: {
            originalVideoPath: '/videos/war-season-1.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        translationQuality: 4.8,
        views: 35600,
        featured: true,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'War Season 2',
        lugandaTitle: 'War Season 2 (Luganda)',
        vjName: 'VJ Soul',
        vjId: 'vj-soul',
        year: 2024,
        duration: 500,
        director: 'Unknown',
        description: 'The war intensifies in Season 2 as alliances shift and new enemies emerge.',
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.3,
            userRating: 8.9,
            translationRating: 4.9,
            totalRatings: 450,
            totalTranslationRatings: 410
        },
        video: {
            originalVideoPath: '/videos/war-season-2.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        translationQuality: 4.9,
        views: 32400,
        featured: true,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'War Season 3',
        lugandaTitle: 'War Season 3 (Luganda)',
        vjName: 'VJ Soul',
        vjId: 'vj-soul',
        year: 2024,
        duration: 510,
        director: 'Unknown',
        description: 'Season 3 brings the conflict to a climax with explosive action and emotional depth.',
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.4,
            userRating: 9.0,
            translationRating: 4.9,
            totalRatings: 480,
            totalTranslationRatings: 440
        },
        video: {
            originalVideoPath: '/videos/war-season-3.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        translationQuality: 4.9,
        views: 29800,
        featured: true,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'War Season 4',
        lugandaTitle: 'War Season 4 (Luganda)',
        vjName: 'VJ Soul',
        vjId: 'vj-soul',
        year: 2024,
        duration: 520,
        director: 'Unknown',
        description: 'The epic conclusion to the War series. Season 4 delivers an unforgettable finale.',
        genres: ['action', 'drama', 'thriller'],
        rating: {
            imdb: 8.5,
            userRating: 9.1,
            translationRating: 5.0,
            totalRatings: 520,
            totalTranslationRatings: 480
        },
        video: {
            originalVideoPath: '/videos/war-season-4.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        translationQuality: 5.0,
        views: 38900,
        featured: true,
        trending: true,
        status: 'published'
    },
    {
        originalTitle: 'Fast & Furious 9',
        lugandaTitle: 'Fast & Furious 9 (Luganda)',
        vjName: 'VJ Junior',
        vjId: 'vj-junior',
        year: 2021,
        duration: 143,
        director: 'Justin Lin',
        description: 'Dom and the crew must take on an international terrorist who turns out to be Dom\'s forsaken brother.',
        genres: ['action', 'thriller'],
        rating: {
            imdb: 5.2,
            userRating: 7.5,
            translationRating: 4.5,
            totalRatings: 280,
            totalTranslationRatings: 240
        },
        video: {
            originalVideoPath: '/videos/fast-furious-9.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/bOFaAXmWWXC3Rbv4u4uM9ZSzRXP.jpg',
        translationQuality: 4.5,
        views: 15420,
        featured: false,
        trending: false,
        status: 'published'
    },
    {
        originalTitle: 'Black Panther',
        lugandaTitle: 'Black Panther (Luganda)',
        vjName: 'VJ Emmy',
        vjId: 'vj-emmy',
        year: 2018,
        duration: 134,
        director: 'Ryan Coogler',
        description: 'T\'Challa returns home to the African nation of Wakanda to take his rightful place as king.',
        genres: ['action', 'adventure'],
        rating: {
            imdb: 7.3,
            userRating: 8.2,
            translationRating: 4.8,
            totalRatings: 450,
            totalTranslationRatings: 400
        },
        video: {
            originalVideoPath: '/videos/black-panther.mp4',
            quality: '4k',
            format: 'mp4'
        },
        poster: 'https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg',
        translationQuality: 4.8,
        views: 28350,
        featured: false,
        trending: false,
        status: 'published'
    }
];

// Seeder function
async function seedMovies() {
    try {
        console.log('🌱 Starting movie seeder...');
        console.log('📦 Connecting to MongoDB...');
        
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        console.log(`📍 Database: ${mongoose.connection.name}`);
        console.log('');
        
        // Check if movies already exist
        const existingCount = await LugandaMovie.countDocuments();
        console.log(`📊 Current movies in database: ${existingCount}`);
        
        if (existingCount > 0) {
            console.log('');
            console.log('⚠️  WARNING: Database already has movies!');
            console.log('');
            console.log('Options:');
            console.log('1. Keep existing movies (do nothing)');
            console.log('2. Delete all and reseed (run with --force flag)');
            console.log('');
            console.log('To force reseed: npm run seed:movies -- --force');
            console.log('');
            
            // Check for --force flag
            const forceFlag = process.argv.includes('--force');
            
            if (!forceFlag) {
                console.log('❌ Seeding cancelled. Use --force to override.');
                process.exit(0);
            }
            
            console.log('🗑️  Deleting existing movies...');
            await LugandaMovie.deleteMany({});
            console.log('✅ Existing movies deleted');
            console.log('');
        }
        
        // Insert sample movies
        console.log(`🎬 Importing ${sampleMovies.length} sample movies...`);
        console.log('');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < sampleMovies.length; i++) {
            const movie = sampleMovies[i];
            try {
                await LugandaMovie.create(movie);
                successCount++;
                console.log(`✅ [${i + 1}/${sampleMovies.length}] ${movie.originalTitle} - Imported`);
            } catch (error) {
                errorCount++;
                console.error(`❌ [${i + 1}/${sampleMovies.length}] ${movie.originalTitle} - Failed: ${error.message}`);
            }
        }
        
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('📊 SEEDING COMPLETE');
        console.log('═══════════════════════════════════════');
        console.log(`✅ Successfully imported: ${successCount} movies`);
        if (errorCount > 0) {
            console.log(`❌ Failed to import: ${errorCount} movies`);
        }
        console.log('');
        
        // Verify final count
        const finalCount = await LugandaMovie.countDocuments();
        console.log(`📦 Total movies in database: ${finalCount}`);
        console.log('');
        
        // Show sample of imported movies
        console.log('📋 Sample of imported movies:');
        const sampleDocs = await LugandaMovie.find().limit(3).select('originalTitle vjName year views');
        sampleDocs.forEach(doc => {
            console.log(`   - ${doc.originalTitle} (VJ ${doc.vjName}, ${doc.year}) - ${doc.views} views`);
        });
        console.log('');
        
        console.log('🎉 Movie seeding completed successfully!');
        console.log('');
        console.log('🔍 Verify by visiting:');
        console.log('   https://luganda-translated-movies-production.up.railway.app/api/luganda-movies');
        console.log('');
        console.log('🌐 Your website will now show real data from the backend!');
        console.log('   https://watch.unrulymovies.com');
        console.log('');
        
    } catch (error) {
        console.error('');
        console.error('❌ ERROR during seeding:');
        console.error(error);
        console.error('');
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

// Run seeder
seedMovies();
