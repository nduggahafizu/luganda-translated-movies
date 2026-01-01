/**
 * Fix movies missing required video.originalVideoPath field
 */
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

async function fixMovies() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');
    
    const collection = mongoose.connection.db.collection('lugandamovies');
    
    // Update movies missing video.originalVideoPath
    const result1 = await collection.updateMany(
        { 'video.originalVideoPath': { $exists: false } },
        { $set: { 'video.originalVideoPath': 'local', 'video.provider': 'local' } }
    );
    console.log(`Updated ${result1.modifiedCount} movies missing video.originalVideoPath`);
    
    // Update movies with null originalVideoPath
    const result2 = await collection.updateMany(
        { 'video.originalVideoPath': null },
        { $set: { 'video.originalVideoPath': 'local' } }
    );
    console.log(`Updated ${result2.modifiedCount} movies with null video.originalVideoPath`);
    
    // Update movies with empty string originalVideoPath
    const result3 = await collection.updateMany(
        { 'video.originalVideoPath': '' },
        { $set: { 'video.originalVideoPath': 'local' } }
    );
    console.log(`Updated ${result3.modifiedCount} movies with empty video.originalVideoPath`);
    
    // Also ensure video object exists for any movies that don't have it
    const result4 = await collection.updateMany(
        { video: { $exists: false } },
        { $set: { video: { originalVideoPath: 'local', provider: 'local', quality: 'hd', format: 'mp4' } } }
    );
    console.log(`Updated ${result4.modifiedCount} movies missing video object entirely`);
    
    // Verify - count movies still missing the field
    const remaining = await collection.countDocuments({
        $or: [
            { 'video.originalVideoPath': { $exists: false } },
            { 'video.originalVideoPath': null },
            { 'video.originalVideoPath': '' }
        ]
    });
    console.log(`\nRemaining movies with missing video.originalVideoPath: ${remaining}`);
    
    await mongoose.connection.close();
    console.log('Done!');
}

fixMovies().catch(console.error);
