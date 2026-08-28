const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const LugandaMovie = require('../models/LugandaMovie');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

// FFmpeg for MKV remuxing
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const PLAYBACK_TOKEN_SECRET = process.env.PLAYBACK_TOKEN_SECRET || process.env.JWT_SECRET || 'unruly-movies-playback-token-secret';
const PLAYBACK_TOKEN_EXPIRES_IN = process.env.PLAYBACK_TOKEN_EXPIRES_IN || '10m';

/**
 * Video Proxy API
 * Extracts direct video URLs from various hosting providers
 * This allows playing videos in our own ad-free player
 */

// CORS middleware
const setCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://watch.unrulymovies.com',
        'https://unrulymovies.com',
        'https://www.unrulymovies.com',
        'https://translatedmovies.netlify.app',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:8000'
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.includes('netlify.app') || origin.includes('unrulymovies.com') || origin.includes('pearlpix.net'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        // Allow all origins for video streaming — credentials cannot be used with wildcard
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
};

// Handle OPTIONS preflight
router.options('*', (req, res) => {
    setCorsHeaders(req, res);
    res.sendStatus(200);
});

function sanitizeUrl(input) {
    if (!input || typeof input !== 'string') return null;
    return input.trim().replace(/\s+/g, '');
}

function isArchiveUrl(url) {
    const u = sanitizeUrl(url);
    if (!u) return false;
    return u.includes('archive.org/') || /ia\d+\.us\.archive\.org/i.test(u);
}

// Real catalog check turned up movies tagged provider:'streamtape' whose URL
// literally ends in ".mp4" (e.g. streamtape.com/e/xxx/Movie_Name.mp4) — that's
// still a Streamtape embed page requiring extraction, not a playable file;
// the ".mp4"-looking suffix is just a display name. So known embed-host
// domains must be checked BEFORE the extension guess, not after — an embed
// host is never "direct" no matter what its URL path looks like.
const EMBED_HOST_PATTERNS = [
    /streamtape\.com/i,
    /streamtape\.to/i,
    /doodstream\.com/i,
    /dood\.(to|ws|watch|pm|wf|la|re|so)/i,
    /filemoon\.(to|sx)/i
];

function isEmbedHostUrl(url) {
    const u = sanitizeUrl(url);
    if (!u) return false;
    return EMBED_HOST_PATTERNS.some(p => p.test(u));
}

// Cloudflare Stream's player page (".../watch") isn't a raw file — it needs
// an iframe or its HLS manifest. The manifest URL is a predictable rewrite
// of the same video ID, so this needs no scraping, unlike Streamtape/Doodstream.
function isCloudflareStreamWatchUrl(url) {
    const u = sanitizeUrl(url);
    if (!u) return false;
    return /cloudflarestream\.com\/[a-f0-9]+\/watch/i.test(u);
}

function cloudflareStreamWatchToManifest(url) {
    return sanitizeUrl(url).replace(/\/watch(\?.*)?$/i, '/manifest/video.m3u8');
}

// Mirrors isDirectVideo() in player.html — the DB's `provider`
// label isn't always accurate (movies get tagged 'streamtape' from an older
// bulk-import regardless of actual host), so URL shape is the reliable signal
// for whether a file is already directly playable vs. an embed page needing extraction.
// Embed-host domains are checked first — see isEmbedHostUrl above.
function isDirectVideoUrl(url) {
    const u = sanitizeUrl(url);
    if (!u) return false;
    if (isEmbedHostUrl(u) || isCloudflareStreamWatchUrl(u)) return false;
    const lower = u.toLowerCase();
    const extensions = ['.mp4', '.webm', '.mkv', '.m3u8', '.m4v'];
    return extensions.some(ext => lower.includes(ext)) ||
        lower.includes('archive.org') ||
        lower.includes('cloudflare') ||
        lower.includes('r2.dev') ||
        lower.includes('b-cdn.net') ||
        lower.includes('bunnycdn') ||
        lower.includes('pearlpix.xyz');
}

