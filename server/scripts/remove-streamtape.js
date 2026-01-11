/**
 * Script to remove Streamtape URLs from all movies
 * Run with: node scripts/remove-streamtape.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function removeStreamtapeUrls() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const db = mongoose.connection.db;
        const collection = db.collection('lugandamovies');
        
        // First, let's see all movies with any video URL set
        const allMoviesWithVideo = await collection.find({
            $or: [
                { video: { $exists: true, $ne: null, $ne: '' } },
                { 'videoSource.url': { $exists: true, $ne: null, $ne: '' } },
                { 'videoSources': { $exists: true, $ne: [] } }
            ]
        }).toArray();
        
        console.log(`\nMovies with any video URL: ${allMoviesWithVideo.length}`);
        
        // Find movies with Streamtape URLs in any field
        const moviesWithStreamtape = await collection.find({
            $or: [
                { video: { $regex: 'streamtape', $options: 'i' } },
                { 'videoSource.url': { $regex: 'streamtape', $options: 'i' } },
                { 'videoSources.url': { $regex: 'streamtape', $options: 'i' } }
            ]
        }).toArray();
        
        console.log(`\nFound ${moviesWithStreamtape.length} movies with Streamtape URLs:\n`);
        
        for (const movie of moviesWithStreamtape) {
            console.log(`- ${movie.originalTitle}`);
            if (movie.video) {
                console.log(`  video: ${movie.video}`);
            }
            if (movie.videoSource?.url) {
                console.log(`  videoSource: ${movie.videoSource.url}`);
            }
            if (movie.videoSources?.length) {
                movie.videoSources.forEach((vs, i) => {
                    console.log(`  videoSources[${i}]: ${vs.url}`);
                });
            }
        }
        
        if (moviesWithStreamtape.length === 0) {
            console.log('No movies with Streamtape URLs found.');
            
            // Show what videos do exist
            console.log('\n--- Current video URLs in database ---');
            for (const movie of allMoviesWithVideo.slice(0, 10)) {
                if (movie.video) {
                    console.log(`- ${movie.originalTitle}: ${movie.video}`);
                }
            }
            
            await mongoose.disconnect();
            return;
        }
        
        console.log('\n--- Removing Streamtape URLs ---\n');
        
        // Update movies: clear video field if it's Streamtape
        const result1 = await collection.updateMany(
            { video: { $regex: 'streamtape', $options: 'i' } },
            { $set: { video: '' } }
        );
        console.log(`Cleared video field from ${result1.modifiedCount} movies`);
        
        // Update movies: clear videoSource if it's Streamtape
        const result2 = await collection.updateMany(
            { 'videoSource.url': { $regex: 'streamtape', $options: 'i' } },
            { 
                $set: { 
                    'videoSource.url': '',
                    'videoSource.type': ''
                }
            }
        );
        console.log(`Cleared videoSource from ${result2.modifiedCount} movies`);
        
        // Update movies: remove Streamtape entries from videoSources array
        const result3 = await collection.updateMany(
            { 'videoSources.url': { $regex: 'streamtape', $options: 'i' } },
            { 
                $pull: { 
                    videoSources: { url: { $regex: 'streamtape', $options: 'i' } }
                }
            }
        );
        console.log(`Removed Streamtape from videoSources in ${result3.modifiedCount} movies`);
        
        console.log('\n✅ Streamtape URLs removed successfully!');
        console.log('You can now add new Archive.org URLs to these movies.');
        
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

removeStreamtapeUrls();
