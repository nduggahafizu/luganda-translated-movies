/**
 * Test script for Uganda TV streams
 * Tests all configured TV stations to verify stream availability
 */

const https = require('https');
const http = require('http');

// TV Station configuration from uganda-tv-api.js
const TV_STATIONS = {
    "ntv-uganda": {
        name: "NTV Uganda",
        streams: [
            "https://stream.ntvuganda.co.ug/live/ntv/index.m3u8",
            "https://bcovlive-a.akamaihd.net/b4e4e5e5e5e5e5e5e5e5e5e5e5e5e5e5/us-east-1/6314071972001/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8",
            "https://ythls.armelin.one/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8"
        ]
    },
    "nbs-tv": {
        name: "NBS TV",
        streams: [
            "https://stream.nbstv.co.ug/live/nbs/index.m3u8",
            "https://ythls-v3.onrender.com/channel/UCT0bVGYRe-Qg_CAjJ7RQb0g.m3u8",
            "https://ythls.armelin.one/channel/UCT0bVGYRe-Qg_CAjJ7RQb0g.m3u8"
        ]
    },
    "ubc-tv": {
        name: "UBC TV",
        streams: [
            "https://webstreaming.viewmedia.tv/web_013/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8",
            "https://ythls.armelin.one/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    },
    "bukedde-tv": {
        name: "Bukedde TV",
        streams: [
            "https://stream.bukeddetv.co.ug/live/bukedde/index.m3u8",
            "https://ythls-v3.onrender.com/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8",
            "https://ythls.armelin.one/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8"
        ]
    },
    "urban-tv": {
        name: "Urban TV",
        streams: [
            "https://stream.urbantv.co.ug/live/urban/index.m3u8",
            "https://ythls-v3.onrender.com/channel/UCxS3-UXJjVdOZmnPpzgRXOg.m3u8",
            "https://ythls.armelin.one/channel/UCxS3-UXJjVdOZmnPpzgRXOg.m3u8"
        ]
    },
    "spark-tv": {
        name: "Spark TV",
        streams: [
            "https://stream.sparktv.co.ug/live/spark/index.m3u8",
            "https://webstreaming.viewmedia.tv/web_016/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    },
    "tv-west": {
        name: "TV West",
        streams: [
            "https://webstreaming.viewmedia.tv/web_017/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    },
    "salt-tv": {
        name: "Salt TV",
        streams: [
            "https://webstreaming.viewmedia.tv/web_018/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    },
    "tv-east": {
        name: "TV East",
        streams: [
            "https://webstreaming.viewmedia.tv/web_019/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    },
    "bbs-tv": {
        name: "BBS TV",
        streams: [
            "https://stream.bbstv.co.ug/live/bbs/index.m3u8",
            "https://ythls-v3.onrender.com/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8",
            "https://ythls.armelin.one/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8"
        ]
    },
    "tv-north": {
        name: "TV North",
        streams: [
            "https://webstreaming.viewmedia.tv/web_021/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    },
    "wan-luo-tv": {
        name: "Wan Luo TV",
        streams: [
            "https://webstreaming.viewmedia.tv/web_022/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    }
};

/**
 * Test if a stream URL is accessible
 * @param {string} url - Stream URL to test
 * @returns {Promise<Object>} - Test result with status and details
 */
function testStreamUrl(url) {
    return new Promise((resolve) => {
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
                contentType: res.headers['content-type']
            });
        });
        
        req.on('error', (error) => {
            resolve({
                url,
                accessible: false,
                error: error.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                url,
                accessible: false,
                error: 'Request timeout'
            });
        });
        
        req.end();
    });
}

/**
 * Test all streams for a TV station
 * @param {string} stationId - Station ID
 * @param {Object} stationData - Station configuration
 */
async function testStation(stationId, stationData) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${stationData.name} (${stationId})`);
    console.log('='.repeat(60));
    
    const results = [];
    
    for (let i = 0; i < stationData.streams.length; i++) {
        const streamUrl = stationData.streams[i];
        console.log(`\nStream ${i + 1}/${stationData.streams.length}:`);
        console.log(`URL: ${streamUrl}`);
        
        const result = await testStreamUrl(streamUrl);
        results.push(result);
        
        if (result.accessible) {
            console.log(`✅ ACCESSIBLE - Status: ${result.statusCode} ${result.statusMessage}`);
            if (result.contentType) {
                console.log(`   Content-Type: ${result.contentType}`);
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
        stationName: stationData.name,
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
    console.log('UGANDA TV STREAMS TEST');
    console.log('Testing all configured TV stations...');
    console.log('='.repeat(60));
    
    const allResults = [];
    
    for (const [stationId, stationData] of Object.entries(TV_STATIONS)) {
        const result = await testStation(stationId, stationData);
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
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('OVERALL STATISTICS:');
    console.log('='.repeat(60));
    console.log(`Total TV Stations: ${totalStations}`);
    console.log(`Stations with working streams: ${stationsWithWorkingStreams}/${totalStations} (${Math.round(stationsWithWorkingStreams/totalStations*100)}%)`);
    console.log(`Total working streams: ${totalStreamsWorking}/${totalStreamsTotal} (${Math.round(totalStreamsWorking/totalStreamsTotal*100)}%)`);
    
    if (stationsWithWorkingStreams === totalStations) {
        console.log('\n✅ ALL STATIONS HAVE AT LEAST ONE WORKING STREAM!');
    } else {
        console.log(`\n⚠️  ${totalStations - stationsWithWorkingStreams} station(s) have NO working streams`);
    }
    
    console.log('='.repeat(60));
    
    // Save results to JSON file
    const fs = require('fs');
    const reportData = {
        testDate: new Date().toISOString(),
        summary: {
            totalStations,
            stationsWithWorkingStreams,
            totalStreamsWorking,
            totalStreamsTotal,
            successRate: Math.round(stationsWithWorkingStreams/totalStations*100)
        },
        results: allResults
    };
    
    fs.writeFileSync('uganda-tv-test-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: uganda-tv-test-report.json\n');
}

// Run the tests
runTests().catch(console.error);
