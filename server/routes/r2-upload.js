const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');

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
        }
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

/**
 * Get presigned upload URL (for large files)
 * POST /api/r2/presign
 * Body: { filename: "movie.mp4", contentType: "video/mp4" }
 */
router.post('/presign', async (req, res) => {
    setCorsHeaders(req, res);
    
    try {
        const r2 = getR2Client();
        if (!r2) {
            return res.status(400).json({
                success: false,
                message: 'Cloudflare R2 is not configured'
            });
        }

        const { filename, contentType } = req.body;
        
        if (!filename) {
            return res.status(400).json({
                success: false,
                message: 'Filename is required'
            });
        }

        // Generate unique key
        const key = `movies/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
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
router.post('/upload', upload.single('video'), async (req, res) => {
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
router.delete('/delete/*', async (req, res) => {
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
