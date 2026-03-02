/**
 * Mobile Video Gesture Controls
 * Double-tap to seek, swipe for brightness/volume, pinch to zoom
 */

class MobileVideoGestures {
    constructor(videoElement, options = {}) {
        this.video = videoElement;
        this.container = videoElement.parentElement;
        this.options = {
            seekTime: 10, // seconds to seek on double-tap
            showIndicator: true,
            enableSwipeVolume: true,
            enableSwipeBrightness: true,
            enableDoubleTap: true,
            ...options
        };
        
        this.lastTap = 0;
        this.tapTimeout = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.initialVolume = 1;
        this.initialBrightness = 1;
        this.isGesturing = false;
        
        this.init();
    }
    
    init() {
        if (!this.isMobile()) return;
        
        this.createIndicators();
        this.bindEvents();
        console.log('📱 Mobile gestures enabled');
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth < 768;
    }
    
    createIndicators() {
        // Seek indicator
        this.seekIndicator = document.createElement('div');
        this.seekIndicator.className = 'gesture-indicator seek-indicator';
        this.seekIndicator.innerHTML = '<span class="seek-icon">⏩</span><span class="seek-text">+10s</span>';
        this.container.appendChild(this.seekIndicator);
        
        // Volume indicator
        this.volumeIndicator = document.createElement('div');
        this.volumeIndicator.className = 'gesture-indicator volume-indicator';
        this.volumeIndicator.innerHTML = '<span class="indicator-icon">🔊</span><span class="indicator-value">100%</span>';
        this.container.appendChild(this.volumeIndicator);
        
        // Brightness indicator
        this.brightnessIndicator = document.createElement('div');
        this.brightnessIndicator.className = 'gesture-indicator brightness-indicator';
        this.brightnessIndicator.innerHTML = '<span class="indicator-icon">☀️</span><span class="indicator-value">100%</span>';
        this.container.appendChild(this.brightnessIndicator);
        
        // Add styles
        this.addStyles();
    }
    
