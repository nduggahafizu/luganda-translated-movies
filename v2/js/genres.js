/* ============================================
   V2 Preview — Genres page
============================================ */

(function () {
    'use strict';

    const genresHeader = document.getElementById('genresHeader');
    const genresGrid = document.getElementById('genresGrid');
    const genreMoviesSection = document.getElementById('genreMoviesSection');
    const genreMoviesGrid = document.getElementById('genreMoviesGrid');
    const genreMoviesTitle = document.getElementById('genreMoviesTitle');
    const backBtn = document.getElementById('backToGenresBtn');

    const GENRE_ICONS = {
        action: '\u{1F4A5}',
        adventure: '\u{1F5FA}\u{FE0F}',
        animation: '\u{1F3A8}',
        comedy: '\u{1F602}',
        crime: '\u{1F52B}',
        documentary: '\u{1F4F9}',
        drama: '\u{1F3AD}',
        family: '\u{1F46A}',
        fantasy: '\u{1F9D9}',
        history: '\u{1F4DC}',
        horror: '\u{1F47B}',
        music: '\u{1F3B5}',
        mystery: '\u{1F50D}',
        romance: '\u{1F495}',
        'sci-fi': '\u{1F680}',
        thriller: '\u{1F631}',
        war: '⚔️',
        western: '\u{1F920}',
        default: '\u{1F3AC}'
    };

    async function loadGenres() {
        try {
            const data = await LugandaMoviesAPI.getGenres();
            const genres = data?.data || [];
            if (!genres.length) {
                genresGrid.innerHTML = V2.emptyStateHTML('No genres found', '');
                return;
            }
            genresGrid.innerHTML = genres.map(genre => {
                const icon = GENRE_ICONS[genre.toLowerCase()] || GENRE_ICONS.default;
                return `
                    <a href="?genre=${encodeURIComponent(genre)}" class="genre-card" data-genre="${V2.escapeHtml(genre)}">
                        <div class="genre-icon">${icon}</div>
                        <div class="genre-name">${V2.escapeHtml(genre)}</div>
                    </a>
                `;
            }).join('');

            genresGrid.querySelectorAll('.genre-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    e.preventDefault();
                    showGenreMovies(card.dataset.genre);
                });
            });
        } catch (error) {
            console.error('Error loading genres:', error);
            genresGrid.innerHTML = V2.emptyStateHTML('Failed to load genres', 'Please check your connection and try again.');
        }
    }

    async function showGenreMovies(genre) {
        genresHeader.style.display = 'none';
        genresGrid.style.display = 'none';
        genreMoviesSection.style.display = 'block';
        genreMoviesTitle.textContent = genre.charAt(0).toUpperCase() + genre.slice(1) + ' Movies';
        genreMoviesGrid.innerHTML = V2.loadingHTML();

        history.replaceState(null, '', `?genre=${encodeURIComponent(genre)}`);

        try {
            const data = await LugandaMoviesAPI.getByGenre(genre, 24);
            const items = data?.data || [];
            if (!items.length) {
                genreMoviesGrid.innerHTML = V2.emptyStateHTML('No movies found', 'Nothing in this genre yet — check back soon.');
                return;
            }
            genreMoviesGrid.innerHTML = items.map(item => V2.cardHTML(item)).join('');
        } catch (error) {
            console.error('Error loading genre movies:', error);
            genreMoviesGrid.innerHTML = V2.emptyStateHTML('Failed to load movies', 'Please check your connection and try again.');
        }
    }

    function showAllGenres() {
        genresHeader.style.display = '';
        genresGrid.style.display = '';
        genreMoviesSection.style.display = 'none';
        history.replaceState(null, '', window.location.pathname);
    }

    backBtn.addEventListener('click', showAllGenres);

    async function init() {
        await loadGenres();
        const preSelected = new URLSearchParams(window.location.search).get('genre');
        if (preSelected) {
            showGenreMovies(preSelected);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
