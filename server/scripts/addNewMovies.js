const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected!');
  const Movie = require('../models/Movie');
  
  // Update Predator: Badlands video URL (VJ Emmy version)
  const predatorUpdate = await Movie.findOneAndUpdate(
    { slug: { $regex: /predator.*badlands/i } },
    { 
      $set: { 
        'video.url': 'https://streamtape.com/e/01Jewvl11Jibre3/Predator.Badlands.part_01.mkv.mp4',
        'video.quality': 'hd'
      }
    },
    { new: true }
  );
  if (predatorUpdate) {
    console.log('Updated Predator Badlands video URL:', predatorUpdate.title);
  } else {
    console.log('Predator Badlands not found in database');
  }
  
  // Add Now You See Me (2013)
  const nysmExists = await Movie.findOne({ title: 'Now You See Me' });
  if (!nysmExists) {
    const nysm = new Movie({
      title: 'Now You See Me',
      slug: 'now-you-see-me',
      description: 'An FBI agent and an Interpol detective track a team of illusionists who pull off bank heists during their performances and reward their audiences with the money.',
      year: 2013,
      duration: 115,
      rating: { imdb: 7.3, userRating: 0, totalRatings: 0 },
      genres: ['thriller', 'crime', 'mystery'],
      cast: [
        { name: 'Jesse Eisenberg', character: 'J. Daniel Atlas', image: 'https://image.tmdb.org/t/p/w185/yhaorPvKQmFCMSrtSrg0yjl2wjQ.jpg' },
        { name: 'Mark Ruffalo', character: 'Dylan Rhodes', image: 'https://image.tmdb.org/t/p/w185/z3dvKqMNDQWk3QLxzumloQVR0pv.jpg' },
        { name: 'Woody Harrelson', character: 'Merritt McKinney', image: 'https://image.tmdb.org/t/p/w185/s5sMSdJV9PiRbUlsQBfYkJLEKPY.jpg' },
        { name: 'Morgan Freeman', character: 'Thaddeus Bradley', image: 'https://image.tmdb.org/t/p/w185/jPsLqiYGSofU4s6BjrxnefMfabb.jpg' },
        { name: 'Michael Caine', character: 'Arthur Tressler', image: 'https://image.tmdb.org/t/p/w185/hZruclwEPCKzA0EV1FUBLol3rff.jpg' }
      ],
      director: 'Louis Leterrier',
      language: 'English',
      country: 'USA',
      poster: 'https://image.tmdb.org/t/p/w500/tWsNYjWrFkFPjO4ojLSwl3VYvxQ.jpg',
      backdrop: 'https://image.tmdb.org/t/p/original/jH4mcUoDMcWBVylrCtoL67VjE2N.jpg',
      video: {
        url: 'https://streamtape.com/e/W6LOGM4A07FbbzJ/Now_You_See_Me_by_Vj_Junior.mp4',
        quality: 'hd',
        size: 0,
        duration: 0
      },
      vj: { name: 'VJ Junior', isVerified: true },
      status: 'published',
      views: 0,
      featured: false
    });
    await nysm.save();
    console.log('Added: Now You See Me');
  } else {
    console.log('Now You See Me already exists');
  }
  
  const count = await Movie.countDocuments();
  console.log('Total movies:', count);
  
  mongoose.disconnect();
}).catch(err => console.error(err));
