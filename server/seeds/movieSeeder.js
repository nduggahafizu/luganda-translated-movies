/* ===================================
   Movie Database Seeder
   Seeds database with Luganda translated movies
   =================================== */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');

// Movies data to seed
const moviesData = [
    // VJ Emmy Movies
    {
        originalTitle: 'Tommy Boy',
        vjName: 'VJ Emmy',
        year: 1995,
        genres: ['Comedy'],
        quality: 'HD',
        rating: 3.4,
        isPremium: true,
        tmdbId: 11381,
        poster: 'https://image.tmdb.org/t/p/w500/sZgBhOvT2Vj0Ds0mJNvuPLEaKCf.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/qJxzjUjCpTPvDHldNnlbRC4OqEh.jpg',
        overview: 'Party animal Tommy Callahan is a dimwitted, good-natured heir to an auto-parts empire, who must save the family business by going on the road to sell brake pads.',
        runtime: 97,
        status: 'published'
    },
    {
        originalTitle: 'To the Limit',
        vjName: 'VJ Emmy',
        year: 1995,
        genres: ['Action'],
        quality: 'HD',
        rating: 6.7,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/rMHmXqxVBdLgzCdjpVPQRhTcz8x.jpg',
        overview: 'A woman seeks revenge against the criminals who murdered her husband.',
        runtime: 96,
        status: 'published'
    },
    {
        originalTitle: 'Secret Admirer',
        vjName: 'VJ Emmy',
        year: 1985,
        genres: ['Comedy', 'Romance'],
        quality: 'HD',
        rating: 5.7,
        isPremium: true,
        tmdbId: 29444,
        poster: 'https://image.tmdb.org/t/p/w500/2Pt6LxAJnQp1nqWwIXt8G5LzqXP.jpg',
        overview: 'An anonymous love letter causes a series of misunderstandings in a small town.',
        runtime: 98,
        status: 'published'
    },
    {
        originalTitle: 'Prom Night',
        vjName: 'VJ Emmy',
        year: 1980,
        genres: ['Horror'],
        quality: 'HD',
        rating: 6.333,
        isPremium: true,
        tmdbId: 16281,
        poster: 'https://image.tmdb.org/t/p/w500/6EYPKlfzJ9OLvuW4bNbRZBHGvl7.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/wQtYM0Y2YaVmWNXnQnqjLVjLKn0.jpg',
        overview: 'A masked killer stalks four teenagers at their high school prom, seeking revenge for an accidental death.',
        runtime: 92,
        status: 'published'
    },
    {
        originalTitle: 'Cobra',
        vjName: 'VJ Emmy',
        year: 1986,
        genres: ['Action', 'Crime'],
        quality: 'HD',
        rating: 6.739,
        isPremium: true,
        tmdbId: 6973,
        poster: 'https://image.tmdb.org/t/p/w500/lGloH8VDU8WKfEKkdI5cEdTn0AO.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/2RSirRqZKJqvJnNRq4uYOuqfaFf.jpg',
        overview: 'A tough-on-crime street cop must protect the only surviving witness to a strange murderous cult with ties to the Los Angeles underworld.',
        runtime: 87,
        status: 'published'
    },
    {
        originalTitle: 'Predator: Badlands',
        vjName: 'VJ Emmy',
        year: 2025,
        genres: ['Action', 'Sci-Fi', 'Horror'],
        quality: 'HD',
        rating: 6.9,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/xNUqsfiIgFli3F7rnlrsMoeFffl.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/b3mdmjYTEL70j7nuXATUAD9qgu4.jpg',
        overview: 'The Predator returns to Earth for a new hunt in the badlands.',
        runtime: 120,
        status: 'published'
    },
    {
        originalTitle: 'Muzzle: City of Wolves',
        vjName: 'VJ Emmy',
        year: 2025,
        genres: ['Action', 'Thriller'],
        quality: 'HD',
        rating: 6.9,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/6AdXwFTRTAzggD2QUTt5B7JFGKL.jpg',
        overview: 'A K-9 cop and his dog partner fight crime in a corrupt city.',
        runtime: 105,
        status: 'published'
    },
    {
        originalTitle: 'Dracula',
        vjName: 'VJ Emmy',
        year: 2022,
        genres: ['Horror', 'Romance'],
        quality: 'HD',
        rating: 6.7,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/sqj1FDkNO1SCn9qEXaJdU8tVXKV.jpg',
        overview: 'A modern retelling of the classic vampire tale.',
        runtime: 110,
        status: 'published'
    },

    // VJ Ice P Movies
    {
        originalTitle: 'Hunting Jessica Brok',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Action', 'Thriller'],
        quality: 'HD',
        rating: 2.0,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/zKqCcIjH7T6WJkbcKL8EBFJzKTz.jpg',
        overview: 'A dangerous game of cat and mouse unfolds as hunters become the hunted.',
        runtime: 98,
        status: 'published'
    },
    {
        originalTitle: 'Desert Lone Hero',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Action', 'Western'],
        quality: 'HD',
        rating: 6.147,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        overview: 'A lone warrior fights for justice in the unforgiving desert.',
        runtime: 105,
        status: 'published'
    },
    {
        originalTitle: 'Madharaasi Part 1 Hindi',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Action', 'Drama'],
        quality: 'HD',
        rating: 5.703,
        isPremium: false,
        poster: 'https://image.tmdb.org/t/p/w500/j5cr2lQrBKhO9g0aX8I3bnqTM9.jpg',
        overview: 'An epic South Indian action drama - Part 1.',
        runtime: 150,
        status: 'published'
    },
    {
        originalTitle: 'Madharaasi Part 2 Hindi',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Action', 'Drama'],
        quality: 'HD',
        rating: 6.739,
        isPremium: false,
        poster: 'https://image.tmdb.org/t/p/w500/j5cr2lQrBKhO9g0aX8I3bnqTM9.jpg',
        overview: 'An epic South Indian action drama - Part 2.',
        runtime: 145,
        status: 'published'
    },
    {
        originalTitle: 'Thanal Part 1 Hindi',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Drama', 'Thriller'],
        quality: 'HD',
        rating: 6.0,
        isPremium: false,
        poster: 'https://image.tmdb.org/t/p/w500/kTLxPiH0B0HKMpHvQjKkI8dAUpB.jpg',
        overview: 'A gripping thriller from South India - Part 1.',
        runtime: 140,
        status: 'published'
    },
    {
        originalTitle: 'Thanal Part 2 Hindi',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Drama', 'Thriller'],
        quality: 'HD',
        rating: 6.0,
        isPremium: false,
        poster: 'https://image.tmdb.org/t/p/w500/kTLxPiH0B0HKMpHvQjKkI8dAUpB.jpg',
        overview: 'A gripping thriller from South India - Part 2.',
        runtime: 135,
        status: 'published'
    },
    {
        originalTitle: 'Kantara: A Legend Chapter 1 Part 2',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Action', 'Drama', 'Thriller'],
        quality: 'HD',
        rating: 7.094,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/4WQFC2uGSgJZdM8JFLz0nxEbLbN.jpg',
        overview: 'The epic continuation of the Kantara legend.',
        runtime: 160,
        status: 'published'
    },

    // VJ Junior Movies
    {
        originalTitle: 'Office Christmas Party',
        vjName: 'VJ Junior',
        year: 2016,
        genres: ['Comedy'],
        quality: 'Ultra HD',
        rating: 6.488,
        isPremium: true,
        tmdbId: 384682,
        poster: 'https://image.tmdb.org/t/p/w500/oYGJ0GXPjB6kqfdJDPG1zcvSHQR.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/dqm8r2FEMPb8EGwCfvLnCXhIhsj.jpg',
        overview: 'When his uptight CEO sister threatens to shut down his branch, the branch manager throws an epic Christmas party in order to land a big client and save the day.',
        runtime: 105,
        status: 'published'
    },
    {
        originalTitle: 'Now You See Me 3: Now You Dont',
        vjName: 'VJ Junior',
        year: 2025,
        genres: ['Action', 'Thriller', 'Crime'],
        quality: 'HD',
        rating: 6.9,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg',
        overview: 'The Four Horsemen return for their most impossible heist yet.',
        runtime: 130,
        status: 'published'
    },
    {
        originalTitle: 'Basic Instinct',
        vjName: 'VJ Junior',
        year: 1992,
        genres: ['Thriller', 'Mystery'],
        quality: 'HD',
        rating: 5.75,
        isPremium: true,
        tmdbId: 532,
        poster: 'https://image.tmdb.org/t/p/w500/fSn76XOxSgPHFnQIe0B7sCDPGFD.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/8EQMAG5oaLo7J2QOhVwVNbkC1Xm.jpg',
        overview: 'A police detective is drawn into a web of seduction and murder by a beautiful crime novelist.',
        runtime: 127,
        status: 'published'
    },
    {
        originalTitle: 'A Christmas Treasure',
        vjName: 'VJ Junior',
        year: 2021,
        genres: ['Romance', 'Comedy'],
        quality: 'HD',
        rating: 6.0,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/gJL5kp5FMopB2sN4WZYnNT5uO5a.jpg',
        overview: 'A heartwarming Christmas romance about finding love and treasure.',
        runtime: 84,
        status: 'published'
    },
    {
        originalTitle: 'Welcome Home Roscoe Jenkins',
        vjName: 'VJ Junior',
        year: 2008,
        genres: ['Comedy'],
        quality: 'HD',
        rating: 6.258,
        isPremium: true,
        tmdbId: 10146,
        poster: 'https://image.tmdb.org/t/p/w500/s5sKKh3Xxv1T3Z9JqPxZWSTqWSJ.jpg',
        overview: 'A talk show host returns to his Southern hometown for his parents anniversary and rediscovers his roots.',
        runtime: 114,
        status: 'published'
    },
    {
        originalTitle: 'Waiting to Exhale',
        vjName: 'VJ Junior',
        year: 1995,
        genres: ['Drama', 'Romance'],
        quality: 'HD',
        rating: 7.8,
        isPremium: true,
        tmdbId: 9890,
        poster: 'https://image.tmdb.org/t/p/w500/wjIBPVaGrjlpLzXDqm7goGPz0Ar.jpg',
        overview: 'Four African-American women deal with relationships, careers, and friendship.',
        runtime: 124,
        status: 'published'
    },
    {
        originalTitle: 'Sisu 2: Road to Revenge',
        vjName: 'VJ Junior',
        year: 2025,
        genres: ['Action', 'War'],
        quality: 'HD',
        rating: 5.9,
        isPremium: true,
        poster: 'https://image.tmdb.org/t/p/w500/ygO9lowFMXWymATCrhoQXd6gCEh.jpg',
        overview: 'The legendary Finnish soldier returns for another brutal mission.',
        runtime: 110,
        status: 'published'
    },
    {
        originalTitle: 'Margaux',
        vjName: 'VJ Junior',
        year: 2022,
        genres: ['Horror', 'Sci-Fi'],
        quality: 'HD',
        rating: 6.333,
        isPremium: true,
        tmdbId: 937278,
        poster: 'https://image.tmdb.org/t/p/w500/m1K87JCSbWO1gAy2R9iqbPjvuFC.jpg',
        overview: 'A group of college friends rent a luxury smart house for a weekend getaway, but the AI has deadly plans.',
        runtime: 89,
        status: 'published'
    },
    {
        originalTitle: 'A Jazzmans Blues',
        vjName: 'VJ Junior',
        year: 2022,
        genres: ['Drama', 'Romance', 'Music'],
        quality: 'HD',
        rating: 7.441,
        isPremium: true,
        tmdbId: 843794,
        poster: 'https://image.tmdb.org/t/p/w500/qVvyX7uvLKuJELPZS5VLZc8RLG7.jpg',
        overview: 'A forbidden love story set against the 1940s Deep South jazz scene.',
        runtime: 126,
        status: 'published'
    },
    {
        originalTitle: 'The Thomas Crown Affair',
        vjName: 'VJ Junior',
        year: 1999,
        genres: ['Romance', 'Thriller', 'Crime'],
        quality: 'HD',
        rating: 6.743,
        isPremium: true,
        tmdbId: 4912,
        poster: 'https://image.tmdb.org/t/p/w500/3wTDrv6LJm6EvKqByQXEjgtcNPD.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/8KqqF4lkPCMf7mFLZNGG4nCJKvL.jpg',
        overview: 'A billionaire businessman plays cat and mouse with an insurance investigator after stealing a priceless painting.',
        runtime: 113,
        status: 'published'
    },

    // TV Series
    {
        originalTitle: 'Walking on Thin Ice',
        vjName: 'VJ Fredy',
        year: 2025,
        genres: ['Drama', 'Romance'],
        quality: 'HD',
        rating: 6.6,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/aKtxBKmQXVfH1Stqu1c2G3QLbNL.jpg',
        overview: 'A Korean drama series about love and sacrifice.',
        totalSeasons: 1,
        totalEpisodes: 24,
        status: 'published'
    },
    {
        originalTitle: 'Alex Rider',
        vjName: 'VJ Ice P',
        year: 2020,
        genres: ['Action', 'Drama', 'Thriller'],
        quality: 'HD',
        rating: 7.788,
        isPremium: true,
        contentType: 'series',
        tmdbId: 90811,
        poster: 'https://image.tmdb.org/t/p/w500/s79wvMsaJNxYPs3XKOzRjqYrfUX.jpg',
        overview: 'A teenage spy reluctantly recruited into MI6.',
        totalSeasons: 3,
        totalEpisodes: 24,
        status: 'published'
    },
    {
        originalTitle: 'Mr. Queen',
        vjName: 'VJ Sammy',
        year: 2020,
        genres: ['Comedy', 'Drama', 'Romance'],
        quality: 'HD',
        rating: 8.527,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/5cI44xK5ZNFQ0YSrJW3w5pKKXfJ.jpg',
        overview: 'A modern-day chef wakes up in the body of a Joseon-era queen.',
        totalSeasons: 1,
        totalEpisodes: 20,
        status: 'published'
    },
    {
        originalTitle: 'Coyote',
        vjName: 'VJ Baros',
        year: 2021,
        genres: ['Drama', 'Thriller'],
        quality: 'HD',
        rating: 7.8,
        isPremium: true,
        contentType: 'series',
        tmdbId: 118491,
        poster: 'https://image.tmdb.org/t/p/w500/k2W0I1a3JDZnKyBnXBrGFGFLBF1.jpg',
        overview: 'A border patrol agent discovers the human side of immigration.',
        totalSeasons: 1,
        totalEpisodes: 6,
        status: 'published'
    },
    {
        originalTitle: 'Man vs Baby',
        vjName: 'VJ Junior',
        year: 2025,
        genres: ['Comedy'],
        quality: 'HD',
        rating: 7.281,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/6VwCJUr6KF6VIwfXLVuUbLr7x0x.jpg',
        overview: 'A hilarious comedy series about the challenges of fatherhood.',
        totalSeasons: 1,
        totalEpisodes: 10,
        status: 'published'
    },
    {
        originalTitle: 'Rabbit Hole',
        vjName: 'VJ Junior',
        year: 2023,
        genres: ['Drama', 'Thriller'],
        quality: 'HD',
        rating: 7.1,
        isPremium: true,
        contentType: 'series',
        tmdbId: 156902,
        poster: 'https://image.tmdb.org/t/p/w500/goY5jvmTx3sVeTvHkbPRIhfHZi4.jpg',
        overview: 'A corporate espionage expert becomes a target of the very system he helped create.',
        totalSeasons: 1,
        totalEpisodes: 8,
        status: 'published'
    },
    {
        originalTitle: 'Genie, Make a Wish',
        vjName: 'VJ M.K',
        year: 2025,
        genres: ['Comedy', 'Fantasy'],
        quality: 'HD',
        rating: 7.29,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
        overview: 'A magical comedy about wishes and their consequences.',
        totalSeasons: 1,
        totalEpisodes: 12,
        status: 'published'
    },
    {
        originalTitle: 'Chasing in the Wild',
        vjName: 'VJ Bonny',
        year: 2024,
        genres: ['Action', 'Drama'],
        quality: 'HD',
        rating: 8.2,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/7Ebnf4IpOka6YNPt1YEgMt5FXa0.jpg',
        overview: 'An adventure series about survival in the wilderness.',
        totalSeasons: 1,
        totalEpisodes: 10,
        status: 'published'
    },
    {
        originalTitle: 'Dear X',
        vjName: 'VJ Light',
        year: 2025,
        genres: ['Drama', 'Romance'],
        quality: 'HD',
        rating: 8.125,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/8xWMh4vIJF6g7Z1YlnXKGSqLy3U.jpg',
        overview: 'A touching drama about letters to a lost love.',
        totalSeasons: 1,
        totalEpisodes: 16,
        status: 'published'
    },
    {
        originalTitle: 'Last Samurai Standing',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['Action', 'Drama'],
        quality: 'HD',
        rating: 8.01,
        isPremium: true,
        contentType: 'series',
        poster: 'https://image.tmdb.org/t/p/w500/A9lQsmCwbw3aPCBPW4yoAqPJpJo.jpg',
        overview: 'A mini-series about the last warriors of an ancient order.',
        totalSeasons: 1,
        totalEpisodes: 6,
        status: 'published'
    }
];

