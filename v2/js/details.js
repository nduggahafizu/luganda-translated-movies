/* ============================================
   V2 Preview — Details page
   ?id=<movieId>&type=movie|series
============================================ */

(function () {
    'use strict';

    const hero = document.getElementById('detailsHero');
    const body = document.getElementById('detailsBody');
    const relatedSection = document.getElementById('relatedSection');

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const type = (params.get('type') || 'movie').toLowerCase();
    const isSeries = type === 'series';

    function notFound() {
        hero.innerHTML = '';
        body.innerHTML = `
            <div class="empty-state">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p class="empty-text">Title not found</p>
                <p class="empty-subtext"><a href="/v2/index.html" style="color: var(--primary-color, #4ade80);">Back to Home</a></p>
            </div>`;
    }

    function render(item) {
        const title = item.originalTitle || item.lugandaTitle || item.title || 'Unknown Title';
        const year = item.year || item.startYear || '';
        const genres = item.genres || [];
        const vjBadge = V2.formatVjBadge(item.vjName || item.vj);
        const quality = item.video?.quality || 'HD';
        const overview = item.description || item.plot || item.overview || 'No description available.';
        const fallback = V2.getPlaceholderPoster(title, year);
        const backdrop = item.backdrop || item.poster || fallback;

        document.title = `${title} — Unruly Movies V2 Preview`;

        hero.innerHTML = `
            <img src="${backdrop}" alt="${V2.escapeHtml(title)}" onerror="this.onerror=null; this.src='${fallback}';">
            <div class="hero-overlay"></div>
        `;

        const watchHref = isSeries
            ? `/series-player.html?id=${item._id}&season=1&episode=1`
            : `/player.html?id=${item._id}`;

        body.innerHTML = `
            <h1 class="details-title">${V2.escapeHtml(title)}</h1>
            <div class="details-meta">
                ${year ? `<span class="meta-tag">${year}</span>` : ''}
                <span class="meta-tag">${isSeries ? 'SERIES' : quality}</span>
                ${vjBadge ? `<span class="meta-tag meta-vj">${vjBadge}</span>` : ''}
                ${genres.map(g => `<span class="meta-tag">${V2.escapeHtml(g)}</span>`).join('')}
            </div>
            <p class="details-overview">${V2.escapeHtml(overview)}</p>
            <div class="details-actions">
                <a href="${watchHref}" class="v2-btn v2-btn-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Watch Now
                </a>
                <button class="v2-btn v2-btn-outline" onclick="addToWatchlist('${item._id}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                    Add to Watchlist
                </button>
            </div>
            <div class="details-info-grid">
                <div class="details-info-item">
                    <div class="label">Type</div>
                    <div class="value">${isSeries ? 'Series' : 'Movie'}</div>
                </div>
                ${year ? `<div class="details-info-item"><div class="label">Year</div><div class="value">${year}</div></div>` : ''}
                ${vjBadge ? `<div class="details-info-item"><div class="label">VJ Translator</div><div class="value">${vjBadge}</div></div>` : ''}
                ${!isSeries ? `<div class="details-info-item"><div class="label">Quality</div><div class="value">${quality}</div></div>` : ''}
                ${isSeries && item.totalSeasons ? `<div class="details-info-item"><div class="label">Seasons</div><div class="value">${item.totalSeasons}</div></div>` : ''}
                ${genres.length ? `<div class="details-info-item"><div class="label">Genres</div><div class="value">${genres.map(V2.escapeHtml).join(', ')}</div></div>` : ''}
            </div>
        `;

        loadRelated(item, genres);
    }

    async function loadRelated(item, genres) {
        try {
            let items = [];
            if (genres.length) {
                const res = await LugandaMoviesAPI.getByGenre(genres[0], 13);
                items = res?.data || [];
            } else if (item.vjName) {
                const res = await LugandaMoviesAPI.getByVJ(item.vjName, 13);
                items = res?.data || [];
            }
            items = items.filter(i => i._id !== item._id).slice(0, 12);
            relatedSection.innerHTML = V2.rowHTML('You Might Also Like', items, null);
        } catch (error) {
            console.error('Error loading related titles:', error);
        }
    }

    async function init() {
        if (!id) {
            notFound();
            return;
        }
        try {
            const res = await LugandaMoviesAPI.getMovie(id);
            if (res?.success && res.data) {
                render(res.data);
            } else {
                notFound();
            }
        } catch (error) {
            console.error('Error loading details:', error);
            notFound();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
