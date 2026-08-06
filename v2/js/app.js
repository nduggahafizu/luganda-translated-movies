/* ============================================
   V2 Preview — Home feed
   Builds the hero carousel, VJ filter pill row,
   and stacked horizontal category rows using the
   existing LugandaMoviesAPI / seriesAPI clients.
============================================ */

(function () {
    'use strict';

    const heroBanner = document.getElementById('heroBanner');
    const bannerIndicators = document.getElementById('bannerIndicators');
    const vjPillRow = document.getElementById('vjPillRow');
    const homeRows = document.getElementById('homeRows');

    let heroTimer = null;
    let defaultRowsHTML = '';

    // ---------- Helpers ----------

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

    // ---------- Card rendering ----------

    function cardHTML(item) {
        const isSeries = item.contentType === 'series';
        const title = item.originalTitle || item.lugandaTitle || 'Unknown Title';
        const year = item.year || '';
        const genres = item.genres || [];
        const vjBadge = formatVjBadge(item.vjName);
        const fallbackPoster = getPlaceholderPoster(title, year);
        const poster = item.poster || fallbackPoster;
        const href = isSeries ? `/series-detail.html?id=${item._id}` : `/player.html?id=${item._id}`;
        const quality = item.video?.quality || 'HD';

        const qualityBadge = isSeries
            ? `<span class="badge-quality" style="background: linear-gradient(135deg, #A855F7, #7C3AED);">SERIES</span>`
            : `<span class="card-badge badge-quality">${quality}</span>`;

        const metaExtra = isSeries
            ? `${item.totalSeasons ? `<span>${item.totalSeasons} Season${item.totalSeasons > 1 ? 's' : ''}</span>` : ''}`
            : `${genres.length > 0 ? `<span>${escapeHtml(genres[0])}</span>` : ''}`;

        return `
            <a href="${href}" class="content-card" data-id="${item._id}">
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
                ${items.map(cardHTML).join('')}
            </div>
        `;
    }

    // ---------- Hero carousel ----------

    function buildHeroSlides(movies) {
        if (!movies.length) {
            heroBanner.innerHTML = '';
            bannerIndicators.innerHTML = '';
            return;
        }

        heroBanner.innerHTML = movies.map((movie, index) => {
            const poster = movie.backdrop || movie.poster || getPlaceholderPoster(movie.originalTitle, movie.year);
            const title = movie.originalTitle || movie.lugandaTitle || 'Movie';
            const year = movie.year || '';
            const quality = movie.video?.quality || 'HD';
            const overview = movie.description || movie.plot || '';
            const vjBadge = formatVjBadge(movie.vjName);

            return `
                <div class="hero-slide${index === 0 ? ' active' : ''}" data-index="${index}">
                    <img src="${poster}" alt="${escapeHtml(title)}" class="slide-poster-img" loading="${index === 0 ? 'eager' : 'lazy'}"
                         onerror="this.onerror=null; this.src='${getPlaceholderPoster(title, year)}';">
                    <div class="hero-overlay"></div>
                    <div class="hero-content">
                        <h2 class="hero-title">${escapeHtml(title)}</h2>
                        <div class="hero-meta">
                            ${year ? `<span class="meta-tag">${year}</span>` : ''}
                            <span class="meta-tag">${quality}</span>
                            ${vjBadge ? `<span class="meta-tag meta-vj">${vjBadge}</span>` : ''}
                        </div>
                        ${overview ? `<p class="hero-overview">${escapeHtml(overview)}</p>` : ''}
                        <div class="hero-btns">
                            <a href="/player.html?id=${movie._id}" class="play-btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                Play Now
                            </a>
                            <button class="save-btn" onclick="addToWatchlist('${movie._id}'); this.classList.toggle('saved')" aria-label="Save to watchlist">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        bannerIndicators.innerHTML = movies.map((_, index) =>
            `<button class="indicator${index === 0 ? ' active' : ''}" data-index="${index}" aria-label="Slide ${index + 1}"></button>`
        ).join('');

        let current = 0;
        const slides = heroBanner.querySelectorAll('.hero-slide');
        const dots = bannerIndicators.querySelectorAll('.indicator');

        function goTo(index) {
            current = index;
            slides.forEach((s, i) => s.classList.toggle('active', i === index));
            dots.forEach((d, i) => d.classList.toggle('active', i === index));
        }

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                goTo(parseInt(dot.dataset.index, 10));
                restartAutoplay();
            });
        });

        function restartAutoplay() {
            if (heroTimer) clearInterval(heroTimer);
            if (slides.length > 1) {
                heroTimer = setInterval(() => goTo((current + 1) % slides.length), 6000);
            }
        }

        restartAutoplay();
    }

    async function renderHero() {
        try {
            let res = await LugandaMoviesAPI.getFeatured(6);
            let movies = res?.data || [];
            if (!movies.length) {
                res = await LugandaMoviesAPI.getTrending(6);
                movies = res?.data || [];
            }
            buildHeroSlides(movies.slice(0, 5));
        } catch (error) {
            console.error('Error loading hero:', error);
            heroBanner.innerHTML = '';
            bannerIndicators.innerHTML = '';
        }
    }

    // ---------- VJ pill row ----------

    async function renderVjPills() {
        try {
            const res = await LugandaMoviesAPI.getAllVJs();
            const vjs = (res?.data || [])
                .filter(v => v._id && !/^unknown/i.test(v._id))
                .sort((a, b) => (b.movieCount || 0) - (a.movieCount || 0))
                .slice(0, 15);

            vjPillRow.innerHTML = `<button class="vj-pill active" data-vj="">All</button>` +
                vjs.map(v => `<button class="vj-pill" data-vj="${escapeHtml(v._id)}">${escapeHtml(formatVjBadge(v._id) || v._id)}</button>`).join('');

            vjPillRow.addEventListener('click', onPillClick);
            return vjs;
        } catch (error) {
            console.error('Error loading VJs:', error);
            return [];
        }
    }

    async function onPillClick(e) {
        const btn = e.target.closest('.vj-pill');
        if (!btn) return;

        vjPillRow.querySelectorAll('.vj-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const vj = btn.dataset.vj;
        if (!vj) {
            homeRows.innerHTML = defaultRowsHTML;
            return;
        }

        homeRows.innerHTML = '<div class="loading-spinner">Loading...</div>';
        try {
            const res = await LugandaMoviesAPI.getByVJ(vj, 24);
            const items = res?.data || [];
            homeRows.innerHTML = rowHTML(formatVjBadge(vj) || vj, items, `/vj.html?name=${encodeURIComponent(vj)}`);
        } catch (error) {
            console.error('Error loading VJ movies:', error);
            homeRows.innerHTML = '<p style="padding:40px;text-align:center;color:var(--text-secondary);">Failed to load movies for this VJ.</p>';
        }
    }

    // ---------- Default home rows ----------

    async function renderDefaultRows(topVjs) {
        homeRows.innerHTML = '<div class="loading-spinner">Loading...</div>';

        const genreRows = [
            { genre: 'action', label: 'Action Movies' },
            { genre: 'comedy', label: 'Comedy Movies' },
            { genre: 'drama', label: 'Drama Movies' }
        ];

        const vjRows = (topVjs || []).slice(0, 2);

        const [trendingRes, latestRes, seriesRes, ...rest] = await Promise.allSettled([
            LugandaMoviesAPI.getTrending(15),
            LugandaMoviesAPI.getLatest(15),
            LugandaMoviesAPI.getAllMovies({ contentType: 'series', limit: 15 }),
            ...vjRows.map(v => LugandaMoviesAPI.getByVJ(v._id, 15)),
            ...genreRows.map(g => LugandaMoviesAPI.getByGenre(g.genre, 15))
        ]);

        const dataOf = (settled) => (settled.status === 'fulfilled' ? settled.value?.data || [] : []);

        const sections = [];
        sections.push(rowHTML('Trending Now', dataOf(trendingRes), '/trending.html'));
        sections.push(rowHTML('Latest Releases', dataOf(latestRes), '/movies.html'));
        sections.push(rowHTML('New Series', dataOf(seriesRes), '/series.html'));

        vjRows.forEach((v, i) => {
            const items = dataOf(rest[i]);
            sections.push(rowHTML(formatVjBadge(v._id) || v._id, items, `/vj.html?name=${encodeURIComponent(v._id)}`));
        });

        genreRows.forEach((g, i) => {
            const items = dataOf(rest[vjRows.length + i]);
            sections.push(rowHTML(g.label, items, `/genres.html?genre=${encodeURIComponent(g.genre)}`));
        });

        defaultRowsHTML = sections.filter(Boolean).join('');
        homeRows.innerHTML = defaultRowsHTML || '<p style="padding:40px;text-align:center;color:var(--text-secondary);">No content available right now.</p>';
    }

    // ---------- Init ----------

    async function init() {
        renderHero();
        const topVjs = await renderVjPills();
        await renderDefaultRows(topVjs);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
