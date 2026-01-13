/**
 * Update Archive.org URLs to Direct CDN URLs
 * 
 * This script updates movies in the database to use direct Archive.org CDN URLs
 * instead of embed URLs, which allows the native player to work without CORS issues.
 * 
 * Usage: node update-archive-urls.js
 */

require('dotenv').config({ path: './server/.env' });
const { MongoClient } = require('mongodb');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';

async function getDirectCdnUrl(archiveUrl) {
    if (!archiveUrl) return null;
    
    // If already a CDN URL, return as is
    if (archiveUrl.match(/ia\d+\.us\.archive\.org/)) {
        return archiveUrl;
    }
    
    // Extract item ID from various Archive.org URL formats
    let itemId = null;
    
    if (archiveUrl.includes('archive.org/embed/')) {
        const match = archiveUrl.match(/archive\.org\/embed\/([^\/\?]+)/);
        if (match) itemId = match[1];
    } else if (archiveUrl.includes('archive.org/details/')) {
        const match = archiveUrl.match(/archive\.org\/details\/([^\/\?]+)/);
        if (match) itemId = match[1];
    } else if (archiveUrl.includes('archive.org/download/')) {
        const match = archiveUrl.match(/archive\.org\/download\/([^\/\?]+)/);
        if (match) itemId = match[1];
    }
    
    if (!itemId) {
        console.log('  ⚠️ Could not extract item ID from:', archiveUrl);
        return null;
    }
    
    try {
        // Fetch metadata from Archive.org API
        const metadataUrl = `https://archive.org/metadata/${itemId}`;
        console.log('  📡 Fetching metadata from:', metadataUrl);
        
        const response = await fetch(metadataUrl);
        if (!response.ok) {
            console.log('  ❌ Metadata fetch failed:', response.status);
            return null;
        }
        
        const metadata = await response.json();
        
        // Get the server and directory
        const server = metadata.d1; // e.g., "ia800101.us.archive.org"
        const dir = metadata.dir;   // e.g., "/14/items/item-id"
        
        if (!server || !dir) {
            console.log('  ❌ No server/dir in metadata');
            return null;
        }
        
        // Find the .ia.mp4 file (browser-compatible transcoded version)
        const files = metadata.files || [];
        let mp4File = files.find(f => f.name && f.name.endsWith('.ia.mp4'));
        
        // Fallback to any .mp4 file
        if (!mp4File) {
            mp4File = files.find(f => f.name && f.name.endsWith('.mp4'));
        }
        
        if (!mp4File) {
            console.log('  ❌ No MP4 file found in item');
            return null;
        }
        
        // Construct direct CDN URL
        const directUrl = `https://${server}${dir}/${encodeURIComponent(mp4File.name)}`;
        console.log('  ✅ Direct CDN URL:', directUrl);
        
        return directUrl;
        
    } catch (error) {
        console.log('  ❌ Error fetching metadata:', error.message);
        return null;
    }
}

async function updateMovies() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');
        
        const db = client.db();
        const collection = db.collection('lugandamovies');
        
        // Find all movies with Archive.org URLs that aren't direct CDN URLs
        const movies = await collection.find({
            contentType: 'movie',
            $or: [
                { 'video.embedUrl': { $regex: 'archive.org', $options: 'i' } },
                { 'embedUrl': { $regex: 'archive.org', $options: 'i' } }
            ]
        }).toArray();
        
        console.log(`📦 Found ${movies.length} movies with Archive.org URLs\n`);
        
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        
        for (const movie of movies) {
            console.log(`\n🎬 Processing: ${movie.originalTitle || movie.title}`);
            
            const currentUrl = movie.video?.embedUrl || movie.embedUrl || movie.video?.originalVideoPath;
            
            // Check if already has direct CDN URL
            if (movie.video?.originalVideoPath?.match(/ia\d+\.us\.archive\.org/)) {
                console.log('  ⏭️ Already has direct CDN URL');
                skipped++;
                continue;
            }
            
            // Get direct CDN URL
            const directUrl = await getDirectCdnUrl(currentUrl);
            
            if (directUrl) {
                // Update the movie using raw MongoDB update (bypasses schema validation)
                await collection.updateOne(
                    { _id: movie._id },
                    {
                        $set: {
                            'video.originalVideoPath': directUrl
                        }
                    }
                );
                console.log('  ✅ Updated successfully');
                updated++;
            } else {
                console.log('  ❌ Could not get direct URL');
                failed++;
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('📊 SUMMARY:');
        console.log(`   ✅ Updated: ${updated}`);
        console.log(`   ⏭️ Skipped: ${skipped}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

// Run the script
updateMovies();
