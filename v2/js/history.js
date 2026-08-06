/* ============================================
   V2 Preview — Watch History page
============================================ */

(function () {
    'use strict';

    const grid = document.getElementById('historyGrid');
    const clearBtn = document.getElementById('clearHistoryBtn');

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

    function render() {
        const items = WatchlistManager.getHistory();
        if (!items.length) {
            grid.innerHTML = V2.emptyStateHTML('No watch history yet', 'Movies and series you watch will show up here.');
            return;
        }
        grid.innerHTML = items.map(item => V2.cardHTML(normalize(item), {
            progress: item.percentComplete || 0
        })).join('');
    }

    clearBtn.addEventListener('click', () => {
        WatchlistManager.clearHistory();
        render();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', render);
    } else {
        render();
    }
})();
