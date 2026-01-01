/**
 * Update Movie Posters Script
 * Fetches real poster URLs from TMDB for all movies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');
const axios = require('axios');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

async function searchTMDB(title, year) {
    try {
        const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
            params: {
                api_key: TMDB_API_KEY,
                query: title,
                year: year,
                language: 'en-US'
            }
        });
        
        if (response.data.results && response.data.results.length > 0) {
            return response.data.results[0];
        }
        return null;
    } catch (error) {
        console.error(`Error searching for "${title}":`, error.message);
        return null;
    }
}

async function updateMoviePosters() {
    try {
        // Connect to MongoDB
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Get all movies
        const movies = await LugandaMovie.find({});
        console.log(`📽️  Found ${movies.length} movies to update\n`);
        
        let updated = 0;
        let failed = 0;
        
        for (const movie of movies) {
            const title = movie.originalTitle;
            const year = movie.year;
            
            console.log(`🔍 Searching: "${title}" (${year})`);
            
            const tmdbMovie = await searchTMDB(title, year);
            
            if (tmdbMovie && tmdbMovie.poster_path) {
                const posterUrl = `${TMDB_IMAGE_BASE}${tmdbMovie.poster_path}`;
                const backdropUrl = tmdbMovie.backdrop_path 
                    ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` 
                    : null;
                
                // Update movie
                await LugandaMovie.findByIdAndUpdate(movie._id, {
                    poster: posterUrl,
                    backdrop: backdropUrl || movie.backdrop,
                    tmdbId: tmdbMovie.id
                });
                
                console.log(`   ✅ Updated poster: ${posterUrl}`);
                updated++;
            } else {
                console.log(`   ❌ No poster found on TMDB`);
                failed++;
            }
            
            // Rate limit: 1 request per 100ms
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\n📊 Results:`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Total: ${movies.length}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

// Run the script
updateMoviePosters();
