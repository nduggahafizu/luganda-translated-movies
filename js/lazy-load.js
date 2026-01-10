/* ===================================
   Netflix-Style Lazy Loading for Images
   Improves performance by loading images as they enter viewport
   =================================== */

(function() {
    'use strict';

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback for older browsers - load all images immediately
        loadAllImages();
        return;
    }

    // Configuration for lazy loading
    const config = {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01
    };

    // Create intersection observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                loadImage(img);
                observer.unobserve(img);
            }
        });
    }, config);

    // Load single image
    function loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // For background images
        if (img.classList.contains('media-cover')) {
            img.style.backgroundImage = `url('${src}')`;
            img.classList.add('loaded');
        } 
        // For regular img tags
        else {
            img.src = src;
            img.onload = () => {
                img.classList.add('loaded');
                img.removeAttribute('data-src');
            };
        }
    }

    // Fallback function to load all images
    function loadAllImages() {
        const lazyImages = document.querySelectorAll('[data-src]');
        lazyImages.forEach(img => loadImage(img));
    }

    // Initialize lazy loading
    function initLazyLoad() {
        const lazyImages = document.querySelectorAll('[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initLazyLoad);
    } else {
        initLazyLoad();
    }

    // Re-initialize when new content is added (for dynamic loading)
    window.reinitLazyLoad = initLazyLoad;

})();

// Responsive image srcset helper
function getResponsiveSrc(baseUrl, size = 'medium') {
    if (!baseUrl) return '';
    
    const sizes = {
        small: 'w200',   // Mobile
        medium: 'w400',  // Tablet
        large: 'w800',   // Desktop
        xlarge: 'w1280'  // Large screens
    };
    
    // If using TMDB images
    if (baseUrl.includes('tmdb.org')) {
        return baseUrl.replace(/w\d+/, sizes[size]);
    }
    
    // For Archive.org or other sources
    return baseUrl;
}

// Create srcset attribute for responsive images
function createSrcSet(baseUrl) {
    if (!baseUrl) return '';
    
    if (baseUrl.includes('tmdb.org')) {
        return `
            ${baseUrl.replace(/w\d+/, 'w200')} 200w,
            ${baseUrl.replace(/w\d+/, 'w400')} 400w,
            ${baseUrl.replace(/w\d+/, 'w800')} 800w
        `.trim();
    }
    
    return baseUrl;
}
