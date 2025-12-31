/* ===================================
   Featured Content Carousel
   Hero slider for featured movies
   =================================== */

const FeaturedCarousel = {
    container: null,
    slides: [],
    currentIndex: 0,
    autoplayInterval: null,
    autoplayDelay: 5000,
    isTransitioning: false,
    touchStartX: 0,
    touchEndX: 0,

    // Initialize carousel
    init: function(containerId, movies) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.slides = movies;
        this.render();
        this.bindEvents();
        this.startAutoplay();
    },

    // Render carousel HTML
    render: function() {
        this.container.innerHTML = `
            <div class="featured-carousel">
                <div class="carousel-slides">
                    ${this.slides.map((movie, index) => this.renderSlide(movie, index)).join('')}
                </div>
                
                <div class="carousel-overlay">
                    <div class="carousel-content">
                        <div class="carousel-badge">
                            <span class="badge-icon">🔥</span>
                            <span>Featured</span>
                        </div>
                        <h2 class="carousel-title">${this.slides[0]?.title || ''}</h2>
                        <div class="carousel-meta">
                            <span class="meta-year">${this.slides[0]?.year || ''}</span>
                            <span class="meta-divider">•</span>
                            <span class="meta-duration">${this.slides[0]?.duration || '2h 15m'}</span>
                            <span class="meta-divider">•</span>
                            <span class="meta-rating">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                ${this.slides[0]?.rating || '8.5'}
                            </span>
                        </div>
                        <p class="carousel-description">${this.slides[0]?.description || ''}</p>
                        <div class="carousel-vj">
                            <img src="${this.slides[0]?.vjAvatar || 'assets/images/default-avatar.png'}" alt="VJ" class="vj-avatar">
                            <span>Translated by <strong>VJ ${this.slides[0]?.vjName || ''}</strong></span>
                        </div>
                        <div class="carousel-actions">
                            <a href="player.html?id=${this.slides[0]?.id}" class="btn-play">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Watch Now
                            </a>
                            <button class="btn-add-list" data-movie-id="${this.slides[0]?.id}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                Add to List
                            </button>
                            <button class="btn-info" data-movie-id="${this.slides[0]?.id}">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                <button class="carousel-nav carousel-prev" aria-label="Previous slide">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button class="carousel-nav carousel-next" aria-label="Next slide">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                
                <div class="carousel-indicators">
                    ${this.slides.map((_, index) => `
                        <button class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to slide ${index + 1}"></button>
                    `).join('')}
                </div>
            </div>
        `;

        this.addStyles();
    },

    // Render individual slide
    renderSlide: function(movie, index) {
        return `
            <div class="carousel-slide ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="slide-bg" style="background-image: url('${movie.backdrop || movie.poster}')"></div>
            </div>
        `;
    },

    // Update content for current slide
    updateContent: function(index) {
        const movie = this.slides[index];
        if (!movie) return;

        const content = this.container.querySelector('.carousel-content');
        content.querySelector('.carousel-title').textContent = movie.title;
        content.querySelector('.meta-year').textContent = movie.year;
        content.querySelector('.meta-duration').textContent = movie.duration || '2h 15m';
        content.querySelector('.meta-rating').innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${movie.rating || '8.5'}
        `;
        content.querySelector('.carousel-description').textContent = movie.description || '';
        content.querySelector('.vj-avatar').src = movie.vjAvatar || 'assets/images/default-avatar.png';
        content.querySelector('.carousel-vj strong').textContent = `VJ ${movie.vjName || ''}`;
        content.querySelector('.btn-play').href = `player.html?id=${movie.id}`;
        content.querySelector('.btn-add-list').dataset.movieId = movie.id;
        content.querySelector('.btn-info').dataset.movieId = movie.id;
    },

    // Go to specific slide
    goTo: function(index) {
        if (this.isTransitioning || index === this.currentIndex) return;
        this.isTransitioning = true;

        const slides = this.container.querySelectorAll('.carousel-slide');
        const indicators = this.container.querySelectorAll('.indicator');

        // Remove active class from current
        slides[this.currentIndex].classList.remove('active');
        indicators[this.currentIndex].classList.remove('active');

        // Update index
        this.currentIndex = index;
        if (this.currentIndex >= this.slides.length) this.currentIndex = 0;
        if (this.currentIndex < 0) this.currentIndex = this.slides.length - 1;

        // Add active class to new
        slides[this.currentIndex].classList.add('active');
        indicators[this.currentIndex].classList.add('active');

        // Update content with animation
        const content = this.container.querySelector('.carousel-content');
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';

        setTimeout(() => {
            this.updateContent(this.currentIndex);
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
            this.isTransitioning = false;
        }, 300);
    },

    // Go to next slide
    next: function() {
        this.goTo(this.currentIndex + 1);
    },

    // Go to previous slide
    prev: function() {
        this.goTo(this.currentIndex - 1);
    },

    // Start autoplay
    startAutoplay: function() {
        this.stopAutoplay();
        this.autoplayInterval = setInterval(() => {
            this.next();
        }, this.autoplayDelay);
    },

    // Stop autoplay
    stopAutoplay: function() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        }
    },

    // Bind events
    bindEvents: function() {
        // Navigation buttons
        const prevBtn = this.container.querySelector('.carousel-prev');
        const nextBtn = this.container.querySelector('.carousel-next');

        prevBtn.addEventListener('click', () => {
            this.prev();
            this.startAutoplay();
        });

        nextBtn.addEventListener('click', () => {
            this.next();
            this.startAutoplay();
        });

        // Indicators
        this.container.querySelectorAll('.indicator').forEach(indicator => {
            indicator.addEventListener('click', () => {
                this.goTo(parseInt(indicator.dataset.index));
                this.startAutoplay();
            });
        });

        // Pause on hover
        this.container.addEventListener('mouseenter', () => this.stopAutoplay());
        this.container.addEventListener('mouseleave', () => this.startAutoplay());

        // Touch support
        this.container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        this.container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        }, { passive: true });

        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        // Add to list button
        this.container.querySelector('.btn-add-list').addEventListener('click', (e) => {
            const movieId = e.currentTarget.dataset.movieId;
            if (typeof WatchlistManager !== 'undefined') {
                WatchlistManager.toggleWatchlist({
                    id: movieId,
                    ...this.slides[this.currentIndex]
                });
            }
        });
    },

    // Handle swipe gesture
    handleSwipe: function() {
        const diff = this.touchStartX - this.touchEndX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
            this.startAutoplay();
        }
    },

    // Add CSS styles
    addStyles: function() {
        if (document.getElementById('featured-carousel-styles')) return;

        const style = document.createElement('style');
        style.id = 'featured-carousel-styles';
        style.textContent = `
            .featured-carousel {
                position: relative;
                width: 100%;
                height: 70vh;
                min-height: 500px;
                max-height: 700px;
                overflow: hidden;
                border-radius: 20px;
                margin-bottom: 30px;
            }

            .carousel-slides {
                position: relative;
                width: 100%;
                height: 100%;
            }

            .carousel-slide {
                position: absolute;
                inset: 0;
                opacity: 0;
                transition: opacity 0.8s ease;
            }

            .carousel-slide.active {
                opacity: 1;
            }

            .slide-bg {
                width: 100%;
                height: 100%;
                background-size: cover;
                background-position: center;
                filter: brightness(0.6);
            }

            .carousel-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(
                    to right,
                    rgba(0, 0, 0, 0.9) 0%,
                    rgba(0, 0, 0, 0.6) 50%,
                    transparent 100%
                );
                display: flex;
                align-items: center;
                padding: 0 60px;
            }

            .carousel-content {
                max-width: 550px;
                transition: all 0.3s ease;
            }

            .carousel-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(124, 252, 0, 0.2);
                border: 1px solid var(--primary-color);
                color: var(--primary-color);
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                margin-bottom: 20px;
            }

            .carousel-title {
                font-size: 48px;
                font-weight: 800;
                line-height: 1.1;
                margin-bottom: 15px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            }

            .carousel-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 20px;
                font-size: 14px;
                color: var(--text-secondary);
            }

            .meta-rating {
                display: flex;
                align-items: center;
                gap: 4px;
                color: #FFD700;
            }

            .carousel-description {
                font-size: 15px;
                line-height: 1.7;
                color: var(--text-secondary);
                margin-bottom: 20px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }

            .carousel-vj {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 25px;
                font-size: 14px;
                color: var(--text-secondary);
            }

            .vj-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border: 2px solid var(--primary-color);
            }

            .carousel-actions {
                display: flex;
                gap: 12px;
            }

            .btn-play {
                display: flex;
                align-items: center;
                gap: 8px;
                background: var(--primary-color);
                color: #000;
                padding: 14px 28px;
                border-radius: 10px;
                font-weight: 700;
                font-size: 15px;
                text-decoration: none;
                transition: all 0.3s ease;
            }

            .btn-play:hover {
                background: #9dff44;
                transform: translateY(-2px);
                box-shadow: 0 5px 20px rgba(124, 252, 0, 0.4);
            }

            .btn-add-list,
            .btn-info {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #fff;
                padding: 14px 20px;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .btn-add-list:hover,
            .btn-info:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: var(--primary-color);
            }

            .carousel-nav {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(0, 0, 0, 0.5);
                border: none;
                color: #fff;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                cursor: pointer;
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 10;
            }

            .featured-carousel:hover .carousel-nav {
                opacity: 1;
            }

            .carousel-nav:hover {
                background: var(--primary-color);
                color: #000;
            }

            .carousel-prev {
                left: 20px;
            }

            .carousel-next {
                right: 20px;
            }

            .carousel-indicators {
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                gap: 10px;
            }

            .indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: none;
                background: rgba(255, 255, 255, 0.3);
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .indicator.active {
                background: var(--primary-color);
                transform: scale(1.2);
            }

            .indicator:hover {
                background: rgba(255, 255, 255, 0.6);
            }

            @media (max-width: 768px) {
                .featured-carousel {
                    height: 60vh;
                    min-height: 400px;
                    border-radius: 15px;
                }

                .carousel-overlay {
                    padding: 0 20px;
                    background: linear-gradient(
                        to top,
                        rgba(0, 0, 0, 0.95) 0%,
                        rgba(0, 0, 0, 0.7) 50%,
                        transparent 100%
                    );
                    align-items: flex-end;
                    padding-bottom: 80px;
                }

                .carousel-content {
                    max-width: 100%;
                }

                .carousel-title {
                    font-size: 28px;
                }

                .carousel-description {
                    display: none;
                }

                .carousel-nav {
                    display: none;
                }

                .btn-add-list span {
                    display: none;
                }
            }
        `;

        document.head.appendChild(style);
    },

    // Load featured movies from API
    loadFeatured: async function(containerId) {
        try {
            const response = await fetch(`${API_CONFIG?.API_URL || ''}/api/luganda-movies?featured=true&limit=5`);
            const data = await response.json();

            if (data.status === 'success' && data.data.length > 0) {
                const movies = data.data.map(movie => ({
                    id: movie._id,
                    title: movie.originalTitle,
                    year: movie.releaseYear || new Date(movie.createdAt).getFullYear(),
                    duration: movie.video?.duration || '2h 15m',
                    rating: movie.rating?.translationRating?.toFixed(1) || '8.5',
                    description: movie.plot || movie.description || '',
                    poster: movie.poster,
                    backdrop: movie.backdrop || movie.poster,
                    vjName: movie.vjName,
                    vjAvatar: movie.vjAvatar || 'assets/images/default-avatar.png'
                }));

                this.init(containerId, movies);
            }
        } catch (error) {
            console.error('Error loading featured movies:', error);
        }
    }
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeaturedCarousel;
}