    addStyles() {
        if (document.getElementById('gesture-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'gesture-styles';
        style.textContent = `
            .gesture-indicator {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-size: 1.2rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                z-index: 1000;
                pointer-events: none;
                transition: transform 0.2s ease;
            }
            .gesture-indicator.show {
                transform: translate(-50%, -50%) scale(1);
            }
            .gesture-indicator .seek-icon,
            .gesture-indicator .indicator-icon {
                font-size: 2rem;
            }
            .seek-indicator.left {
                left: 25%;
            }
            .seek-indicator.left .seek-icon {
                transform: scaleX(-1);
            }
            .seek-indicator.right {
                left: 75%;
            }
            .volume-indicator {
                right: 10%;
                left: auto;
                transform: translate(0, -50%) scale(0);
            }
            .volume-indicator.show {
                transform: translate(0, -50%) scale(1);
            }
            .brightness-indicator {
                left: 10%;
                transform: translate(0, -50%) scale(0);
            }
            .brightness-indicator.show {
                transform: translate(0, -50%) scale(1);
            }
            .double-tap-ripple {
                position: absolute;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            }
            @keyframes ripple {
                to {
                    transform: scale(3);
                    opacity: 0;
                }
            }
            .video-container {
                position: relative;
                touch-action: manipulation;
            }
        `;
        document.head.appendChild(style);
    }
    
    bindEvents() {
        // Double-tap to seek
        if (this.options.enableDoubleTap) {
            this.container.addEventListener('touchend', (e) => this.handleTap(e));
        }
        
        // Swipe gestures
        this.container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.container.addEventListener('touchend', () => this.handleTouchEnd());
    }
    
    handleTap(e) {
        const currentTime = Date.now();
        const tapLength = currentTime - this.lastTap;
        
        clearTimeout(this.tapTimeout);
        
        if (tapLength < 300 && tapLength > 0) {
            // Double tap
            const rect = this.container.getBoundingClientRect();
            const x = e.changedTouches[0].clientX - rect.left;
            const width = rect.width;
            
            if (x < width / 3) {
                // Left side - rewind
                this.seek(-this.options.seekTime, x, e.changedTouches[0].clientY - rect.top);
            } else if (x > (width * 2 / 3)) {
                // Right side - forward
                this.seek(this.options.seekTime, x, e.changedTouches[0].clientY - rect.top);
            } else {
                // Center - play/pause
                if (this.video.paused) {
                    this.video.play();
                } else {
                    this.video.pause();
                }
            }
            
            this.lastTap = 0;
        } else {
            this.lastTap = currentTime;
            
            // Single tap - toggle controls (let default behavior handle it)
            this.tapTimeout = setTimeout(() => {
                this.lastTap = 0;
            }, 300);
        }
    }
    
    seek(seconds, x, y) {
        this.video.currentTime = Math.max(0, Math.min(this.video.duration, this.video.currentTime + seconds));
        
        // Show ripple effect
        const ripple = document.createElement('div');
        ripple.className = 'double-tap-ripple';
        ripple.style.left = (x - 40) + 'px';
        ripple.style.top = (y - 40) + 'px';
        this.container.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
        
        // Show seek indicator
        this.seekIndicator.classList.remove('left', 'right');
        this.seekIndicator.classList.add(seconds < 0 ? 'left' : 'right');
        this.seekIndicator.querySelector('.seek-text').textContent = seconds < 0 ? `${seconds}s` : `+${seconds}s`;
        this.showIndicator(this.seekIndicator);
    }
    
    handleTouchStart(e) {
        if (e.touches.length !== 1) return;
        
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.initialVolume = this.video.volume;
        this.isGesturing = false;
    }
    
    handleTouchMove(e) {
        if (e.touches.length !== 1) return;
        
        const rect = this.container.getBoundingClientRect();
        const deltaX = e.touches[0].clientX - this.touchStartX;
        const deltaY = this.touchStartY - e.touches[0].clientY; // Inverted for natural feel
        
        // Determine if this is a vertical swipe
        if (Math.abs(deltaY) > 30 && Math.abs(deltaY) > Math.abs(deltaX)) {
            e.preventDefault();
            this.isGesturing = true;
            
            const touchX = this.touchStartX - rect.left;
            const sensitivity = 150;
            
            if (touchX > rect.width / 2 && this.options.enableSwipeVolume) {
                // Right side - Volume
                const newVolume = Math.max(0, Math.min(1, this.initialVolume + (deltaY / sensitivity)));
                this.video.volume = newVolume;
                this.video.muted = false;
                
                this.volumeIndicator.querySelector('.indicator-value').textContent = Math.round(newVolume * 100) + '%';
                this.volumeIndicator.querySelector('.indicator-icon').textContent = newVolume === 0 ? '🔇' : newVolume < 0.5 ? '🔉' : '🔊';
                this.showIndicator(this.volumeIndicator, true);
            } else if (touchX <= rect.width / 2 && this.options.enableSwipeBrightness) {
                // Left side - Brightness (using CSS filter)
                const brightness = Math.max(0.2, Math.min(1.5, 1 + (deltaY / sensitivity)));
                this.video.style.filter = `brightness(${brightness})`;
                
                this.brightnessIndicator.querySelector('.indicator-value').textContent = Math.round(brightness * 100) + '%';
                this.showIndicator(this.brightnessIndicator, true);
            }
        }
    }
    
    handleTouchEnd() {
        this.hideIndicator(this.volumeIndicator);
        this.hideIndicator(this.brightnessIndicator);
        this.isGesturing = false;
    }
    
    showIndicator(indicator, keepVisible = false) {
        indicator.classList.add('show');
        
        if (!keepVisible) {
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 800);
        }
    }
    
    hideIndicator(indicator) {
        indicator.classList.remove('show');
    }
}

// Auto-initialize on video elements
document.addEventListener('DOMContentLoaded', () => {
    // Wait for video player to be ready
    const initGestures = () => {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (!video.dataset.gesturesEnabled) {
                new MobileVideoGestures(video);
                video.dataset.gesturesEnabled = 'true';
            }
        });
    };
    
    // Initial check
    setTimeout(initGestures, 1000);
    
    // Also observe for dynamically added videos
    const observer = new MutationObserver(initGestures);
    observer.observe(document.body, { childList: true, subtree: true });
});

// Export for manual initialization
window.MobileVideoGestures = MobileVideoGestures;
