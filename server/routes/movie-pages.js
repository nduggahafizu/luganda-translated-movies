const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

const SITE_URL = 'https://unrulymovies.com';

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function renderMoviePage(movie) {
    const title    = movie.originalTitle || movie.title || 'Unknown Title';
    const luganda  = movie.lugandaTitle && movie.lugandaTitle !== title ? movie.lugandaTitle : null;
    const year     = movie.year || movie.releaseYear || '';
    const vj       = movie.vjName || '';
    const desc     = movie.plot || movie.description || '';
    const poster   = movie.poster || `${SITE_URL}/assets/images/placeholder.svg`;
    const backdrop = movie.backdrop || poster;
    const genres   = Array.isArray(movie.genres) ? movie.genres : [];
    const rating   = (movie.rating && (movie.rating.imdb || movie.rating)) || movie.imdbRating || '';
    const duration = movie.duration || movie.runtime || '';
    const quality  = movie.video?.quality || movie.quality || '';
    const movieId  = String(movie._id);
    const slug     = movie.slug || movieId;
    const pageUrl  = `${SITE_URL}/movie/${slug}`;

    const durationText = (() => {
        if (!duration) return '';
        const m = parseInt(duration);
        return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
    })();

    const genresHtml = genres.map(g =>
        `<a href="/genres.html?genre=${encodeURIComponent(g)}" class="genre-pill">${esc(g)}</a>`
    ).join('');

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
        potentialAction: { '@type': 'WatchAction', target: `${SITE_URL}/player.html?id=${movieId}` },
        offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/OnlineOnly',
            price: '0', priceCurrency: 'UGX', url: pageUrl
        }
    });

    const genreDescriptions = {
        action: 'Action films on Unruly Movies are narrated with energy that matches every fight scene, chase, and confrontation.',
        comedy: 'Comedy narration in Luganda replaces English jokes with culturally equivalent Ugandan humour so the film lands as intended.',
        drama: 'Drama titles receive emotionally precise narration that preserves the weight of every scene in Luganda.',
        thriller: 'Thriller narration in Luganda builds suspense through controlled vocal delivery that matches every tense moment on screen.',
        horror: 'Horror films in Luganda — the VJ\'s voice in the quiet moments before a scare is part of what makes them work so well.',
        romance: 'Romance narration softens the distance between international filmmaking and East African audiences in a way subtitles never achieve.',
    };
    const genreNote = genres.map(g => genreDescriptions[g.toLowerCase()]).find(Boolean) || '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${year ? ` (${year})` : ''} — Luganda VJ Translation${vj ? ` by ${esc(vj)}` : ''} | Unruly Movies</title>
