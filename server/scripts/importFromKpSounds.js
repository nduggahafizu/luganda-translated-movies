const mongoose = require('mongoose');
const kpSoundsScraper = require('../services/kpSoundsScraper');
const LugandaMovie = require('../models/LugandaMovie');
const VJ = require('../models/VJ');
require('dotenv').config();

/* ===================================
   Import Movies and VJs from Kp Sounds Watch
   
   This script will:
   1. Scrape all VJs from watch.kpsounds.com
   2. Scrape latest movies for each VJ
   3. Add them to your MongoDB database
   =================================== */

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies');
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
}

// Import VJs
async function importVJs() {
    try {
        console.log('\n📥 Importing VJs from Kp Sounds Watch...\n');
        
        const vjsData = await kpSoundsScraper.getVJList();
        console.log(`Found ${vjsData.length} VJs to import\n`);
        
        let imported = 0;
        let skipped = 0;
        
        for (const vjData of vjsData) {
            try {
                // Check if VJ already exists
                const existing = await VJ.findOne({ name: vjData.name });
                
                if (existing) {
                    console.log(`⏭️  Skipped: ${vjData.name} (already exists)`);
                    skipped++;
                    continue;
                }
                
                // Create new VJ
                const vj = await VJ.create({
                    name: vjData.name,
                    slug: vjData.slug,
                    bio: `Professional Luganda movie translator from Uganda`,
                    profileImage: 'https://via.placeholder.com/300x300?text=' + encodeURIComponent(vjData.name),
                    socialMedia: {
                        kpSounds: vjData.kpSoundsUrl
                    },
                    stats: {
                        totalMovies: 0,
                        totalViews: 0,
                        averageRating: 0
                    },
                    featured: false,
                    verified: true,
                    active: true
                });
                
                console.log(`✅ Imported: ${vj.name}`);
                imported++;
                
            } catch (error) {
                console.error(`❌ Error importing ${vjData.name}:`, error.message);
            }
        }
        
        console.log(`\n📊 VJ Import Summary:`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${vjsData.length}\n`);
        
        return imported;
        
    } catch (error) {
        console.error('❌ Error importing VJs:', error.message);
        return 0;
    }
}

// Import movies for a specific VJ
async function importMoviesForVJ(vjName, vjSlug, limit = 50) {
    try {
        console.log(`\n📥 Importing movies for ${vjName}...`);
        
        const moviesData = await kpSoundsScraper.getMoviesByVJ(vjSlug, limit);
        console.log(`Found ${moviesData.length} movies\n`);
        
        let imported = 0;
        let skipped = 0;
        
        for (const movieData of moviesData) {
            try {
                // Check if movie already exists
                const existing = await LugandaMovie.findOne({ 
                    originalTitle: movieData.title,
                    vjName: vjName
                });
                
                if (existing) {
                    console.log(`⏭️  Skipped: ${movieData.title} (already exists)`);
                    skipped++;
                    continue;
                }
                
                // Create new movie
                const movie = await LugandaMovie.create({
                    originalTitle: movieData.title,
                    lugandaTitle: `${movieData.title} (Luganda)`,
                    vjName: vjName,
                    vjId: vjSlug,
                    description: `${movieData.title} translated to Luganda by ${vjName}. Watch this amazing ${movieData.category || 'movie'} with professional Luganda translation.`,
                    year: movieData.year || 2024,
                    duration: 120, // Default duration
                    rating: {
                        imdb: movieData.imdbRating || 7.0,
                        userRating: movieData.imdbRating || 7.0,
                        translationRating: 4.5
                    },
                    genres: movieData.category ? [movieData.category.toLowerCase()] : ['action'],
                    director: 'Unknown',
                    poster: `https://via.placeholder.com/500x750?text=${encodeURIComponent(movieData.title)}`,
                    video: {
                        originalVideoPath: movieData.url || `/videos/${movieData.slug}.mp4`,
                        quality: movieData.quality?.toLowerCase() || 'hd'
                    },
                    hosting: {
                        provider: 'custom',
                        url: movieData.url,
                        streamUrl: `https://watch.kpsounds.com${movieData.url}`
                    },
                    status: 'published',
                    featured: false,
                    trending: false,
                    translationDate: new Date()
                });
                
                console.log(`✅ Imported: ${movie.originalTitle}`);
                imported++;
                
            } catch (error) {
                console.error(`❌ Error importing ${movieData.title}:`, error.message);
            }
        }
        
        console.log(`\n📊 Movies Import Summary for ${vjName}:`);
        console.log(`   Imported: ${imported}`);
        console.log(`   Skipped: ${skipped}`);
        console.log(`   Total: ${moviesData.length}\n`);
        
        return imported;
        
    } catch (error) {
        console.error(`❌ Error importing movies for ${vjName}:`, error.message);
        return 0;
    }
}

