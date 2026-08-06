/* ============================================
   V2 Preview — Watchlist page
============================================ */

(function () {
    'use strict';

    const grid = document.getElementById('watchlistGrid');

    function normalize(item) {
        return {
            _id: item.id || item._id,
            originalTitle: item.title || item.originalTitle,
            poster: item.poster,
            year: item.year,
            vjName: item.vj || item.vjName,
            genres: item.genres || []
        };
    }

    window.removeFromWatchlist_v2 = async function (id) {
        await WatchlistManager.removeFromWatchlist(id);
        render();
    };

    function render() {
        const items = WatchlistManager.getWatchlist();
        if (!items.length) {
            grid.innerHTML = V2.emptyStateHTML('Your watchlist is empty', 'Tap the bookmark icon on any title to save it here.');
            return;
        }
        grid.innerHTML = items.map(item => V2.cardHTML(normalize(item), {
            removeHandler: `removeFromWatchlist_v2('${item.id || item._id}')`
        })).join('');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
