/**
 * MyVJ-Style Features
 * - Lazy Loading Images
 * - Video Preview on Hover
 * - Watch Progress Tracking
 */

// ===================================
// 1. LAZY LOADING IMPLEMENTATION
// ===================================

class LazyLoader {
    constructor() {
        this.images = document.querySelectorAll('img.lazy');
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img);
                    }
                });
            }, this.options);

            this.images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            this.images.forEach(img => this.loadImage(img));
        }
    }

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        img.src = src;
        img.onload = () => {
            img.classList.add('loaded');
        };
        img.onerror = () => {
            // Fallback image on error
            img.src = 'assets/images/placeholder.png';
            img.classList.add('loaded');
        };
    }

    update() {
        // Re-initialize for dynamically added images
        this.images = document.querySelectorAll('img.lazy:not(.loaded)');
        this.init();
    }
}

// ===================================
// 2. VIDEO PREVIEW ON HOVER
// ===================================

class VideoPreview {
    constructor() {
        this.movieCards = document.querySelectorAll('.list-movie');
        this.hoverDelay = 800; // ms before video starts
        this.hoverTimers = new Map();
        this.activeVideos = new Map();
        this.init();
    }

    init() {
        this.movieCards.forEach(card => {
            card.addEventListener('mouseenter', (e) => this.handleMouseEnter(e, card));
            card.addEventListener('mouseleave', (e) => this.handleMouseLeave(e, card));
        });
    }

    handleMouseEnter(e, card) {
        const videoData = card.getAttribute('data-trailer-url');
        if (!videoData) return;

        // Set timer to start video after delay
        const timer = setTimeout(() => {
            this.playPreview(card, videoData);
        }, this.hoverDelay);

        this.hoverTimers.set(card, timer);
    }

    handleMouseLeave(e, card) {
        // Clear hover timer
        const timer = this.hoverTimers.get(card);
        if (timer) {
            clearTimeout(timer);
            this.hoverTimers.delete(card);
        }

        // Stop and remove video
        this.stopPreview(card);
    }

