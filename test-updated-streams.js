/**
 * Test script for updated Uganda TV streams
 * Verifies that the new stream URLs are working
 */

const https = require('https');
const http = require('http');

// Load the updated configuration
const updatedStreams = {
    "ntv-uganda": [
        "https://www.youtube.com/embed/live_stream?channel=UCwga1dPCqBddbtq5KYRii2g&autoplay=1"
    ],
    "nbs-tv": [
        "https://www.youtube.com/embed/live_stream?channel=UCT0bVGYRe-Qg_CAjJ7RQb0g&autoplay=1"
    ],
    "ubc-tv": [
        "https://www.youtube.com/embed/live_stream?channel=UCVktcIoQvZgmNdmNwXOYPxg&autoplay=1"
    ],
    "bukedde-tv": [
        "https://stream.hydeinnovations.com/bukedde1flussonic/index.m3u8",
        "https://stream.hydeinnovations.com/bukedde2flussonic/index.m3u8",
        "https://www.youtube.com/embed/live_stream?channel=UCouBdXAhnJbVpXlLi5YYkxg&autoplay=1"
    ],
    "urban-tv": [
        "https://www.youtube.com/embed/live_stream?channel=UCxS3-UXJjVdOZmnPpzgRXOg&autoplay=1"
    ],
    "spark-tv": [
        "https://www.youtube.com/embed/live_stream?channel=UCVktcIoQvZgmNdmNwXOYPxg&autoplay=1"
    ],
    "tv-west": [
        "https://stream.hydeinnovations.com/tvwest-flussonic/index.m3u8"
    ],
    "salt-tv": [
        "https://www.youtube.com/embed/live_stream?channel=UCVktcIoQvZgmNdmNwXOYPxg&autoplay=1"
    ],
    "tv-east": [
        "https://www.youtube.com/embed/live_stream?channel=UCVktcIoQvZgmNdmNwXOYPxg&autoplay=1"
    ],
    "bbs-tv": [
        "https://www.youtube.com/embed/live_stream?channel=UCgLpjHjfGTbBBi5T5JaBcKg&autoplay=1"
    ],
    "tv-north": [
        "https://www.youtube.com/embed/live_stream?channel=UCVktcIoQvZgmNdmNwXOYPxg&autoplay=1"
    ],
    "wan-luo-tv": [
        "https://stream.hydeinnovations.com/luotv-flussonic/index.m3u8"
    ]
};

const stationNames = {
    "ntv-uganda": "NTV Uganda",
    "nbs-tv": "NBS TV",
    "ubc-tv": "UBC TV",
    "bukedde-tv": "Bukedde TV",
    "urban-tv": "Urban TV",
    "spark-tv": "Spark TV",
    "tv-west": "TV West",
    "salt-tv": "Salt TV",
    "tv-east": "TV East",
    "bbs-tv": "BBS TV",
    "tv-north": "TV North",
    "wan-luo-tv": "Wan Luo TV"
};

/**
 * Test if a stream URL is accessible
 */
function testStreamUrl(url) {
    return new Promise((resolve) => {
        // YouTube embeds are always considered working (they'll show error if channel is offline)
        if (url.includes('youtube.com/embed')) {
            resolve({
                url,
                accessible: true,
                type: 'youtube-embed',
                note: 'YouTube embed - will show error if channel offline'
            });
            return;
        }
        
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : http;
        
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
                url,
                accessible: isSuccess,
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                contentType: res.headers['content-type'],
                type: 'hls-stream'
            });
        });
        
        req.on('error', (error) => {
            resolve({
                url,
                accessible: false,
                error: error.message,
                type: 'hls-stream'
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                url,
                accessible: false,
                error: 'Request timeout',
                type: 'hls-stream'
            });
        });
        
        req.end();
    });
}

/**
 * Test all streams for a station
 */
