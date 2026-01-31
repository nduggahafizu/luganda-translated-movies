const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Munowatch Integration API
 * Fetches video data from Munowatch for playback
 * CDN Base: http://munotech2.b-cdn.net/simo/
 */

// CORS middleware
const setCorsHeaders = (req, res) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://watch.unrulymovies.com',
        'https://unrulymovies.com',
        'https://www.unrulymovies.com',
        'http://localhost:3000',
        'http://localhost:5000',
        'http://localhost:8000'
    ];
    
    if (origin && (allowedOrigins.includes(origin) || origin.includes('netlify.app') || origin.includes('unrulymovies.com'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Handle OPTIONS preflight
router.options('*', (req, res) => {
    setCorsHeaders(req, res);
    res.sendStatus(200);
});

// Munowatch API base
const MUNOWATCH_API = 'https://munowatch.org/api';
const MUNOWATCH_SITE = 'https://munowatch.com';
const MUNOWATCH_CDN = 'http://munotech2.b-cdn.net/simo';

/**
 * Get dashboard data from Munowatch (no auth required)
 * GET /api/munowatch/dashboard
 */
router.get('/dashboard', async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const response = await axios.get(\/dashboard/v2/1, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 15000
        });
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        console.error('Munowatch dashboard error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch Munowatch dashboard',
            error: error.message
        });
    }
});

/**
 * Scrape video page to extract video URL
 * POST /api/munowatch/extract
 * Body: { videoId: "xxx" } or { url: "https://munowatch.com/twolekede?v=xxx" }
 */
router.post('/extract', async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const { videoId, url } = req.body;
        
        let pageUrl;
        if (url) {
            pageUrl = url;
        } else if (videoId) {
            pageUrl = \/twolekede?v=\;
        } else {
            return res.status(400).json({
                success: false,
                message: 'videoId or url is required'
            });
        }
        
        // Fetch the video page
        const response = await axios.get(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': MUNOWATCH_SITE
            },
            timeout: 15000
        });
        
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Extract video URL from the page
        // Munowatch uses base64 encoded URLs in the HTML
        let videoUrl = null;
        let movieTitle = '';
        let moviePoster = '';
        
        // Try to find video source
        // Method 1: Look for Base64 encoded video URLs
        const base64Match = html.match(/atob\s*\(\s*['"]([A-Za-z0-9+/=]+)['"]\s*\)/g);
        if (base64Match) {
            for (const match of base64Match) {
                const b64 = match.match(/['"]([A-Za-z0-9+/=]+)['"]/);
                if (b64 && b64[1]) {
                    try {
                        const decoded = Buffer.from(b64[1], 'base64').toString('utf-8');
                        if (decoded.includes('.mp4') || decoded.includes('b-cdn.net')) {
                            videoUrl = decoded;
                            break;
                        }
                    } catch (e) {}
                }
            }
        }
        
        // Method 2: Look for direct CDN URLs
        if (!videoUrl) {
            const cdnMatch = html.match(/https?:\/\/munotech2\.b-cdn\.net\/[^\s"'<>]+\.mp4/i);
            if (cdnMatch) {
                videoUrl = cdnMatch[0];
            }
        }
        
        // Method 3: Look for video source in script tags
        if (!videoUrl) {
            const srcMatch = html.match(/src\s*[:=]\s*['"]([^'"]+\.mp4[^'"]*)['"]/i);
            if (srcMatch) {
                videoUrl = srcMatch[1];
            }
        }
        
        // Extract title
        const titleTag = title.text();
        if (titleTag) {
            movieTitle = titleTag.replace(' - Munowatch', '').trim();
        }
        
        // Extract poster
        const ogImage = meta[property="og:image"].attr('content');
        if (ogImage) {
            moviePoster = ogImage;
        }
        
        if (videoUrl) {
            // Ensure URL is absolute
            if (!videoUrl.startsWith('http')) {
                videoUrl = 'http:' + videoUrl;
            }
            
            res.json({
                success: true,
                videoUrl,
                title: movieTitle,
                poster: moviePoster,
                source: 'munowatch'
            });
        } else {
            res.json({
                success: false,
                message: 'Could not extract video URL',
                title: movieTitle,
                poster: moviePoster
            });
        }
    } catch (error) {
        console.error('Munowatch extract error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to extract video',
            error: error.message
        });
    }
});

/**
 * Stream video from Munowatch CDN (proxy to avoid CORS)
 * GET /api/munowatch/stream?url=...
 */
router.get('/stream', async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).send('URL required');
        }
        
        // Only allow Munowatch CDN URLs
        if (!url.includes('munotech2.b-cdn.net') && !url.includes('munowatch')) {
            return res.status(400).json({
                success: false,
                message: 'Only Munowatch CDN URLs are allowed'
            });
        }
        
        const range = req.headers.range;
        
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Referer': 'https://munowatch.com/',
                ...(range && { Range: range })
            },
            timeout: 30000,
            maxRedirects: 5,
            validateStatus: () => true
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
        
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.status(response.status);
        response.data.pipe(res);
    } catch (error) {
        console.error('Munowatch stream error:', error.message);
        res.status(500).send('Stream error');
    }
});

/**
 * Get list of known working movies from Munowatch
 * GET /api/munowatch/movies
 */
router.get('/movies', async (req, res) => {
    setCorsHeaders(req, res);
    
    // Known working movies with direct CDN URLs
    const knownMovies = [
        {
            id: 'the-internship',
            title: 'The Internship',
            vjFolder: 'simo22',
            filename: 'The.Internship.mp4',
            videoUrl: \/simo22/The.Internship.mp4,
            poster: 'https://image.tmdb.org/t/p/w500/mhzKnHWEQPTG8BByurCUXqB5HKS.jpg',
            year: 2013,
            description: 'Two salesmen whose careers have been torpedoed by the digital age find their way into a coveted internship at Google.'
        }
        // Add more known movies here as they are discovered
    ];
    
    res.json({
        success: true,
        count: knownMovies.length,
        data: knownMovies
    });
});

module.exports = router;
