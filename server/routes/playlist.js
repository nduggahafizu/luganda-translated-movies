const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// In-memory storage for playlists (replace with database in production)
// Structure: { userId: { playlistId: { name, movies: [], createdAt, updatedAt } } }
const playlistStore = new Map();

/**
 * @route   POST /api/playlist/create
 * @desc    Create a new playlist
 * @access  Private or Public with session
 */
router.post('/create', async (req, res) => {
    try {
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Playlist name is required'
            });
        }
        
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
        // Initialize user playlists if not exists
        if (!playlistStore.has(userId)) {
            playlistStore.set(userId, new Map());
        }
        
        const userPlaylists = playlistStore.get(userId);
        const playlistId = `playlist_${Date.now()}`;
        
        userPlaylists.set(playlistId, {
            id: playlistId,
            name: name,
            movies: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        res.json({
            success: true,
            message: 'Playlist created successfully',
            playlist: userPlaylists.get(playlistId)
        });
        
    } catch (error) {
        console.error('Error creating playlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create playlist'
        });
    }
});

/**
 * @route   POST /api/playlist/:playlistId/add
 * @desc    Add movie to playlist
 * @access  Private or Public with session
 */
router.post('/:playlistId/add', async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { movieId } = req.body;
        
        if (!movieId) {
            return res.status(400).json({
                success: false,
                error: 'Movie ID is required'
            });
        }
        
        const userId = req.user?.id || req.sessionID || 'anonymous';
        const userPlaylists = playlistStore.get(userId);
        
        if (!userPlaylists || !userPlaylists.has(playlistId)) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        
        const playlist = userPlaylists.get(playlistId);
        
        // Check if movie already in playlist
        if (playlist.movies.includes(movieId)) {
            return res.status(400).json({
                success: false,
                error: 'Movie already in playlist'
            });
        }
        
        playlist.movies.push(movieId);
        playlist.updatedAt = new Date().toISOString();
        
        res.json({
            success: true,
            message: 'Movie added to playlist',
            playlist: playlist
        });
        
    } catch (error) {
        console.error('Error adding to playlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add movie to playlist'
        });
    }
});

/**
 * @route   DELETE /api/playlist/:playlistId/remove/:movieId
 * @desc    Remove movie from playlist
 * @access  Private or Public with session
 */
router.delete('/:playlistId/remove/:movieId', async (req, res) => {
    try {
        const { playlistId, movieId } = req.params;
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
        const userPlaylists = playlistStore.get(userId);
        
        if (!userPlaylists || !userPlaylists.has(playlistId)) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        
        const playlist = userPlaylists.get(playlistId);
        playlist.movies = playlist.movies.filter(id => id !== movieId);
        playlist.updatedAt = new Date().toISOString();
        
        res.json({
            success: true,
            message: 'Movie removed from playlist',
            playlist: playlist
        });
        
    } catch (error) {
        console.error('Error removing from playlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove movie from playlist'
        });
    }
});

/**
 * @route   GET /api/playlist/user/all
 * @desc    Get all playlists for current user
 * @access  Private or Public with session
 */
router.get('/user/all', async (req, res) => {
    try {
        const userId = req.user?.id || req.sessionID || 'anonymous';
        const userPlaylists = playlistStore.get(userId);
        
        if (!userPlaylists) {
            return res.json({
                success: true,
                playlists: []
            });
        }
        
        // Convert Map to Array
        const playlists = Array.from(userPlaylists.values());
        
        res.json({
            success: true,
            playlists: playlists
        });
        
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch playlists'
        });
    }
});

/**
 * @route   GET /api/playlist/:playlistId
 * @desc    Get playlist details with movies
 * @access  Private or Public with session
 */
router.get('/:playlistId', async (req, res) => {
    try {
        const { playlistId } = req.params;
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
        const userPlaylists = playlistStore.get(userId);
        
        if (!userPlaylists || !userPlaylists.has(playlistId)) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        
        const playlist = userPlaylists.get(playlistId);
        
        // Fetch movie details for all movies in playlist
        const LugandaMovie = require('../models/LugandaMovie');
        const movies = await LugandaMovie.find({
            _id: { $in: playlist.movies }
        }).select('-__v');
        
        res.json({
            success: true,
            playlist: {
                ...playlist,
                movieDetails: movies
            }
        });
        
    } catch (error) {
        console.error('Error fetching playlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch playlist'
        });
    }
});

/**
 * @route   DELETE /api/playlist/:playlistId
 * @desc    Delete a playlist
 * @access  Private or Public with session
 */
router.delete('/:playlistId', async (req, res) => {
    try {
        const { playlistId } = req.params;
        const userId = req.user?.id || req.sessionID || 'anonymous';
        
        const userPlaylists = playlistStore.get(userId);
        
        if (!userPlaylists || !userPlaylists.has(playlistId)) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        
        userPlaylists.delete(playlistId);
        
        res.json({
            success: true,
            message: 'Playlist deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete playlist'
        });
    }
});

/**
 * @route   PUT /api/playlist/:playlistId
 * @desc    Update playlist name
 * @access  Private or Public with session
 */
router.put('/:playlistId', async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { name } = req.body;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Playlist name is required'
            });
        }
        
        const userId = req.user?.id || req.sessionID || 'anonymous';
        const userPlaylists = playlistStore.get(userId);
        
        if (!userPlaylists || !userPlaylists.has(playlistId)) {
            return res.status(404).json({
                success: false,
                error: 'Playlist not found'
            });
        }
        
        const playlist = userPlaylists.get(playlistId);
        playlist.name = name;
        playlist.updatedAt = new Date().toISOString();
        
        res.json({
            success: true,
            message: 'Playlist updated successfully',
            playlist: playlist
        });
        
    } catch (error) {
        console.error('Error updating playlist:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update playlist'
        });
    }
});

module.exports = router;
