require('dotenv').config();
const mongoose = require('mongoose');

async function removeStreamtape() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const collection = db.collection('lugandamovies');
    
    // Find all movies with Streamtape URLs
    const streamtapeMovies = await collection.find({
        'video.originalVideoPath': { $regex: 'streamtape', $options: 'i' }
    }).toArray();
    
    console.log(`Found ${streamtapeMovies.length} movies with Streamtape URLs:\n`);
    streamtapeMovies.forEach(m => {
        console.log(`- ${m.originalTitle}`);
        console.log(`  URL: ${m.video.originalVideoPath}`);
    });
    
    if (streamtapeMovies.length === 0) {
        console.log('No Streamtape URLs to remove.');
        await mongoose.disconnect();
        return;
    }
    
    console.log('\n--- Removing Streamtape URLs ---\n');
    
    // Update: set originalVideoPath back to 'pending-upload'
    const result = await collection.updateMany(
        { 'video.originalVideoPath': { $regex: 'streamtape', $options: 'i' } },
        { 
            $set: { 
                'video.originalVideoPath': 'pending-upload',
                'hosting.provider': 'local',
                'hosting.url': null,
                'hosting.streamUrl': null
            }
        }
    );
    
    console.log(`✅ Cleared Streamtape URLs from ${result.modifiedCount} movies`);
    console.log('\nThese movies are now ready for new Archive.org URLs.');
    
    await mongoose.disconnect();
    console.log('\nDone!');
}

removeStreamtape().catch(console.error);
