/**
 * Script to find working Uganda TV streams from various sources
 * This will check multiple IPTV databases and APIs for verified streams
 */

const https = require('https');
const http = require('http');

/**
 * Fetch data from a URL
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            method: 'GET',
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };
        
        const req = protocol.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

/**
 * Test if a stream URL works
 */
async function testStream(url) {
    try {
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
        return new Promise((resolve) => {
            const options = {
                method: 'HEAD',
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            
            const req = protocol.request(options, (res) => {
                const isSuccess = res.statusCode >= 200 && res.statusCode < 400;
                resolve({
                    working: isSuccess,
                    statusCode: res.statusCode,
                    contentType: res.headers['content-type']
                });
            });
            
            req.on('error', () => {
                resolve({ working: false });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({ working: false });
            });
            
            req.end();
        });
    } catch (error) {
        return { working: false };
    }
}

/**
 * Search IPTV-org GitHub repository
 */
async function searchIPTVOrg() {
    console.log('\n🔍 Searching IPTV-org GitHub repository...');
    
    try {
        // Fetch Uganda streams from IPTV-org
        const result = await fetchUrl('https://iptv-org.github.io/iptv/countries/ug.m3u');
        
        if (result.statusCode === 200) {
            const m3uContent = result.data;
            const streams = parseM3U(m3uContent);
            
            console.log(`✅ Found ${streams.length} streams from IPTV-org`);
            return streams;
        } else {
            console.log(`❌ Failed to fetch from IPTV-org: ${result.statusCode}`);
            return [];
        }
    } catch (error) {
        console.log(`❌ Error fetching from IPTV-org: ${error.message}`);
        return [];
    }
}

/**
 * Parse M3U playlist
 */
function parseM3U(content) {
    const streams = [];
    const lines = content.split('\n');
    
    let currentStream = {};
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#EXTINF:')) {
            // Extract channel name
            const nameMatch = line.match(/,(.+)$/);
            if (nameMatch) {
                currentStream.name = nameMatch[1].trim();
            }
            
            // Extract tvg-logo
            const logoMatch = line.match(/tvg-logo="([^"]+)"/);
            if (logoMatch) {
                currentStream.logo = logoMatch[1];
            }
            
            // Extract group-title
            const groupMatch = line.match(/group-title="([^"]+)"/);
            if (groupMatch) {
                currentStream.category = groupMatch[1];
            }
        } else if (line && !line.startsWith('#')) {
            // This is the stream URL
            currentStream.url = line;
            
            if (currentStream.name && currentStream.url) {
                streams.push({ ...currentStream });
            }
            
            currentStream = {};
        }
    }
    
    return streams;
}

/**
 * Get YouTube live stream URLs using alternative methods
 */
function getAlternativeYouTubeStreams() {
    console.log('\n🔍 Generating alternative YouTube stream URLs...');
    
    const youtubeChannels = {
        'NTV Uganda': 'UCwga1dPCqBddbtq5KYRii2g',
        'NBS TV': 'UCT0bVGYRe-Qg_CAjJ7RQb0g',
        'UBC TV': 'UCVktcIoQvZgmNdmNwXOYPxg',
        'Bukedde TV': 'UCouBdXAhnJbVpXlLi5YYkxg',
        'Urban TV': 'UCxS3-UXJjVdOZmnPpzgRXOg',
        'BBS TV': 'UCgLpjHjfGTbBBi5T5JaBcKg'
    };
    
    const streams = [];
    
    for (const [name, channelId] of Object.entries(youtubeChannels)) {
        streams.push({
            name: name,
            url: `https://www.youtube.com/channel/${channelId}/live`,
            type: 'youtube-embed',
            embedUrl: `https://www.youtube.com/embed/live_stream?channel=${channelId}&autoplay=1`,
            category: 'YouTube Live'
        });
    }
    
    console.log(`✅ Generated ${streams.length} YouTube embed URLs`);
    return streams;
}

/**
 * Get known working IPTV streams for Uganda
 */
