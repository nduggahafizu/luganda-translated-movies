/* ===================================
   Social Sharing Component
   Features: Share to social media, copy link, native share
   =================================== */

const SocialShare = {
    // Initialize share functionality
    init: function() {
        this.bindEvents();
    },

    // Bind click events
    bindEvents: function() {
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openShareModal();
            });
        });
    },

    // Get share data
    getShareData: function() {
        const title = document.querySelector('meta[property="og:title"]')?.content || document.title;
        const description = document.querySelector('meta[property="og:description"]')?.content || 
                          document.querySelector('meta[name="description"]')?.content || '';
        const url = window.location.href;
        const image = document.querySelector('meta[property="og:image"]')?.content || '';
        
        return { title, description, url, image };
    },

    // Open share modal
    openShareModal: function() {
        const data = this.getShareData();
        
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-overlay"></div>
            <div class="share-modal-content">
                <div class="share-modal-header">
                    <h3>Share</h3>
                    <button class="share-modal-close">&times;</button>
                </div>
                <div class="share-modal-body">
                    <div class="share-preview">
                        ${data.image ? `<img src="${data.image}" alt="Preview" class="share-preview-image">` : ''}
                        <div class="share-preview-info">
                            <div class="share-preview-title">${data.title}</div>
                            <div class="share-preview-url">${data.url}</div>
                        </div>
                    </div>
                    
                    <div class="share-platforms">
                        <button class="share-platform-btn" data-platform="facebook">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            Facebook
                        </button>
                        <button class="share-platform-btn" data-platform="twitter">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            X (Twitter)
                        </button>
                        <button class="share-platform-btn" data-platform="whatsapp">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            WhatsApp
                        </button>
                        <button class="share-platform-btn" data-platform="telegram">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                            Telegram
                        </button>
                        <button class="share-platform-btn" data-platform="linkedin">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                            </svg>
                            LinkedIn
                        </button>
                        <button class="share-platform-btn" data-platform="email">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            Email
                        </button>
                    </div>
                    
                    <div class="share-copy-link">
                        <input type="text" value="${data.url}" readonly class="share-link-input">
                        <button class="share-copy-btn" data-platform="copy">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy Link
                        </button>
                    </div>
                    
                    ${navigator.share ? `
                        <button class="share-native-btn" data-platform="native">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                            </svg>
                            More sharing options
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add styles if not already added
        this.addStyles();
        
        // Bind modal events
        modal.querySelector('.share-modal-overlay').addEventListener('click', () => this.closeModal(modal));
        modal.querySelector('.share-modal-close').addEventListener('click', () => this.closeModal(modal));
        
        modal.querySelectorAll('[data-platform]').forEach(btn => {
            btn.addEventListener('click', () => this.handleShare(btn.dataset.platform, data, modal));
        });
        
        // Animate in
        requestAnimationFrame(() => modal.classList.add('active'));
    },

    // Close modal
    closeModal: function(modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    },

    // Handle share action
    handleShare: function(platform, data, modal) {
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.title)}&url=${encodeURIComponent(data.url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(data.title + ' ' + data.url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.title)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
            email: `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.description + '\n\n' + data.url)}`
        };
        
        if (platform === 'copy') {
            navigator.clipboard.writeText(data.url).then(() => {
                const btn = modal.querySelector('.share-copy-btn');
                btn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Copied!
                `;
                setTimeout(() => {
                    btn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy Link
                    `;
                }, 2000);
            });
            return;
        }
        
        if (platform === 'native' && navigator.share) {
            navigator.share({
                title: data.title,
                text: data.description,
                url: data.url
            }).then(() => {
                this.closeModal(modal);
            }).catch(console.error);
            return;
        }
        
        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    },

    // Add CSS styles
    addStyles: function() {
        if (document.getElementById('share-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'share-modal-styles';
        style.textContent = `
            .share-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .share-modal.active {
                opacity: 1;
            }
            
            .share-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
            }
            
            .share-modal-content {
                position: relative;
                background: var(--background-light, #1a1a1a);
                border-radius: 20px;
                max-width: 450px;
                width: 100%;
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            
            .share-modal.active .share-modal-content {
                transform: translateY(0);
            }
            
            .share-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid var(--border-color, #333);
            }
            
            .share-modal-header h3 {
                font-size: 18px;
                font-weight: 600;
                margin: 0;
            }
            
            .share-modal-close {
                background: none;
                border: none;
                font-size: 28px;
                color: var(--text-secondary, #888);
                cursor: pointer;
                line-height: 1;
            }
            
            .share-modal-body {
                padding: 25px;
            }
            
            .share-preview {
                display: flex;
                gap: 15px;
                padding: 15px;
                background: var(--background-dark, #0d0d0d);
                border-radius: 12px;
                margin-bottom: 25px;
            }
            
            .share-preview-image {
                width: 80px;
                height: 80px;
                border-radius: 8px;
                object-fit: cover;
            }
            
            .share-preview-info {
                flex: 1;
                overflow: hidden;
            }
            
            .share-preview-title {
                font-weight: 600;
                margin-bottom: 8px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .share-preview-url {
                font-size: 13px;
                color: var(--text-secondary, #888);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .share-platforms {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 12px;
                margin-bottom: 25px;
            }
            
            .share-platform-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 15px 10px;
                background: var(--background-dark, #0d0d0d);
                border: 1px solid var(--border-color, #333);
                border-radius: 12px;
                color: var(--text-primary, #fff);
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s ease;
            }
            
            .share-platform-btn:hover {
                background: rgba(124, 252, 0, 0.1);
                border-color: var(--primary-color, #7CFC00);
            }
            
            .share-platform-btn svg {
                width: 24px;
                height: 24px;
            }
            
            .share-copy-link {
                display: flex;
                gap: 10px;
            }
            
            .share-link-input {
                flex: 1;
                padding: 12px 15px;
                background: var(--background-dark, #0d0d0d);
                border: 1px solid var(--border-color, #333);
                border-radius: 10px;
                color: var(--text-primary, #fff);
                font-size: 14px;
            }
            
            .share-copy-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 20px;
                background: var(--primary-color, #7CFC00);
                border: none;
                border-radius: 10px;
                color: #000;
                font-weight: 600;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.3s ease;
            }
            
            .share-copy-btn:hover {
                background: #9dff44;
            }
            
            .share-copy-btn svg {
                width: 18px;
                height: 18px;
            }
            
            .share-native-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                width: 100%;
                padding: 15px;
                margin-top: 15px;
                background: transparent;
                border: 1px dashed var(--border-color, #333);
                border-radius: 12px;
                color: var(--text-secondary, #888);
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .share-native-btn:hover {
                border-color: var(--primary-color, #7CFC00);
                color: var(--primary-color, #7CFC00);
            }
            
            .share-native-btn svg {
                width: 20px;
                height: 20px;
            }
        `;
        
        document.head.appendChild(style);
    },

    // Create share button
    createShareButton: function(container, movieData = null) {
        const btn = document.createElement('button');
        btn.className = 'share-btn';
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Share
        `;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // If movie data provided, set meta tags temporarily
            if (movieData) {
                this.setTempMetaTags(movieData);
            }
            
            this.openShareModal();
        });
        
        if (container) {
            container.appendChild(btn);
        }
        
        return btn;
    },

    // Set temporary meta tags for sharing
    setTempMetaTags: function(data) {
        const setMeta = (property, content) => {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };
        
        if (data.title) setMeta('og:title', data.title);
        if (data.description) setMeta('og:description', data.description);
        if (data.image) setMeta('og:image', data.image);
        setMeta('og:url', data.url || window.location.href);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    SocialShare.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialShare;
}
