const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

const schema = new mongoose.Schema({
    originalTitle: String,
    video: { embedUrl: String, provider: String, quality: String, originalVideoPath: String }
}, { collection: 'lugandamovies' });

const Movie = mongoose.model('LugandaMovie', schema);

async function updateMovie() {
    await mongoose.connect(MONGODB_URI);
    
    const result = await Movie.findOneAndUpdate(
        { originalTitle: { $regex: 'great battle', $options: 'i' } },
        { 
            $set: { 
                'video.embedUrl': 'https://streamtape.com/e/ggzPYa3Q2AuqWkz/The_great_battle.mp4',
                'video.provider': 'streamtape',
                'video.quality': 'hd',
                'video.originalVideoPath': 'streamtape'
            } 
        },
        { new: true }
    );
    
    if (result) {
        console.log('✅ Updated: ' + result.originalTitle);
        console.log('   Stream: ' + result.video.embedUrl);
    } else {
        console.log('❌ The Great Battle not found in database');
    }
    
    await mongoose.connection.close();
}

updateMovie().catch(console.error);
