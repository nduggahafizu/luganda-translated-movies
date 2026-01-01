/**
 * Update Production Database Movie Posters
 * Fetches real poster URLs from TMDB and updates the production database
 */

const https = require('https');
const http = require('http');

const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI3NzEzYzkxMGI5NTAzYTFkYTBkMGU2ZTQ0OGJmODkwZSIsIm5iZiI6MTc2NTM2NzkxNS4wNDQsInN1YiI6IjY5Mzk2MDZiMDVjNWU1ODRkMmViMmMwMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.XIEb1EqUvntduCCKYVYzMrBfj0KhXkBI8gXEdkqbiz4';
const PRODUCTION_API = 'https://luganda-translated-movies-production.up.railway.app';

function httpsGet(url, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Accept': 'application/json',
                ...headers
            }
        };
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

function httpsPatch(url, body) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify(body));
        req.end();
    });
}

async function searchTMDB(title, year) {
    const query = encodeURIComponent(title.replace(/ - Luganda$/, '').replace(/ Part \d+.*$/, '').replace(/ Hindi$/, ''));
    const url = `https://api.themoviedb.org/3/search/movie?query=${query}&year=${year}`;
    
    const result = await httpsGet(url, {
        'Authorization': `Bearer ${TMDB_TOKEN}`
    });
    
    if (result.results && result.results.length > 0) {
        return result.results[0];
    }
    
    // Try without year
    const url2 = `https://api.themoviedb.org/3/search/movie?query=${query}`;
    const result2 = await httpsGet(url2, {
        'Authorization': `Bearer ${TMDB_TOKEN}`
    });
    
    if (result2.results && result2.results.length > 0) {
        return result2.results[0];
    }
    
    return null;
}

function generatePlaceholder(title, year) {
    const colors = ['7CFC00', 'FF6B6B', '4ECDC4', 'FFE66D', 'A855F7', 'EC4899', '06B6D4', 'F97316'];
    const colorIndex = (title || '').length % colors.length;
    const color = colors[colorIndex];
    const displayTitle = (title || 'Movie').substring(0, 15);
    return `https://placehold.co/500x750/1a1a2e/${color}?text=${encodeURIComponent(displayTitle)}`;
}

async function main() {
    console.log('🎬 Fetching movies from production database...');
    
    // Fetch all movies from production
    const moviesResponse = await httpsGet(`${PRODUCTION_API}/api/movies/fetch?limit=100`);
    
    if (!moviesResponse.success) {
        console.error('Failed to fetch movies');
        return;
    }
    
    const movies = moviesResponse.movies;
    console.log(`📊 Found ${movies.length} movies to process\n`);
    
    const updates = [];
    const notFound = [];
    
    for (const movie of movies) {
        const title = movie.title;
        const year = movie.year;
        
        console.log(`🔍 Searching: "${title}" (${year})...`);
        
        try {
            const tmdbResult = await searchTMDB(title, year);
            
            if (tmdbResult && tmdbResult.poster_path) {
                const posterUrl = `https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}`;
                updates.push({
                    id: movie.row_id,
                    title: title,
                    poster: posterUrl,
                    tmdb_id: tmdbResult.id
                });
                console.log(`   ✅ Found: ${tmdbResult.title} -> ${tmdbResult.poster_path}`);
            } else {
                const placeholder = generatePlaceholder(title, year);
                notFound.push({
                    id: movie.row_id,
                    title: title,
                    poster: placeholder
                });
                console.log(`   ⚠️ Not found, using placeholder`);
            }
            
            // Rate limit
            await new Promise(r => setTimeout(r, 250));
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            notFound.push({
                id: movie.row_id,
                title: title,
                poster: generatePlaceholder(title, year)
            });
        }
    }
    
    console.log('\n📝 SUMMARY:');
    console.log(`   ✅ Found on TMDB: ${updates.length}`);
    console.log(`   ⚠️ Using placeholders: ${notFound.length}`);
    
    // Output the poster URLs for manual update or API update
    console.log('\n📋 POSTER UPDATES (Copy for MongoDB):');
    console.log('='.repeat(60));
    
    const allUpdates = [...updates, ...notFound];
    
    // Generate MongoDB update commands
    for (const update of allUpdates) {
        console.log(`db.lugandamovies.updateOne({_id: ObjectId("${update.id}")}, {$set: {poster: "${update.poster}"}})`);
    }
    
    console.log('\n✅ Done! Copy the commands above and run them in MongoDB.');
}

main().catch(console.error);
