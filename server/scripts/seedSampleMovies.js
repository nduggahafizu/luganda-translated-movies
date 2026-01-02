/**
 * Quick script to seed sample Luganda movies
 */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('✓ Connected to MongoDB');
});

// Sample movies data
const sampleMovies = [
    {
        originalTitle: "Fast & Furious 9",
        lugandaTitle: "Abasajja Abaangu 9",
        vjName: "VJ Junior",
        year: 2021,
        duration: 143,
        director: "Justin Lin",
        genres: ["action", "thriller", "adventure"],
        description: "Dom and the crew must take on an international terrorist who turns out to be Dom's forsaken brother.",
        poster: "https://image.tmdb.org/t/p/w500/bOFaAXmWWXC3Rbv4u4uM9ZSzRXP.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/bOFaAXmWWXC3Rbv4u4uM9ZSzRXP.jpg",
        rating: {
            imdb: 5.2,
            userRating: 7.3,
            translationRating: 4.8
        },
        video: {
            originalVideoPath: "/movies/fast-furious-9.mp4",
            lugandaAudioPath: "/movies/fast-furious-9-luganda.mp3",
            quality: "hd",
            duration: 143,
            format: "mp4"
        },
        views: 32100,
        featured: true,
        trending: true
    },
    {
        originalTitle: "Black Panther",
        lugandaTitle: "Enkima Enzirugavu",
        vjName: "VJ Emmy",
        year: 2018,
        duration: 134,
        director: "Ryan Coogler",
        genres: ["action", "adventure", "sci-fi"],
        description: "T'Challa returns home to the African nation of Wakanda to take his rightful place as king.",
        poster: "https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/uxzzxijgPIY7slzFvMotPv8wjKA.jpg",
        rating: {
            imdb: 7.3,
            userRating: 7.4,
            translationRating: 4.9
        },
        video: {
            originalVideoPath: "/movies/black-panther.mp4",
            lugandaAudioPath: "/movies/black-panther-luganda.mp3",
            quality: "hd",
            duration: 134,
            format: "mp4"
        },
        views: 28400,
        featured: true,
        trending: true
    },
    {
        originalTitle: "Avatar: The Way of Water",
        lugandaTitle: "Omuntu Omulala: Ekkubo ly'Amazzi",
        vjName: "VJ Emmy",
        year: 2022,
        duration: 192,
        director: "James Cameron",
        genres: ["sci-fi", "adventure", "action"],
        description: "Jake Sully and Ney'tiri have formed a family and are doing everything to stay together.",
        poster: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
        rating: {
            imdb: 7.6,
            userRating: 7.7,
            translationRating: 4.7
        },
        video: {
            originalVideoPath: "/movies/avatar-way-of-water.mp4",
            lugandaAudioPath: "/movies/avatar-way-of-water-luganda.mp3",
            quality: "4k",
            duration: 192,
            format: "mp4"
        },
        views: 25600,
        featured: true,
        trending: true
    },
    {
        originalTitle: "The Marvels",
        lugandaTitle: "Abakyewuunyisa",
        vjName: "VJ Little T",
        year: 2023,
        duration: 105,
        director: "Nia DaCosta",
        genres: ["action", "adventure", "sci-fi"],
        description: "Carol Danvers gets her powers entangled with those of Kamala Khan and Monica Rambeau.",
        poster: "https://image.tmdb.org/t/p/w500/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg",
        rating: {
            imdb: 5.5,
            userRating: 6.5,
            translationRating: 4.5
        },
        video: {
            originalVideoPath: "/movies/the-marvels.mp4",
            lugandaAudioPath: "/movies/the-marvels-luganda.mp3",
            quality: "hd",
            duration: 105,
            format: "mp4"
        },
        views: 15200,
        featured: false,
        trending: true
    },
    {
        originalTitle: "Wonka",
        lugandaTitle: "Wonka",
        vjName: "VJ Bonny",
        year: 2023,
        duration: 116,
        director: "Paul King",
        genres: ["fantasy", "comedy", "family"],
        description: "The story of how the world's greatest inventor, magician and chocolate-maker became the beloved Willy Wonka we know today.",
        poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
        rating: {
            imdb: 7.1,
            userRating: 7.2,
            translationRating: 4.6
        },
        video: {
            originalVideoPath: "/movies/wonka.mp4",
            lugandaAudioPath: "/movies/wonka-luganda.mp3",
            quality: "4k",
            duration: 116,
            format: "mp4"
        },
        views: 18900,
        featured: false,
        trending: true
    },
    {
        originalTitle: "Guardians of the Galaxy Vol. 3",
        lugandaTitle: "Abakuumi ba Galaxy Ekitundu 3",
        vjName: "VJ Junior",
        year: 2023,
        duration: 150,
        director: "James Gunn",
        genres: ["action", "adventure", "sci-fi"],
        description: "Still reeling from the loss of Gamora, Peter Quill rallies his team to defend the universe.",
        poster: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg",
        rating: {
            imdb: 7.9,
            userRating: 8.0,
            translationRating: 4.8
        },
        video: {
            originalVideoPath: "/movies/guardians-galaxy-3.mp4",
            lugandaAudioPath: "/movies/guardians-galaxy-3-luganda.mp3",
            quality: "hd",
            duration: 150,
            format: "mp4"
        },
        views: 22300,
        featured: false,
        trending: true
    },
    {
        originalTitle: "Spider-Man: Across the Spider-Verse",
        lugandaTitle: "Omuntu Ennabbubi: Okuyita mu Spider-Verse",
        vjName: "VJ Little T",
        year: 2023,
        duration: 140,
        director: "Joaquim Dos Santos",
        genres: ["animation", "action", "adventure"],
        description: "Miles Morales catapults across the Multiverse, where he encounters a team of Spider-People.",
        poster: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
        rating: {
            imdb: 8.7,
            userRating: 8.6,
            translationRating: 4.9
        },
        video: {
            originalVideoPath: "/movies/spiderman-across-spiderverse.mp4",
            lugandaAudioPath: "/movies/spiderman-across-spiderverse-luganda.mp3",
            quality: "4k",
            duration: 140,
            format: "mp4"
        },
        views: 31500,
        featured: true,
        trending: true
    },
    {
        originalTitle: "Song of the Assassins",
        lugandaTitle: "Oluyimba lw'Abatemu",
        vjName: "VJ Ice P",
        year: 2022,
        duration: 127,
        director: "Daniel Lee",
        genres: ["action", "adventure"],
        description: "After completing his training, an elite young assassin embarks on his first mission.",
        poster: "https://image.tmdb.org/t/p/w500/gWt6vVKJYmYP7aqIkN7GqNnLq5K.jpg",
        backdrop: "https://image.tmdb.org/t/p/original/xXBnM6uSTk6qqCf0SRZKXcga9Ba.jpg",
        rating: {
            imdb: 7.2,
            userRating: 7.3,
            translationRating: 4.7
        },
        video: {
            originalVideoPath: "/movies/song-of-assassins.mp4",
            lugandaAudioPath: "/movies/song-of-assassins-luganda.mp3",
            quality: "hd",
            duration: 127,
            format: "mp4"
        },
        views: 19800,
        featured: true,
        trending: false
    }
];

async function seedMovies() {
    try {
        console.log('\n🎬 Starting to seed sample movies...\n');

        // Clear existing movies (optional)
        // await LugandaMovie.deleteMany({});
        // console.log('✓ Cleared existing movies\n');

        let successCount = 0;
        let errorCount = 0;

        for (const movieData of sampleMovies) {
            try {
                // Check if movie already exists
                const existing = await LugandaMovie.findOne({ 
                    originalTitle: movieData.originalTitle 
                });

                if (existing) {
                    console.log(`⚠️  Skipping: ${movieData.originalTitle} (already exists)`);
                    continue;
                }

                const movie = new LugandaMovie(movieData);
                await movie.save();
                console.log(`✅ Added: ${movieData.originalTitle} (VJ ${movieData.vjName})`);
                successCount++;
            } catch (error) {
                console.error(`❌ Error adding ${movieData.originalTitle}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n✅ Seeding complete!`);
        console.log(`   Success: ${successCount} movies`);
        console.log(`   Errors: ${errorCount} movies`);
        console.log(`   Total in database: ${await LugandaMovie.countDocuments()}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

// Run the seeder
seedMovies();
