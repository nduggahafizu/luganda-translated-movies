const express = require('express');
const router = express.Router();
const {
    S3Client, PutObjectCommand, DeleteObjectCommand,
    CreateMultipartUploadCommand, UploadPartCommand, ListPartsCommand,
    CompleteMultipartUploadCommand, AbortMultipartUploadCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

// Upload and delete let the caller write to (and remove from) the R2 bucket.
// Left open, anyone on the internet could dump files into the bucket — storage
// billed to this account, and whatever they upload served from our domain —
// or delete the catalogue. So every mutating route is admin-only. (OPTIONS and
// the read-only /status stay open: preflight can't carry a token, and status
// returns nothing but a boolean.)
const adminGuard = [protect, adminOnly];

/**
 * Cloudflare R2 Upload Routes
 * For uploading movies directly to R2 (no ads, free bandwidth)
 */

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB max
});

// Initialize R2 client
const getR2Client = () => {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
        return null;
    }
    
    return new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        },
        // AWS SDK v3 (>=3.729) bakes a CRC32 checksum into presigned PUT URLs.
        // R2 rejects that (the signed value is for an empty body, not the real
        // file), so browser uploads fail with a checksum mismatch. WHEN_REQUIRED
        // keeps checksums off unless an operation actually needs them.
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED'
    });
};

// CORS middleware
const setCorsHeaders = (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

router.options('*', (req, res) => {
    setCorsHeaders(req, res);
    res.sendStatus(200);
});

/**
 * Check R2 configuration status
 * GET /api/r2/status
 */
router.get('/status', (req, res) => {
    setCorsHeaders(req, res);
    
    const configured = !!(
        process.env.R2_ACCOUNT_ID &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        process.env.R2_BUCKET_NAME
    );
    
    res.json({
        success: true,
        configured,
        publicUrl: process.env.R2_PUBLIC_URL || null,
        message: configured 
            ? 'Cloudflare R2 is configured and ready' 
            : 'Cloudflare R2 is not configured. See CLOUDFLARE_R2_SETUP.md'
    });
});

// Where an uploaded file goes in the bucket: movies/<time>-<name> by default,
// or a caller-supplied folder (the series manager sends "series/<slug>").
// Sanitised so it can't escape the bucket.
function makeUploadKey(filename, folder) {
    let prefix = 'movies';
    if (folder && typeof folder === 'string') {
        const clean = folder.toLowerCase()
            .replace(/\\/g, '/')
            .replace(/[^a-z0-9/_.-]/g, '')
            .replace(/\.{2,}/g, '')
            .replace(/\/{2,}/g, '/')
            .replace(/^\/+|\/+$/g, '');
        if (clean) prefix = clean;
    }
    return `${prefix}/${Date.now()}-${String(filename).replace(/[^a-zA-Z0-9.-]/g, '_')}`;
}

// Only keys that makeUploadKey could have made (no "..", no odd characters)
function isUploadKey(key) {
    return typeof key === 'string' && key.length <= 512 && !key.includes('..') &&
        /^[a-z0-9_.\/-]+\/\d{10,}-[A-Za-z0-9._-]+$/.test(key);
}

/* ---------------------------------------------------------------------------
 * Split uploads (S3 multipart) — how the admin pages upload videos.
 *
 * One connection from Uganda to R2 reaches only a fraction of the line's
 * upload speed (measured Nov 2026: about 0.5 Mbps on one connection, about
 * 3 Mbps on eight), and a dropped connection meant starting the whole movie
 * again. So the browser (js/r2-upload.js) cuts the file into pieces, sends
 * several at once straight to R2, and re-sends only a piece that fails.
 *
 *   POST /api/r2/multipart/start     { filename, contentType, folder, size }
 *        -> { uploadId, key, publicUrl, partSize, partCount }
 *   POST /api/r2/multipart/sign      { key, uploadId, partNumbers: [1, 2, ...] }
 *        -> { urls: { "1": "https://...", ... } }   (PUT one piece to each)
 *   POST /api/r2/multipart/complete  { key, uploadId, partCount }
 *        -> { publicUrl }   (the pieces are read back from R2, so the browser
 *                            doesn't need to see R2's ETag headers)
 *   POST /api/r2/multipart/abort     { key, uploadId }
 * ------------------------------------------------------------------------- */
const MIN_PART_SIZE = 8 * 1024 * 1024;   // small enough that a failed piece is quick to re-send
const MAX_PARTS = 10000;                 // S3/R2 limit
const SIGN_TTL_SECONDS = 3600;

function partSizeFor(size) {
    const needed = Math.ceil(size / (MAX_PARTS - 100));
    return Math.max(MIN_PART_SIZE, Math.ceil(needed / (1024 * 1024)) * 1024 * 1024);
}

function multipartError(res, error, what) {
    console.error(`R2 multipart ${what} error:`, error);
    res.status(500).json({ success: false, message: `Upload ${what} failed. Please try again.` });
}

router.post('/multipart/start', ...adminGuard, async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const r2 = getR2Client();
        if (!r2) return res.status(400).json({ success: false, message: 'Cloudflare R2 is not configured' });

        const { filename, contentType, folder } = req.body || {};
        const size = Number(req.body && req.body.size);
        if (!filename) return res.status(400).json({ success: false, message: 'Filename is required' });
        if (!Number.isFinite(size) || size <= 0) return res.status(400).json({ success: false, message: 'File size is required' });

        const key = makeUploadKey(filename, folder);
        const out = await r2.send(new CreateMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType || 'video/mp4'
        }));
        const partSize = partSizeFor(size);
        res.json({
            success: true,
            uploadId: out.UploadId,
            key,
            publicUrl: `${process.env.R2_PUBLIC_URL}/${key}`,
            partSize,
            partCount: Math.ceil(size / partSize)
        });
    } catch (error) {
        multipartError(res, error, 'start');
    }
});

