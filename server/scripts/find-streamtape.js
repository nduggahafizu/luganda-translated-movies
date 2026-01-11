require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Check hosting field
    const moviesWithHosting = await db.collection('lugandamovies').find({ 
        hosting: { $exists: true, $ne: null } 
    }).limit(5).toArray();
    
    console.log('Movies with hosting field:\n');
    moviesWithHosting.forEach(m => {
        console.log(`${m.originalTitle}:`);
        console.log(JSON.stringify(m.hosting, null, 2));
        console.log('---');
    });
    
    // Find streamtape in hosting
    const streamtapeInHosting = await db.collection('lugandamovies').find({
        $or: [
            { 'hosting.url': { $regex: 'streamtape', $options: 'i' } },
            { 'hosting.embedUrl': { $regex: 'streamtape', $options: 'i' } },
            { 'hosting.provider': { $regex: 'streamtape', $options: 'i' } }
        ]
    }).toArray();
    
    console.log(`\nMovies with Streamtape in hosting: ${streamtapeInHosting.length}`);
    streamtapeInHosting.forEach(m => {
        console.log(`- ${m.originalTitle}:`);
        console.log(JSON.stringify(m.hosting, null, 2));
    });
    
    // Also check video.originalVideoPath for streamtape
    const streamtapeInVideoPath = await db.collection('lugandamovies').find({
        'video.originalVideoPath': { $regex: 'streamtape', $options: 'i' }
    }).toArray();
    
    console.log(`\nMovies with Streamtape in video.originalVideoPath: ${streamtapeInVideoPath.length}`);
    
    mongoose.disconnect();
}).catch(console.error);