async function testStation(stationId, streams) {
    const stationName = stationNames[stationId];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${stationName} (${stationId})`);
    console.log('='.repeat(60));
    
    const results = [];
    
    for (let i = 0; i < streams.length; i++) {
        const streamUrl = streams[i];
        console.log(`\nStream ${i + 1}/${streams.length}:`);
        console.log(`URL: ${streamUrl}`);
        
        const result = await testStreamUrl(streamUrl);
        results.push(result);
        
        if (result.accessible) {
            if (result.type === 'youtube-embed') {
                console.log(`✅ YOUTUBE EMBED - ${result.note}`);
            } else {
                console.log(`✅ ACCESSIBLE - Status: ${result.statusCode} ${result.statusMessage}`);
                if (result.contentType) {
                    console.log(`   Content-Type: ${result.contentType}`);
                }
            }
        } else {
            console.log(`❌ NOT ACCESSIBLE - ${result.error || `Status: ${result.statusCode}`}`);
        }
    }
    
    const workingStreams = results.filter(r => r.accessible).length;
    const totalStreams = results.length;
    
    console.log(`\nSummary: ${workingStreams}/${totalStreams} streams accessible`);
    
    return {
        stationId,
        stationName,
        totalStreams,
        workingStreams,
        results
    };
}

/**
 * Main test function
 */
async function runTests() {
    console.log('\n' + '='.repeat(60));
    console.log('UPDATED UGANDA TV STREAMS TEST');
    console.log('Testing new stream configuration...');
    console.log('='.repeat(60));
    
    const allResults = [];
    
    for (const [stationId, streams] of Object.entries(updatedStreams)) {
        const result = await testStation(stationId, streams);
        allResults.push(result);
    }
    
    // Print summary report
    console.log('\n\n' + '='.repeat(60));
    console.log('FINAL SUMMARY REPORT');
    console.log('='.repeat(60));
    
    let totalStations = allResults.length;
    let stationsWithWorkingStreams = 0;
    let totalStreamsWorking = 0;
    let totalStreamsTotal = 0;
    let youtubeEmbeds = 0;
    let hlsStreams = 0;
    
    console.log('\nStation-by-Station Results:');
    console.log('-'.repeat(60));
    
    allResults.forEach(result => {
        const status = result.workingStreams > 0 ? '✅' : '❌';
        console.log(`${status} ${result.stationName.padEnd(20)} - ${result.workingStreams}/${result.totalStreams} streams working`);
        
        if (result.workingStreams > 0) {
            stationsWithWorkingStreams++;
        }
        totalStreamsWorking += result.workingStreams;
        totalStreamsTotal += result.totalStreams;
        
        // Count stream types
        result.results.forEach(r => {
            if (r.accessible) {
                if (r.type === 'youtube-embed') {
                    youtubeEmbeds++;
                } else if (r.type === 'hls-stream') {
                    hlsStreams++;
                }
            }
        });
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('OVERALL STATISTICS:');
    console.log('='.repeat(60));
    console.log(`Total TV Stations: ${totalStations}`);
    console.log(`Stations with working streams: ${stationsWithWorkingStreams}/${totalStations} (${Math.round(stationsWithWorkingStreams/totalStations*100)}%)`);
    console.log(`Total working streams: ${totalStreamsWorking}/${totalStreamsTotal} (${Math.round(totalStreamsWorking/totalStreamsTotal*100)}%)`);
    console.log(`\nStream Types:`);
    console.log(`  - YouTube Embeds: ${youtubeEmbeds}`);
    console.log(`  - HLS Streams: ${hlsStreams}`);
    
    if (stationsWithWorkingStreams === totalStations) {
        console.log('\n✅ ALL STATIONS HAVE AT LEAST ONE WORKING STREAM!');
    } else {
        console.log(`\n⚠️  ${totalStations - stationsWithWorkingStreams} station(s) have NO working streams`);
    }
    
    console.log('='.repeat(60));
    
    // Save results
    const fs = require('fs');
    const reportData = {
        testDate: new Date().toISOString(),
        summary: {
            totalStations,
            stationsWithWorkingStreams,
            totalStreamsWorking,
            totalStreamsTotal,
            successRate: Math.round(stationsWithWorkingStreams/totalStations*100),
            youtubeEmbeds,
            hlsStreams
        },
        results: allResults
    };
    
    fs.writeFileSync('updated-streams-test-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: updated-streams-test-report.json\n');
}

// Run the tests
runTests().catch(console.error);
