const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Movie = require('./models/LugandaMovie');
    
    // Find movies with any video URL
    const movies = await Movie.find({
        $or: [
            { embedUrl: { $exists: true, $ne: null, $ne: '' } },
            { 'video.embedUrl': { $exists: true, $ne: null, $ne: '' } },
            { 'video.originalVideoPath': { $regex: /archive\.org|streamtape/i } }
        ]
    }).select('originalTitle embedUrl video.embedUrl video.originalVideoPath').limit(20).lean();
    
    console.log('Movies with video URLs:', movies.length);
    movies.forEach(m => {
        console.log('---');
        console.log('Title:', m.originalTitle);
        console.log('embedUrl:', m.embedUrl || 'none');
        console.log('video.embedUrl:', m.video?.embedUrl || 'none');
        console.log('video.originalVideoPath:', m.video?.originalVideoPath || 'none');
    });
    
    mongoose.disconnect();
});