function extractArchiveItemId(url) {
    const u = sanitizeUrl(url);
    if (!u) return null;

    const embedMatch = u.match(/archive\.org\/embed\/([^/?#]+)/i);
    if (embedMatch) return embedMatch[1];

    const detailsMatch = u.match(/archive\.org\/details\/([^/?#]+)/i);
    if (detailsMatch) return detailsMatch[1];

    const downloadMatch = u.match(/archive\.org\/download\/([^/?#]+)/i);
    if (downloadMatch) return downloadMatch[1];

    const cdnMatch = u.match(/\/items\/([^/?#]+)/i);
    if (cdnMatch) return cdnMatch[1];

    return null;
}

function archiveEmbedToDefaultDirectMp4(url) {
    const u = sanitizeUrl(url);
    if (!u) return null;
    const itemId = extractArchiveItemId(u);
    if (!itemId) return null;
    return `https://archive.org/download/${itemId}/${itemId}.ia.mp4`;
}

function buildArchiveFallbackUrls(primaryUrl) {
    const u = sanitizeUrl(primaryUrl);
    if (!u) return [];

    const urls = [];
    urls.push(u);

    const itemId = extractArchiveItemId(u);
    if (itemId) {
        // A commonly playable default derivative
        urls.push(`https://archive.org/download/${itemId}/${itemId}.ia.mp4`);
        urls.push(`https://archive.org/download/${itemId}/${itemId}.mp4`);
    }

    // If this is a CDN URL (ia*.us.archive.org/.../items/{itemId}/{file}), also try archive.org/download
    const cdnFileMatch = u.match(/\/items\/([^/]+)\/(.+)$/i);
    if (cdnFileMatch) {
        const cdnItemId = cdnFileMatch[1];
        const cdnFile = cdnFileMatch[2];
        urls.push(`https://archive.org/download/${cdnItemId}/${cdnFile}`);
    }

    // If embed/details, prefer the default direct derivative
    if (u.includes('archive.org/embed/') || u.includes('archive.org/details/')) {
        const direct = archiveEmbedToDefaultDirectMp4(u);
        if (direct) urls.unshift(direct);
    }

    // Deduplicate while preserving order
    const seen = new Set();
    return urls.filter(x => {
        const key = x.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function streamRemoteVideo(req, res, sourceUrl) {
    const range = req.headers.range;

    const upstreamHeaders = {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Accept': '*/*',
        'Referer': 'https://archive.org/'
    };
    if (range) upstreamHeaders['Range'] = range;

    const upstream = await axios({
        method: 'GET',
        url: sourceUrl,
        responseType: 'stream',
        headers: upstreamHeaders,
        timeout: 30000,
        maxRedirects: 5,
        validateStatus: () => true
    });

    if (upstream.status >= 400) {
        const err = new Error(`Upstream error ${upstream.status}`);
        err.status = upstream.status;
        throw err;
    }

    // Pass through key headers for video playback (Range/seek support)
    const passthroughHeaders = [
        'content-type',
        'content-length',
        'accept-ranges',
        'content-range',
        'etag',
        'last-modified'
    ];
    passthroughHeaders.forEach(h => {
        if (upstream.headers[h]) res.setHeader(h, upstream.headers[h]);
    });

    // CORS + expose range headers
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    res.setHeader('Cache-Control', 'private, max-age=0, no-store');

    res.status(upstream.status);

    // Pipe and handle aborts
    upstream.data.on('error', () => {
        try { res.end(); } catch (e) {}
    });
    req.on('close', () => {
        try { upstream.data.destroy(); } catch (e) {}
    });

    upstream.data.pipe(res);
}

async function resolveMovieSourceUrl(movie) {
    if (!movie) return null;

    // Prefer explicit direct path if present
    const direct = sanitizeUrl(movie.video?.originalVideoPath);
    if (direct) return direct;

    // Fall back to embedUrl fields
    const embed = sanitizeUrl(movie.embedUrl || movie.video?.embedUrl || movie.video?.url);
    if (embed) return embed;

    return null;
}

// A movie's `requiredPlan` field ('free'/'basic'/'premium') is unused
// leftover data from an old tiering scheme that doesn't match the real
// plan lineup (daily/weekly/biweekly/monthly) — no UI ever set it
// deliberately, it isn't shown to users anywhere, and enforcing it
// silently blocked paying customers from titles they'd already paid for.
// Any active paid plan, including the cheapest (daily), unlocks any movie.
function effectiveRequiredPlan(movie) {
    return 'daily';
}

function requirePlaybackAuthIfNeeded(movie, req) {
    const requiredPlan = effectiveRequiredPlan(movie);

    const token = sanitizeUrl(req.query.token);
    if (!token) {
        const error = new Error('Playback token required');
        error.code = 'PLAYBACK_TOKEN_REQUIRED';
        error.httpStatus = 401;
        throw error;
    }

    let payload;
    try {
        payload = jwt.verify(token, PLAYBACK_TOKEN_SECRET, { issuer: 'unruly-movies' });
    } catch (e) {
        const error = new Error('Invalid or expired playback token');
        error.code = 'INVALID_PLAYBACK_TOKEN';
        error.httpStatus = 401;
        throw error;
    }

    // Token must have been issued for this exact movie — otherwise a token
    // for one movie could be replayed against any other movieId in the URL.
    if (String(payload.movieId) !== String(movie._id)) {
        const error = new Error('Token does not match requested movie');
        error.code = 'TOKEN_MISMATCH';
        error.httpStatus = 401;
        throw error;
    }

    return { requiredPlan, tokenPayload: payload };
}

async function assertUserCanPlay(requiredPlan, tokenPayload) {
    // All content requires at least the cheapest paid plan (daily)
    const effectivePlan = requiredPlan === 'free' ? 'daily' : requiredPlan;

    const userId = tokenPayload?.uid;
    if (!userId) {
        const error = new Error('Invalid playback token payload');
        error.code = 'INVALID_PLAYBACK_TOKEN';
        error.httpStatus = 401;
        throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
        const error = new Error('User not found');
        error.code = 'USER_NOT_FOUND';
        error.httpStatus = 401;
        throw error;
    }

    if (!user.canAccessContent(effectivePlan)) {
        const error = new Error(`This content requires a paid subscription`);
        error.code = 'SUBSCRIPTION_REQUIRED';
        error.httpStatus = 403;
        throw error;
    }
}

/**
 * Create a short-lived playback token for a specific movie.
 * Client uses this token as a query param for <video> src (since <video> cannot attach Authorization headers).
 * POST /api/video/playback-token
 * Body: { movieId: "..." }
 */
// Season 1 Episode 1 is free to watch for any logged-in account regardless
// of plan (a preview episode), but never for download — callers pass
// forDownload:true to force the real entitlement check even on S1E1.
function isFreeEpisode(season, episode) {
    return Number(season) === 1 && Number(episode) === 1;
}

router.post('/playback-token', protect, async (req, res) => {
    setCorsHeaders(req, res);

    try {
        const movieId = req.body?.movieId;
        const season = req.body?.season;
        const episode = req.body?.episode;
        const forDownload = !!req.body?.forDownload;
        if (!movieId) {
            return res.status(400).json({
                success: false,
                message: 'movieId is required'
            });
        }

        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        const isEpisodeRequest = season != null && episode != null;
        if (isEpisodeRequest) {
            const seasonDoc = (movie.seasons || []).find(s => s.seasonNumber === Number(season));
            const episodeDoc = seasonDoc?.episodes?.find(e => e.episodeNumber === Number(episode));
            if (!episodeDoc) {
                return res.status(404).json({ success: false, message: 'Episode not found' });
            }
        }

        const freeEpisode = isEpisodeRequest && !forDownload && isFreeEpisode(season, episode);

        if (!freeEpisode) {
            const requiredPlan = effectiveRequiredPlan(movie);
            if (!req.user.canAccessContent(requiredPlan)) {
                return res.status(403).json({
                    success: false,
                    message: `This content requires a ${requiredPlan} subscription or higher`,
                    requiredPlan,
                    currentPlan: req.user.subscription?.plan
                });
            }
        }

        // canAccessContent grants full access during the trial window, but
        // downloads are deliberately not part of the trial — check that
        // separately so a trial user can't get a download-flagged token just
        // because streaming access already passed above.
        if (forDownload && !req.user.hasDownloadAccess()) {
            return res.status(403).json({
                success: false,
                message: 'Downloads require a paid subscription',
                code: 'DOWNLOAD_REQUIRES_SUBSCRIPTION'
            });
        }

        const token = jwt.sign(
            {
                type: 'playback',
                uid: req.user.id,
                movieId: String(movieId),
                season: isEpisodeRequest ? Number(season) : null,
                episode: isEpisodeRequest ? Number(episode) : null
            },
            PLAYBACK_TOKEN_SECRET,
            {
                expiresIn: PLAYBACK_TOKEN_EXPIRES_IN,
                issuer: 'unruly-movies'
            }
        );

        return res.json({
            success: true,
            token,
            expiresIn: PLAYBACK_TOKEN_EXPIRES_IN
        });
    } catch (error) {
        console.error('Playback token error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create playback token'
        });
    }
});

/**
 * Stream a LugandaMovie through the backend with Range support.
 * This hides direct Archive.org links and provides retry/fallback.
 * GET /api/video/stream/luganda/:movieId?token=...
 * PUBLIC: Free content available without authentication
 */
router.get('/stream/luganda/:movieId', optionalAuth, async (req, res) => {
    setCorsHeaders(req, res);

    try {
        const { movieId } = req.params;
        const movie = await LugandaMovie.findById(movieId).lean();

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        // Enforce subscription via short-lived playback token for paid plans
        const { requiredPlan, tokenPayload } = requirePlaybackAuthIfNeeded(movie, req);
        await assertUserCanPlay(requiredPlan, tokenPayload);

        let sourceUrl = await resolveMovieSourceUrl(movie);
        if (!sourceUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing video URL for this movie'
            });
        }

        // Only proxy Archive.org URLs here (safe + predictable). For other URLs, return 400 to avoid open proxy.
        if (!isArchiveUrl(sourceUrl)) {
            return res.status(400).json({
                success: false,
                message: 'Streaming proxy only supports Archive.org sources for now'
            });
        }

        const candidates = buildArchiveFallbackUrls(sourceUrl);

        let lastErr = null;
        for (const candidate of candidates) {
            try {
                await streamRemoteVideo(req, res, candidate);
                return;
            } catch (err) {
                lastErr = err;
                // Try next candidate
            }
        }

        console.error('All Archive.org stream candidates failed', { movieId, error: lastErr?.message });
        return res.status(502).json({
            success: false,
            message: 'Failed to stream video from Archive.org'
        });
    } catch (error) {
        const httpStatus = error.httpStatus || 500;
        const code = error.code;
        return res.status(httpStatus).json({
            success: false,
            code,
            message: error.message || 'Streaming error'
        });
    }
});

/**
 * Resolve the direct playable URL for a movie, by ID, after verifying the
 * short-lived playback token + subscription entitlement (same check as the
 * Archive.org stream proxy above). Unlike /extract below, the caller never
 * needs to already possess the raw source URL — this is what closes the gap
 * where GET /api/luganda-movies/:id (public, unauthenticated) used to hand
 * out the real CDN/embed URL to anyone regardless of subscription.
 * GET /api/video/resolve/luganda/:movieId?token=...
 */
// Route by actual URL shape, not the DB's `provider` label — a real catalog
// check found ~227 of 229 movies tagged provider:'streamtape' are really
// Cloudflare Stream or plain CDN/S3 files from an old bulk import, so the
// label can't be trusted for routing.
async function resolveUrlForDelivery(sourceUrl, fallbackProvider, fallbackFormat) {
    if (isCloudflareStreamWatchUrl(sourceUrl)) {
        return {
            success: true,
            directUrl: cloudflareStreamWatchToManifest(sourceUrl),
            provider: 'cloudflare-stream',
            format: 'm3u8'
        };
    }

    if (isEmbedHostUrl(sourceUrl)) {
        if (/streamtape/i.test(sourceUrl)) {
            return await extractStreamtape(sourceUrl);
        } else if (/dood\./i.test(sourceUrl) || /doodstream/i.test(sourceUrl)) {
            return await extractDoodstream(sourceUrl);
        } else if (/filemoon/i.test(sourceUrl)) {
            return await extractFilemoon(sourceUrl);
        }
    }

    // Already a direct file/CDN/Archive.org URL — safe to return as-is.
    return {
        success: true,
        directUrl: sourceUrl,
        provider: fallbackProvider || 'unknown',
        format: fallbackFormat || 'mp4'
    };
}

router.get('/resolve/luganda/:movieId', async (req, res) => {
    setCorsHeaders(req, res);

    try {
        const { movieId } = req.params;
        const { season, episode } = req.query;
        const movie = await LugandaMovie.findById(movieId).lean();

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }

        const isEpisodeRequest = season != null && episode != null;

        if (isEpisodeRequest) {
            // Token must have been issued for this exact episode — a token
            // for the free S1E1 preview can't be replayed against any other
            // (paid) episode just by changing the query string.
            const token = sanitizeUrl(req.query.token);
            if (!token) {
                const error = new Error('Playback token required');
                error.code = 'PLAYBACK_TOKEN_REQUIRED';
                error.httpStatus = 401;
                throw error;
            }
            let payload;
            try {
                payload = jwt.verify(token, PLAYBACK_TOKEN_SECRET, { issuer: 'unruly-movies' });
            } catch (e) {
                const error = new Error('Invalid or expired playback token');
                error.code = 'INVALID_PLAYBACK_TOKEN';
                error.httpStatus = 401;
                throw error;
            }
            if (String(payload.movieId) !== String(movieId) ||
                Number(payload.season) !== Number(season) ||
                Number(payload.episode) !== Number(episode)) {
                const error = new Error('Token does not match requested episode');
                error.code = 'TOKEN_MISMATCH';
                error.httpStatus = 401;
                throw error;
            }

            // Re-verify entitlement, same defense-in-depth the movie path
            // uses — catches a subscription expiring inside the token's
            // 10-minute window. Skipped for a genuine free episode.
            if (!isFreeEpisode(season, episode)) {
                const requiredPlan = effectiveRequiredPlan(movie);
                await assertUserCanPlay(requiredPlan, payload);
            }

            const seasonDoc = (movie.seasons || []).find(s => s.seasonNumber === Number(season));
            const episodeDoc = seasonDoc?.episodes?.find(e => e.episodeNumber === Number(episode));
            if (!episodeDoc) {
                return res.status(404).json({ success: false, message: 'Episode not found' });
            }

            const sourceUrl = sanitizeUrl(episodeDoc.video?.embedUrl || episodeDoc.video?.archiveUrl);
            if (!sourceUrl) {
                return res.status(400).json({ success: false, message: 'Missing video URL for this episode' });
            }

            const result = await resolveUrlForDelivery(sourceUrl, episodeDoc.video?.provider, 'mp4');
            return res.json(result);
        }

        const { requiredPlan, tokenPayload } = requirePlaybackAuthIfNeeded(movie, req);
        await assertUserCanPlay(requiredPlan, tokenPayload);

        const sourceUrl = await resolveMovieSourceUrl(movie);
        if (!sourceUrl) {
            return res.status(400).json({
                success: false,
                message: 'Missing video URL for this movie'
            });
        }

        const result = await resolveUrlForDelivery(sourceUrl, movie.video?.provider, movie.video?.format);
        return res.json(result);
    } catch (error) {
        const httpStatus = error.httpStatus || 500;
        return res.status(httpStatus).json({
            success: false,
            code: error.code,
            message: error.message || 'Failed to resolve video URL'
        });
    }
});

/**
 * Extract direct video URL from Streamtape
 * POST /api/video/extract
 * Body: { url: "https://streamtape.com/e/xxxxx" }
 */
router.post('/extract', protect, async (req, res) => {
    // Block free plan users
    if (!req.user || req.user.subscription?.plan === 'free' || !req.user.hasActiveSubscription()) {
        return res.status(403).json({
            success: false,
            code: 'SUBSCRIPTION_REQUIRED',
            message: 'A paid subscription is required to watch videos',
            redirectUrl: '/subscription.html'
        });
    }
    setCorsHeaders(req, res);
    
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ 
                success: false, 
                message: 'URL is required' 
            });
        }

        // Detect provider
        if (url.includes('streamtape')) {
            const result = await extractStreamtape(url);
            return res.json(result);
        } else if (url.includes('doodstream') || url.includes('dood.')) {
            const result = await extractDoodstream(url);
            return res.json(result);
        } else if (url.includes('filemoon')) {
            const result = await extractFilemoon(url);
            return res.json(result);
        } else {
            // Return original URL for unknown providers
            return res.json({ 
                success: true, 
                directUrl: url,
                provider: 'unknown'
            });
        }
    } catch (error) {
        console.error('Video extraction error:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to extract video URL',
            fallbackEmbed: req.body.url
        });
    }
});

/**
 * Extract direct URL from Streamtape
 */
async function extractStreamtape(embedUrl) {
    try {
        // Convert embed URL to normal URL for better extraction
        let pageUrl = embedUrl;
        if (embedUrl.includes('/e/')) {
            pageUrl = embedUrl.replace('/e/', '/v/');
        }
        
        // Fetch the page
        const response = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Referer': 'https://streamtape.com/'
            },
            timeout: 10000
        });

        const html = response.data;
        
        // Method 1: Look for the robotlink token
        // Streamtape uses an obfuscated URL construction
        // The video URL is typically: https://streamtape.com/get_video?id=XXX&expires=XXX&ip=XXX&token=XXX
        
        // Find the token/link construction in the HTML
        // Pattern: document.getElementById('robotlink').innerHTML = 
        const robotLinkMatch = html.match(/id\s*=\s*['"]robotlink['"][^>]*>([^<]+)/i);
        const tokenMatch = html.match(/token\s*=\s*['"]([^'"]+)['"]/i) || 
                          html.match(/&token=([a-zA-Z0-9_-]+)/i);
        
        // Method 2: Look for direct video source
        const videoSrcMatch = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi);
        
        // Method 3: Extract from JavaScript
        // Look for: ('|get_video|...) pattern
        const jsMatch = html.match(/\('([^']+)'\)\.split\('\|'\)/);
        
        // Method 4: Look for the actual streaming URL construction
        // Streamtape builds URL like: //streamtape.com/get_video?id=...&expires=...&ip=...&token=...&stream=1
        const streamMatch = html.match(/\/\/[a-z0-9]+\.streamtape\.[a-z]+\/get_video\?[^"'<>\s]+/i);
        
        if (streamMatch) {
            let directUrl = streamMatch[0];
            if (!directUrl.startsWith('http')) {
                directUrl = 'https:' + directUrl;
            }
            return {
                success: true,
                directUrl: directUrl,
                provider: 'streamtape',
                quality: 'auto'
            };
        }

        // Method 5: Try to find the norobotlink which contains the URL minus token
        const noRobotMatch = html.match(/id\s*=\s*['"]norobotlink['"][^>]*>/i);
        const substringMatch = html.match(/substring\((\d+)\)/);
        
        if (robotLinkMatch && tokenMatch) {
            // Reconstruct the URL
            let baseUrl = robotLinkMatch[1].trim();
            if (!baseUrl.startsWith('http')) {
                baseUrl = 'https:' + baseUrl;
            }
            // Add token
            const separator = baseUrl.includes('?') ? '&' : '?';
            const directUrl = `${baseUrl}${separator}token=${tokenMatch[1]}&stream=1`;
            
            return {
                success: true,
                directUrl: directUrl,
                provider: 'streamtape',
                quality: 'auto'
            };
        }
        
        // If direct extraction fails, try alternate method
        // Look for: document.getElementById('ideoolink').innerHTML
        const altMatch = html.match(/getElementById\(['"]([^'"]+)['"]\)\.innerHTML\s*=\s*['"]([^'"]+)['"]\s*\+\s*\(['"]([^'"]+)['"]\)/);
        
        if (videoSrcMatch && videoSrcMatch.length > 0) {
            // Filter out ad URLs and get the actual video
            const videoUrl = videoSrcMatch.find(url => 
                url.includes('get_video') || 
                url.includes('.mp4') && !url.includes('ad')
            );
            
            if (videoUrl) {
                return {
                    success: true,
                    directUrl: videoUrl,
                    provider: 'streamtape',
                    quality: 'auto'
                };
            }
        }

        // Fallback: return embed URL for iframe
        return {
            success: false,
            message: 'Could not extract direct URL',
            fallbackEmbed: embedUrl,
            provider: 'streamtape'
        };

    } catch (error) {
        console.error('Streamtape extraction error:', error.message);
        return {
            success: false,
            message: error.message,
            fallbackEmbed: embedUrl,
            provider: 'streamtape'
        };
    }
}

/**
 * Extract direct URL from Doodstream
 */
async function extractDoodstream(embedUrl) {
    try {
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': embedUrl
            },
            timeout: 10000
        });

        const html = response.data;
        
        // Doodstream has a pass_md5 endpoint
        const md5Match = html.match(/\/pass_md5\/[^'"]+/);
        
        if (md5Match) {
            const md5Url = `https://dood.to${md5Match[0]}`;
            
            // Fetch the token
            const tokenResponse = await axios.get(md5Url, {
                headers: {
                    'Referer': embedUrl,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            // Generate random string for the URL
            const randomStr = Array(10).fill(0).map(() => 
                'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
                    .charAt(Math.floor(Math.random() * 62))
            ).join('');
            
            const directUrl = `${tokenResponse.data}${randomStr}?token=${md5Match[0].split('/').pop()}&expiry=${Date.now()}`;
            
            return {
                success: true,
                directUrl: directUrl,
                provider: 'doodstream',
                quality: 'auto'
            };
        }

        return {
            success: false,
            fallbackEmbed: embedUrl,
            provider: 'doodstream'
        };

    } catch (error) {
        console.error('Doodstream extraction error:', error.message);
        return {
            success: false,
            fallbackEmbed: embedUrl,
            provider: 'doodstream'
        };
    }
}

/**
 * Extract direct URL from Filemoon
 */
async function extractFilemoon(embedUrl) {
    try {
        const response = await axios.get(embedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': embedUrl
            },
            timeout: 10000
        });

        const html = response.data;
        
        // Look for HLS source
        const hlsMatch = html.match(/file\s*:\s*["']([^"']+\.m3u8[^"']*)/i);
        
        if (hlsMatch) {
            return {
                success: true,
                directUrl: hlsMatch[1],
                provider: 'filemoon',
                type: 'hls',
                quality: 'auto'
            };
        }

        // Look for MP4 source
        const mp4Match = html.match(/file\s*:\s*["']([^"']+\.mp4[^"']*)/i);
        
        if (mp4Match) {
            return {
                success: true,
                directUrl: mp4Match[1],
                provider: 'filemoon',
                type: 'mp4',
                quality: 'auto'
            };
        }

        return {
            success: false,
            fallbackEmbed: embedUrl,
            provider: 'filemoon'
        };

    } catch (error) {
        console.error('Filemoon extraction error:', error.message);
        return {
            success: false,
            fallbackEmbed: embedUrl,
            provider: 'filemoon'
        };
    }
}

/**
 * Proxy video stream (for CORS issues)
 * GET /api/video/proxy?url=...
 */
router.get('/proxy', async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).send('URL required');
        }

        // Get range header for video seeking
        const range = req.headers.range;
        
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://streamtape.com/',
                ...(range && { Range: range })
            },
            timeout: 30000
        });

        // Forward headers
        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }
        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }
        if (response.headers['content-range']) {
            res.setHeader('Content-Range', response.headers['content-range']);
        }
        if (response.headers['accept-ranges']) {
            res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
        }

        res.status(response.status);
        response.data.pipe(res);

    } catch (error) {
        console.error('Video proxy error:', error.message);
        res.status(500).send('Proxy error');
    }
});