<meta name="description" content="Watch ${esc(title)}${year ? ` (${year})` : ''} in Luganda${vj ? `, narrated by ${esc(vj)}` : ''}. ${esc(desc.slice(0, 140))}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<meta name="google-adsense-account" content="ca-pub-1904736753681797">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1904736753681797" crossorigin="anonymous"></script>
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
<link rel="stylesheet" href="/css/style.css">
<link rel="stylesheet" href="/css/responsive.css">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
.mdp{max-width:1000px;margin:0 auto;padding:32px 16px 80px}
.mdb{position:relative;width:100%;height:300px;border-radius:16px;overflow:hidden;margin-bottom:32px;background:#111}
.mdb img{width:100%;height:100%;object-fit:cover;opacity:.4}
.mdb-ov{position:absolute;inset:0;background:linear-gradient(to bottom,transparent 30%,#0a0a0a 100%)}
.mm{display:flex;gap:28px;align-items:flex-start}
.mp img{width:190px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.6)}
.mi{flex:1;min-width:0}
.mt{font-size:30px;font-weight:900;line-height:1.2;margin-bottom:6px;color:#fff}
.ml{font-size:16px;color:rgba(255,255,255,.5);margin-bottom:12px;font-style:italic}
.mmeta{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.pill{padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
.pill.yr{color:#4ade80;background:rgba(74,222,128,.1)}
.pill.ql{color:#4ade80;background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3)}
.vj-b{display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:20px;background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.3);color:#4ade80;font-size:13px;font-weight:700;margin-bottom:14px}
.gr{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.genre-pill{padding:5px 14px;border-radius:20px;font-size:13px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.65);text-decoration:none}
.genre-pill:hover{border-color:#4ade80;color:#4ade80}
.md{font-size:15px;line-height:1.8;color:rgba(255,255,255,.65);margin-bottom:26px}
.wb{display:inline-flex;align-items:center;gap:10px;padding:14px 32px;background:#4ade80;color:#000;font-weight:800;font-size:16px;border-radius:10px;text-decoration:none}
.wb:hover{background:#9dff44}
.bc{font-size:13px;color:rgba(255,255,255,.4);margin-bottom:22px}
.bc a{color:#4ade80;text-decoration:none}
.is{margin-top:44px}
.is h2{font-size:20px;font-weight:700;margin-bottom:12px;color:#fff}
.is p{font-size:15px;line-height:1.8;color:rgba(255,255,255,.6);margin-bottom:12px}
.is a{color:#4ade80}
@media(max-width:640px){.mm{flex-direction:column}.mp img{width:100%;max-width:220px}.mt{font-size:22px}.mdb{height:180px}}
</style>
</head>
<body>
<div class="container"><div class="app">
<div class="app-header"><div class="navbar navbar-expand-lg">
  <div class="menu" id="menuToggle" role="button" aria-label="Menu" tabindex="0">
    <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  </div>
  <div class="app-navbar"><a href="/" class="navbar-brand"><img src="/assets/images/logo-wordmark.png" alt="Unruly Movies"></a></div>
  <form class="header-search input-group d-md-block d-none" method="get" action="/search.html">
    <div class="typeahead__container app-search"><div class="typeahead__field"><div class="typeahead__query">
      <label for="search-input" class="btn px-0 mb-0" aria-label="Search"><svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg></label>
      <input class="video-search form-control" name="q" type="text" id="search-input" placeholder="Search movies, VJs..." autocomplete="off">
    </div></div></div>
  </form>
  <ul class="navbar-nav navbar-user ml-auto align-items-center text-nowrap">
    <li class="nav-item"><a class="nav-link btn-login" href="/login.html">Login</a></li>
    <li class="nav-item"><a class="nav-link btn-register" href="/register.html">Sign Up</a></li>
  </ul>
</div></div>

<div class="app-wrapper">
<div class="app-aside nav-aside" id="aside">
  <button class="modal-close" data-dismiss="modal" aria-label="Close menu"><svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
  <ul class="nav">
    <li><a href="/index.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>Home</a></li>
    <li><a href="/movies.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>Movies</a></li>
    <li><a href="/vjs.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>VJ Translators</a></li>
    <li><a href="/blog.html"><svg class="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>Blog</a></li>
  </ul>
</div>

<main class="app-container flex-fill">
<div class="mdp">
  <div class="bc"><a href="/">Home</a> / <a href="/movies.html">Movies</a> / ${esc(title)}</div>

  <div class="mdb">
    <img src="${esc(backdrop)}" alt="${esc(title)}" loading="lazy">
    <div class="mdb-ov"></div>
  </div>

  <div class="mm">
    <div class="mp"><img src="${esc(poster)}" alt="${esc(title)} poster" loading="lazy"></div>
    <div class="mi">
      <h1 class="mt">${esc(title)}</h1>
      ${luganda ? `<p class="ml">${esc(luganda)}</p>` : ''}
      <div class="mmeta">
        ${year ? `<span class="pill yr">${esc(String(year))}</span>` : ''}
        ${durationText ? `<span class="pill">${esc(durationText)}</span>` : ''}
        ${quality ? `<span class="pill ql">${esc(quality.toUpperCase())}</span>` : ''}
        ${rating ? `<span class="pill">⭐ ${esc(String(typeof rating === 'object' ? rating.imdb || '' : rating))}</span>` : ''}
      </div>
      ${vj ? `<div class="vj-b"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>Luganda VJ by ${esc(vj)}</div>` : ''}
      ${genresHtml ? `<div class="gr">${genresHtml}</div>` : ''}
      <p class="md">${esc(desc)}</p>
      <a href="/player.html?id=${esc(movieId)}" class="wb">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        Watch in Luganda
      </a>
    </div>
  </div>

  <div class="is">
    <h2>About This Luganda Translation</h2>
    <p>${esc(title)} is available on Unruly Movies with a full Luganda narration track${vj ? ` by ${esc(vj)}` : ''}. The VJ narration delivers the complete story in Luganda so viewers can follow every scene without reading subtitles.</p>
    ${genreNote ? `<p>${genreNote}</p>` : ''}
    <p>You need a free Unruly Movies account to watch. <a href="/register.html">Sign up here</a> — it takes under a minute.</p>
  </div>
</div>

<footer class="site-footer" style="margin-top:40px">
  <div class="footer-bottom">
    <p>Copyright &copy; Unruly Movies 2026 &nbsp;|&nbsp;
    <a href="/about.html" style="color:#4ade80">About</a> &nbsp;|&nbsp;
    <a href="/privacy-policy.html" style="color:#4ade80">Privacy</a> &nbsp;|&nbsp;
    <a href="/blog.html" style="color:#4ade80">Blog</a></p>
  </div>
</footer>
</main>
</div>
</div></div>
<script src="/js/app.js" defer></script>
</body>
</html>`;
}

// GET /api/movie-page/:slug
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;

        let movie = await LugandaMovie.findOne({ slug, contentType: { $ne: 'series' } });
        if (!movie && /^[0-9a-fA-F]{24}$/.test(slug)) {
            movie = await LugandaMovie.findById(slug);
        }

        if (!movie) {
            return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title><meta http-equiv="refresh" content="3;url=/movies.html"></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h1 style="color:#4ade80">Movie Not Found</h1><p>Redirecting to movies...</p></div></body></html>`);
        }

        const html = renderMoviePage(movie);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        // Cache at Netlify CDN for 1 hour; serve stale for up to 24h while revalidating
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.send(html);
    } catch (err) {
        console.error('[movie-pages] Error:', err.message);
        res.status(500).send('<h1>Server error</h1>');
    }
});

module.exports = router;
