const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const Movie = require('./models/LugandaMovie');
    
    // Fix invalid URLs (those with spaces or too short)
    const result = await Movie.updateMany(
        { 
            $or: [
                { 'video.embedUrl': 'http:// archive.org' },
                { 'video.embedUrl': 'https:// archive.org' },
                { 'video.embedUrl': { $regex: /^https?:\/\/\s+/ } }
            ]
        }, 
        { 
            $set: { 
                'video.embedUrl': null, 
                'video.originalVideoPath': 'pending-upload' 
            }
        }
    );
    
    console.log('Fixed invalid URLs:', result.modifiedCount);
    mongoose.disconnect();
});
