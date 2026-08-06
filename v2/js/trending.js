/* ============================================
   V2 Preview — Trending page
============================================ */

(function () {
    'use strict';

    const grid = document.getElementById('trendingGrid');

    function formatViews(views) {
        if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
        if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
        return (views || 0).toString();
    }

    async function loadTrending() {
        try {
            const data = await LugandaMoviesAPI.getAllMovies({ sort: 'popular', limit: 50 });
            const items = data?.data || [];

            if (!items.length) {
                grid.innerHTML = V2.emptyStateHTML('No trending movies found', '');
                return;
            }

            items.sort((a, b) => {
                const aTrending = a.trending === true ? 10000 : 0;
                const bTrending = b.trending === true ? 10000 : 0;
                const aScore = aTrending + (a.views || 0);
                const bScore = bTrending + (b.views || 0);
                return bScore - aScore;
            });

            grid.innerHTML = items.map((item, index) => {
                const rank = index + 1;
                let rankClass = 'regular';
                if (rank === 1) rankClass = 'gold';
                else if (rank === 2) rankClass = 'silver';
                else if (rank === 3) rankClass = 'bronze';

                const isSeries = item.contentType === 'series';
                const title = item.originalTitle || item.lugandaTitle || item.title || 'Unknown Title';
                const year = item.year || item.startYear || '';
                const views = item.views || 0;
                const vjBadge = V2.formatVjBadge(item.vjName || item.vj);
                const fallbackPoster = V2.getPlaceholderPoster(title, year);
                const poster = item.poster || fallbackPoster;
                const href = isSeries ? `/v2/details.html?id=${item._id}&type=series` : `/v2/details.html?id=${item._id}&type=movie`;

                return `
                    <a href="${href}" class="trending-card" data-movie-id="${item._id}">
                        <div class="trending-rank ${rankClass}">${rank}</div>
                        ${vjBadge ? `<div class="vj-badge">${V2.escapeHtml(vjBadge)}</div>` : ''}
                        <img src="${poster}" alt="${V2.escapeHtml(title)}" loading="lazy" onerror="this.onerror=null; this.src='${fallbackPoster}';">
                        <div class="trending-card-info">
                            <div class="trending-card-title">${V2.escapeHtml(title)}</div>
                            <div class="trending-card-meta">
                                <span>${year}</span>
                                <span class="views">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                    ${formatViews(views)}
                                </span>
                            </div>
                        </div>
                    </a>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading trending movies:', error);
            grid.innerHTML = V2.emptyStateHTML('Failed to load trending movies', 'Please check your connection and try again.');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadTrending);
    } else {
        loadTrending();
    }
})();
