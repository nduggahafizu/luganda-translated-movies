const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const gcsService = require('../services/googleCloudStorage');
const LugandaMovie = require('../models/LugandaMovie');
const auth = require('../middleware/auth');

// Configure multer for file uploads (temporary storage)
const upload = multer({
    dest: 'uploads/temp/',
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB max file size
    },
    fileFilter: (req, file, cb) => {
        // Accept video files only
        const allowedTypes = /mp4|mkv|avi|mov|webm|flv/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'));
        }
    }
});

// Configure multer for image uploads
const imageUpload = multer({
    dest: 'uploads/temp/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Configure multer for subtitle uploads
const subtitleUpload = multer({
    dest: 'uploads/temp/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /srt|vtt|ass|ssa/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only subtitle files are allowed!'));
        }
    }
});

/**
 * @route   POST /api/upload/movie
 * @desc    Upload a movie file to Google Cloud Storage
 * @access  Private (Admin only)
 */
router.post('/movie', auth, upload.single('movie'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { movieId, quality = 'hd', type = 'original' } = req.body;

        if (!movieId) {
            // Clean up temp file
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Movie ID is required' });
        }

        // Find the movie in database
        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Generate GCS path
        const fileExtension = path.extname(req.file.originalname);
        const gcsPath = `movies/${movieId}/${type}-${quality}${fileExtension}`;

        console.log(`Uploading movie to GCS: ${gcsPath}`);

        // Upload to Google Cloud Storage
        const uploadResult = await gcsService.uploadMovie(
            req.file.path,
            gcsPath,
            {
                contentType: req.file.mimetype,
                originalName: req.file.originalname,
                custom: {
                    movieId: movieId,
                    quality: quality,
                    type: type,
                    uploadedBy: req.user.id
                }
            }
        );

        // Update movie record in database
        movie.hosting = {
            provider: 'gcs',
            bucketName: uploadResult.bucketName,
            url: uploadResult.publicUrl,
            streamUrl: gcsPath // Store path for generating signed URLs
        };

        if (type === 'original') {
            movie.video.originalVideoPath = gcsPath;
        } else if (type === 'luganda') {
            movie.video.lugandaVideoPath = gcsPath;
        }

        movie.video.quality = quality;
        movie.video.size = uploadResult.size;
        movie.video.format = fileExtension.replace('.', '');

        await movie.save();

        // Clean up temp file
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            message: 'Movie uploaded successfully',
            data: {
                movieId: movie._id,
                gcsPath: gcsPath,
                size: uploadResult.size,
                quality: quality,
                type: type
            }
        });

    } catch (error) {
        console.error('Error uploading movie:', error);
        
        // Clean up temp file on error
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting temp file:', unlinkError);
            }
        }

        res.status(500).json({
            error: 'Failed to upload movie',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/upload/poster
 * @desc    Upload a movie poster to Google Cloud Storage
 * @access  Private (Admin only)
 */
router.post('/poster', auth, imageUpload.single('poster'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { movieId } = req.body;

        if (!movieId) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Movie ID is required' });
        }

        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ error: 'Movie not found' });
        }

        const fileExtension = path.extname(req.file.originalname);
        const gcsPath = `posters/${movieId}${fileExtension}`;

        const uploadResult = await gcsService.uploadMovie(
            req.file.path,
            gcsPath,
            {
                contentType: req.file.mimetype,
                originalName: req.file.originalname
            }
        );

        // Make poster public (posters can be public)
        const publicUrl = await gcsService.makePublic(gcsPath);

        movie.poster = publicUrl;
        await movie.save();

        await fs.unlink(req.file.path);

        res.json({
            success: true,
            message: 'Poster uploaded successfully',
            data: {
                movieId: movie._id,
                posterUrl: publicUrl
            }
        });

    } catch (error) {
        console.error('Error uploading poster:', error);
        
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting temp file:', unlinkError);
            }
        }

        res.status(500).json({
            error: 'Failed to upload poster',
            message: error.message
        });
    }
});

/**
 * @route   POST /api/upload/subtitle
 * @desc    Upload subtitle file to Google Cloud Storage
 * @access  Private (Admin only)
 */
