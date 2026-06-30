/**
 * Stream & Download routes
 * Serves signed, time-limited URLs so raw video sources never appear in DevTools.
 *
 * Perf note: the resolved video URL is encrypted directly into the token at
 * issue time (one DB lookup). /play and /download then decrypt and redirect
 * with NO database call — keeping the actual video-serving hot path fast.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const LugandaMovie = require('../models/LugandaMovie');
const { protect } = require('../middleware/auth');
const { extractStreamtape, extractDoodstream, extractFilemoon } = require('./video-proxy').extractors;

// Mirrors player.html's isDirectVideo() heuristic — true if the URL is a
// directly-playable file/CDN link, false if it's an HTML embed page that
// needs server-side extraction first (Streamtape, Doodstream, Filemoon, etc.)
function isDirectVideoUrl(url) {
    const u = (url || '').toLowerCase();
    const extensions = ['.mp4', '.webm', '.mkv', '.m3u8', '.m4v'];
    return extensions.some(ext => u.includes(ext)) ||
           u.includes('archive.org') ||
           u.includes('cloudflare') ||
           u.includes('r2.dev') ||
           u.includes('b-cdn.net') ||
           u.includes('bunnycdn') ||
           u.includes('pearlpix.xyz') ||
           u.includes('munotech.b-cdn.net') ||
           u.includes('jimmy.pearlpix.xyz');
}

// Resolve an embed-page URL to a direct playable URL server-side.
// Falls back to the original URL if extraction fails or provider is unknown.
async function resolveDirectUrl(url) {
    if (isDirectVideoUrl(url)) return url;
    try {
        let result;
        if (url.includes('streamtape')) result = await extractStreamtape(url);
        else if (url.includes('doodstream') || url.includes('dood.')) result = await extractDoodstream(url);
        else if (url.includes('filemoon')) result = await extractFilemoon(url);
        if (result?.success && result.directUrl) return result.directUrl;
    } catch (e) {
        // fall through to original URL
    }
    return url;
}

const STREAM_SECRET = process.env.STREAM_TOKEN_SECRET || process.env.JWT_SECRET || 'unruly-stream-secret';
const ENC_KEY = crypto.createHash('sha256').update(STREAM_SECRET).digest(); // 32 bytes for AES-256

const TOKEN_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Encrypt a JSON payload (with embedded url + exp) into a compact base64url token
function encryptToken(obj) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
    const json = JSON.stringify({ ...obj, exp: Date.now() + TOKEN_TTL_MS });
    const enc = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64url');
}

function decryptToken(token) {
    try {
        const buf = Buffer.from(token, 'base64url');
        const iv = buf.subarray(0, 12);
        const tag = buf.subarray(12, 28);
        const enc = buf.subarray(28);
        const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
        decipher.setAuthTag(tag);
        const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
        const obj = JSON.parse(dec);
        if (Date.now() > obj.exp) return null;
        return obj;
    } catch {
        return null;
    }
}

function redirectForUrl(res, movieId, rawUrl) {
    const isEmbedPage = /archive\.org\/embed\//i.test(rawUrl) || /archive\.org\/details\//i.test(rawUrl);
    if (isEmbedPage) {
        return res.redirect(302, `/api/video/stream/luganda/${movieId}`);
    }
    if (rawUrl.toLowerCase().includes('.mkv')) {
        return res.redirect(302, `/api/video/stream-proxy?url=${encodeURIComponent(rawUrl)}`);
    }
    res.redirect(302, rawUrl);
}

// GET /api/stream/token/:movieId
// One DB lookup happens here; the resolved URL is encrypted into the token.
router.get('/token/:movieId', protect, async (req, res) => {
    try {
        const movie = await LugandaMovie.findById(req.params.movieId).lean();
        if (!movie) return res.status(404).json({ status: 'error', message: 'Movie not found' });

        const rawUrl = movie.video?.originalVideoPath || movie.video?.embedUrl || movie.embedUrl;
        if (!rawUrl) return res.status(404).json({ status: 'error', message: 'Stream not available' });

        // Resolve embed pages (Streamtape etc.) to a direct URL now, once, so
        // /play never has to do extraction work on the hot path.
        const resolvedUrl = await resolveDirectUrl(rawUrl);

        const title = (movie.originalTitle || movie.lugandaTitle || 'movie').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
        const token = encryptToken({ mid: req.params.movieId, u: resolvedUrl, t: title });
        res.json({ status: 'success', token, format: movie.video?.format || null });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Could not generate stream token' });
    }
});

// GET /api/stream/play/:movieId?token=XXX — no DB call, just decrypt + redirect
router.get('/play/:movieId', (req, res) => {
    const data = decryptToken(req.query.token);
    if (!data || data.mid !== req.params.movieId) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    redirectForUrl(res, req.params.movieId, data.u);
});

// GET /api/stream/download/:movieId?token=XXX — no DB call, just decrypt + redirect
router.get('/download/:movieId', (req, res) => {
    const data = decryptToken(req.query.token);
    if (!data || data.mid !== req.params.movieId) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    const titleName = data.t || 'movie';
    res.setHeader('Content-Disposition', `attachment; filename="${titleName}.mp4"`);
    redirectForUrl(res, req.params.movieId, data.u);
});

// ===== Series episode streaming =====
// Series episodes live inside LugandaMovie docs (contentType: 'series'),
// in seasons[].episodes[]. Same hide-the-URL approach, same no-DB-on-redirect perf pattern.

function findEpisode(seriesDoc, season, episode) {
    const seasonDoc = seriesDoc.seasons?.find(s => s.seasonNumber === Number(season));
    if (!seasonDoc) return null;
    return seasonDoc.episodes?.find(e => e.episodeNumber === Number(episode)) || null;
}

// GET /api/stream/episode-token/:seriesId/:season/:episode
router.get('/episode-token/:seriesId/:season/:episode', protect, async (req, res) => {
    try {
        const { seriesId, season, episode } = req.params;
        const series = await LugandaMovie.findById(seriesId).select('seasons').lean();
        if (!series) return res.status(404).json({ status: 'error', message: 'Series not found' });

        const ep = findEpisode(series, season, episode);
        if (!ep) return res.status(404).json({ status: 'error', message: 'Episode not found' });

        const rawUrl = ep.video?.embedUrl || ep.video?.archiveUrl || '';
        if (!rawUrl) return res.status(404).json({ status: 'error', message: 'Episode video not available' });

        // Resolve embed pages (Streamtape etc.) to a direct URL now, once, so
        // episode-play never has to do extraction work on the hot path.
        const resolvedUrl = await resolveDirectUrl(rawUrl);
        const isDirectVideo = isDirectVideoUrl(resolvedUrl) || /\.(mp4|mkv|webm|avi|mov)(\?|$)/i.test(resolvedUrl);

        const token = encryptToken({ sid: seriesId, s: season, e: episode, u: resolvedUrl });
        res.json({
            status: 'success',
            token,
            provider: ep.video?.provider || null,
            isDirectVideo
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Could not generate stream token' });
    }
});

// GET /api/stream/episode-play/:seriesId/:season/:episode?token=XXX — no DB call
router.get('/episode-play/:seriesId/:season/:episode', (req, res) => {
    const data = decryptToken(req.query.token);
    if (!data || data.sid !== req.params.seriesId || String(data.s) !== req.params.season || String(data.e) !== req.params.episode) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    if (data.u.toLowerCase().includes('.mkv')) {
        return res.redirect(302, `/api/video/stream-proxy?url=${encodeURIComponent(data.u)}`);
    }
    res.redirect(302, data.u);
});

// GET /api/stream/episode-download/:seriesId/:season/:episode?token=XXX — no DB call
router.get('/episode-download/:seriesId/:season/:episode', (req, res) => {
    const data = decryptToken(req.query.token);
    if (!data || data.sid !== req.params.seriesId || String(data.s) !== req.params.season || String(data.e) !== req.params.episode) {
        return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="episode.mp4"`);
    res.redirect(302, data.u);
});

module.exports = router;