// Import all movies from all VJs
async function importAllMovies(moviesPerVJ = 50) {
    try {
        console.log('\n📥 Importing all movies from all VJs...\n');
        
        // Get all VJs from database
        const vjs = await VJ.find({ active: true });
        console.log(`Found ${vjs.length} VJs in database\n`);
        
        let totalImported = 0;
        
        for (const vj of vjs) {
            const imported = await importMoviesForVJ(vj.name, vj.slug, moviesPerVJ);
            totalImported += imported;
            
            // Update VJ stats
            const movieCount = await LugandaMovie.countDocuments({ vjName: vj.name });
            await VJ.findByIdAndUpdate(vj._id, {
                'stats.totalMovies': movieCount
            });
        }
        
        console.log(`\n🎉 Total movies imported: ${totalImported}\n`);
        return totalImported;
        
    } catch (error) {
        console.error('❌ Error importing all movies:', error.message);
        return 0;
    }
}

// Import trending movies
async function importTrendingMovies(limit = 20) {
    try {
        console.log('\n📥 Importing trending movies...\n');
        
        const trendingData = await kpSoundsScraper.getTrendingMovies(limit);
        console.log(`Found ${trendingData.length} trending movies\n`);
        
        let updated = 0;
        
        for (const movieData of trendingData) {
            try {
                // Find and update movie to mark as trending
                const movie = await LugandaMovie.findOne({ 
                    originalTitle: { $regex: movieData.title, $options: 'i' }
                });
                
                if (movie) {
                    movie.trending = true;
                    movie.views = movieData.views || movie.views;
                    await movie.save();
                    console.log(`✅ Marked as trending: ${movie.originalTitle}`);
                    updated++;
                } else {
                    console.log(`⏭️  Not found in database: ${movieData.title}`);
                }
                
            } catch (error) {
                console.error(`❌ Error updating ${movieData.title}:`, error.message);
            }
        }
        
        console.log(`\n📊 Trending Update Summary:`);
        console.log(`   Updated: ${updated}`);
        console.log(`   Total: ${trendingData.length}\n`);
        
        return updated;
        
    } catch (error) {
        console.error('❌ Error importing trending movies:', error.message);
        return 0;
    }
}

// Main import function
async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   Kp Sounds Watch → Luganda Movies Database Import    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    try {
        // Connect to database
        await connectDB();
        
        // Get command line arguments
        const args = process.argv.slice(2);
        const command = args[0] || 'all';
        const limit = parseInt(args[1]) || 50;
        
        console.log(`Command: ${command}`);
        console.log(`Limit: ${limit} movies per VJ\n`);
        
        let totalImported = 0;
        
        switch (command) {
            case 'vjs':
                // Import only VJs
                totalImported = await importVJs();
                break;
                
            case 'movies':
                // Import only movies (VJs must exist)
                totalImported = await importAllMovies(limit);
                break;
                
            case 'trending':
                // Update trending status
                totalImported = await importTrendingMovies(limit);
                break;
                
            case 'all':
            default:
                // Import everything
                const vjsImported = await importVJs();
                const moviesImported = await importAllMovies(limit);
                const trendingUpdated = await importTrendingMovies(20);
                totalImported = vjsImported + moviesImported + trendingUpdated;
                break;
        }
        
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                   Import Complete!                     ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log(`✅ Total items processed: ${totalImported}\n`);
        
        // Show database stats
        const vjCount = await VJ.countDocuments();
        const movieCount = await LugandaMovie.countDocuments();
        const publishedCount = await LugandaMovie.countDocuments({ status: 'published' });
        
        console.log('📊 Database Statistics:');
        console.log(`   VJs: ${vjCount}`);
        console.log(`   Total Movies: ${movieCount}`);
        console.log(`   Published Movies: ${publishedCount}`);
        console.log(`   Trending Movies: ${await LugandaMovie.countDocuments({ trending: true })}`);
        console.log(`   Featured Movies: ${await LugandaMovie.countDocuments({ featured: true })}\n`);
        
    } catch (error) {
        console.error('\n❌ Import failed:', error.message);
        console.error(error.stack);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('✅ Database connection closed\n');
    }
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    importVJs,
    importMoviesForVJ,
    importAllMovies,
    importTrendingMovies
};
