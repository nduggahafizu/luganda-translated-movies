/**
 * Stream & Download routes
 * Serves signed, time-limited URLs so raw video sources never appear in DevTools.
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const LugandaMovie = require('../models/LugandaMovie');
const { protect } = require('../middleware/auth');

const STREAM_SECRET = process.env.STREAM_TOKEN_SECRET || process.env.JWT_SECRET || 'unruly-stream-secret';

// Sign a payload into a short-lived base64url token
function signToken(payload) {
    const exp = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
    const data = `${payload}:${exp}`;
    const sig = crypto.createHmac('sha256', STREAM_SECRET).update(data).digest('hex');
    return Buffer.from(`${data}:${sig}`).toString('base64url');
}

function verifyToken(token) {
    try {
        const decoded = Buffer.from(token, 'base64url').toString();
        const lastColon = decoded.lastIndexOf(':');
        const secondLastColon = decoded.lastIndexOf(':', lastColon - 1);
        const sig = decoded.slice(lastColon + 1);
        const exp = parseInt(decoded.slice(secondLastColon + 1, lastColon));
        const data = decoded.slice(0, lastColon);

        if (Date.now() > exp) return null;
        const expected = crypto.createHmac('sha256', STREAM_SECRET).update(data).digest('hex');
        if (!crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))) return null;

        return data.slice(0, secondLastColon); // returns movieId:userId
    } catch {
        return null;
    }
}

// GET /api/stream/token/:movieId
// Returns a short-lived signed token the player uses to fetch the actual stream URL
router.get('/token/:movieId', protect, async (req, res) => {
    try {
        const movie = await LugandaMovie.findById(req.params.movieId).select('+video.embedUrl +video.originalVideoPath +embedUrl');
        if (!movie) return res.status(404).json({ status: 'error', message: 'Movie not found' });

        const token = signToken(`${req.params.movieId}:${req.user._id}`);
        res.json({ status: 'success', token });
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Could not generate stream token' });
    }
});

// GET /api/stream/play/:movieId?token=XXX
// Validates the token and redirects to the actual stream URL
router.get('/play/:movieId', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(401).json({ status: 'error', message: 'Token required' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });

    const [movieId] = payload.split(':');
    if (movieId !== req.params.movieId) return res.status(403).json({ status: 'error', message: 'Token mismatch' });

    try {
        const movie = await LugandaMovie.findById(movieId)
            .select('video embedUrl');
        if (!movie) return res.status(404).json({ status: 'error', message: 'Movie not found' });

        const rawUrl =
            movie.video?.originalVideoPath ||
            movie.video?.embedUrl ||
            movie.embedUrl;

        if (!rawUrl) return res.status(404).json({ status: 'error', message: 'Stream not available' });

        const isEmbedPage = /archive\.org\/embed\//i.test(rawUrl) ||
                            /archive\.org\/details\//i.test(rawUrl);

        if (isEmbedPage) {
            // Archive.org embed URLs are HTML pages — use the existing video stream proxy
            // which extracts and serves the real video URL
            return res.redirect(302, `/api/video/stream/luganda/${movieId}`);
        }

        // Direct video file — redirect; only our /api/stream/play URL shows in DevTools
        res.redirect(302, rawUrl);
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Stream error' });
    }
});

// GET /api/stream/download/:movieId?token=XXX
// Same as /play but adds Content-Disposition: attachment so browser downloads instead of playing
router.get('/download/:movieId', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(401).json({ status: 'error', message: 'Token required' });

    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ status: 'error', message: 'Invalid or expired token' });

    const [movieId] = payload.split(':');
    if (movieId !== req.params.movieId) return res.status(403).json({ status: 'error', message: 'Token mismatch' });

    try {
        const movie = await LugandaMovie.findById(movieId).select('+video.embedUrl +video.originalVideoPath +embedUrl +originalTitle +lugandaTitle');
        if (!movie) return res.status(404).json({ status: 'error', message: 'Movie not found' });

        const streamUrl =
            movie.video?.originalVideoPath ||
            movie.video?.embedUrl ||
            movie.embedUrl;

        if (!streamUrl) return res.status(404).json({ status: 'error', message: 'Download not available' });

        const title = (movie.originalTitle || movie.lugandaTitle || 'movie').replace(/[^a-zA-Z0-9 _-]/g, '');
        res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
        res.redirect(302, streamUrl);
    } catch (e) {
        res.status(500).json({ status: 'error', message: 'Download error' });
    }
});

module.exports = router;
