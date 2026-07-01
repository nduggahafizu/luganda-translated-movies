const express = require('express');
const router = express.Router();
const LugandaMovie = require('../models/LugandaMovie');

const SITE_URL = 'https://unrulymovies.com';

// GET /api/sitemap-movies.xml
// Dynamic sitemap of all published movie SSR pages — auto-updates as movies are uploaded
router.get('/', async (req, res) => {
    try {
        const movies = await LugandaMovie.find(
            { contentType: { $ne: 'series' }, status: 'published', slug: { $exists: true, $ne: '' } },
            { slug: 1, updatedAt: 1 }
        ).lean();

        const today = new Date().toISOString().split('T')[0];

        const urls = movies.map(m => {
            const lastmod = m.updatedAt
                ? new Date(m.updatedAt).toISOString().split('T')[0]
                : today;
            return `  <url>
    <loc>${SITE_URL}/movie/${m.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        }).join('\n');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.send(xml);
    } catch (err) {
        console.error('[sitemap-movies]', err.message);
        res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }
});

module.exports = router;
