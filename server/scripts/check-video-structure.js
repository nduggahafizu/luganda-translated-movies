require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    const movies = await db.collection('lugandamovies').find({ video: { $exists: true } }).limit(5).toArray();
    
    console.log('Video field structure examples:\n');
    movies.forEach(m => {
        console.log(`${m.originalTitle}:`);
        console.log(JSON.stringify(m.video, null, 2));
        console.log('---');
    });
    
    // Check for streamtape in video.url
    const streamtapeMovies = await db.collection('lugandamovies').find({
        'video.url': { $regex: 'streamtape', $options: 'i' }
    }).toArray();
    
    console.log(`\nMovies with Streamtape in video.url: ${streamtapeMovies.length}`);
    streamtapeMovies.forEach(m => {
        console.log(`- ${m.originalTitle}: ${m.video.url}`);
    });
    
    mongoose.disconnect();
}).catch(console.error);
