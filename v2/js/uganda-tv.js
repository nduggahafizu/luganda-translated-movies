/* ============================================
   V2 Preview — Uganda TV page
============================================ */

(function () {
    'use strict';

    document.querySelectorAll('.tv-station-card').forEach(card => {
        card.addEventListener('click', function () {
            const stationId = this.dataset.station;
            if (!stationId) return;

            this.style.opacity = '0.7';
            this.style.pointerEvents = 'none';

            if (window.UgandaTvApi) {
                UgandaTvApi.getStreamUrl(stationId).then(streamUrl => {
                    if (streamUrl) {
                        window.location.href = `/player.html?station=${stationId}&stream=${encodeURIComponent(streamUrl)}`;
                    } else {
                        alert('Stream not available at the moment. Please try again later.');
                        this.style.opacity = '1';
                        this.style.pointerEvents = 'auto';
                    }
                }).catch(error => {
                    console.error('Error getting stream URL:', error);
                    alert('Error accessing stream. Please try again later.');
                    this.style.opacity = '1';
                    this.style.pointerEvents = 'auto';
                });
            } else {
                window.location.href = `/player.html?station=${stationId}`;
            }
        });
    });

    document.querySelectorAll('.tv-station-thumbnail img').forEach(img => {
        img.onerror = function () {
            this.onerror = null;
            const currentSrc = this.src;
            if (currentSrc.endsWith('.webp')) {
                this.src = currentSrc.replace('.webp', '.svg');
            } else {
                this.style.opacity = '0.3';
            }
        };
    });
})();