// Helper function to generate slug
function generateSlug(title, vjName) {
    const baseSlug = `${title}-${vjName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return baseSlug;
}

// Seed function
async function seedMovies() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';
        console.log('📦 Connecting to MongoDB...');
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Check existing movies
        const existingCount = await LugandaMovie.countDocuments();
        console.log(`📊 Existing movies in database: ${existingCount}`);
        
        // Prepare movies with slugs
        const moviesToInsert = moviesData.map(movie => ({
            ...movie,
            slug: generateSlug(movie.originalTitle, movie.vjName),
            contentType: movie.contentType || 'movie',
            language: 'Luganda',
            translationQuality: 4.5,
            views: Math.floor(Math.random() * 10000) + 100,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        
        // Insert movies (skip duplicates based on slug)
        let inserted = 0;
        let skipped = 0;
        
        for (const movie of moviesToInsert) {
            try {
                const exists = await LugandaMovie.findOne({ slug: movie.slug });
                if (exists) {
                    console.log(`⏭️  Skipping (exists): ${movie.originalTitle} by ${movie.vjName}`);
                    skipped++;
                } else {
                    await LugandaMovie.create(movie);
                    console.log(`✅ Added: ${movie.originalTitle} by ${movie.vjName}`);
                    inserted++;
                }
            } catch (err) {
                console.error(`❌ Error adding ${movie.originalTitle}:`, err.message);
            }
        }
        
        console.log('\n========================================');
        console.log(`✅ Seeding complete!`);
        console.log(`   - Inserted: ${inserted} movies`);
        console.log(`   - Skipped: ${skipped} (already exist)`);
        console.log(`   - Total in database: ${await LugandaMovie.countDocuments()}`);
        console.log('========================================\n');
        
        // Show summary by VJ
        const vjStats = await LugandaMovie.aggregate([
            { $group: { _id: '$vjName', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('Movies by VJ:');
        vjStats.forEach(vj => {
            console.log(`   ${vj._id}: ${vj.count} movies`);
        });
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

// Run seeder
seedMovies();
