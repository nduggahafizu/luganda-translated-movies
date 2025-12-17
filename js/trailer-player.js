/**
 * Movie Trailer Player
 * Handles fetching and playing movie trailers from TMDB
 */

class TrailerPlayer {
    constructor() {
        this.modal = null;
        this.currentTrailer = null;
        this.init();
    }

    /**
     * Initialize trailer player
     */
    init() {
        this.createModal();
        this.attachEventListeners();
    }

    /**
     * Create trailer modal
     */
    createModal() {
        const modalHTML = `
            <div id="trailerModal" class="trailer-modal" style="display: none;">
                <div class="trailer-modal-overlay"></div>
                <div class="trailer-modal-content">
                    <button class="trailer-close-btn" aria-label="Close trailer">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div class="trailer-player-wrapper">
                        <div id="trailerPlayer"></div>
                        <div class="trailer-loading" style="display: none;">
                            <div class="spinner"></div>
                            <p>Loading trailer...</p>
                        </div>
                        <div class="trailer-error" style="display: none;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p>Trailer not available</p>
                        </div>
                    </div>
                    <div class="trailer-info">
                        <h3 id="trailerTitle"></h3>
                        <p id="trailerDescription"></p>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('trailerModal');
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Close button
        const closeBtn = this.modal.querySelector('.trailer-close-btn');
        closeBtn.addEventListener('click', () => this.closeTrailer());

        // Overlay click
        const overlay = this.modal.querySelector('.trailer-modal-overlay');
        overlay.addEventListener('click', () => this.closeTrailer());

        // Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.closeTrailer();
            }
        });
    }

    /**
     * Play trailer for a movie
     * @param {number} tmdbId - TMDB movie ID
     * @param {string} movieTitle - Movie title
     */
    async playTrailer(tmdbId, movieTitle) {
        try {
            // Show modal with loading state
            this.showModal();
            this.showLoading();

            // Fetch trailer data from TMDB
            const videos = await tmdbApi.getMovieVideos(tmdbId);

            // Find YouTube trailer
            const trailer = this.findBestTrailer(videos.results);

            if (!trailer) {
                this.showError();
                return;
            }

            // Store current trailer
            this.currentTrailer = trailer;

            // Update modal info
            document.getElementById('trailerTitle').textContent = movieTitle;
            document.getElementById('trailerDescription').textContent = 
                `${trailer.type} • ${trailer.name}`;

            // Load YouTube player
            this.loadYouTubePlayer(trailer.key);

        } catch (error) {
            console.error('Error loading trailer:', error);
            this.showError();
        }
    }

    /**
     * Find best trailer from videos
     * @param {Array} videos - Array of video objects
     * @returns {Object|null} Best trailer or null
     */
    findBestTrailer(videos) {
        if (!videos || videos.length === 0) return null;

        // Filter for YouTube trailers
        const youtubeVideos = videos.filter(v => 
            v.site === 'YouTube' && 
            (v.type === 'Trailer' || v.type === 'Teaser')
        );

        if (youtubeVideos.length === 0) return null;

        // Prioritize official trailers
        const officialTrailer = youtubeVideos.find(v => 
            v.official && v.type === 'Trailer'
        );

        if (officialTrailer) return officialTrailer;

        // Return first trailer
        return youtubeVideos[0];
    }

    /**
     * Load YouTube player
     * @param {string} videoId - YouTube video ID
     */
    loadYouTubePlayer(videoId) {
        const playerDiv = document.getElementById('trailerPlayer');
        
        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        // Clear and add iframe
        playerDiv.innerHTML = '';
        playerDiv.appendChild(iframe);

        // Hide loading
        this.hideLoading();
    }

    /**
     * Show modal
     */
    showModal() {
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close trailer
     */
    closeTrailer() {
        // Stop video
        const playerDiv = document.getElementById('trailerPlayer');
        playerDiv.innerHTML = '';

        // Hide modal
        this.modal.style.display = 'none';
        document.body.style.overflow = '';

        // Reset state
        this.currentTrailer = null;
        this.hideLoading();
        this.hideError();
    }

    /**
     * Show loading state
     */
    showLoading() {
        this.modal.querySelector('.trailer-loading').style.display = 'flex';
        this.modal.querySelector('.trailer-error').style.display = 'none';
        document.getElementById('trailerPlayer').style.display = 'none';
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        this.modal.querySelector('.trailer-loading').style.display = 'none';
        document.getElementById('trailerPlayer').style.display = 'block';
    }

    /**
     * Show error state
     */
    showError() {
        this.modal.querySelector('.trailer-loading').style.display = 'none';
        this.modal.querySelector('.trailer-error').style.display = 'flex';
        document.getElementById('trailerPlayer').style.display = 'none';
    }

    /**
     * Hide error state
     */
    hideError() {
        this.modal.querySelector('.trailer-error').style.display = 'none';
    }
}

// Initialize trailer player
let trailerPlayer;
document.addEventListener('DOMContentLoaded', () => {
    trailerPlayer = new TrailerPlayer();
});

/**
 * Helper function to add trailer button to movie cards
 * @param {Object} movie - Movie object with tmdbId
 * @returns {string} HTML for trailer button
 */
function getTrailerButtonHTML(movie) {
    if (!movie.tmdbId) return '';
    
    return `
        <button class="btn-trailer" 
                onclick="trailerPlayer.playTrailer(${movie.tmdbId}, '${movie.title || movie.originalTitle}')"
                aria-label="Watch trailer for ${movie.title || movie.originalTitle}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Watch Trailer
        </button>
    `;
}

/**
 * Helper function to add play button to movie cards
 * @param {Object} movie - Movie object
 * @returns {string} HTML for play button
 */
function getPlayButtonHTML(movie) {
    const movieId = movie._id || movie.id;
    return `
        <a href="player.html?id=${movieId}" class="btn-play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play Movie
        </a>
    `;
}