/**
 * Simple video proxy - streams video directly without transcoding
 * GET /api/video/stream-proxy?url=...
 * This works for MKV and other formats by proxying the bytes through
 */
router.get('/stream-proxy', async (req, res) => {
    setCorsHeaders(req, res);
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL required' });
    }

    let decodedUrl = decodeURIComponent(url);

    // Guard: prevent double-proxy (URL is itself a stream-proxy URL)
    if (decodedUrl.includes('/api/video/stream-proxy') || decodedUrl.includes('/stream-proxy?url=')) {
        const innerMatch = decodedUrl.match(/[?&]url=(.+)$/);
        if (innerMatch) {
            decodedUrl = decodeURIComponent(innerMatch[1]);
            console.warn('🎬 Double-proxy detected, unwrapping to:', decodedUrl.substring(0, 100));
        } else {
            return res.status(400).json({ success: false, message: 'Invalid proxy URL' });
        }
    }

    // Encode spaces for HTTP requests
    const fetchUrl = decodedUrl.replace(/ /g, '%20');
    console.log('🎬 Proxying video:', decodedUrl.substring(0, 100) + '...', '| incoming Range:', req.headers.range || '(none)');

    try {
        const range = req.headers.range;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Encoding': 'identity',
        };
        
        // Add appropriate Referer for restricted CDNs
        const urlLower = fetchUrl.toLowerCase();
        if (urlLower.includes('b-cdn.net')) {
            // BunnyCDN hotlink protection allows no-referer (direct access) but blocks wrong-referer.
            // Don't set Referer/Origin — this makes the request look like direct browser navigation.
        } else if (urlLower.includes('pearlpix.xyz') || urlLower.includes('jimmy.pearlpix.xyz')) {
            headers['Referer'] = 'https://pearlpix.net/';
            headers['Origin'] = 'https://pearlpix.net';
        }
        
        // "bytes=0-" (open-ended, from the very start) is what browsers send
        // as their first request for a <video> element — but forwarding it
        // upstream as-is causes some CDNs (confirmed with this app's b-cdn.net
        // host, on large files) to hang for the full file's worth of range
        // computation before responding at all. A plain unranged GET gets an
        // instant 200 with the same bytes, streamed the same way — and
        // Accept-Ranges: bytes is still set below, so seeking (bounded
        // ranges) still works for every request after this first one.
        const isOpenEndedFromStart = range && /^bytes=0-$/i.test(range.trim());
        if (range && !isOpenEndedFromStart) {
            headers['Range'] = range;
        }

        const upstreamStart = Date.now();
        const response = await axios({
            method: 'GET',
            url: fetchUrl,
            responseType: 'stream',
            headers,
            // Hosts that ignore Range (see the 200-vs-206 handling below) make
            // us receive-and-discard everything before the requested offset
            // ourselves — on a late-file resume that can be most of a
            // multi-GB file, so this needs more headroom than a normal
            // range-respecting request would.
            timeout: 120000,
            maxRedirects: 5,
            validateStatus: () => true
        });
        console.log('🎬 Upstream responded:', response.status, `(${Date.now() - upstreamStart}ms)`, '| forwarded Range:', headers['Range'] || '(none)');

        if (response.status >= 400) {
            console.error('🎬 Upstream error:', response.status, 'for URL:', fetchUrl.substring(0, 100));
            return res.status(response.status).json({ success: false, message: 'Video unavailable', status: response.status });
        }

        // Determine content type - use video/mp4 even for MKV (browser will try to play)
        const contentType = response.headers['content-type'] || 'video/mp4';
        res.setHeader('Content-Type', contentType);

        // Some hosts (confirmed: pearlpix.xyz — advertises Accept-Ranges but
        // silently ignores the Range header and returns the whole file with
        // 200) don't actually honor range requests. A resumable download
        // client asking to continue from a byte offset and getting a full
        // 200 response back instead of 206 treats that mismatch as a failed
        // resume — this is the "network error after pause/resume" users hit
        // on the 74% of the catalog hosted there. Emulate a real 206 by
        // discarding bytes ourselves up to the requested start.
        const requestedRangeMatch = headers['Range'] && headers['Range'].match(/^bytes=(\d+)-(\d*)$/i);
        if (requestedRangeMatch && response.status === 200) {
            const start = parseInt(requestedRangeMatch[1], 10);
            const endStr = requestedRangeMatch[2];
            const totalSize = parseInt(response.headers['content-length'], 10) || null;
            const end = endStr ? parseInt(endStr, 10) : (totalSize ? totalSize - 1 : null);

            console.warn('🎬 Upstream ignored Range header — emulating partial content locally', { start, end, totalSize, url: fetchUrl.substring(0, 100) });

            res.status(206);
            if (totalSize) {
                res.setHeader('Content-Range', `bytes ${start}-${end != null ? end : ''}/${totalSize}`);
            }
            if (end != null) {
                res.setHeader('Content-Length', String(end - start + 1));
            }
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
            if (req.query.download) {
                const filename = String(req.query.download).replace(/[^a-zA-Z0-9._\- ]/g, '') || 'movie.mp4';
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            }

            let bytesSeen = 0;
            let bytesSent = 0;
            const wantedLength = end != null ? (end - start + 1) : Infinity;

            response.data.on('data', (chunk) => {
                if (bytesSent >= wantedLength) return; // already satisfied — draining until destroy() takes effect
                const chunkStart = bytesSeen;
                bytesSeen += chunk.length;
                if (bytesSeen <= start) return; // entirely before the wanted window

                const sliceStart = Math.max(0, start - chunkStart);
                let sliceEnd = chunk.length;
                if (end != null) {
                    sliceEnd = Math.min(chunk.length, sliceStart + (wantedLength - bytesSent));
                }
                if (sliceStart >= sliceEnd) return;

                const slice = chunk.subarray(sliceStart, sliceEnd);
                bytesSent += slice.length;
                res.write(slice);

                if (bytesSent >= wantedLength) {
                    res.end();
                    try { response.data.destroy(); } catch (e) {}
                }
            });
            response.data.on('end', () => { if (!res.writableEnded) res.end(); });
            response.data.on('error', () => { if (!res.writableEnded) res.end(); });
            req.on('close', () => { try { response.data.destroy(); } catch (e) {} });
            return;
        }

        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }
        if (response.headers['content-range']) {
            res.setHeader('Content-Range', response.headers['content-range']);
        }

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

        // When ?download=filename is set, force browser to save instead of play
        if (req.query.download) {
            const filename = String(req.query.download).replace(/[^a-zA-Z0-9._\- ]/g, '') || 'movie.mp4';
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }

        res.status(response.status);
        response.data.pipe(res);

        // Handle client disconnect
        req.on('close', () => {
            console.log('🎬 Client disconnected from proxy');
            response.data.destroy();
        });

    } catch (error) {
        console.error('🎬 Stream proxy error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Proxy error: ' + error.message });
        }
    }
});