router.post('/subtitle', auth, subtitleUpload.single('subtitle'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { movieId, language = 'english' } = req.body;

        if (!movieId) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Movie ID is required' });
        }

        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            await fs.unlink(req.file.path);
            return res.status(404).json({ error: 'Movie not found' });
        }

        const fileExtension = path.extname(req.file.originalname);
        const gcsPath = `subtitles/${movieId}/${language}${fileExtension}`;

        const uploadResult = await gcsService.uploadMovie(
            req.file.path,
            gcsPath,
            {
                contentType: 'text/plain',
                originalName: req.file.originalname
            }
        );

        // Make subtitle public
        const publicUrl = await gcsService.makePublic(gcsPath);

        // Add or update subtitle in movie record
        const existingSubtitleIndex = movie.subtitles.findIndex(
            sub => sub.language.toLowerCase() === language.toLowerCase()
        );

        if (existingSubtitleIndex >= 0) {
            movie.subtitles[existingSubtitleIndex].url = publicUrl;
            movie.subtitles[existingSubtitleIndex].format = fileExtension.replace('.', '');
        } else {
            movie.subtitles.push({
                language: language.charAt(0).toUpperCase() + language.slice(1),
                url: publicUrl,
                format: fileExtension.replace('.', '')
            });
        }

        await movie.save();
        await fs.unlink(req.file.path);

        res.json({
            success: true,
            message: 'Subtitle uploaded successfully',
            data: {
                movieId: movie._id,
                language: language,
                subtitleUrl: publicUrl
            }
        });

    } catch (error) {
        console.error('Error uploading subtitle:', error);
        
        if (req.file && req.file.path) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting temp file:', unlinkError);
            }
        }

        res.status(500).json({
            error: 'Failed to upload subtitle',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/upload/stream/:movieId
 * @desc    Get signed streaming URL for a movie
 * @access  Private (Authenticated users)
 */
router.get('/stream/:movieId', auth, async (req, res) => {
    try {
        const { movieId } = req.params;
        const { quality = 'hd', type = 'original' } = req.query;

        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Check if user has access based on subscription
        // TODO: Implement subscription check
        // For now, allow all authenticated users

        // Get the appropriate video path
        let videoPath;
        if (type === 'luganda' && movie.video.lugandaVideoPath) {
            videoPath = movie.video.lugandaVideoPath;
        } else {
            videoPath = movie.video.originalVideoPath;
        }

        if (!videoPath) {
            return res.status(404).json({ error: 'Video file not found' });
        }

        // Generate signed URL (valid for 4 hours)
        const signedUrl = await gcsService.generateSignedUrl(videoPath, 14400);

        // Get subtitle URLs if available
        const subtitleUrls = movie.subtitles.map(sub => ({
            language: sub.language,
            url: sub.url,
            format: sub.format
        }));

        // Increment view count
        await movie.incrementViews();

        res.json({
            success: true,
            data: {
                movieId: movie._id,
                title: movie.originalTitle,
                streamUrl: signedUrl,
                expiresIn: 14400, // 4 hours in seconds
                expiresAt: new Date(Date.now() + 14400000).toISOString(),
                quality: quality,
                type: type,
                subtitles: subtitleUrls,
                poster: movie.poster
            }
        });

    } catch (error) {
        console.error('Error generating stream URL:', error);
        res.status(500).json({
            error: 'Failed to generate stream URL',
            message: error.message
        });
    }
});

/**
 * @route   DELETE /api/upload/:movieId
 * @desc    Delete movie files from Google Cloud Storage
 * @access  Private (Admin only)
 */
router.delete('/:movieId', auth, async (req, res) => {
    try {
        const { movieId } = req.params;

        const movie = await LugandaMovie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        // Collect all files to delete
        const filesToDelete = [];

        if (movie.video.originalVideoPath) {
            filesToDelete.push(movie.video.originalVideoPath);
        }
        if (movie.video.lugandaVideoPath) {
            filesToDelete.push(movie.video.lugandaVideoPath);
        }

        // Delete files from GCS
        const deleteResults = await gcsService.deleteMultipleFiles(filesToDelete);

        // Update movie record
        movie.hosting = {
            provider: 'local',
            url: null,
            streamUrl: null
        };
        movie.video.originalVideoPath = null;
        movie.video.lugandaVideoPath = null;

        await movie.save();

        res.json({
            success: true,
            message: 'Movie files deleted successfully',
            data: {
                deleted: deleteResults.success,
                failed: deleteResults.failed
            }
        });

    } catch (error) {
        console.error('Error deleting movie files:', error);
        res.status(500).json({
            error: 'Failed to delete movie files',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/upload/stats
 * @desc    Get storage usage statistics
 * @access  Private (Admin only)
 */
router.get('/stats', auth, async (req, res) => {
    try {
        const stats = await gcsService.getStorageStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Error getting storage stats:', error);
        res.status(500).json({
            error: 'Failed to get storage stats',
            message: error.message
        });
    }
});

/**
 * @route   GET /api/upload/list
 * @desc    List all files in storage
 * @access  Private (Admin only)
 */
router.get('/list', auth, async (req, res) => {
    try {
        const { prefix = '', maxResults = 100 } = req.query;

        const files = await gcsService.listFiles(prefix, parseInt(maxResults));

        res.json({
            success: true,
            count: files.length,
            data: files
        });

    } catch (error) {
        console.error('Error listing files:', error);
        res.status(500).json({
            error: 'Failed to list files',
            message: error.message
        });
    }
});

module.exports = router;
