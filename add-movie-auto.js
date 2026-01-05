// Script to auto-add a movie to the database using TMDB data and S3 video
require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const LugandaMovie = require('./server/models/LugandaMovie');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Movie details
const originalTitle = "The Shadow's Edge";
const year = 2025;
const videoKey = "THE_SHADOW'S_EDGE_2025_JR_1080p_MR_NO'S_ENT_0766009748.mp4";
const vjName = "VJ Junior";
const duration = 120;
const genres = ["action", "thriller"];
const description = "A thrilling action movie...";
const director = "John Doe";

async function fetchTmdbData(title, year) {
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
  const res = await axios.get(url);
  if (res.data.results && res.data.results.length > 0) {
    const movie = res.data.results[0];
    return {
      tmdbId: movie.id,
      imdbId: movie.imdb_id || '',
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : '',
      description: movie.overview || description
    };
  }
  return { tmdbId: '', imdbId: '', poster: '', description };
}

async function addMovie() {
  await mongoose.connect(MONGODB_URI);
  const tmdbData = await fetchTmdbData(originalTitle, year);
  const newMovie = new LugandaMovie({
    originalTitle,
    vjName,
    year,
    duration,
    description: tmdbData.description,
    director,
    poster: tmdbData.poster,
    genres,
    video: {
      originalVideoPath: `s3://${process.env.AWS_S3_BUCKET}/${videoKey}`,
      provider: 'aws',
      format: 'mp4',
      quality: 'hd'
    },
    metaData: {
      tmdbId: tmdbData.tmdbId,
      imdbId: tmdbData.imdbId
    },
    status: 'published'
  });
  await newMovie.save();
  console.log('Movie added:', newMovie);
  mongoose.disconnect();
}

addMovie().catch(err => {
  console.error('Error adding movie:', err);
  mongoose.disconnect();
});