/**
 * Remux MKV to MP4 on-the-fly for browser playback
 * GET /api/video-proxy/remux?url=...
 * This converts MKV container to MP4 without re-encoding (very fast)
 */
router.get('/remux', async (req, res) => {
    setCorsHeaders(req, res);
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL required' });
    }

    // Decode the URL, then re-encode spaces for FFmpeg compatibility
    let decodedUrl = decodeURIComponent(url);
    // FFmpeg needs spaces encoded as %20, not literal spaces
    const ffmpegUrl = decodedUrl.replace(/ /g, '%20');
    console.log('🎬 Remuxing video:', decodedUrl.substring(0, 100) + '...');

    let ffmpegProcess = null;
    let isEnded = false;

    try {
        // Set response headers for streaming video
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

        // Create FFmpeg command to remux MKV -> MP4
        // -c copy means no transcoding, just container change (very fast)
        // -movflags frag_keyframe+empty_moov+faststart enables streaming without full download
        ffmpegProcess = ffmpeg(ffmpegUrl)
            .inputOptions([
                '-reconnect', '1',
                '-reconnect_streamed', '1', 
                '-reconnect_delay_max', '5',
                '-timeout', '30000000',  // 30 second timeout in microseconds
                '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ])
            .outputOptions([
                '-c:v', 'copy',           // Copy video codec (no transcoding)
                '-c:a', 'aac',            // Convert audio to AAC for browser compatibility
                '-b:a', '192k',           // Audio bitrate
                '-movflags', 'frag_keyframe+empty_moov+faststart', // Enable streaming
                '-f', 'mp4'               // Output format
            ])
            .on('start', (cmd) => {
                console.log('🎬 FFmpeg started:', cmd.substring(0, 300));
            })
            .on('progress', (progress) => {
                if (progress.timemark) {
                    console.log('🎬 FFmpeg progress:', progress.timemark);
                }
            })
            .on('error', (err, stdout, stderr) => {
                console.error('🎬 FFmpeg error:', err.message);
                console.error('🎬 FFmpeg stderr:', stderr ? stderr.substring(0, 500) : 'none');
                isEnded = true;
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Remux failed: ' + err.message });
                } else {
                    res.end();
                }
            })
            .on('end', () => {
                console.log('🎬 FFmpeg finished successfully');
                isEnded = true;
            });

        // Pipe the output to response
        ffmpegProcess.pipe(res, { end: true });

        // Handle client disconnect
        req.on('close', () => {
            if (!isEnded) {
                console.log('🎬 Client disconnected, killing FFmpeg');
                if (ffmpegProcess) {
                    ffmpegProcess.kill('SIGKILL');
                }
            }
        });

    } catch (error) {
        console.error('Remux error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Remux error: ' + error.message });
        }
    }
});

