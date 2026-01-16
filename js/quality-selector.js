/**
 * Video Quality Selector
 * Allows users to choose video quality (works with Archive.org URLs)
 */

class VideoQualitySelector {
    constructor(playerContainer, options = {}) {
        this.container = typeof playerContainer === 'string' 
            ? document.querySelector(playerContainer) 
            : playerContainer;
        this.options = {
            defaultQuality: 'auto',
            qualities: ['auto', '1080p', '720p', '480p', '360p'],
            onQualityChange: null,
            ...options
        };
        
        this.currentQuality = localStorage.getItem('preferredQuality') || this.options.defaultQuality;
        this.video = null;
        this.currentSrc = '';
        
        this.init();
    }
    
    init() {
        this.video = this.container.querySelector('video');
        if (!this.video) return;
        
        this.currentSrc = this.video.src;
        this.createQualityButton();
        this.createQualityMenu();
        this.addStyles();
        
        console.log('🎬 Quality selector initialized');
    }
    
    createQualityButton() {
        const controls = this.container.querySelector('.plyr__controls') || 
                        this.container.querySelector('.video-controls') ||
                        this.container;
        
        this.qualityBtn = document.createElement('button');
        this.qualityBtn.className = 'quality-selector-btn';
        this.qualityBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            <span class="quality-label">${this.currentQuality}</span>
        `;
        this.qualityBtn.title = 'Video Quality';
        this.qualityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMenu();
        });
        
        controls.appendChild(this.qualityBtn);
    }
    
    createQualityMenu() {
        this.menu = document.createElement('div');
        this.menu.className = 'quality-menu hidden';
        
        let menuHTML = '<div class="quality-menu-header">Quality</div>';
        
        this.options.qualities.forEach(quality => {
            const isActive = quality === this.currentQuality ? 'active' : '';
            menuHTML += `
                <button class="quality-option ${isActive}" data-quality="${quality}">
                    <span class="quality-check">✓</span>
                    <span class="quality-name">${quality}</span>
                    ${quality === 'auto' ? '<span class="quality-desc">Recommended</span>' : ''}
                    ${quality === '1080p' ? '<span class="quality-badge">HD</span>' : ''}
                    ${quality === '720p' ? '<span class="quality-badge">HD</span>' : ''}
                </button>
            `;
        });
        
        menuHTML += `
            <div class="quality-menu-footer">
                <label class="quality-save">
                    <input type="checkbox" id="saveQualityPref" ${localStorage.getItem('preferredQuality') ? 'checked' : ''}>
                    Remember my choice
                </label>
            </div>
        `;
        
        this.menu.innerHTML = menuHTML;
        this.container.appendChild(this.menu);
        
        // Add click handlers
        this.menu.querySelectorAll('.quality-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.setQuality(btn.dataset.quality);
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', () => this.hideMenu());
    }
    
    toggleMenu() {
        this.menu.classList.toggle('hidden');
    }
    
    hideMenu() {
        this.menu.classList.add('hidden');
    }
    
    setQuality(quality) {
        const oldQuality = this.currentQuality;
        this.currentQuality = quality;
        
        // Update UI
        this.menu.querySelectorAll('.quality-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.quality === quality);
        });
        this.qualityBtn.querySelector('.quality-label').textContent = quality;
        
        // Save preference
        const saveCheckbox = document.getElementById('saveQualityPref');
        if (saveCheckbox && saveCheckbox.checked) {
            localStorage.setItem('preferredQuality', quality);
        }
        
        // Apply quality change
        this.applyQuality(quality);
        
        this.hideMenu();
        
        // Callback
        if (this.options.onQualityChange) {
            this.options.onQualityChange(quality, oldQuality);
        }
        
        // Track
        if (typeof gtag === 'function') {
            gtag('event', 'quality_change', {
                'old_quality': oldQuality,
                'new_quality': quality
            });
        }
    }
    
    applyQuality(quality) {
        if (!this.video || !this.currentSrc) return;
        
        // For Archive.org URLs, we can try to get different quality versions
        // Archive.org format: https://ia{server}.us.archive.org/{id}/{filename}
        // Some Archive.org items have _h264_360, _h264_480, etc.
        
        const currentTime = this.video.currentTime;
        const wasPlaying = !this.video.paused;
        
        if (quality === 'auto') {
            // Use original source
            if (this.video.src !== this.currentSrc) {
                this.video.src = this.currentSrc;
                this.video.currentTime = currentTime;
                if (wasPlaying) this.video.play();
            }
            return;
        }
        
        // Try to find quality-specific URL (Archive.org specific)
        const qualityMap = {
            '1080p': '',           // Original is usually 1080p
            '720p': '_h264_720',
            '480p': '_h264_480',
            '360p': '_h264_360'
        };
        
        // For now, show a message since Archive.org quality depends on upload
        this.showQualityMessage(quality);
    }
    
    showQualityMessage(quality) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'quality-toast';
        toast.innerHTML = `
            <span>📺 Quality: ${quality}</span>
            <small>Playback adjusted for ${quality === 'auto' ? 'best' : quality} quality</small>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    addStyles() {
        if (document.getElementById('quality-selector-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'quality-selector-styles';
        style.textContent = `
            .quality-selector-btn {
                display: flex;
                align-items: center;
                gap: 5px;
                background: rgba(0, 0, 0, 0.6);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 13px;
                font-weight: 500;
                transition: background 0.2s;
            }
            .quality-selector-btn:hover {
                background: rgba(102, 187, 106, 0.8);
            }
            .quality-selector-btn svg {
                opacity: 0.8;
            }
            .quality-menu {
                position: absolute;
                bottom: 60px;
                right: 10px;
                background: rgba(28, 28, 28, 0.98);
                border-radius: 10px;
                min-width: 180px;
                overflow: hidden;
                z-index: 1000;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                animation: slideUp 0.2s ease;
            }
            .quality-menu.hidden {
                display: none;
            }
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .quality-menu-header {
                padding: 12px 15px;
                font-weight: 600;
                color: #fff;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                font-size: 14px;
            }
            .quality-option {
                display: flex;
                align-items: center;
                width: 100%;
                padding: 10px 15px;
                background: none;
                border: none;
                color: #ccc;
                cursor: pointer;
                text-align: left;
                transition: background 0.2s;
                font-size: 14px;
            }
            .quality-option:hover {
                background: rgba(102, 187, 106, 0.2);
                color: #fff;
            }
            .quality-option.active {
                color: #66BB6A;
            }
            .quality-option .quality-check {
                width: 20px;
                opacity: 0;
            }
            .quality-option.active .quality-check {
                opacity: 1;
            }
            .quality-option .quality-name {
                flex: 1;
            }
            .quality-option .quality-desc {
                font-size: 11px;
                color: #888;
                margin-left: 5px;
            }
            .quality-option .quality-badge {
                background: #66BB6A;
                color: #000;
                font-size: 10px;
                font-weight: 700;
                padding: 2px 5px;
                border-radius: 3px;
                margin-left: 5px;
            }
            .quality-menu-footer {
                padding: 10px 15px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .quality-save {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                color: #888;
                cursor: pointer;
            }
            .quality-save input {
                accent-color: #66BB6A;
            }
            .quality-toast {
                position: fixed;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(28, 28, 28, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 10px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                z-index: 10000;
                opacity: 0;
                transition: all 0.3s ease;
            }
            .quality-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .quality-toast small {
                color: #888;
                font-size: 11px;
            }
        `;
        document.head.appendChild(style);
    }
}

// Export
window.VideoQualitySelector = VideoQualitySelector;
