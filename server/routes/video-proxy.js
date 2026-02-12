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

function sanitizeUrl(input) {
    if (!input || typeof input !== 'string') return null;
    return input.trim().replace(/\s+/g, '');
}

function isArchiveUrl(url) {
    const u = sanitizeUrl(url);
    if (!u) return false;
    return u.includes('archive.org/') || /ia\d+\.us\.archive\.org/i.test(u);
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

function requirePlaybackAuthIfNeeded(movie, req) {
    const requiredPlan = movie?.requiredPlan || 'free';
    if (requiredPlan === 'free') return { requiredPlan, tokenPayload: null };

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

    return { requiredPlan, tokenPayload: payload };
}

async function assertUserCanPlay(requiredPlan, tokenPayload) {
    if (requiredPlan === 'free') return;

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

    if (!user.canAccessContent(requiredPlan)) {
        const error = new Error(`This content requires a ${requiredPlan} plan or higher`);
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
router.post('/playback-token', protect, async (req, res) => {
    setCorsHeaders(req, res);

    try {
        const movieId = req.body?.movieId;
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

        const requiredPlan = movie.requiredPlan || 'free';
        if (!req.user.canAccessContent(requiredPlan)) {
            return res.status(403).json({
                success: false,
                message: `This content requires a ${requiredPlan} subscription or higher`,
                requiredPlan,
                currentPlan: req.user.subscription?.plan
            });
        }

        const token = jwt.sign(
            {
                type: 'playback',
                uid: req.user.id,
                movieId: String(movieId)
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

    const decodedUrl = decodeURIComponent(url);
    console.log('🎬 Remuxing video:', decodedUrl.substring(0, 100) + '...');

    try {
        // Set response headers for streaming video
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

        // Create FFmpeg command to remux MKV -> MP4
        // -c copy means no transcoding, just container change (very fast)
        // -movflags frag_keyframe+empty_moov+faststart enables streaming without full download
        const ffmpegProcess = ffmpeg(decodedUrl)
            .inputOptions([
                '-headers', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\nReferer: https://archive.org/\r\n'
            ])
            .outputOptions([
                '-c:v', 'copy',           // Copy video codec (no transcoding)
                '-c:a', 'aac',            // Convert audio to AAC for browser compatibility
                '-b:a', '192k',           // Audio bitrate
                '-movflags', 'frag_keyframe+empty_moov+faststart', // Enable streaming
                '-f', 'mp4'               // Output format
            ])
            .on('start', (cmd) => {
                console.log('🎬 FFmpeg started:', cmd.substring(0, 200));
            })
            .on('error', (err, stdout, stderr) => {
                console.error('🎬 FFmpeg error:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Remux failed: ' + err.message });
                }
            })
            .on('end', () => {
                console.log('🎬 FFmpeg finished');
            });

        // Pipe the output to response
        ffmpegProcess.pipe(res, { end: true });

        // Handle client disconnect
        req.on('close', () => {
            console.log('🎬 Client disconnected, killing FFmpeg');
            ffmpegProcess.kill('SIGKILL');
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