/**
 * Get info about a video file (codecs, duration, etc.)
 * GET /api/video-proxy/probe?url=...
 */
router.get('/probe', async (req, res) => {
    setCorsHeaders(req, res);
    
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, message: 'URL required' });
    }

    const decodedUrl = decodeURIComponent(url);

    try {
        ffmpeg.ffprobe(decodedUrl, (err, metadata) => {
            if (err) {
                console.error('Probe error:', err.message);
                return res.status(500).json({ success: false, message: 'Probe failed: ' + err.message });
            }

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

            res.json({
                success: true,
                data: {
                    format: metadata.format.format_name,
                    duration: metadata.format.duration,
                    size: metadata.format.size,
                    bitrate: metadata.format.bit_rate,
                    video: videoStream ? {
                        codec: videoStream.codec_name,
                        width: videoStream.width,
                        height: videoStream.height,
                        fps: videoStream.r_frame_rate
                    } : null,
                    audio: audioStream ? {
                        codec: audioStream.codec_name,
                        channels: audioStream.channels,
                        sampleRate: audioStream.sample_rate
                    } : null,
                    // Recommend remux if MKV or incompatible audio
                    needsRemux: metadata.format.format_name?.includes('matroska') || 
                               (audioStream && !['aac', 'mp3'].includes(audioStream.codec_name))
                }
            });
        });
    } catch (error) {
        console.error('Probe error:', error.message);
        res.status(500).json({ success: false, message: 'Probe error: ' + error.message });
    }
});

module.exports = router;
