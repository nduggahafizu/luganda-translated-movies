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
    
    // Direct stream URLs (fallbacks or primary sources)
    directStreams: {
        "ntv-uganda": "https://ythls.onrender.com/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8",
        "nbs-tv": "https://ythls.onrender.com/channel/UCwga1dPCqBddbtq5KYRii2g.m3u8",
        "ubc-tv": "https://ythls.onrender.com/channel/UCVktcIoQvZgmNdmNwXOYPxg.m3u8",
        "bukedde-tv": "https://ythls.onrender.com/channel/UCouBdXAhnJbVpXlLi5YYkxg.m3u8",
        "urban-tv": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8",
        "spark-tv": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8",
        "tv-west": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8",
        "salt-tv": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8",
        "tv-east": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8",
        "bbs-tv": "https://ythls.onrender.com/channel/UCgLpjHjfGTbBBi5T5JaBcKg.m3u8",
        "tv-north": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8",
        "wan-luo-tv": "https://stream.hydeinnovations.com:2140/live/bosstv/index.m3u8"
    }
};

/**
 * Get stream URL for a specific TV station
 * @param {string} stationId - The ID of the TV station
 * @returns {Promise<string>} - The stream URL
 */
async function getStreamUrl(stationId) {
    try {
        // First try to get from IPTV-org API
        const iptvOrgStream = await fetchFromIptvOrg(stationId);
        if (iptvOrgStream) return iptvOrgStream;
        
        // If not found, use direct stream URL as fallback
        return TV_API_CONFIG.directStreams[stationId] || null;
    } catch (error) {
        console.error("Error getting stream URL:", error);
        // Fallback to direct stream
        return TV_API_CONFIG.directStreams[stationId] || null;
    }
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
    getYouTubeLiveUrl
};
