// Node.js script to add movies with VJ and TMDB poster
// Requires TMDB API key in environment variable TMDB_API_KEY
const fs = require('fs');
const https = require('https');
const path = require('path');

const MOVIES = [
  { "title": "Tommy Boy", "vj": "Vj Emmy" },
  { "title": "To the Limit", "vj": "Vj Emmy" },
  { "title": "Secret Admirer", "vj": "Vj Emmy" },
  { "title": "Prom Night", "vj": "Vj Emmy" },
  { "title": "Hunting Jessica Brok", "vj": "VJ ICE P" },
  { "title": "Desert Lone Hero", "vj": "VJ ICE P" },
  { "title": "Cobra", "vj": "VJ EMMY" },
  { "title": "Madharaasi", "vj": "Vj ICE P" },
  { "title": "Office Christmas Party", "vj": "Vj Junior" },
  { "title": "Now You See Me 3: Now You Don't", "vj": "VJ JUNIOR" },
  { "title": "Basic Instinct", "vj": "Vj Junior" },
  { "title": "A Christmas Treasure", "vj": "Vj Junior" },
  { "title": "Welcome Home Roscoe Jenkins", "vj": "Vj Junior" },
  { "title": "Waiting to Exhale", "vj": "Vj Junior" },
  { "title": "Sisu 2: Road to Revenge", "vj": "VJ JUNIOR" },
  { "title": "Margaux", "vj": "Vj Junior" },
  { "title": "Predator: Badlands", "vj": "VJ EMMY" },
  { "title": "Muzzle: City of Wolves", "vj": "VJ EMMY" },
  { "title": "Dracula", "vj": "Vj Emmy" },
  { "title": "A Jazzman's Blues", "vj": "Vj Junior" },
  { "title": "The Thomas Crown Affair", "vj": "Vj Junior" },
  { "title": "Walking on Thin Ice", "vj": "VJ FREDY" },
  { "title": "Alex Rider", "vj": "Vj Ice P" },
  { "title": "Mr. Queen", "vj": "VJ Sammy" },
  { "title": "Coyote", "vj": "Vj Baros" },
  { "title": "Man vs Baby", "vj": "VJ JUNIOR" },
  { "title": "Rabbit Hole", "vj": "Vj Junior" },
  { "title": "Genie, Make a Wish", "vj": "Vj M.K" },
  { "title": "Chasing in the Wild", "vj": "VJ BONNY" },
  { "title": "Dear X", "vj": "VJ LIGHT" },
  { "title": "Last Samurai Standing", "vj": "VJ ICE P" }
];

const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error('TMDB_API_KEY not set in environment.');
  process.exit(1);
}

function searchTMDB(title) {
  return new Promise((resolve) => {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.results && json.results.length > 0) {
            resolve(json.results[0].poster_path ? `https://image.tmdb.org/t/p/w500${json.results[0].poster_path}` : null);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

(async () => {
  const results = [];
  for (const movie of MOVIES) {
    const poster = await searchTMDB(movie.title);
    results.push({ ...movie, poster });
    console.log(`${movie.title} (${movie.vj}): ${poster ? poster : 'No poster found'}`);
  }
  fs.writeFileSync('playlist-data.json', JSON.stringify(results, null, 2));
  console.log('playlist-data.json updated.');
})();
