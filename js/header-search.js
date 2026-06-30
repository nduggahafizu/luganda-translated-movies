/**
 * Live search-as-you-type for the header search bar (desktop + mobile)
 * Shows a dropdown of matching movies as the user types, on every page.
 */
(function () {
    function init() {
        const apiBase = (typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : 'https://luganda-translated-movies-production.up.railway.app');
        const searchUrl = `${apiBase}/api/luganda-movies/search`;

        attachLiveSearch(document.getElementById('search-input'));
        attachLiveSearch(document.getElementById('mobileSearchInput'));

        function attachLiveSearch(input) {
            if (!input) return;

            const wrapper = input.closest('.typeahead__container, .mobile-search-form') || input.parentElement;
            if (!wrapper) return;
            wrapper.style.position = wrapper.style.position || 'relative';

            const dropdown = document.createElement('div');
            dropdown.className = 'header-search-dropdown';
            wrapper.appendChild(dropdown);

            let timeout;
            let activeRequest = 0;

            input.addEventListener('input', function () {
                const query = input.value.trim();
                clearTimeout(timeout);

                if (query.length < 2) {
                    dropdown.classList.remove('open');
                    return;
                }

                timeout = setTimeout(() => runSearch(query), 280);
            });

            input.addEventListener('focus', function () {
                if (input.value.trim().length >= 2 && dropdown.innerHTML) {
                    dropdown.classList.add('open');
                }
            });

            document.addEventListener('click', function (e) {
                if (!wrapper.contains(e.target)) dropdown.classList.remove('open');
            });

            async function runSearch(query) {
                const requestId = ++activeRequest;
                dropdown.innerHTML = '<div class="hsd-loading">Searching…</div>';
                dropdown.classList.add('open');

                try {
                    const res = await fetch(`${searchUrl}?q=${encodeURIComponent(query)}&limit=6`);
                    const data = await res.json();
                    if (requestId !== activeRequest) return;

                    const movies = data.data || [];
                    if (movies.length === 0) {
                        dropdown.innerHTML = `<div class="hsd-empty">No results for "${escapeHtml(query)}"</div>`;
                        return;
                    }

                    dropdown.innerHTML = movies.map(m => {
                        const title = escapeHtml(m.originalTitle || m.lugandaTitle || 'Unknown');
                        const poster = m.poster || 'https://placehold.co/60x90/16161f/4ade80?text=%20';
                        const year = m.year || '';
                        const vj = (m.vjName || '').replace(/^vj\s*/i, '').trim();
                        return `
                            <a class="hsd-item" href="player.html?id=${m._id}">
                                <img src="${poster}" alt="" loading="lazy">
                                <div class="hsd-item-info">
                                    <div class="hsd-item-title">${title}</div>
                                    <div class="hsd-item-meta">${year ? year + ' · ' : ''}${vj ? 'VJ ' + escapeHtml(vj) : ''}</div>
                                </div>
                            </a>`;
                    }).join('') + `<a class="hsd-viewall" href="search.html?q=${encodeURIComponent(query)}">See all results for "${escapeHtml(query)}" →</a>`;
                } catch (e) {
                    if (requestId === activeRequest) {
                        dropdown.innerHTML = '<div class="hsd-empty">Search unavailable. Try again.</div>';
                    }
                }
            }
        }

        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
