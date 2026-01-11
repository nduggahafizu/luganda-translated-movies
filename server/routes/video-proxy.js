const express = require('express');
const router = express.Router();
const axios = require('axios');

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
        'https://translatedmovies.netlify.app',
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
};

// Handle OPTIONS preflight
router.options('*', (req, res) => {
    setCorsHeaders(req, res);
    res.sendStatus(200);
});

/**
 * Extract direct video URL from Streamtape
 * POST /api/video/extract
 * Body: { url: "https://streamtape.com/e/xxxxx" }
 */
router.post('/extract', async (req, res) => {
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

module.exports = router;
