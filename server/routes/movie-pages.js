const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

const SITE_URL = 'https://unrulymovies.com';
const API_BASE = 'https://luganda-translated-movies-production.up.railway.app';

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function makeSlug(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderMoviePage(movie) {
    const title    = movie.originalTitle || movie.title || 'Unknown Title';
    const luganda  = movie.lugandaTitle && movie.lugandaTitle !== title ? movie.lugandaTitle : null;
    const year     = movie.year || movie.releaseYear || '';
    const vj       = movie.vjName || '';
    const vjDisplay = vj ? vj.replace(/^vj\s*/i, '').trim() : '';
    const vjLabel  = vjDisplay ? `VJ ${vjDisplay}` : vj;
    const desc     = movie.plot || movie.description || '';
    const poster   = movie.poster || `${SITE_URL}/assets/images/placeholder.svg`;
    const genres   = Array.isArray(movie.genres) ? movie.genres : [];
    const rating   = movie.rating?.imdb || movie.rating?.userRating || movie.imdbRating || '';
    const duration = movie.duration || movie.runtime || '';
    const quality  = movie.video?.quality || movie.quality || 'HD';
    const movieId  = String(movie._id);
    const slug     = movie.slug || movieId;
    const pageUrl  = `${SITE_URL}/movie/${slug}`;
    const hasVideo = !!(movie.video?.embedUrl || movie.embedUrl || movie.video?.url);
    const provider = (movie.video?.provider || '').toLowerCase();
    const format   = (movie.video?.format || '').toLowerCase();

    const durationText = (() => {
        if (!duration) return '';
        const m = parseInt(duration);
        if (isNaN(m)) return '';
        return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
    })();

    const genresHtml = genres.map(g =>
        `<a href="/genres.html?genre=${encodeURIComponent(g)}" class="gp">${esc(g)}</a>`
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
        potentialAction: { '@type': 'WatchAction', target: pageUrl },
        offers: { '@type': 'Offer', availability: 'https://schema.org/OnlineOnly', price: '0', priceCurrency: 'UGX', url: pageUrl }
    });

    // Safe JSON for embedding in <script>. The real playable URL is never
    // embedded here — it's resolved client-side via POST /api/video/playback-token
    // + GET /api/video/resolve/luganda/:id, which check subscription entitlement
    // server-side before returning anything.
    const movieJson = JSON.stringify({
        id: movieId,
        title,
        poster,
        hasVideo,
        provider,
        format,
        slug
    }).replace(/<\/script>/gi, '<\\/script>');

    const genreDescriptions = {
        action:      'Action films narrated in Luganda with the energy that matches every fight scene and chase.',
        adventure:   'Adventure stories narrated in Luganda so the scale of every journey still comes through.',
        comedy:      'Comedy in Luganda — local humour replaces English jokes so the film lands as intended.',
        drama:       'Drama narrated with emotional precision so every scene carries its full weight in Luganda.',
        thriller:    'Thriller narration builds suspense through controlled Luganda delivery.',
        horror:      'Horror in Luganda — the VJ\'s voice in quiet moments before a scare is part of the experience.',
        romance:     'Romance narration bridges international filmmaking and East African audiences.',
        'sci-fi':    'Sci-fi concepts get explained in plain Luganda so the world-building stays easy to follow.',
        fantasy:     'Fantasy worlds narrated in Luganda, with names and lore kept clear for local audiences.',
        animation:   'Animated films narrated in Luganda, aimed at making the story easy to follow for the whole family.',
        family:      'Family-friendly narration in Luganda, made for watching together across generations.',
        crime:       'Crime stories narrated in Luganda with attention to the details that keep the plot tight.',
        mystery:     'Mystery films narrated in Luganda without giving away the reveal early — the pacing stays intact.',
        war:         'War films narrated in Luganda with the gravity the subject matter demands.',
        history:     'Historical films narrated in Luganda, with context added where local audiences need it.',
        music:       'Musical and music-driven films narrated in Luganda around the soundtrack, not over it.',
        western:     'Westerns narrated in Luganda, keeping the tone of the genre intact.',
        documentary: 'Documentary narration in Luganda, presented factually and true to the source material.',
    };
    const genreNotes = genres
        .map(g => genreDescriptions[g.toLowerCase()])
        .filter(Boolean);
    const genreNote = genreNotes.slice(0, 2).join(' ');

    const statsNote = [
        rating ? `It holds a ${esc(String(typeof rating === 'object' ? (rating.imdb || '') : rating))} rating` : '',
        durationText ? `runs ${esc(durationText)}` : '',
        year ? `and was released in ${esc(String(year))}` : ''
    ].filter(Boolean).join(', ') + (rating || durationText || year ? '.' : '');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}${year ? ` (${year})` : ''} in Luganda${vjLabel ? ` — ${esc(vjLabel)}` : ''} | Unruly Movies</title>