router.post('/multipart/sign', ...adminGuard, async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const r2 = getR2Client();
        if (!r2) return res.status(400).json({ success: false, message: 'Cloudflare R2 is not configured' });

        const { key, uploadId, partNumbers } = req.body || {};
        if (!isUploadKey(key) || !uploadId || typeof uploadId !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid upload' });
        }
        const numbers = Array.isArray(partNumbers) ? partNumbers.map(Number) : [];
        if (!numbers.length || numbers.length > 50 ||
            numbers.some(n => !Number.isInteger(n) || n < 1 || n > MAX_PARTS)) {
            return res.status(400).json({ success: false, message: 'Invalid part numbers' });
        }

        const urls = {};
        await Promise.all(numbers.map(async n => {
            urls[n] = await getSignedUrl(r2, new UploadPartCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                PartNumber: n
            }), { expiresIn: SIGN_TTL_SECONDS });
        }));
        res.json({ success: true, urls, expiresIn: SIGN_TTL_SECONDS });
    } catch (error) {
        multipartError(res, error, 'sign');
    }
});

router.post('/multipart/complete', ...adminGuard, async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const r2 = getR2Client();
        if (!r2) return res.status(400).json({ success: false, message: 'Cloudflare R2 is not configured' });

        const { key, uploadId } = req.body || {};
        const partCount = Number(req.body && req.body.partCount);
        if (!isUploadKey(key) || !uploadId || typeof uploadId !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid upload' });
        }

        // Read back every piece R2 has for this upload
        const parts = [];
        let marker;
        for (;;) {
            const page = await r2.send(new ListPartsCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                MaxParts: 1000,
                PartNumberMarker: marker
            }));
            (page.Parts || []).forEach(p => parts.push({ PartNumber: p.PartNumber, ETag: p.ETag }));
            if (!page.IsTruncated) break;
            marker = page.NextPartNumberMarker;
        }
        parts.sort((a, b) => a.PartNumber - b.PartNumber);

        // Every piece must be there, or the video would have holes in it
        if (Number.isInteger(partCount) && partCount > 0) {
            const have = new Set(parts.map(p => p.PartNumber));
            const missing = [];
            for (let n = 1; n <= partCount && missing.length < 20; n++) if (!have.has(n)) missing.push(n);
            if (missing.length) {
                return res.status(409).json({ success: false, code: 'PARTS_MISSING', missing, message: 'Some pieces of the file are missing. Please try again.' });
            }
        }

        await r2.send(new CompleteMultipartUploadCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts }
        }));
        res.json({ success: true, key, publicUrl: `${process.env.R2_PUBLIC_URL}/${key}` });
    } catch (error) {
        multipartError(res, error, 'finish');
    }
});

router.post('/multipart/abort', ...adminGuard, async (req, res) => {
    setCorsHeaders(req, res);
    try {
        const r2 = getR2Client();
        if (!r2) return res.status(400).json({ success: false, message: 'Cloudflare R2 is not configured' });
        const { key, uploadId } = req.body || {};
        if (!isUploadKey(key) || !uploadId || typeof uploadId !== 'string') {
            return res.status(400).json({ success: false, message: 'Invalid upload' });
        }
        await r2.send(new AbortMultipartUploadCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, UploadId: uploadId }));
        res.json({ success: true });
    } catch (error) {
        multipartError(res, error, 'cancel');
    }
});

/**
 * Get presigned upload URL (one PUT of the whole file — kept for older pages;
 * the admin pages now use the split upload above)
 * POST /api/r2/presign
 * Body: { filename: "movie.mp4", contentType: "video/mp4" }
 */
router.post('/presign', ...adminGuard, async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const r2 = getR2Client();
        if (!r2) {
            return res.status(400).json({
                success: false,
                message: 'Cloudflare R2 is not configured'
            });
        }

        const { filename, contentType, folder } = req.body;

        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Filename is required'
            });
        }

        const key = makeUploadKey(filename, folder);

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType || 'video/mp4'
        });

        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        res.json({
            success: true,
            uploadUrl,
            publicUrl,
            key,
            expiresIn: 3600
        });

    } catch (error) {
        console.error('Presign error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate upload URL'
        });
    }
});

/**
 * Direct upload (for smaller files via admin panel)
 * POST /api/r2/upload
 */
router.post('/upload', ...adminGuard, upload.single('video'), async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const r2 = getR2Client();
        if (!r2) {
            return res.status(400).json({
                success: false,
                message: 'Cloudflare R2 is not configured'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const filename = req.file.originalname;
        const key = `movies/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        });

        await r2.send(command);

        const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            url: publicUrl,
            key
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload video'
        });
    }
});

/**
 * Delete video from R2
 * DELETE /api/r2/delete/:key
 */
router.delete('/delete/*', ...adminGuard, async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const r2 = getR2Client();
        if (!r2) {
            return res.status(400).json({
                success: false,
                message: 'Cloudflare R2 is not configured'
            });
        }

        const key = req.params[0];
        
        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key
        });

        await r2.send(command);

        res.json({
            success: true,
            message: 'Video deleted successfully'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete video'
        });
    }
});

module.exports = router;
