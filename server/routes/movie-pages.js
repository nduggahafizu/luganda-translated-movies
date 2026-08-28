const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

// /movie/:slug used to render its own standalone server-side movie page
// (with its own embedded Video.js player, ad setup, watchlist, etc.) —
// a second, parallel implementation of the real player.html. It's gone;
// this just resolves the slug/id to the real document and sends visitors
// to the one real player, the same way the series branch below already did.
router.get('/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(slug);

        let movie = await LugandaMovie.findOne({ slug, contentType: { $ne: 'series' } });
        if (!movie && isObjectId) {
            movie = await LugandaMovie.findById(slug);
        }
        if (movie) {
            // player.html's data endpoint only accepts a raw ObjectId, not a slug.
            return res.redirect(302, `/player.html?id=${encodeURIComponent(String(movie._id))}`);
        }

        const series = await LugandaMovie.findOne(
            isObjectId ? { contentType: 'series', $or: [{ slug }, { _id: slug }] } : { contentType: 'series', slug }
        );
        if (series) {
            const seriesId = series.slug || String(series._id);
            return res.redirect(302, `/series-player.html?id=${encodeURIComponent(seriesId)}`);
        }

        return res.status(404).send(`<!DOCTYPE html><html><head><title>Not Found</title><meta http-equiv="refresh" content="3;url=/movies.html"></head><body style="background:#0a0a0a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center"><div><h1 style="color:#4ade80">Movie Not Found</h1><p>Redirecting to movies...</p></div></body></html>`);
    } catch (err) {
        console.error('[movie-pages]', err.message);
        res.status(500).send('<h1>Server error</h1>');
    }
});

module.exports = router;
