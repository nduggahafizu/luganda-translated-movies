/* ============================================
   V2 Preview — Search page
   Live search with debounce + genre filter chips.
============================================ */

(function () {
    'use strict';

    const grid = document.getElementById('searchGrid');
    const pagination = document.getElementById('searchPagination');
    const resultCount = document.getElementById('resultCount');
    const searchInput = document.getElementById('searchInput');
    const genreChips = document.getElementById('genreChips');

    let currentPage = 1;
    let currentGenre = '';
    let debounceTimer = null;
    const LIMIT = 18;

    async function runSearch() {
        grid.innerHTML = V2.loadingHTML();
        pagination.innerHTML = '';

        const query = searchInput.value.trim();
        const params = { page: currentPage, limit: LIMIT };
        if (currentGenre) params.category = currentGenre;

        try {
            let data;
            if (query) {
                data = await LugandaMoviesAPI.searchMovies(query, params);
            } else {
                data = await LugandaMoviesAPI.getAllMovies({ ...params, sort: 'latest' });
            }

            const items = data?.data || [];
            const pg = data?.pagination || {};

            if (!items.length) {
                grid.innerHTML = V2.emptyStateHTML(
                    query ? `No results for "${query}"` : 'No content found',
                    'Try different keywords or adjust the genre filter.'
                );
                resultCount.textContent = '';
                return;
            }

            grid.innerHTML = items.map(item => V2.cardHTML(item)).join('');
            resultCount.textContent = pg.total
                ? `Showing ${items.length} of ${pg.total} results${query ? ` for "${query}"` : ''}`
                : `Showing ${items.length} results${query ? ` for "${query}"` : ''}`;

            const pages = pg.pages || 1;
            if (pages > 1) {
                pagination.innerHTML = V2.paginationHTML({ page: currentPage, pages });
                const prevBtn = document.getElementById('prevPage');
                const nextBtn = document.getElementById('nextPage');
                if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
                if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
            }
        } catch (error) {
            console.error('Error searching:', error);
            grid.innerHTML = V2.emptyStateHTML('Search failed', 'Please check your connection and try again.');
        }
    }

    function goToPage(page) {
        currentPage = page;
        runSearch();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentPage = 1;
            const url = new URL(window.location);
            if (searchInput.value.trim()) {
                url.searchParams.set('q', searchInput.value.trim());
            } else {
                url.searchParams.delete('q');
            }
            window.history.replaceState({}, '', url);
            runSearch();
        }, 400);
    });

    genreChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;
        genreChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentGenre = chip.dataset.genre || '';
        currentPage = 1;
        runSearch();
    });

    function init() {
        const params = new URLSearchParams(window.location.search);
        const q = params.get('q');
        if (q) searchInput.value = q;
        runSearch();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
