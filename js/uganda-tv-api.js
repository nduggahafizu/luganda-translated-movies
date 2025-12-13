/**
 * Uganda TV Stations API Integration
 * 
 * This file handles fetching and displaying live streams for Uganda TV stations
 * using a combination of available free APIs.
 */

// Configuration
const TV_API_CONFIG = {
    // Base URLs for different APIs
    iptv_org: "https://iptv-org.github.io/api/streams.json",
    freeiptvAPI: "https://iptv-org.github.io/iptv/countries/ug.m3u",
    
    // YouTube channels for stations that broadcast live on YouTube
    youtubeChannels: {
        "ntv-uganda": "UCwga1dPCqBddbtq5KYRii2g",
        "nbs-tv": "UCwga1dPCqBddbtq5KYRii2g", 
        "ubc-tv": "UCVktcIoQvZgmNdmNwXOYPxg",
        "bukedde-tv": "UCouBdXAhnJbVpXlLi5YYkxg",
        "urban-tv": "UCVktcIoQvZgmNdmNwXOYPxg",
        "spark-tv": "UCVktcIoQvZgmNdmNwXOYPxg",
        "tv-west": "UCVktcIoQvZgmNdmNwXOYPxg",
        "salt-tv": "UCVktcIoQvZgmNdmNwXOYPxg",
        "tv-east": "UCVktcIoQvZgmNdmNwXOYPxg",
        "bbs-tv": "UCgLpjHjfGTbBBi5T5JaBcKg",
        "tv-north": "UCVktcIoQvZgmNdmNwXOYPxg",
        "wan-luo-tv": "UCVktcIoQvZgmNdmNwXOYPxg"
    },
    
    // Direct stream URLs with multiple fallback options
    directStreams: {
        "ntv-uganda": [
            "https://streaming.viewmedia.tv/web_012/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8",
            "https://ythls.armelin.one/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8"
        ],
        "nbs-tv": [
            "https://streaming.viewmedia.tv/web_006/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCT0bVGYRe-Qg_CAjJ7RQb0g.m3u8",
            "https://ythls.armelin.one/channel/UCT0bVGYRe-Qg_CAjJ7RQb0g.m3u8"
        ],
        "ubc-tv": [
            "https://streaming.viewmedia.tv/web_013/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8",
            "https://ythls.armelin.one/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ],
        "bukedde-tv": [
            "https://streaming.viewmedia.tv/web_014/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8",
            "https://ythls.armelin.one/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8"
        ],
        "urban-tv": [
            "https://streaming.viewmedia.tv/web_015/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCxS3-UXJjVdOZmnPpzgRXOg.m3u8",
            "https://ythls.armelin.one/channel/UCxS3-UXJjVdOZmnPpzgRXOg.m3u8"
        ],
        "spark-tv": [
            "https://streaming.viewmedia.tv/web_016/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8",
            "https://ythls.armelin.one/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ],
        "tv-west": [
            "https://streaming.viewmedia.tv/web_017/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ],
        "salt-tv": [
            "https://streaming.viewmedia.tv/web_018/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ],
        "tv-east": [
            "https://streaming.viewmedia.tv/web_019/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ],
        "bbs-tv": [
            "https://streaming.viewmedia.tv/web_020/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8",
            "https://ythls.armelin.one/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8"
        ],
        "tv-north": [
            "https://streaming.viewmedia.tv/web_021/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ],
        "wan-luo-tv": [
            "https://streaming.viewmedia.tv/web_022/Stream/playlist.m3u8",
            "https://ythls-v3.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8"
        ]
    }
};

/**
 * Get stream URL for a specific TV station
 * @param {string} stationId - The ID of the TV station
 * @returns {Promise<string>} - The stream URL
 */
async function getStreamUrl(stationId) {
    try {
        // Get stream URLs for this station (array of fallbacks)
        const streamUrls = TV_API_CONFIG.directStreams[stationId];
        
        if (!streamUrls || streamUrls.length === 0) {
            console.error(`No stream URLs configured for ${stationId}`);
            return null;
        }
        
        // Return the first URL (primary source)
        // The player will handle fallbacks if this fails
        return Array.isArray(streamUrls) ? streamUrls[0] : streamUrls;
    } catch (error) {
        console.error("Error getting stream URL:", error);
        return null;
    }
}

/**
 * Get all fallback URLs for a station
 * @param {string} stationId - The ID of the TV station
 * @returns {Array<string>} - Array of stream URLs
 */
function getAllStreamUrls(stationId) {
    const streamUrls = TV_API_CONFIG.directStreams[stationId];
    return Array.isArray(streamUrls) ? streamUrls : [streamUrls];
}

/**
 * Fetch stream URL from IPTV-org API
 * @param {string} stationId - The ID of the TV station
 * @returns {Promise<string|null>} - The stream URL or null if not found
 */
async function fetchFromIptvOrg(stationId) {
    try {
        const response = await fetch(TV_API_CONFIG.iptv_org);
        const data = await response.json();
        
        // Map station IDs to search terms
        const searchTerms = {
            "ntv-uganda": "ntv uganda",
            "nbs-tv": "nbs",
            "ubc-tv": "ubc",
            "bukedde-tv": "bukedde",
            "urban-tv": "urban",
            "spark-tv": "spark",
            "tv-west": "west",
            "salt-tv": "salt",
            "tv-east": "east",
            "bbs-tv": "bbs",
            "tv-north": "north",
            "wan-luo-tv": "wan luo"
        };
        
        // Find matching stream
        const searchTerm = searchTerms[stationId] || stationId.replace("-", " ");
        const stream = data.find(item => 
            item.channel && 
            item.channel.toLowerCase().includes(searchTerm) && 
            item.country === "UG"
        );
        
        return stream ? stream.url : null;
    } catch (error) {
        console.error("Error fetching from IPTV-org:", error);
        return null;
    }
}

/**
 * Get YouTube live stream URL for a channel
 * @param {string} channelId - YouTube channel ID
 * @returns {string} - HLS stream URL
 */
function getYouTubeLiveUrl(channelId) {
    return `https://ythls.onrender.com/channel/${channelId}.m3u8`;
}

/**
 * Initialize TV station cards with stream data
 */
async function initTvStations() {
    const stationCards = document.querySelectorAll('.tv-station-card');
    
    for (const card of stationCards) {
        const watchButton = card.querySelector('.watch-btn');
        if (!watchButton) continue;
        
        const href = watchButton.getAttribute('href');
        const urlParams = new URLSearchParams(href.split('?')[1]);
        const stationId = urlParams.get('station');
        
        if (!stationId) continue;
        
        // Update watch button to include data-stream-url attribute
        const streamUrl = await getStreamUrl(stationId);
        if (streamUrl) {
            watchButton.setAttribute('data-stream-url', streamUrl);
            
            // Update href to include stream URL
            watchButton.setAttribute('href', `player.html?station=${stationId}&stream=${encodeURIComponent(streamUrl)}`);
        }
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'stream-status';
        loadingIndicator.innerHTML = 'Checking stream...';
        card.querySelector('.tv-station-info').appendChild(loadingIndicator);
        
        // Check if stream is active
        checkStreamStatus(streamUrl, loadingIndicator);
    }
}

/**
 * Check if a stream is currently active
 * @param {string} streamUrl - The URL of the stream to check
 * @param {HTMLElement} statusElement - Element to update with status
 */
function checkStreamStatus(streamUrl, statusElement) {
    if (!streamUrl) {
        statusElement.innerHTML = '<span class="status-offline">Offline</span>';
        return;
    }
    
    // For HLS streams, we can't easily check status without actually trying to play
    // So we'll just mark YouTube-based streams as likely available
    if (streamUrl.includes('ythls.onrender.com')) {
        statusElement.innerHTML = '<span class="status-online">Live</span>';
        return;
    }
    
    // For other streams, we'll make a HEAD request to check if resource exists
    fetch(streamUrl, { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
            statusElement.innerHTML = '<span class="status-online">Live</span>';
        })
        .catch(() => {
            statusElement.innerHTML = '<span class="status-offline">Offline</span>';
        });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initTvStations);

// Export functions for use in other scripts
window.UgandaTvApi = {
    getStreamUrl,
    getAllStreamUrls,
    getYouTubeLiveUrl
};
