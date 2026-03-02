/**
 * Munowatch Integration API Client
 * Fetches and plays videos from Munowatch CDN
 */

const MunowatchAPI = {
    // API base URL (change this to your production server)
    baseUrl: window.location.origin.includes('localhost') 
        ? 'http://localhost:5000/api/munowatch'
        : '/api/munowatch',
    
    // Known CDN base
    cdnBase: 'http://munotech2.b-cdn.net/simo',
    
    /**
     * Get Munowatch dashboard data
     * @returns {Promise<Object>} Dashboard data with movies
     */
    async getDashboard() {
        try {
            const response = await fetch(\/dashboard);
            return await response.json();
        } catch (error) {
            console.error('Munowatch dashboard error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Extract video URL from Munowatch video page
     * @param {string} videoIdOrUrl - Video ID or full URL
     * @returns {Promise<Object>} Extracted video data
     */
    async extractVideo(videoIdOrUrl) {
        try {
            const body = videoIdOrUrl.startsWith('http') 
                ? { url: videoIdOrUrl }
                : { videoId: videoIdOrUrl };
            
            const response = await fetch(\/extract, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return await response.json();
        } catch (error) {
            console.error('Munowatch extract error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get proxy stream URL for a video
     * @param {string} videoUrl - Direct CDN video URL
     * @returns {string} Proxied stream URL
     */
    getProxyStreamUrl(videoUrl) {
        return \/stream?url=\;
    },
    
    /**
     * Get list of known working movies
     * @returns {Promise<Object>} List of movies
     */
    async getKnownMovies() {
        try {
            const response = await fetch(\/movies);
            return await response.json();
        } catch (error) {
            console.error('Munowatch movies error:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Play a Munowatch video in a video element
     * @param {HTMLVideoElement} videoElement - Video element to play in
     * @param {string} videoUrl - Video URL to play
     * @param {boolean} useProxy - Whether to use proxy (for CORS)
     */
    playVideo(videoElement, videoUrl, useProxy = false) {
        const src = useProxy ? this.getProxyStreamUrl(videoUrl) : videoUrl;
        videoElement.src = src;
        videoElement.load();
        videoElement.play().catch(e => console.log('Autoplay blocked:', e));
    },
    
    /**
     * Build direct CDN URL from VJ folder and filename
     * @param {string} vjFolder - VJ folder name (e.g., 'simo22')
     * @param {string} filename - Video filename (e.g., 'The.Internship.mp4')
     * @returns {string} Full CDN URL
     */
    buildCdnUrl(vjFolder, filename) {
        return \/\/\;
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MunowatchAPI;
}
