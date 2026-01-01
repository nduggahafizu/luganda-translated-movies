const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority')
.then(async () => {
    // Update The Great Battle
    const result1 = await mongoose.connection.db.collection('lugandamovies').updateOne(
        { _id: new mongoose.Types.ObjectId('695676535308c2a9efc5451a') },
        { $set: { 'video.embedUrl': 'https://streamtape.com/e/ggzPYa3Q2AuqWkz/The_great_battle.mp4' } }
    );
    console.log('The Great Battle updated:', result1.modifiedCount);
    
    // Update Song of the Assassins
    const result2 = await mongoose.connection.db.collection('lugandamovies').updateOne(
        { _id: new mongoose.Types.ObjectId('6956739c526d5d4bf9d38e91') },
        { $set: { 'video.embedUrl': 'https://streamtape.com/e/8J1MmpAjBGtlb8/code_of_the_assassins.mp4' } }
    );
    console.log('Song of the Assassins updated:', result2.modifiedCount);
    
    mongoose.connection.close();
    console.log('Done!');
}).catch(e => console.error(e));