    playPreview(card, videoUrl) {
        const mediaElement = card.querySelector('.list-media');
        if (!mediaElement) return;

        // Check if video container already exists
        let videoContainer = card.querySelector('.preview-video-container');
        
        if (!videoContainer) {
            // Create video container
            videoContainer = document.createElement('div');
            videoContainer.className = 'preview-video-container';
            
            // Create video element
            const video = document.createElement('video');
            video.className = 'preview-video';
            video.muted = true;
            video.loop = true;
            video.playsInline = true;
            video.src = videoUrl;
            
            // Create mute toggle button
            const muteBtn = document.createElement('button');
            muteBtn.className = 'mute-toggle';
            muteBtn.setAttribute('aria-label', 'Toggle mute');
            muteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
            `;
            
            muteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                video.muted = !video.muted;
                muteBtn.innerHTML = video.muted ? `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                ` : `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                `;
            });
            
            videoContainer.appendChild(video);
            videoContainer.appendChild(muteBtn);
            mediaElement.appendChild(videoContainer);
        }

        const video = videoContainer.querySelector('video');
        
        // Play video
        video.play().catch(err => {
            console.log('Video preview autoplay failed:', err);
        });

        this.activeVideos.set(card, video);
    }

    stopPreview(card) {
        const video = this.activeVideos.get(card);
        if (video) {
            video.pause();
            video.currentTime = 0;
            this.activeVideos.delete(card);
        }

        const videoContainer = card.querySelector('.preview-video-container');
        if (videoContainer) {
            videoContainer.style.opacity = '0';
            videoContainer.style.visibility = 'hidden';
        }
    }

    update() {
        // Re-initialize for dynamically added cards
        this.movieCards = document.querySelectorAll('.list-movie');
        this.init();
    }
}

// ===================================
// 3. WATCH PROGRESS TRACKING
// ===================================

class WatchProgress {
    constructor() {
        this.storageKey = 'luganda_movies_progress';
        this.progress = this.loadProgress();
    }

    loadProgress() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading watch progress:', e);
            return {};
        }
    }

    saveProgress() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.progress));
        } catch (e) {
            console.error('Error saving watch progress:', e);
        }
    }

    updateProgress(movieId, currentTime, duration) {
        const percentage = (currentTime / duration) * 100;
        this.progress[movieId] = {
            currentTime: currentTime,
            duration: duration,
            percentage: Math.round(percentage),
            lastWatched: new Date().toISOString()
        };
        this.saveProgress();
        this.updateProgressBar(movieId, percentage);
    }

    getProgress(movieId) {
        return this.progress[movieId] || null;
    }

    updateProgressBar(movieId, percentage) {
        const progressBars = document.querySelectorAll(`[data-movie-id="${movieId}"] .movie-progress`);
        progressBars.forEach(bar => {
            bar.value = percentage;
            bar.style.display = percentage > 5 ? 'block' : 'none';
        });
    }

    renderProgressBars() {
        // Add progress bars to all movie cards
        const movieCards = document.querySelectorAll('.list-movie[data-movie-id]');
        movieCards.forEach(card => {
            const movieId = card.getAttribute('data-movie-id');
            const progress = this.getProgress(movieId);
            
            if (progress && progress.percentage > 5) {
                const mediaElement = card.querySelector('.list-media');
                if (mediaElement && !mediaElement.querySelector('.movie-progress')) {
                    const progressBar = document.createElement('progress');
                    progressBar.className = 'movie-progress';
                    progressBar.max = 100;
                    progressBar.value = progress.percentage;
                    mediaElement.appendChild(progressBar);
                }
            }
        });
    }
}

// ===================================
// 4. VIDEO.JS PLAYER INTEGRATION
// ===================================

class VideoJSPlayer {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.player = null;
        this.movieId = videoElement.getAttribute('data-movie-id');
        this.watchProgress = new WatchProgress();
        this.init();
    }

    init() {
        if (typeof videojs === 'undefined') {
            console.error('Video.js library not loaded');
            return;
        }

        // Initialize Video.js player
        this.player = videojs(this.videoElement, {
            controls: true,
            autoplay: false,
            preload: 'auto',
            fluid: true,
            responsive: true,
            playbackRates: [0.5, 1, 1.5, 2],
            controlBar: {
                children: [
                    'playToggle',
                    'volumePanel',
                    'currentTimeDisplay',
                    'timeDivider',
                    'durationDisplay',
                    'progressControl',
                    'playbackRateMenuButton',
                    'qualitySelector',
                    'fullscreenToggle'
                ]
            }
        });

        this.setupEventListeners();
        this.loadSavedProgress();
    }

    setupEventListeners() {
        // Track watch progress
        this.player.on('timeupdate', () => {
            if (this.movieId) {
                const currentTime = this.player.currentTime();
                const duration = this.player.duration();
                
                // Save progress every 5 seconds
                if (Math.floor(currentTime) % 5 === 0) {
                    this.watchProgress.updateProgress(this.movieId, currentTime, duration);
                }
            }
        });

        // Save progress when video ends
        this.player.on('ended', () => {
            if (this.movieId) {
                this.watchProgress.updateProgress(this.movieId, this.player.duration(), this.player.duration());
            }
        });

        // Save progress when user leaves
        window.addEventListener('beforeunload', () => {
            if (this.movieId && this.player) {
                this.watchProgress.updateProgress(
                    this.movieId,
                    this.player.currentTime(),
                    this.player.duration()
                );
            }
        });
    }

    loadSavedProgress() {
        if (this.movieId) {
            const progress = this.watchProgress.getProgress(this.movieId);
            if (progress && progress.percentage < 95) {
                // Resume from saved position
                this.player.currentTime(progress.currentTime);
            }
        }
    }

    destroy() {
        if (this.player) {
            this.player.dispose();
        }
    }
}

// ===================================
// 5. INITIALIZATION
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lazy Loading
    const lazyLoader = new LazyLoader();
    window.lazyLoader = lazyLoader; // Make globally accessible

    // Initialize Video Preview (only if trailer URLs are available)
    const hasTrailers = document.querySelector('[data-trailer-url]');
    if (hasTrailers) {
        const videoPreview = new VideoPreview();
        window.videoPreview = videoPreview;
    }

    // Initialize Watch Progress
    const watchProgress = new WatchProgress();
    watchProgress.renderProgressBars();
    window.watchProgress = watchProgress;

    // Initialize Video.js player if on player page
    const videoElement = document.getElementById('mainVideo');
    if (videoElement && typeof videojs !== 'undefined') {
        const player = new VideoJSPlayer(videoElement);
        window.videoPlayer = player;
    }

    console.log('MyVJ Features initialized successfully');
});

// ===================================
// 6. UTILITY FUNCTIONS
// ===================================

// Convert video height to quality label
function videoHeightToQuality(height) {
    if (height >= 2160) return '4K';
    if (height >= 1080) return 'Full HD';
    if (height >= 720) return 'HD';
    return 'SD';
}

// Check if value is empty
function isEmpty(value) {
    return value === null || value === undefined || value === '' || value === 'null';
}

// Format duration (seconds to HH:MM:SS)
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Export for global access
window.MyVJFeatures = {
    LazyLoader,
    VideoPreview,
    WatchProgress,
    VideoJSPlayer,
    videoHeightToQuality,
    isEmpty,
    formatDuration
};
