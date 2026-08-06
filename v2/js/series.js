/* ============================================
   V2 Preview — Series grid page
============================================ */

(function () {
    'use strict';

    const grid = document.getElementById('seriesGrid');
    const pagination = document.getElementById('seriesPagination');
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

    async function loadSeries() {
        grid.innerHTML = V2.loadingHTML();
        pagination.innerHTML = '';

        const params = {
            contentType: 'series',
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
                grid.innerHTML = V2.emptyStateHTML('No series found', 'Try adjusting your filters.');
                resultCount.textContent = '';
                return;
            }

            grid.innerHTML = items.map(item => V2.cardHTML(item)).join('');
            resultCount.textContent = pg.total ? `Showing ${items.length} of ${pg.total} series` : `Showing ${items.length} series`;

            const pages = pg.pages || 1;
            if (pages > 1) {
                pagination.innerHTML = V2.paginationHTML({ page: currentPage, pages });
                const prevBtn = document.getElementById('prevPage');
                const nextBtn = document.getElementById('nextPage');
                if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
                if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
            }
        } catch (error) {
            console.error('Error loading series:', error);
            grid.innerHTML = V2.emptyStateHTML('Failed to load series', 'Please check your connection and try again.');
        }
    }

    function goToPage(page) {
        currentPage = page;
        loadSeries();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    [genreFilter, yearFilter, vjFilter, sortFilter].forEach(el => {
        el.addEventListener('change', () => {
            currentPage = 1;
            loadSeries();
        });
    });

    async function init() {
        await loadVjOptions();
        await loadSeries();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