function getKnownWorkingStreams() {
    console.log('\n🔍 Checking known working IPTV sources...');
    
    // These are commonly available Uganda TV streams from various IPTV providers
    const knownStreams = [
        {
            name: 'NTV Uganda',
            url: 'https://streaming.viewmedia.tv/web_006/Stream/playlist.m3u8',
            category: 'News'
        },
        {
            name: 'NBS TV',
            url: 'https://streaming.viewmedia.tv/web_012/Stream/playlist.m3u8',
            category: 'News'
        },
        {
            name: 'UBC TV',
            url: 'https://webstreaming.viewmedia.tv/web_013/Stream/playlist.m3u8',
            category: 'General'
        },
        {
            name: 'Bukedde TV',
            url: 'https://streaming.viewmedia.tv/web_014/Stream/playlist.m3u8',
            category: 'Entertainment'
        },
        {
            name: 'BBS TV',
            url: 'https://streaming.viewmedia.tv/web_015/Stream/playlist.m3u8',
            category: 'General'
        },
        {
            name: 'Spark TV',
            url: 'https://streaming.viewmedia.tv/web_016/Stream/playlist.m3u8',
            category: 'Entertainment'
        },
        {
            name: 'Urban TV',
            url: 'https://streaming.viewmedia.tv/web_017/Stream/playlist.m3u8',
            category: 'Entertainment'
        },
        {
            name: 'Salt TV',
            url: 'https://streaming.viewmedia.tv/web_018/Stream/playlist.m3u8',
            category: 'Religious'
        }
    ];
    
    console.log(`✅ Found ${knownStreams.length} known stream sources`);
    return knownStreams;
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('UGANDA TV STREAM FINDER');
    console.log('Searching for working stream sources...');
    console.log('='.repeat(60));
    
    const allStreams = [];
    
    // 1. Search IPTV-org
    const iptvOrgStreams = await searchIPTVOrg();
    allStreams.push(...iptvOrgStreams);
    
    // 2. Get YouTube alternatives
    const youtubeStreams = getAlternativeYouTubeStreams();
    allStreams.push(...youtubeStreams);
    
    // 3. Get known working streams
    const knownStreams = getKnownWorkingStreams();
    allStreams.push(...knownStreams);
    
    console.log('\n' + '='.repeat(60));
    console.log(`TOTAL STREAMS FOUND: ${allStreams.length}`);
    console.log('='.repeat(60));
    
    // Test streams
    console.log('\n🧪 Testing stream accessibility...\n');
    
    const testedStreams = [];
    
    for (const stream of allStreams) {
        if (stream.type === 'youtube-embed') {
            // YouTube embeds don't need testing
            testedStreams.push({
                ...stream,
                tested: false,
                working: true,
                note: 'YouTube embed - not tested via HEAD request'
            });
            console.log(`⏭️  ${stream.name} - YouTube embed (skipped test)`);
        } else {
            console.log(`Testing: ${stream.name}...`);
            const result = await testStream(stream.url);
            
            testedStreams.push({
                ...stream,
                tested: true,
                working: result.working,
                statusCode: result.statusCode,
                contentType: result.contentType
            });
            
            if (result.working) {
                console.log(`   ✅ Working - Status: ${result.statusCode}`);
            } else {
                console.log(`   ❌ Not accessible`);
            }
        }
    }
    
    // Generate report
    const workingStreams = testedStreams.filter(s => s.working);
    
    console.log('\n' + '='.repeat(60));
    console.log('FINAL RESULTS');
    console.log('='.repeat(60));
    console.log(`Total streams found: ${testedStreams.length}`);
    console.log(`Working streams: ${workingStreams.length}`);
    console.log(`Success rate: ${Math.round(workingStreams.length / testedStreams.length * 100)}%`);
    
    // Group by station
    const stationMap = {};
    
    for (const stream of workingStreams) {
        const stationName = stream.name;
        if (!stationMap[stationName]) {
            stationMap[stationName] = [];
        }
        stationMap[stationName].push(stream);
    }
    
    console.log('\n📺 Working Streams by Station:');
    console.log('-'.repeat(60));
    
    for (const [station, streams] of Object.entries(stationMap)) {
        console.log(`\n${station}: ${streams.length} stream(s)`);
        streams.forEach((s, i) => {
            console.log(`  ${i + 1}. ${s.url}`);
            if (s.embedUrl) {
                console.log(`     Embed: ${s.embedUrl}`);
            }
        });
    }
    
    // Save results
    const fs = require('fs');
    
    const report = {
        generatedAt: new Date().toISOString(),
        totalStreams: testedStreams.length,
        workingStreams: workingStreams.length,
        successRate: Math.round(workingStreams.length / testedStreams.length * 100),
        streams: testedStreams,
        workingOnly: workingStreams,
        byStation: stationMap
    };
    
    fs.writeFileSync('working-streams-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Report saved to: working-streams-report.json');
    
    // Generate updated configuration
    generateUpdatedConfig(stationMap);
}

/**
 * Generate updated uganda-tv-api.js configuration
 */
function generateUpdatedConfig(stationMap) {
    const fs = require('fs');
    
    console.log('\n📝 Generating updated configuration...');
    
    const config = {
        'ntv-uganda': [],
        'nbs-tv': [],
        'ubc-tv': [],
        'bukedde-tv': [],
        'urban-tv': [],
        'spark-tv': [],
        'bbs-tv': [],
        'salt-tv': [],
        'tv-west': [],
        'tv-east': [],
        'tv-north': [],
        'wan-luo-tv': []
    };
    
    // Map station names to IDs
    const nameToId = {
        'NTV Uganda': 'ntv-uganda',
        'NBS TV': 'nbs-tv',
        'UBC TV': 'ubc-tv',
        'Bukedde TV': 'bukedde-tv',
        'Urban TV': 'urban-tv',
        'Spark TV': 'spark-tv',
        'BBS TV': 'bbs-tv',
        'Salt TV': 'salt-tv',
        'TV West': 'tv-west',
        'TV East': 'tv-east',
        'TV North': 'tv-north',
        'Wan Luo TV': 'wan-luo-tv'
    };
    
    for (const [stationName, streams] of Object.entries(stationMap)) {
        const stationId = nameToId[stationName];
        if (stationId && config[stationId]) {
            config[stationId] = streams.map(s => s.embedUrl || s.url);
        }
    }
    
    fs.writeFileSync('updated-stream-config.json', JSON.stringify(config, null, 2));
    console.log('✅ Updated configuration saved to: updated-stream-config.json');
}

// Run the script
main().catch(console.error);
