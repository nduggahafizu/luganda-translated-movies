/* ===================================
   Unruly Movies - Main JavaScript
   =================================== */

(function() {
    'use strict';

    // ===================================
    // Global Image Error Handler
    // ===================================
    // Handle broken images site-wide
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            const alt = img.alt || 'Image';
            // Generate colorful placeholder based on alt text
            const colors = ['7CFC00', 'FF6B6B', '4ECDC4', 'FFE66D', 'A855F7', 'EC4899', '06B6D4', 'F97316'];
            const colorIndex = alt.length % colors.length;
            const color = colors[colorIndex];
            const displayText = alt.substring(0, 15);
            img.src = `https://placehold.co/300x450/1a1a2e/${color}?text=${encodeURIComponent(displayText)}`;
            img.onerror = null; // Prevent infinite loop
        }
    }, true);

    // Handle broken background images for media-cover divs
    function handleBrokenBackgroundImages() {
        const mediaCoverElements = document.querySelectorAll('.media-cover, .media-slide');
        mediaCoverElements.forEach(el => {
            const style = el.style.backgroundImage;
            if (style && style.includes('url(')) {
                const urlMatch = style.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (urlMatch && urlMatch[1] && urlMatch[1].includes('tmdb.org')) {
                    const img = new Image();
                    img.onerror = function() {
                        // Generate placeholder
                        const colors = ['7CFC00', 'FF6B6B', '4ECDC4', 'FFE66D', 'A855F7'];
                        const colorIndex = Math.floor(Math.random() * colors.length);
                        const color = colors[colorIndex];
                        el.style.backgroundImage = `url('https://placehold.co/300x450/1a1a2e/${color}?text=Movie')`;
                    };
                    img.src = urlMatch[1];
                }
            }
        });
    }

    // Run after DOM is fully loaded
    setTimeout(handleBrokenBackgroundImages, 500);

    // DOM Elements
    const body = document.body;
    const menuBtn = document.getElementById('menuToggle') || document.querySelector('.menu');
    const sidebar = document.getElementById('aside') || document.querySelector('.app-aside');
    const searchBtn = document.querySelector('.search-btn');
    const headerSearch = document.querySelector('.header-search');
    const scrollUpBtn = document.querySelector('.scroll-up');

    // ===================================
    // Mobile Menu Toggle
    // ===================================
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            sidebar.classList.toggle('show');
            body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
            console.log('Menu clicked, sidebar show:', sidebar.classList.contains('show'));
        });
        
        // Also handle keyboard accessibility
        menuBtn.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                sidebar.classList.toggle('show');
                body.style.overflow = sidebar.classList.contains('show') ? 'hidden' : '';
            }
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', function(e) {
            if (sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) &&
                !menuBtn.contains(e.target)) {
                sidebar.classList.remove('show');
                body.style.overflow = '';
            }
        });

        // Close button in sidebar
        const modalClose = sidebar.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', function() {
                sidebar.classList.remove('show');
                body.style.overflow = '';
            });
        }
    }

    // ===================================
    // Mobile Search Toggle
    // ===================================
    const mobileSearchBtn = document.getElementById('mobileSearchBtn');
    const mobileSearchForm = document.getElementById('mobileSearchForm');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const mobileSearchClose = document.getElementById('mobileSearchClose');
    
    if (mobileSearchBtn && mobileSearchForm) {
        // Open mobile search
        mobileSearchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            mobileSearchForm.classList.add('active');
            if (mobileSearchInput) {
                setTimeout(() => mobileSearchInput.focus(), 100);
            }
        });
        
        // Close mobile search
        if (mobileSearchClose) {
            mobileSearchClose.addEventListener('click', function(e) {
                e.preventDefault();
                mobileSearchForm.classList.remove('active');
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileSearchForm.classList.contains('active')) {
                mobileSearchForm.classList.remove('active');
            }
        });
    }
    
    // Legacy search toggle (for other pages)
    if (searchBtn && headerSearch) {
        searchBtn.addEventListener('click', function() {
            headerSearch.classList.toggle('active');
            if (headerSearch.classList.contains('active')) {
                const searchInput = headerSearch.querySelector('.video-search');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 300);
                }
            }
        });

        // Close search when clicking outside
        document.addEventListener('click', function(e) {
            if (headerSearch.classList.contains('active') && 
                !headerSearch.contains(e.target) && 
                !searchBtn.contains(e.target)) {
                headerSearch.classList.remove('active');
            }
        });
    }

    // ===================================
    // Carousel Functionality
    // ===================================
    const carousel = document.querySelector('#slider');
    if (carousel) {
        const items = carousel.querySelectorAll('.carousel-item');
        const indicators = carousel.querySelectorAll('.carousel-indicators li');
        const prevBtn = carousel.querySelector('.control-prev');
        const nextBtn = carousel.querySelector('.control-next');
        let currentIndex = 0;
        let autoPlayInterval;

        function showSlide(index) {
            // Remove active class from all items
            items.forEach(item => item.classList.remove('active'));
            indicators.forEach(indicator => indicator.classList.remove('active'));

            // Add active class to current item
            if (items[index]) {
                items[index].classList.add('active');
            }
            if (indicators[index]) {
                indicators[index].classList.add('active');
            }
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % items.length;
            showSlide(currentIndex);
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            showSlide(currentIndex);
        }

        // Next button
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                nextSlide();
                resetAutoPlay();
            });
        }

        // Previous button
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                prevSlide();
                resetAutoPlay();
            });
        }

        // Indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', function() {
                currentIndex = index;
                showSlide(currentIndex);
                resetAutoPlay();
            });
        });

        // Auto play
        function startAutoPlay() {
            autoPlayInterval = setInterval(nextSlide, 5000);
        }

        function resetAutoPlay() {
            clearInterval(autoPlayInterval);
            startAutoPlay();
        }

        // Start auto play
        startAutoPlay();

        // Pause on hover
        carousel.addEventListener('mouseenter', function() {
            clearInterval(autoPlayInterval);
        });

        carousel.addEventListener('mouseleave', function() {
            startAutoPlay();
        });

        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                prevSlide();
                resetAutoPlay();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
                resetAutoPlay();
            }
        });

        // Touch swipe support
        let touchStartX = 0;
        let touchEndX = 0;

        carousel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });

        carousel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });

        function handleSwipe() {
            if (touchEndX < touchStartX - 50) {
                nextSlide();
                resetAutoPlay();
            }
            if (touchEndX > touchStartX + 50) {
                prevSlide();
                resetAutoPlay();
            }
        }
    }

    // ===================================
    // Scroll to Top Button
    // ===================================
    if (scrollUpBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollUpBtn.classList.add('show');
            } else {
                scrollUpBtn.classList.remove('show');
            }
        });

        scrollUpBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ===================================
    // Lazy Loading Images
    // ===================================
    const lazyImages = document.querySelectorAll('.media[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                
                if (src) {
                    img.style.backgroundImage = `url('${src}')`;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px'
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // ===================================
    // Search Functionality
    // ===================================
    const searchInput = document.querySelector('.video-search');
    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();

            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 300);
            }
        });

        function performSearch(query) {
            // This would typically make an API call
            console.log('Searching for:', query);
            // You can implement actual search functionality here
        }
    }

    // ===================================
    // Horizontal Scroll for Movie Lists
    // ===================================
    const scrollableContainers = document.querySelectorAll('.list-scrollable');
    
    scrollableContainers.forEach(container => {
        let isDown = false;
        let startX;
        let scrollLeft;

        container.addEventListener('mousedown', (e) => {
            isDown = true;
            container.style.cursor = 'grabbing';
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        });

        container.addEventListener('mouseleave', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mouseup', () => {
            isDown = false;
            container.style.cursor = 'grab';
        });

        container.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 2;
            container.scrollLeft = scrollLeft - walk;
        });
    });

    // ===================================
    // Modal Functionality
    // ===================================
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.classList.remove('show');
                modal.style.display = 'none';
            });
        }

        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                modal.style.display = 'none';
            }
        });
    });

    // ===================================
    // Video Player Placeholder
    // ===================================
    const playButtons = document.querySelectorAll('.play-btn');
    
    playButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const movieCard = this.closest('.list-movie');
            const title = movieCard.querySelector('.list-title')?.textContent || 'Movie';
            
            // Show notification (you can replace this with actual video player)
            showNotification(`Playing: ${title}`, 'success');
        });
    });

    // ===================================
    // Notification System
    // ===================================
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? 'var(--primary-color)' : 'var(--background-light)'};
            color: ${type === 'success' ? '#000' : 'var(--text-primary)'};
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ===================================
    // Active Navigation Highlighting
    // ===================================
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav li a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.parentElement.classList.add('active');
        }
    });

    // ===================================
    // Form Validation (for login/register)
    // ===================================
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const inputs = form.querySelectorAll('input[required]');
            let isValid = true;
            
            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#ff4444';
                } else {
                    input.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showNotification('Please fill in all required fields', 'error');
            }
        });
    });

    // ===================================
    // Smooth Scroll for Anchor Links
    // ===================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ===================================
    // Initialize on Load
    // ===================================
    window.addEventListener('load', function() {
        // Remove loading class if exists
        body.classList.remove('loading');
        
        // Log initialization
        console.log('Unruly Movies initialized successfully!');
    });

    // ===================================
    // Handle Network Status
    // ===================================
    window.addEventListener('online', function() {
        showNotification('Connection restored', 'success');
    });

    window.addEventListener('offline', function() {
        showNotification('No internet connection', 'error');
    });

})();
