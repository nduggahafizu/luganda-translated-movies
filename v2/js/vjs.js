/* ============================================
   V2 Preview — VJ Translators page
============================================ */

(function () {
    'use strict';

    const vjGrid = document.getElementById('vjGrid');

    function formatViews(views) {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return (views || 0).toString();
    }

    function renderVJs(vjs) {
        vjGrid.innerHTML = vjs.map(vj => {
            const name = vj.name || vj.fullName || 'Unknown VJ';
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
            const movieCount = vj.stats?.totalMovies || vj.movieCount || 0;
            const totalViews = vj.stats?.totalViews || vj.totalViews || 0;
            const avgRating = vj.rating?.overall ? vj.rating.overall.toFixed(1) : (vj.avgRating ? vj.avgRating.toFixed(1) : '0.0');
            const bio = vj.bio ? vj.bio.substring(0, 90) + '...' : '';
            const verified = vj.verified ? '<span style="color:#4ade80;font-size:0.9rem;"> ✓</span>' : '';
            const specialties = vj.specialties ? vj.specialties.slice(0, 3).map(s => `<span class="specialty-tag">${V2.escapeHtml(s)}</span>`).join('') : '';

            return `
                <div class="vj-card">
                    <div class="vj-avatar">${V2.escapeHtml(initials)}</div>
                    <h3 class="vj-name">${V2.escapeHtml(name)}${verified}</h3>
                    ${bio ? `<p style="color:#aaa;font-size:0.85rem;margin-bottom:12px;">${V2.escapeHtml(bio)}</p>` : ''}
                    ${specialties ? `<div style="margin-bottom:12px;">${specialties}</div>` : ''}
                    <div class="vj-stats">
                        <div class="vj-stat">
                            <div class="vj-stat-value">${movieCount}</div>
                            <div class="vj-stat-label">Movies</div>
                        </div>
                        <div class="vj-stat">
                            <div class="vj-stat-value">${formatViews(totalViews)}</div>
                            <div class="vj-stat-label">Views</div>
                        </div>
                        <div class="vj-stat">
                            <div class="vj-stat-value">⭐ ${avgRating}</div>
                            <div class="vj-stat-label">Rating</div>
                        </div>
                    </div>
                    <a href="/v2/movies.html?vj=${encodeURIComponent(name)}" class="vj-btn">View Movies</a>
                </div>
            `;
        }).join('');
    }

    async function init() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/vjs`);
            const data = await response.json();

            if (data.success && data.data && data.data.length > 0) {
                renderVJs(data.data);
            } else {
                vjGrid.innerHTML = V2.emptyStateHTML('No VJ translators found', '');
            }
        } catch (error) {
            console.error('Error loading VJs:', error);
            vjGrid.innerHTML = V2.emptyStateHTML('Failed to load VJ translators', 'Please check your connection and try again.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
