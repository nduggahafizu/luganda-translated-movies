/* ============================================
   V2 Preview — Shared card/grid helpers
   Used by movies, series, search, details,
   watchlist and history pages.
============================================ */

(function () {
    'use strict';

    function formatVjBadge(vjName) {
        const name = (vjName || '').toString().trim();
        if (!name) return '';
        if (/^unknown\b/i.test(name)) return '';
        const cleaned = name.replace(/^vj[\s:\-.]*?/i, '').trim();
        if (!cleaned) return '';
        return `VJ ${cleaned}`;
    }

    function getPlaceholderPoster(title, year) {
        const colors = ['4ade80', 'FF6B6B', '4ECDC4', '9D4EDD', 'A855F7', 'EC4899', '06B6D4', 'F97316'];
        const colorIndex = (title || '').length % colors.length;
        const color = colors[colorIndex];
        const displayTitle = (title || 'Movie').substring(0, 20);
        const displayYear = year || '';
        return `https://placehold.co/300x450/1a1a2e/${color}?text=${encodeURIComponent(displayTitle)}%0A${displayYear}`;
    }

    function escapeHtml(str) {
        return (str || '').toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function showToast(message, type) {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            padding: 14px 24px;
            background: ${type === 'success' ? '#4ade80' : type === 'error' ? '#ff4444' : '#333'};
            color: ${type === 'success' ? '#000' : '#fff'};
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }

    window.addToWatchlist = async function (movieId) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/api/playlist/watchlist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ contentId: movieId, contentType: 'movie' })
            });
            const data = await response.json();
            if (data.success) {
                showToast('Added to Watchlist!', 'success');
            } else {
                showToast(data.message || 'Already in watchlist', 'info');
            }
        } catch (error) {
            console.error('Error adding to watchlist:', error);
            showToast('Could not add to watchlist', 'error');
        }
    };

    // opts: { removeHandler: 'jsExpressionString', progress: 0-100 }
    function cardHTML(item, opts) {
        opts = opts || {};
        const isSeries = item.contentType === 'series';
        const title = item.originalTitle || item.lugandaTitle || item.title || 'Unknown Title';
        const year = item.year || item.startYear || '';
        const genres = item.genres || [];
        const vjBadge = formatVjBadge(item.vjName || item.vj);
        const fallbackPoster = getPlaceholderPoster(title, year);
        const poster = item.poster || fallbackPoster;
        const href = isSeries ? `/v2/details.html?id=${item._id}&type=series` : `/v2/details.html?id=${item._id}&type=movie`;
        const quality = item.video?.quality || 'HD';

        const qualityBadge = isSeries
            ? `<span class="badge-quality" style="background: linear-gradient(135deg, #A855F7, #7C3AED);">SERIES</span>`
            : `<span class="card-badge badge-quality">${quality}</span>`;

        const metaExtra = isSeries
            ? `${item.totalSeasons ? `<span>${item.totalSeasons} Season${item.totalSeasons > 1 ? 's' : ''}</span>` : ''}`
            : `${genres.length > 0 ? `<span>${escapeHtml(genres[0])}</span>` : ''}`;

        const removeBtn = opts.removeHandler
            ? `<button class="card-remove-btn" title="Remove" onclick="event.preventDefault(); event.stopPropagation(); ${opts.removeHandler}">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                       <line x1="18" y1="6" x2="6" y2="18"></line>
                       <line x1="6" y1="6" x2="18" y2="18"></line>
                   </svg>
               </button>`
            : '';

        const progressBar = typeof opts.progress === 'number'
            ? `<div class="progress-track"><div class="progress-fill" style="width:${Math.min(100, Math.max(0, opts.progress))}%"></div></div>`
            : '';

        const cardClass = opts.removeHandler || progressBar ? 'content-card v2-history-item' : 'content-card';

        return `
            <a href="${href}" class="${cardClass}" data-id="${item._id}">
                ${removeBtn}
                <div class="card-poster">
                    <img src="${poster}" alt="${escapeHtml(title)}" loading="lazy"
                         onerror="this.onerror=null; this.src='${fallbackPoster}';">
                    <div class="card-badges">
                        ${qualityBadge}
                        ${vjBadge ? `<span class="card-badge badge-vj">${vjBadge}</span>` : ''}
                    </div>
                    <div class="play-overlay">
                        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    </div>
                    ${progressBar}
                </div>
                <div class="card-info">
                    <h3 class="card-title">${escapeHtml(title)}</h3>
                    <div class="card-meta">
                        ${year ? `<span>${year}</span>` : ''}
                        ${metaExtra}
                    </div>
                </div>
            </a>
        `;
    }

    function rowHTML(title, items, seeMoreHref) {
        if (!items || !items.length) return '';
        return `
            <div class="section-header">
                <h2 class="section-title">${escapeHtml(title)}</h2>
                ${seeMoreHref ? `<a class="view-all" href="${seeMoreHref}">See more →</a>` : ''}
            </div>
            <div class="content-row h-scroll">
                ${items.map(item => cardHTML(item)).join('')}
            </div>
        `;
    }

    function loadingHTML() {
        return '<div class="loading-spinner">Loading...</div>';
    }

    function emptyStateHTML(text, subtext) {
        return `
            <div class="empty-state" style="grid-column: 1/-1;">
                <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p class="empty-text">${escapeHtml(text)}</p>
                ${subtext ? `<p class="empty-subtext">${escapeHtml(subtext)}</p>` : ''}
            </div>`;
    }

    function paginationHTML(pagination) {
        const page = pagination.page || 1;
        const pages = pagination.pages || 1;
        let html = '';
        html += `<button class="page-btn" id="prevPage" ${page <= 1 ? 'disabled' : ''} aria-label="Previous page" title="Previous page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>`;
        html += `<span class="page-info" style="padding:0 14px;color:var(--text-secondary,#8b8b99);font-size:13px;">Page ${page} of ${pages}</span>`;
        html += `<button class="page-btn" id="nextPage" ${page >= pages ? 'disabled' : ''} aria-label="Next page" title="Next page">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>`;
        return html;
    }

    window.V2 = {
        formatVjBadge,
        getPlaceholderPoster,
        escapeHtml,
        showToast,
        cardHTML,
        rowHTML,
        loadingHTML,
        emptyStateHTML,
        paginationHTML
    };
})();
