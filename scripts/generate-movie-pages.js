#!/usr/bin/env node
/**
 * Generates static HTML pages for every published movie and series.
 * Run by Netlify at build time: each page is fully baked with metadata,
 * poster, description, and JSON-LD — crawlable without JavaScript.
 *
 * Output: movie/[slug].html  (served at /movie/[slug])
 *         series/[slug].html (served at /series-detail/[slug])
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_URL ||
    'https://luganda-translated-movies-production.up.railway.app/api';

const SITE_URL = 'https://unrulymovies.com';

// ── helpers ──────────────────────────────────────────────────────────────────

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function slug(movie) {
    return movie.slug || String(movie._id);
}

function genreTag(g) {
    return `<a href="../genres.html?genre=${encodeURIComponent(g)}" class="genre-pill">${esc(g)}</a>`;
}

// ── HTML template ─────────────────────────────────────────────────────────────

function moviePageHtml(movie) {
    const title      = movie.originalTitle || movie.title || 'Unknown Title';
    const luganda    = movie.lugandaTitle && movie.lugandaTitle !== title ? movie.lugandaTitle : null;
    const year       = movie.year || movie.releaseYear || '';
    const vj         = movie.vjName || '';
    const desc       = movie.plot || movie.description || '';
    const poster     = movie.poster || `${SITE_URL}/assets/images/placeholder.svg`;
    const backdrop   = movie.backdrop || poster;
    const genres     = Array.isArray(movie.genres) ? movie.genres : [];
    const rating     = movie.rating?.imdb || movie.imdbRating || movie.rating || '';
    const duration   = movie.duration || movie.runtime || '';
    const quality    = movie.video?.quality || movie.quality || '';
    const movieId    = movie._id;
    const canonicalSlug = slug(movie);
    const pageUrl    = `${SITE_URL}/movie/${canonicalSlug}`;

    const durationText = duration
        ? (() => { const m = parseInt(duration); return m >= 60 ? `${Math.floor(m/60)}h ${m%60}m` : `${m}m`; })()
        : '';

    const genresHtml = genres.map(genreTag).join('');

    const jsonLd = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Movie',
        name: title,
        description: desc.slice(0, 300),
        image: poster,
        dateCreated: year ? String(year) : undefined,
        genre: genres,
        inLanguage: 'lg',
        url: pageUrl,
        potentialAction: {
            '@type': 'WatchAction',
            target: `${SITE_URL}/player.html?id=${movieId}`
        },
        offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/OnlineOnly',
            price: '0',
            priceCurrency: 'UGX',
            url: pageUrl
        }
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}${year ? ` (${year})` : ''} — Luganda VJ Translation${vj ? ` by ${esc(vj)}` : ''} | Unruly Movies</title>
    <meta name="description" content="Watch ${esc(title)}${year ? ` (${year})` : ''} translated to Luganda${vj ? ` by ${esc(vj)}` : ''}. ${esc(desc.slice(0, 140))}">
    <meta name="robots" content="index, follow">
    <meta name="author" content="Unruly Movies">
    <link rel="canonical" href="${pageUrl}">


    <meta property="og:type" content="video.movie">
    <meta property="og:title" content="${esc(title)}${year ? ` (${year})` : ''} — Luganda VJ Translation | Unruly Movies">
    <meta property="og:description" content="${esc(desc.slice(0, 200))}">
    <meta property="og:image" content="${esc(poster)}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:site_name" content="Unruly Movies">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)} — Luganda Translation | Unruly Movies">
    <meta name="twitter:image" content="${esc(poster)}">

    <script type="application/ld+json">${jsonLd}</script>

    <link rel="icon" type="image/png" href="/assets/images/favicon.png">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/responsive.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">

    <style>
        .movie-detail-page { max-width: 1000px; margin: 0 auto; padding: 32px 16px 80px; }
        .movie-backdrop {
            position: relative; width: 100%; height: 320px; border-radius: 16px;
            overflow: hidden; margin-bottom: 32px; background: #111;
        }
        .movie-backdrop img {
            width: 100%; height: 100%; object-fit: cover; opacity: 0.45;
        }
        .movie-backdrop-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to bottom, transparent 30%, #0a0a0a 100%);
        }
        .movie-main { display: flex; gap: 32px; align-items: flex-start; }
        .movie-poster-wrap { flex-shrink: 0; width: 200px; }
        .movie-poster-wrap img {
            width: 200px; border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .movie-info { flex: 1; min-width: 0; }
        .movie-title { font-size: 32px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; color: #fff; }
        .movie-luganda { font-size: 17px; color: rgba(255,255,255,0.55); margin-bottom: 14px; font-style: italic; }
        .movie-meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 16px; }
        .meta-pill {
            padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
            background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7);
        }
        .meta-pill.year { color: #4ade80; background: rgba(74,222,128,0.1); }
        .meta-pill.quality { color: #4ade80; background: rgba(74,222,128,0.15); border: 1px solid rgba(74,222,128,0.3); }
        .vj-badge {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 6px 14px; border-radius: 20px;
            background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3);
            color: #4ade80; font-size: 13px; font-weight: 700; margin-bottom: 16px;
        }
        .genres-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .genre-pill {
            padding: 5px 14px; border-radius: 20px; font-size: 13px;
            background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.65); text-decoration: none;
            transition: border-color 0.2s, color 0.2s;
        }
        .genre-pill:hover { border-color: #4ade80; color: #4ade80; }
        .movie-description { font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.65); margin-bottom: 28px; }
        .watch-btn {
            display: inline-flex; align-items: center; gap: 10px;
            padding: 14px 36px; background: #4ade80; color: #000;
            font-weight: 800; font-size: 16px; border-radius: 10px;
            text-decoration: none; transition: background 0.2s, transform 0.15s;
        }
        .watch-btn:hover { background: #9dff44; transform: translateY(-2px); }
        .breadcrumb { font-size: 13px; color: rgba(255,255,255,0.4); margin-bottom: 24px; }
        .breadcrumb a { color: #4ade80; text-decoration: none; }
        .info-section { margin-top: 48px; }
        .info-section h2 { font-size: 20px; font-weight: 700; margin-bottom: 14px; color: #fff; }
        .info-section p { font-size: 15px; line-height: 1.8; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
        @media (max-width: 640px) {
            .movie-main { flex-direction: column; }
            .movie-poster-wrap { width: 100%; }
            .movie-poster-wrap img { width: 100%; max-width: 240px; }
            .movie-title { font-size: 24px; }
            .movie-backdrop { height: 200px; }
        }
    </style>
</head>
<body>
<div class="container">
<div class="app">
    <div class="app-header">
        <div class="navbar navbar-expand-lg">
            <div class="menu" id="menuToggle" role="button" aria-label="Menu" tabindex="0">
                <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
            </div>
            <div class="app-navbar">
                <a href="../index.html" class="navbar-brand">
                    <img src="../assets/images/logo-wordmark.png" alt="Unruly Movies">
                </a>
            </div>
            <form class="header-search input-group d-md-block d-none" method="get" action="../search.html">
                <div class="typeahead__container app-search"><div class="typeahead__field"><div class="typeahead__query">
                    <label for="search-input" class="btn px-0 mb-0" aria-label="Search">
                        <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>
                    </label>
                    <input class="video-search form-control" name="q" type="text" id="search-input" placeholder="Search Luganda movies, VJs..." autocomplete="off">
                </div></div></div>
            </form>
            <ul class="navbar-nav navbar-user ml-auto align-items-center text-nowrap">
                <li class="nav-item"><a class="nav-link btn-login" href="../login.html">Login</a></li>
                <li class="nav-item"><a class="nav-link btn-register" href="../register.html">Sign Up</a></li>
            </ul>
        </div>
    </div>

    <div class="app-wrapper">
        <div class="app-aside nav-aside" id="aside">
            <button class="modal-close" data-dismiss="modal" aria-label="Close menu">
                <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <ul class="nav">
                <li><a href="../index.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>Home</a></li>
                <li><a href="../movies.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>Movies</a></li>
                <li><a href="../vjs.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>VJ Translators</a></li>
                <li><a href="../blog.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>Blog</a></li>
            </ul>
        </div>

        <main class="app-container flex-fill">
            <div class="movie-detail-page">
                <div class="breadcrumb">
                    <a href="../index.html">Home</a> /
                    <a href="../movies.html">Movies</a> /
                    ${esc(title)}
                </div>

                ${backdrop ? `
                <div class="movie-backdrop">
                    <img src="${esc(backdrop)}" alt="${esc(title)} backdrop" loading="lazy">
                    <div class="movie-backdrop-overlay"></div>
                </div>` : ''}

                <div class="movie-main">
                    <div class="movie-poster-wrap">
                        <img src="${esc(poster)}" alt="${esc(title)} movie poster" loading="lazy">
                    </div>

                    <div class="movie-info">
                        <h1 class="movie-title">${esc(title)}</h1>
                        ${luganda ? `<p class="movie-luganda">${esc(luganda)}</p>` : ''}

                        <div class="movie-meta">
                            ${year ? `<span class="meta-pill year">${esc(String(year))}</span>` : ''}
                            ${durationText ? `<span class="meta-pill">${esc(durationText)}</span>` : ''}
                            ${quality ? `<span class="meta-pill quality">${esc(quality.toUpperCase())}</span>` : ''}
                            ${rating ? `<span class="meta-pill">⭐ ${esc(String(rating))}</span>` : ''}
                        </div>

                        ${vj ? `<div class="vj-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                            Luganda VJ by ${esc(vj)}
                        </div>` : ''}

                        ${genresHtml ? `<div class="genres-row">${genresHtml}</div>` : ''}

                        <p class="movie-description">${esc(desc)}</p>

                        <a href="../player.html?id=${esc(movieId)}" class="watch-btn">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                            Watch in Luganda
                        </a>
                    </div>
                </div>

                <div class="info-section">
                    <h2>About This Luganda Translation</h2>
                    <p>${esc(title)} is available on Unruly Movies with a full Luganda narration track${vj ? ` by ${esc(vj)}` : ''}. The VJ narration replaces the need for subtitles by delivering the complete story in Luganda — Uganda's most widely spoken Bantu language — so viewers can follow every scene, joke, and dramatic moment without reading.</p>
                    ${genres.length > 0 ? `<p>This title is categorised as ${genres.slice(0,3).join(', ')}. ${genres.includes('action') ? 'Action films on Unruly Movies are narrated with energy and pace that matches the on-screen sequences — fights, chases, and confrontations all delivered in sharp Luganda.' : ''} ${genres.includes('comedy') ? 'Comedy narration in Luganda replaces English jokes with culturally equivalent Ugandan humour, so the film lands the same way it was meant to.' : ''} ${genres.includes('drama') ? 'Drama titles receive emotionally precise narration that preserves the weight of every scene in Luganda.' : ''}</p>` : ''}
                    <p>To watch this title you need a free Unruly Movies account. <a href="../register.html" style="color:#4ade80;">Sign up here</a> — it takes less than a minute.</p>
                </div>
            </div>

            <footer class="site-footer" style="margin-top: 40px;">
                <div class="footer-bottom">
                    <p>Copyright &copy; Unruly Movies 2026 &nbsp;|&nbsp;
                    <a href="../about.html" style="color:#4ade80;">About</a> &nbsp;|&nbsp;
                    <a href="../privacy-policy.html" style="color:#4ade80;">Privacy</a> &nbsp;|&nbsp;
                    <a href="../blog.html" style="color:#4ade80;">Blog</a></p>
                </div>
            </footer>
        </main>
    </div>
</div>
</div>
<script src="../js/app.js" defer></script>
</body>
</html>`;
}

// ── fetch all movies ──────────────────────────────────────────────────────────

async function fetchAllMovies() {
    const movies = [];
    let page = 1;
    const limit = 100;

    console.log(`[generate] Fetching movies from ${API_BASE}...`);

    while (true) {
        const url = `${API_BASE}/luganda-movies?page=${page}&limit=${limit}&status=published`;
        const res = await fetch(url, { headers: { 'User-Agent': 'UnrulyMovies-Build/1.0' } });

        if (!res.ok) {
            console.warn(`[generate] API returned ${res.status} on page ${page}, stopping.`);
            break;
        }

        const json = await res.json();
        const batch = json.data?.movies || json.data || [];

        if (!Array.isArray(batch) || batch.length === 0) break;

        // Only process movies (not series — series get their own detail page already)
        const moviesOnly = batch.filter(m => m.contentType !== 'series');
        movies.push(...moviesOnly);
        console.log(`[generate] Page ${page}: ${moviesOnly.length} movies (total so far: ${movies.length})`);

        if (batch.length < limit) break;
        page++;
    }

    return movies;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
    const outDir = path.join(__dirname, '..', 'movie');
    fs.mkdirSync(outDir, { recursive: true });

    const movies = await fetchAllMovies();

    if (movies.length === 0) {
        console.warn('[generate] No movies returned from API. Skipping page generation.');
        return;
    }

    let generated = 0;
    let skipped = 0;

    for (const movie of movies) {
        const movieSlug = slug(movie);
        if (!movieSlug) { skipped++; continue; }

        const html = moviePageHtml(movie);
        const outPath = path.join(outDir, `${movieSlug}.html`);
        fs.writeFileSync(outPath, html, 'utf8');
        generated++;
    }

    console.log(`[generate] Done. Generated: ${generated}, Skipped: ${skipped}`);
}

main().catch(err => {
    console.error('[generate] Fatal error:', err.message);
    process.exit(1);
});
