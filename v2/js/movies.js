/* ============================================
   V2 Preview — Movies grid page
============================================ */

(function () {
    'use strict';

    const grid = document.getElementById('moviesGrid');
    const pagination = document.getElementById('moviesPagination');
    const resultCount = document.getElementById('resultCount');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const vjFilter = document.getElementById('vjFilter');
    const sortFilter = document.getElementById('sortFilter');

    let currentPage = 1;
    const LIMIT = 18;

    async function loadVjOptions() {
        try {
            const res = await LugandaMoviesAPI.getAllVJs();
            const vjs = (res?.data || [])
                .filter(v => v._id && !/^unknown/i.test(v._id))
                .sort((a, b) => (b.movieCount || 0) - (a.movieCount || 0));

            vjFilter.innerHTML = '<option value="">All VJs</option>' +
                vjs.map(v => `<option value="${V2.escapeHtml(v._id)}">${V2.escapeHtml(V2.formatVjBadge(v._id) || v._id)}</option>`).join('');
        } catch (error) {
            console.error('Error loading VJ filter options:', error);
        }
    }

    async function loadMovies() {
        grid.innerHTML = V2.loadingHTML();
        pagination.innerHTML = '';

        const params = {
            contentType: 'movie',
            page: currentPage,
            limit: LIMIT
        };
        if (genreFilter.value) params.category = genreFilter.value;
        if (yearFilter.value) params.year = yearFilter.value;
        if (vjFilter.value) params.vj = vjFilter.value;
        if (sortFilter.value) params.sort = sortFilter.value;

        try {
            const data = await LugandaMoviesAPI.getAllMovies(params);
            const items = data?.data || [];
            const pg = data?.pagination || {};

            if (!items.length) {
                grid.innerHTML = V2.emptyStateHTML('No movies found', 'Try adjusting your filters.');
                resultCount.textContent = '';
                return;
            }

            grid.innerHTML = items.map(item => V2.cardHTML(item)).join('');
            resultCount.textContent = pg.total ? `Showing ${items.length} of ${pg.total} movies` : `Showing ${items.length} movies`;

            const pages = pg.pages || 1;
            if (pages > 1) {
                pagination.innerHTML = V2.paginationHTML({ page: currentPage, pages });
                const prevBtn = document.getElementById('prevPage');
                const nextBtn = document.getElementById('nextPage');
                if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
                if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
            }
        } catch (error) {
            console.error('Error loading movies:', error);
            grid.innerHTML = V2.emptyStateHTML('Failed to load movies', 'Please check your connection and try again.');
        }
    }

    function goToPage(page) {
        currentPage = page;
        loadMovies();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    [genreFilter, yearFilter, vjFilter, sortFilter].forEach(el => {
        el.addEventListener('change', () => {
            currentPage = 1;
            loadMovies();
        });
    });

    async function init() {
        await loadVjOptions();

        const params = new URLSearchParams(window.location.search);
        const vj = params.get('vj');
        const genre = params.get('genre');
        if (vj && [...vjFilter.options].some(o => o.value === vj)) vjFilter.value = vj;
        if (genre) genreFilter.value = genre;

        await loadMovies();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