<meta name="description" content="Watch ${esc(title)}${year ? ` (${year})` : ''} in Luganda${vjLabel ? ` narrated by ${esc(vjLabel)}` : ''}. ${esc(desc.slice(0, 130))}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${pageUrl}">
<meta property="og:type" content="video.movie">
<meta property="og:title" content="${esc(title)} — Luganda Translation | Unruly Movies">
<meta property="og:description" content="${esc(desc.slice(0, 200))}">
<meta property="og:image" content="${esc(poster)}">
<meta property="og:url" content="${pageUrl}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${esc(poster)}">
<meta name="google-adsense-account" content="ca-pub-1904736753681797">
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1904736753681797" crossorigin="anonymous"></script>
<script type="application/ld+json">${jsonLd}</script>
<link rel="icon" type="image/png" href="/assets/images/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<!-- Video.js -->
<link href="/vendor/video-js/video-js.css" rel="stylesheet">
<script src="/vendor/video-js/video.min.js"></script>
<script src="/vendor/video-js/videojs-http-streaming.min.js"></script>
<!-- IMA / VAST ad integration (mirrors player.html setup) -->
<script src="https://imasdk.googleapis.com/js/sdkloader/ima3.js" async></script>
<link href="https://cdn.jsdelivr.net/npm/videojs-contrib-ads@7/dist/videojs.ads.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/videojs-ima@2/dist/videojs.ima.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/videojs-contrib-ads@7/dist/videojs.ads.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/videojs-ima@2/dist/videojs.ima.min.js" defer></script>
<script src="/js/config.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--accent:#4ade80;--bg:#0a0a0a;--bg2:#111;--bg3:#1a1a1a;--text:rgba(255,255,255,.65);--border:rgba(255,255,255,.08)}
body{font-family:'Inter',sans-serif;background:var(--bg);color:#fff;min-height:100vh}
a{text-decoration:none;color:inherit}

/* ── NAV ── */
.nav{position:sticky;top:0;z-index:100;height:52px;background:rgba(10,10,10,.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;padding:0 16px}
.nav-back{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:500;color:rgba(255,255,255,.6);padding:6px 10px;border-radius:7px;transition:.15s}
.nav-back:hover{color:#fff;background:rgba(255,255,255,.06)}
.nav-logo img{height:24px}
.nav-logo{margin-left:4px}
.nav-right{margin-left:auto;display:flex;gap:8px;align-items:center}
.nav-btn{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.55);padding:7px;border-radius:7px;display:flex;align-items:center;transition:.15s}
.nav-btn:hover{color:#fff;background:rgba(255,255,255,.07)}

/* ── PLAYER ── */
.player-wrap{position:relative;width:100%;background:#000;aspect-ratio:16/9;max-height:75vh}
.video-js{width:100%!important;height:100%!important}
.video-js video{object-fit:contain}
.video-js .vjs-big-play-button{background:rgba(74,222,128,.15);border:2px solid var(--accent);border-radius:50%;width:64px;height:64px;top:50%;left:50%;transform:translate(-50%,-50%);margin:0}
.video-js .vjs-big-play-button .vjs-icon-placeholder:before{font-size:32px;line-height:64px;color:var(--accent)}
.video-js .vjs-big-play-button:hover{background:rgba(74,222,128,.25)}
.video-js .vjs-play-progress,.video-js .vjs-volume-level{background:var(--accent)}
.video-js .vjs-control-bar{background:linear-gradient(transparent,rgba(0,0,0,.8));height:42px}

/* poster placeholder before player loads */
.poster-placeholder{position:absolute;inset:0;background-size:cover;background-position:center;display:flex;align-items:center;justify-content:center}
.poster-placeholder::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,.55)}

/* ── AUTH GATE ── */
.auth-gate{display:none;position:absolute;inset:0;z-index:20;flex-direction:column;align-items:center;justify-content:center;background:rgba(8,8,8,.88);backdrop-filter:blur(6px)}
.auth-gate.show{display:flex}
.gate-bg{position:absolute;inset:-20px;background-size:cover;background-position:center;filter:blur(20px);opacity:.2;pointer-events:none}
.gate-box{position:relative;text-align:center;padding:32px 24px;max-width:340px}
.gate-icon{width:54px;height:54px;border-radius:50%;background:rgba(74,222,128,.1);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;color:var(--accent)}
.gate-box h3{font-size:20px;font-weight:800;margin-bottom:8px}
.gate-box p{font-size:13px;color:rgba(255,255,255,.55);margin-bottom:22px;line-height:1.6}
.gate-login{display:block;padding:12px 0;background:var(--accent);color:#000;font-weight:800;font-size:14px;border-radius:9px;margin-bottom:10px}
.gate-login:hover{background:#9dff44}
.gate-register{display:block;padding:11px 0;border:1px solid rgba(255,255,255,.2);color:rgba(255,255,255,.7);font-size:14px;font-weight:600;border-radius:9px}
.gate-register:hover{border-color:var(--accent);color:var(--accent)}

/* loading spinner in player */
.player-loading{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5)}
.player-loading.hide{display:none}
.spin{width:40px;height:40px;border:3px solid rgba(255,255,255,.1);border-top-color:var(--accent);border-radius:50%;animation:spin .7s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* ── AUTH STATE STRIPS (below player) ── */
.auth-strip{display:none;max-width:900px;margin:0 auto;padding:14px 16px}
.auth-strip.show{display:block}
/* logged-out strip */
.logout-strip{background:rgba(74,222,128,.05);border-bottom:1px solid rgba(74,222,128,.1)}
.logout-inner{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.logout-text strong{display:block;font-size:14px;font-weight:700;color:#fff;margin-bottom:2px}
.logout-text span{font-size:12px;color:rgba(255,255,255,.45)}
.logout-btns{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap}
.ls-reg{padding:9px 20px;background:var(--accent);color:#000;font-weight:800;font-size:13px;border-radius:8px}
.ls-reg:hover{background:#9dff44}
.ls-login{padding:9px 16px;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.65);font-size:13px;font-weight:600;border-radius:8px}
.ls-login:hover{border-color:var(--accent);color:var(--accent)}
/* logged-in now-playing strip */
.playing-strip{border-bottom:1px solid var(--border)}
.playing-inner{display:flex;align-items:center;gap:10px}
.np-dot{width:8px;height:8px;border-radius:50%;background:var(--accent);animation:pulse 1.5s infinite;flex-shrink:0}
.np-label{font-size:13px;font-weight:600;color:var(--accent)}
.np-hint{font-size:12px;color:rgba(255,255,255,.35);margin-left:auto}

/* ── INFO SECTION ── */
.info{max-width:900px;margin:0 auto;padding:24px 16px 16px}
.title-row{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;flex-wrap:wrap}
.movie-title{font-size:26px;font-weight:900;line-height:1.2;flex:1;min-width:0}
.luganda-title{font-size:13px;color:rgba(255,255,255,.4);font-style:italic;margin-top:3px}
.meta-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.badge{padding:4px 11px;border-radius:18px;font-size:12px;font-weight:600}
.badge-year{background:rgba(74,222,128,.1);color:var(--accent)}
.badge-plain{background:rgba(255,255,255,.07);color:rgba(255,255,255,.6)}
.badge-hd{background:rgba(74,222,128,.12);color:var(--accent);border:1px solid rgba(74,222,128,.25)}
.vj-badge{display:inline-flex;align-items:center;gap:7px;padding:7px 14px;border-radius:20px;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.2);color:var(--accent);font-size:13px;font-weight:700;margin-bottom:14px}
.vj-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
.genres{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px}
.gp{padding:5px 13px;border-radius:18px;font-size:12px;background:rgba(255,255,255,.05);border:1px solid var(--border);color:rgba(255,255,255,.55);transition:.15s}
.gp:hover{border-color:var(--accent);color:var(--accent)}
.desc{font-size:14px;line-height:1.85;color:rgba(255,255,255,.58);margin-bottom:20px}
.action-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px}
.action-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;transition:.15s}
.action-btn-outline{background:rgba(255,255,255,.06);color:rgba(255,255,255,.7);border:1px solid var(--border)}
.action-btn-outline:hover{border-color:var(--accent);color:var(--accent);background:rgba(74,222,128,.06)}

/* ── RELATED MOVIES ── */
.related-section{max-width:900px;margin:0 auto;padding:28px 16px 16px;border-top:1px solid var(--border)}
.related-section h2{font-size:18px;font-weight:800;margin-bottom:18px;display:flex;align-items:center;gap:10px}
.related-section h2::before{content:'';width:4px;height:20px;background:linear-gradient(180deg,#4ade80,#22c55e);border-radius:2px;flex-shrink:0}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
.rc{background:var(--bg3);border-radius:10px;overflow:hidden;text-decoration:none;color:inherit;display:block;transition:.25s cubic-bezier(.4,0,.2,1)}
.rc:hover{transform:scale(1.04) translateY(-5px);box-shadow:0 16px 36px rgba(0,0,0,.55);z-index:5;position:relative}
.rc-poster{position:relative;width:100%;aspect-ratio:2/3;overflow:hidden}
.rc-poster img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.rc:hover .rc-poster img{transform:scale(1.08)}
.rc-overlay{position:absolute;inset:0;background:linear-gradient(transparent 35%,rgba(0,0,0,.9));opacity:0;transition:opacity .25s;display:flex;align-items:center;justify-content:center}
.rc:hover .rc-overlay{opacity:1}
.rc-play{width:44px;height:44px;border-radius:50%;background:rgba(74,222,128,.92);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transform:scale(.8);transition:transform .2s}
.rc:hover .rc-play{transform:scale(1)}
.rc-play svg{fill:#000;width:18px;height:18px;margin-left:2px}
.rc-badges{position:absolute;top:7px;left:7px;display:flex;gap:4px}
.rc-badge{padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;background:rgba(0,0,0,.65);backdrop-filter:blur(4px);color:#fff}
.rc-badge.hd{background:rgba(74,222,128,.15);color:#4ade80}
.rc-info{padding:8px 10px 10px}
.rc-title{font-size:12px;font-weight:600;color:#fff;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rc-meta{font-size:11px;color:rgba(255,255,255,.4);display:flex;gap:5px}

/* ── EDITORIAL ── */
.editorial{max-width:900px;margin:0 auto;padding:0 16px 60px;border-top:1px solid var(--border);padding-top:24px}
.editorial h2{font-size:17px;font-weight:700;margin-bottom:10px;color:#fff}
.editorial p{font-size:14px;line-height:1.85;color:rgba(255,255,255,.5);margin-bottom:10px}
.editorial a{color:var(--accent)}

/* ── FOOTER ── */
.foot{border-top:1px solid var(--border);padding:20px 16px;text-align:center;font-size:12px;color:rgba(255,255,255,.25)}
.foot a{color:var(--accent)}

@media(max-width:600px){
  .movie-title{font-size:20px}
  .player-wrap{aspect-ratio:16/9;max-height:55vw}
}
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <a href="/" class="nav-back">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
    Back
  </a>
  <a href="/" class="nav-logo"><img src="/assets/images/logo-wordmark.png" alt="Unruly Movies"></a>
  <div class="nav-right">
    <button class="nav-btn" id="shareBtn" title="Share">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
    </button>
  </div>
</nav>

<!-- PLAYER -->
<div class="player-wrap">
  <!-- Poster shown before player initialises -->
  <div class="poster-placeholder" id="posterBg" style="background-image:url('${esc(poster)}')"></div>

  <!-- Loading spinner -->
  <div class="player-loading" id="playerLoading">
    <div class="spin"></div>
  </div>

  <!-- Auth gate overlay -->
  <div class="auth-gate" id="authGate">
    <div class="gate-bg" style="background-image:url('${esc(poster)}')"></div>
    <div class="gate-box">
      <div class="gate-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h3>Sign in to watch</h3>
      <p>Create a free account to watch <strong>${esc(title)}</strong> and 400+ movies in Luganda.</p>
      <a href="/login.html?redirect=${encodeURIComponent('/movie/' + slug)}" class="gate-login">Login</a>
      <a href="/register.html?redirect=${encodeURIComponent('/movie/' + slug)}" class="gate-register">Create free account</a>
    </div>
  </div>

  <!-- Video element — Video.js initialises this -->
  <video id="moviePlayer" class="video-js vjs-default-skin" playsinline controlsList="nodownload" disablePictureInPicture oncontextmenu="return false"></video>
</div>

<!-- Logged-out strip — shown by JS when no valid session -->
<div class="auth-strip logout-strip" id="logoutStrip">
  <div class="logout-inner">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" style="flex-shrink:0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    <div class="logout-text">
      <strong>Free account required to watch</strong>
      <span>Sign up in under a minute — no payment needed to start watching</span>
    </div>
    <div class="logout-btns">
      <a href="/register.html?redirect=${encodeURIComponent('/movie/' + slug)}" class="ls-reg">Sign Up Free</a>
      <a href="/login.html?redirect=${encodeURIComponent('/movie/' + slug)}" class="ls-login">Login</a>
    </div>
  </div>
</div>

<!-- Now-playing strip — shown by JS when logged in and playing -->
<div class="auth-strip playing-strip" id="playingStrip">
  <div class="playing-inner">
    <span class="np-dot"></span>
    <span class="np-label">Now playing in Luganda${vjLabel ? ` &mdash; ${esc(vjLabel)}` : ''}</span>
    <span class="np-hint">Space to pause &nbsp;·&nbsp; F to fullscreen &nbsp;·&nbsp; ← → to seek</span>
  </div>
</div>

<!-- MOVIE INFO (SSR — visible to Google without JS) -->
<div class="info">
  <div class="title-row">
    <div>
      <h1 class="movie-title">${esc(title)}</h1>
      ${luganda ? `<div class="luganda-title">${esc(luganda)}</div>` : ''}
    </div>
  </div>

  <div class="meta-row">
    ${year ? `<span class="badge badge-year">${esc(String(year))}</span>` : ''}
    ${durationText ? `<span class="badge badge-plain">${esc(durationText)}</span>` : ''}
    ${quality ? `<span class="badge badge-hd">${esc(quality.toUpperCase())}</span>` : ''}
    ${rating ? `<span class="badge badge-plain">⭐ ${esc(String(typeof rating === 'object' ? (rating.imdb || '') : rating))}</span>` : ''}
  </div>

  ${vjLabel ? `
  <div class="vj-badge">
    <span class="vj-dot"></span>
    Luganda narration by ${esc(vjLabel)}
  </div>` : ''}

  ${genresHtml ? `<div class="genres">${genresHtml}</div>` : ''}

  ${desc ? `<p class="desc">${esc(desc)}</p>` : ''}

  <div class="action-row">
    <button class="action-btn action-btn-outline" id="watchlistBtn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
      Add to Watchlist
    </button>
    <button class="action-btn action-btn-outline" id="downloadBtn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      Download
    </button>
    <button class="action-btn action-btn-outline" id="shareBtn2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/></svg>
      Share
    </button>
  </div>
</div>

<!-- YOU MAY ALSO LIKE -->
<div class="related-section" id="relatedSection" style="display:none">
  <h2>You May Also Like</h2>
  <div class="related-grid" id="relatedGrid"></div>
</div>

<!-- EDITORIAL (SSR — original content for AdSense/Google) -->
<div class="editorial">
  <h2>About this Luganda Translation</h2>
  <p>${esc(title)} is available on Unruly Movies with a full Luganda narration track${vjLabel ? ` by ${esc(vjLabel)}` : ''}. The VJ narration delivers the complete story so viewers can follow every scene without subtitles.${statsNote ? ` ${statsNote}` : ''}</p>
  ${genreNote ? `<p>${genreNote}</p>` : ''}
  <p>Unruly Movies is Uganda's licensed platform for Luganda VJ-translated films. <a href="/register.html">Sign up free</a> to start watching, or <a href="/blog.html">read about VJ culture</a> to learn more.</p>
</div>

<footer class="foot">
  &copy; Unruly Movies 2026 &nbsp;|&nbsp;
  <a href="/about.html">About</a> &nbsp;|&nbsp;
  <a href="/privacy-policy.html">Privacy</a> &nbsp;|&nbsp;
  <a href="/blog.html">Blog</a>
</footer>

<script>
// Data embedded by server — no API call needed for basic info
window.__MOVIE__ = ${movieJson};
const API_BASE = typeof API_CONFIG !== 'undefined' ? API_CONFIG.BASE_URL : '${API_BASE}';

const authGate      = document.getElementById('authGate');
const playerLoading = document.getElementById('playerLoading');
const posterBg      = document.getElementById('posterBg');
const logoutStrip   = document.getElementById('logoutStrip');
const playingStrip  = document.getElementById('playingStrip');
let vjsPlayer       = null;

function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('authToken') ||
           sessionStorage.getItem('token') || sessionStorage.getItem('authToken') || '';
}
function cleanToken(t) {
    if (!t || typeof t !== 'string') return '';
    const s = t.trim();
    return s.toLowerCase().startsWith('bearer ') ? s.slice(7).trim() : s;
}

function isBot() {
    const ua = navigator.userAgent || '';
    return /Googlebot|bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|ia_archiver|AhrefsBot|SemrushBot|MJ12bot|DotBot|Applebot|Twitterbot|LinkedInBot|WhatsApp|Slack|Discordbot/i.test(ua);
}

async function checkAuth() {
    const raw = getToken();
    const token = cleanToken(raw);
    if (!token) return false;
    try {
        const r = await fetch(API_BASE + '/api/auth/check-access', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (r.ok) {
            const d = await r.json();
            window._userAccess = d.access || d.data || {};
        }
        return r.ok;
    } catch {
        return !!token;
    }
}

// Upgrade http:// → https:// so the browser never loads mixed content on our HTTPS page
function safeUrl(url) {
    if (!url) return url;
    return url.startsWith('http://') ? 'https://' + url.slice(7) : url;
}

function hideLoading()  { playerLoading.classList.add('hide'); }
function showGate() {
    const access = window._userAccess || {};
    const gateBox = authGate.querySelector('.gate-box');
    if (access.freeUser) {
        // Logged in but free plan — show subscribe prompt
        gateBox.innerHTML = \`
          <div class="gate-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3>Subscription Required</h3>
          <p>Get a paid plan to watch <strong>${esc(title)}</strong> and 400+ Luganda VJ movies.</p>
          <button onclick="showSubscribePopup()" class="gate-login" style="width:100%;cursor:pointer;border:none;">Subscribe Now — from UGX 1,000</button>
        \`;
        // Update bottom strip for free users
        const strip = document.getElementById('logoutStrip');
        if (strip) {
            strip.querySelector('.logout-text strong').textContent = 'Subscribe to watch';
            strip.querySelector('.logout-text span').textContent = 'Get a plan from UGX 1,000 to unlock all movies';
            const regBtn = strip.querySelector('.ls-reg');
            regBtn.textContent = 'Subscribe Now';
            regBtn.removeAttribute('href');
            regBtn.onclick = () => showSubscribePopup();
            strip.querySelector('.ls-login').style.display = 'none';
        }
    }
    authGate.classList.add('show');
    hideLoading();
    logoutStrip.classList.add('show');
}
function showPlaying()  { playingStrip.classList.add('show'); }

// The public page/API never contains the real playable URL — it's stripped
// server-side. This is the only way to get one: a short-lived,
// subscription-checked playback token, then a server-side resolve (which
// also extracts embed-page providers like Streamtape when needed).
async function resolvePlayableUrl(movieId) {
    try {
        const token = cleanToken(getToken());
        const tokenResp = await fetch(API_BASE + '/api/video/playback-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ movieId })
        });
        const tokenData = await tokenResp.json();
        if (!tokenData.success || !tokenData.token) {
            return { success: false, message: tokenData.message };
        }

        const resolveResp = await fetch(API_BASE + '/api/video/resolve/luganda/' + movieId + '?token=' + encodeURIComponent(tokenData.token));
        return await resolveResp.json();
    } catch (e) {
        return { success: false, message: 'Network error' };
    }
}

function initVjs(movieId) {
    posterBg.style.display = 'none';
    vjsPlayer = videojs('moviePlayer', {
        controls: true,
        autoplay: true,
        preload: 'auto',
        fluid: false,
        responsive: true,
        playbackRates: [0.75, 1, 1.25, 1.5],
        controlBar: {
            children: ['playToggle','volumePanel','currentTimeDisplay','timeDivider',
                       'durationDisplay','progressControl','customControlSpacer',
                       'playbackRateMenuButton','pictureInPictureToggle','fullscreenToggle']
        }
    });

    vjsPlayer.ready(async () => {
        const result = await resolvePlayableUrl(movieId);
        hideLoading();
        if (result.success && result.directUrl) {
            const playUrl = safeUrl(result.directUrl);
            const type = playUrl.toLowerCase().includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4';
            vjsPlayer.src({ src: playUrl, type });
        } else {
            console.error('Playback resolve failed:', result.message);
            playerLoading.innerHTML = '';
            const msg = document.createElement('p');
            msg.style.cssText = 'color:#fff;font-size:13px;text-align:center;padding:0 20px;';
            msg.textContent = result.message || 'This video is currently unavailable.';
            playerLoading.appendChild(msg);
            playerLoading.classList.remove('hide');
        }
    });

    vjsPlayer.on('play', () => { showPlaying(); checkDownloadPermission(); });
    vjsPlayer.on('error', () => { console.error('Player error', vjsPlayer.error()); });

    // VAST pre-roll ads — wait up to 800ms for checkAuth() to populate _userAccess,
    // then skip ads for admins/paid plans (showAds === false), fire for free users.
    setTimeout(() => {
        const showAds = window._userAccess ? window._userAccess.showAds !== false : true;
        if (!showAds) return;
        try {
            if (typeof vjsPlayer.ima === 'function') {
                vjsPlayer.ima({
                    adTagUrl: 'https://pubads.g.doubleclick.net/gampad/live/ads?iu=/23358450278/video-preroll&description_url=https%3A%2F%2Funrulymovies.com&tfcd=0&npa=0&sz=640x480&min_ad_duration=5000&max_ad_duration=30000&gdfp_req=1&unviewed_position_start=1&output=vast&env=vp&impl=s&correlator=',
                    adsRenderingSettings: { enablePreloading: true }
                });
                vjsPlayer.ima.initializeAdDisplayContainer();
            }
        } catch (e) {}
    }, 800);

    // Save watch progress every 10s
    const movie = window.__MOVIE__;
    vjsPlayer.on('timeupdate', (() => {
        let last = 0;
        return () => {
            const now = Date.now();
            if (now - last < 10000) return;
            last = now;
            const token = cleanToken(getToken());
            if (!token) return;
            fetch(API_BASE + '/api/watch-progress/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ movieId: movie.id, currentTime: vjsPlayer.currentTime(), duration: vjsPlayer.duration() })
            }).catch(() => {});
        };
    })());
}

async function boot() {
    const m = window.__MOVIE__;

    // Wait for auth check before loading player — block free plan users
    const isAuthed = await checkAuth();
    const access = window._userAccess || {};

    // Show download button for admins/paid subscribers
    // Always show download button — clicking checks subscription
    const btn = document.getElementById('downloadBtn');
    if (btn) {
        btn.onclick = () => {
            const access = window._userAccess || {};
            if (access.canDownload || access.isAdmin) {
                handleDownload();
            } else {
                showDownloadPrompt();
            }
        };
    }

    // Block free plan or unauthenticated users
    // Bots/crawlers: skip all gates so Google indexes the content
    if (isBot()) {
        hideLoading();
        loadRelatedMovies();
        return;
    }
    if (!isAuthed) {
        showGate();
        loadRelatedMovies();
        return;
    }
    if (access.freeUser || !access.canWatch) {
        // Free plan — don't block the page; show poster with a tap-to-subscribe play button
        hideLoading();
        const strip = document.getElementById('logoutStrip');
        if (strip) {
            strip.querySelector('.logout-text strong').textContent = 'Subscribe to watch';
            strip.querySelector('.logout-text span').textContent = 'Get a plan from UGX 1,000 to unlock all movies';
            const regBtn = strip.querySelector('.ls-reg');
            regBtn.textContent = 'Subscribe Now';
            regBtn.removeAttribute('href');
            regBtn.onclick = () => showSubscribePopup();
            const loginBtn = strip.querySelector('.ls-login');
            if (loginBtn) loginBtn.style.display = 'none';
            strip.classList.add('show');
        }
        const wrap = document.querySelector('.player-wrap');
        if (wrap) {
            const freeBtn = document.createElement('button');
            freeBtn.id = 'freePlayBtn';
            freeBtn.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:rgba(0,0,0,0.38);border:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;gap:14px;';
            freeBtn.innerHTML = '<div style="width:76px;height:76px;border-radius:50%;background:rgba(74,222,128,0.92);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 14px rgba(74,222,128,0.18);"><svg width="30" height="30" viewBox="0 0 24 24" fill="#000"><polygon points="5 3 19 12 5 21 5 3"/></svg></div><span style="color:#fff;font-size:13px;background:rgba(0,0,0,0.65);padding:5px 16px;border-radius:20px;">Subscribe to watch</span>';
            freeBtn.onclick = () => showSubscribePopup();
            wrap.appendChild(freeBtn);
        }
        loadRelatedMovies();
        return;
    }

    if (m.hasVideo === false) {
        playerLoading.innerHTML = '';
        const msg = document.createElement('p');
        msg.style.cssText = 'color:#fff;font-size:13px;text-align:center;padding:0 20px;';
        msg.textContent = 'Video not available for this movie.';
        playerLoading.appendChild(msg);
        loadRelatedMovies();
        return;
    }

    initVjs(m.id);
    loadRelatedMovies();
    fetch(API_BASE + '/api/luganda-movies/' + m.id + '/view', { method: 'POST' }).catch(() => {});
}

// ── DOWNLOAD ──
function checkDownloadPermission() {
    const btn = document.getElementById('downloadBtn');
    if (!btn) return;
    btn.style.display = 'inline-flex';
    btn.onclick = () => {
        const access = window._userAccess || {};
        if (access.canDownload || access.isAdmin) {
            handleDownload();
        } else {
            showDownloadPrompt();
        }
    };
}

function showSubscribePopup() { showDownloadPrompt(); }
function showDownloadPrompt() {
    const el = document.getElementById('downloadPromptOverlay');
    if (el) { el.remove(); return; }
    const ov = document.createElement('div');
    ov.id = 'downloadPromptOverlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.88);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    ov.onclick = e => { if (e.target === ov) ov.remove(); };
    ov.innerHTML = \`
        <div style="background:linear-gradient(145deg,#1a1a2e,#16213e);border:1px solid rgba(74,222,128,.2);border-radius:20px;padding:28px;max-width:380px;width:100%;text-align:center;">
          <div style="width:54px;height:54px;border-radius:50%;background:rgba(74,222,128,.1);display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <h3 style="color:#fff;font-size:17px;margin-bottom:6px;">Premium Access Required</h3>
          <p style="color:#888;font-size:12px;line-height:1.6;margin-bottom:20px;">Choose a plan to download &amp; watch offline</p>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;">
            <button onclick="window._selectPlan('daily')" style="display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:14px;cursor:pointer;width:100%;">
              <span>Daily</span><span style="color:#f59e0b;font-weight:700;">UGX 1,000 <small style="color:#888;font-weight:400;">/ 1 day</small></span>
            </button>
            <button onclick="window._selectPlan('weekly')" style="display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:14px;cursor:pointer;width:100%;">
              <span>Weekly</span><span style="color:#00d9ff;font-weight:700;">UGX 5,000 <small style="color:#888;font-weight:400;">/ 7 days</small></span>
            </button>
            <button onclick="window._selectPlan('biweekly')" style="display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:10px;color:#fff;font-size:14px;cursor:pointer;width:100%;">
              <span>2 Weeks</span><span style="color:#a78bfa;font-weight:700;">UGX 7,000 <small style="color:#888;font-weight:400;">/ 14 days</small></span>
            </button>
            <button onclick="window._selectPlan('monthly')" style="display:flex;justify-content:space-between;align-items:center;padding:13px 16px;background:rgba(74,222,128,.08);border:1px solid rgba(74,222,128,.3);border-radius:10px;color:#fff;font-size:14px;cursor:pointer;width:100%;position:relative;">
              <span>Monthly <span style="background:#4ade80;color:#000;font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;margin-left:6px;">BEST</span></span>
              <span style="color:#4ade80;font-weight:700;">UGX 12,000 <small style="color:#888;font-weight:400;">/ 30 days</small></span>
            </button>
          </div>
          <button onclick="document.getElementById('downloadPromptOverlay').remove()" style="background:none;border:none;color:#555;font-size:12px;cursor:pointer;">Not now</button>
        </div>\`;
    document.body.appendChild(ov);
    // Handle plan selection — initiate payment via API
    window._selectPlan = async (plan) => {
        const token = cleanToken(getToken());
        if (!token) { window.location.href = '/login.html'; return; }
        const btn = ov.querySelector(\`button[onclick="window._selectPlan('\${plan}')"]\`);
        if (btn) { btn.textContent = 'Processing...'; btn.disabled = true; }
        try {
            const r = await fetch(API_BASE + '/api/payments/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify({ plan, paymentMethod: 'pesapal' })
            });
            const d = await r.json();
            if (d.status === 'success' && d.data?.redirectUrl) {
                window.location.href = d.data.redirectUrl;
            } else {
                alert(d.message || d.error || 'Payment error. Please try again.');
                if (btn) { btn.textContent = plan; btn.disabled = false; }
            }
        } catch(e) {
            alert('Network error. Please try again.');
            if (btn) { btn.disabled = false; }
        }
    };
}

// Links straight to the resolved CDN URL — no Railway byte-proxying. The
// real URL isn't in window.__MOVIE__ (stripped from the page source), so
// this resolves it the same authenticated way playback does.
async function handleDownload() {
    const m = window.__MOVIE__;
    if (m.hasVideo === false) return;

    const result = await resolvePlayableUrl(m.id);
    if (!result.success || !result.directUrl) {
        console.error('Download resolve failed:', result.message);
        return;
    }

    const fileName = (m.title || 'movie').replace(/[^a-zA-Z0-9 _-]/g, '').trim() + '.mp4';
    // Route through the backend proxy so the response carries
    // Content-Disposition: attachment — a direct cross-origin CDN link
    // makes Chrome/Safari just play the video instead of saving it, since
    // the download attribute is ignored cross-origin without that header.
    const proxyDownload = API_BASE + '/api/video/stream-proxy?url=' + encodeURIComponent(result.directUrl) + '&download=' + encodeURIComponent(fileName);
    const a = document.createElement('a');
    a.href = proxyDownload;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ── RELATED MOVIES ──
async function loadRelatedMovies() {
    const m = window.__MOVIE__;
    try {
        const genre = ${JSON.stringify(genres[0] || '')};
        const url = genre
            ? API_BASE + '/api/luganda-movies/genre/' + encodeURIComponent(genre) + '?limit=8'
            : API_BASE + '/api/luganda-movies/latest?limit=8';
        const r = await fetch(url);
        const d = await r.json();
        if ((d.success || d.status === 'success') && d.data) {
            const movies = d.data.filter(x => x._id !== m.id).slice(0, 6);
            if (!movies.length) return;
            renderRelatedMovies(movies);
            document.getElementById('relatedSection').style.display = '';
        }
    } catch (e) {}
}

function renderRelatedMovies(movies) {
    document.getElementById('relatedGrid').innerHTML = movies.map(m => {
        const title  = m.originalTitle || m.title || 'Unknown';
        const year   = m.year || '';
        const vj     = (m.vjName || '').replace(/^vj[\\s]*/i, '').trim();
        const qual   = (m.video?.quality || 'HD').toUpperCase();
        const poster = m.poster || '/assets/images/placeholder.svg';
        const href   = '/movie/' + (m.slug || m._id);
        return \`<a href="\${href}" class="rc">
          <div class="rc-poster">
            <img src="\${poster}" alt="\${title.replace(/"/g,'')}" loading="lazy" onerror="this.src='/assets/images/placeholder.svg'">
            <div class="rc-badges"><span class="rc-badge hd">\${qual}</span></div>
            <div class="rc-overlay"><button class="rc-play"><svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg></button></div>
          </div>
          <div class="rc-info">
            <div class="rc-title">\${title}</div>
            <div class="rc-meta">\${year ? '<span>'+year+'</span>' : ''}\${vj ? '<span>VJ '+vj+'</span>' : ''}</div>
          </div>
        </a>\`;
    }).join('');
}

// Block right-click / "Save Video As" on the entire player area
document.querySelector('.player-wrap').addEventListener('contextmenu', e => e.preventDefault());

// Share button
document.getElementById('shareBtn').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({ title: '${esc(title)} — Luganda | Unruly Movies', url: window.location.href });
    } else {
        navigator.clipboard?.writeText(window.location.href);
    }
});
document.getElementById('shareBtn2')?.addEventListener('click', () => {
    document.getElementById('shareBtn').click();
});

// Watchlist
document.getElementById('watchlistBtn').addEventListener('click', async () => {
    const token = cleanToken(getToken());
    if (!token) { window.location.href = '/login.html'; return; }
    try {
        await fetch(API_BASE + '/api/playlist/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ contentId: window.__MOVIE__.id, contentType: 'movie' })
        });
        document.getElementById('watchlistBtn').textContent = '✓ Added';
    } catch (e) {}
});

// Sync check — if clearly no token, show gate immediately (no spinner flash)
if (!getToken()) {
    showGate();
    loadRelatedMovies(); // still show recommendations to logged-out users
} else {
    boot();
}
</script>
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
        // If still not found, check if it's a series — redirect to series-detail page
        if (!movie) {
            const seriesQuery = { contentType: 'series', slug };
            const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);
            const series = await LugandaMovie.findOne(
                isObjectId ? { contentType: 'series', $or: [{ slug }, { _id: slug }] } : seriesQuery
            );
            if (series) {
                const seriesId = series.slug || String(series._id);
                return res.redirect(302, `/series-player.html?id=${encodeURIComponent(seriesId)}`);
            }
            return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title><meta http-equiv="refresh" content="3;url=/movies.html"></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h1 style="color:#4ade80">Movie Not Found</h1><p>Redirecting to movies...</p></div></body></html>`);
        }
        const html = renderMoviePage(movie);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.send(html);
    } catch (err) {
        console.error('[movie-pages]', err.message);
        res.status(500).send('<h1>Server error</h1>');
    }
});

module.exports = router;
