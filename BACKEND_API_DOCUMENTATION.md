# Luganda Movies Backend API Documentation

Complete API documentation for the Luganda Movies streaming platform backend.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

## Table of Contents
1. [Movies API](#movies-api)
2. [Watch Progress API](#watch-progress-api)
3. [Playlist API](#playlist-api)
4. [Authentication API](#authentication-api)
5. [Payment API](#payment-api)

---

## Movies API

### 1. Fetch Movies with Pagination
**Endpoint:** `GET /api/movies/fetch`

**Description:** Fetch movies with pagination, filtering, and sorting (MyVJ-style)

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 18)
- `category` (string, optional): Filter by genre/category
- `vj` (string, optional): Filter by VJ name
- `quality` (string, optional): Filter by video quality (hd, 4k, sd)
- `search` (string, optional): Search by title or VJ name
- `sort` (string, optional): Sort by (popular, rating, title, latest)

**Example Request:**
```bash
GET /api/movies/fetch?page=1&limit=18&category=action&sort=popular
```

**Response:**
```json
{
  "success": true,
  "movies": [
    {
      "row_id": "movie_id_123",
      "title": "Fast & Furious 9",
      "luganda_title": "Abasirikale ba Mooto 9",
      "slug": "fast-furious-9",
      "vj": "VJ Junior",
      "vj_slug": "vj-junior",
      "tmdb_poster_path": "/poster.jpg",
      "poster_url": "https://image.tmdb.org/t/p/w500/poster.jpg",
      "trailer": "https://trailer-url.mp4",
      "height": 1080,
      "quality": "hd",
      "watch_percentage": 0,
      "categories": "Action, Thriller",
      "rating": 8.5,
      "year": 2021,
      "duration": 143,
      "views": 15420
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 18,
    "total": 150,
    "pages": 9,
    "hasMore": true
  }
}
```

### 2. Get Single Movie
**Endpoint:** `GET /api/movies/:id`

**Description:** Get detailed information about a specific movie

**Example Request:**
```bash
GET /api/movies/movie_id_123
```

**Response:**
```json
{
  "success": true,
  "movie": {
    "_id": "movie_id_123",
    "originalTitle": "Fast & Furious 9",
    "lugandaTitle": "Abasirikale ba Mooto 9",
    "slug": "fast-furious-9",
    "vjName": "VJ Junior",
    "poster": "https://image.tmdb.org/t/p/w500/poster.jpg",
    "video": {
      "url": "https://video-url.mp4",
      "quality": "hd",
      "resolution": { "width": 1920, "height": 1080 },
      "trailerUrl": "https://trailer-url.mp4"
    },
    "rating": {
      "translationRating": 8.5,
      "originalRating": 5.2
    },
    "genres": ["Action", "Thriller"],
    "year": 2021,
    "duration": 143,
    "views": 15421,
    "description": "Movie description..."
  }
}
```

### 3. Get Trending Movies
**Endpoint:** `GET /api/movies/trending/now`

**Description:** Get trending movies (highest views in last 7 days)

**Query Parameters:**
- `limit` (number, optional): Number of movies to return (default: 10)

**Example Request:**
```bash
GET /api/movies/trending/now?limit=10
```

**Response:**
```json
{
  "success": true,
  "movies": [...]
}
```

---

## Watch Progress API

### 1. Update Watch Progress
**Endpoint:** `POST /api/watch-progress/update`

**Description:** Update watch progress for a movie

**Request Body:**
```json
{
  "movieId": "movie_id_123",
  "currentTime": 1234.56,
  "duration": 8580
}
```

**Response:**
```json
{
  "success": true,
  "message": "Watch progress updated",
  "progress": {
    "movieId": "movie_id_123",
    "currentTime": 1234.56,
    "duration": 8580,
    "percentage": 14
  }
}
```

### 2. Get Watch Progress for Movie
**Endpoint:** `GET /api/watch-progress/:movieId`

**Description:** Get watch progress for a specific movie

**Example Request:**
```bash
GET /api/watch-progress/movie_id_123
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "currentTime": 1234.56,
    "duration": 8580,
    "percentage": 14,
    "lastWatched": "2025-01-15T10:30:00.000Z"
  }
}
```

### 3. Get All User Progress
**Endpoint:** `GET /api/watch-progress/user/all`

**Description:** Get all watch progress for current user

**Response:**
```json
{
  "success": true,
  "progress": {
    "movie_id_123": {
      "currentTime": 1234.56,
      "duration": 8580,
      "percentage": 14,
      "lastWatched": "2025-01-15T10:30:00.000Z"
    },
    "movie_id_456": {
      "currentTime": 5000,
      "duration": 7200,
      "percentage": 69,
      "lastWatched": "2025-01-14T15:20:00.000Z"
    }
  }
}
```

### 4. Delete Watch Progress
**Endpoint:** `DELETE /api/watch-progress/:movieId`

**Description:** Delete watch progress for a movie

**Example Request:**
```bash
DELETE /api/watch-progress/movie_id_123
```

**Response:**
```json
{
  "success": true,
  "message": "Watch progress deleted"
}
```

---

## Playlist API

### 1. Create Playlist
**Endpoint:** `POST /api/playlist/create`

**Description:** Create a new playlist

**Request Body:**
```json
{
  "name": "My Favorite Action Movies"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Playlist created successfully",
  "playlist": {
    "id": "playlist_1705315200000",
    "name": "My Favorite Action Movies",
    "movies": [],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z"
  }
}
```

### 2. Add Movie to Playlist
**Endpoint:** `POST /api/playlist/:playlistId/add`

**Description:** Add a movie to a playlist

**Request Body:**
```json
{
  "movieId": "movie_id_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Movie added to playlist",
  "playlist": {
    "id": "playlist_1705315200000",
    "name": "My Favorite Action Movies",
    "movies": ["movie_id_123"],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:05:00.000Z"
  }
}
```

### 3. Remove Movie from Playlist
**Endpoint:** `DELETE /api/playlist/:playlistId/remove/:movieId`

**Description:** Remove a movie from a playlist

**Example Request:**
```bash
DELETE /api/playlist/playlist_1705315200000/remove/movie_id_123
```

**Response:**
```json
{
  "success": true,
  "message": "Movie removed from playlist",
  "playlist": {
    "id": "playlist_1705315200000",
    "name": "My Favorite Action Movies",
    "movies": [],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:10:00.000Z"
  }
}
```

### 4. Get All User Playlists
**Endpoint:** `GET /api/playlist/user/all`

**Description:** Get all playlists for current user

**Response:**
```json
{
  "success": true,
  "playlists": [
    {
      "id": "playlist_1705315200000",
      "name": "My Favorite Action Movies",
      "movies": ["movie_id_123", "movie_id_456"],
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:05:00.000Z"
    }
  ]
}
```

### 5. Get Playlist Details
**Endpoint:** `GET /api/playlist/:playlistId`

**Description:** Get playlist details with full movie information

**Example Request:**
```bash
GET /api/playlist/playlist_1705315200000
```

**Response:**
```json
{
  "success": true,
  "playlist": {
    "id": "playlist_1705315200000",
    "name": "My Favorite Action Movies",
    "movies": ["movie_id_123", "movie_id_456"],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:05:00.000Z",
    "movieDetails": [
      {
        "_id": "movie_id_123",
        "originalTitle": "Fast & Furious 9",
        "poster": "https://image.tmdb.org/t/p/w500/poster.jpg",
        ...
      }
    ]
  }
}
```

### 6. Update Playlist Name
**Endpoint:** `PUT /api/playlist/:playlistId`

**Description:** Update playlist name

**Request Body:**
```json
{
  "name": "Best Action Movies Ever"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Playlist updated successfully",
  "playlist": {
    "id": "playlist_1705315200000",
    "name": "Best Action Movies Ever",
    "movies": ["movie_id_123"],
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:15:00.000Z"
  }
}
```

### 7. Delete Playlist
**Endpoint:** `DELETE /api/playlist/:playlistId`

**Description:** Delete a playlist

**Example Request:**
```bash
DELETE /api/playlist/playlist_1705315200000
```

**Response:**
```json
{
  "success": true,
  "message": "Playlist deleted successfully"
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing or invalid parameters)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Window:** 15 minutes
- **Max Requests:** 100 per window per IP

When rate limit is exceeded:
```json
{
  "message": "Too many requests from this IP, please try again later."
}
```

---

## Session Management

Watch progress and playlists use session-based storage:
- Sessions last for 30 days
- Session cookie is automatically managed
- No authentication required for basic features
- Authenticated users get persistent storage

---

## Installation & Setup

1. **Install Dependencies:**
```bash
cd server
npm install
```

2. **Environment Variables:**
Create `.env` file in server directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/luganda-movies
NODE_ENV=development
SESSION_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Start Server:**
```bash
# Development
npm run dev

# Production
npm start
```

4. **Test Endpoints:**
```bash
# Health check
curl http://localhost:5000/api/health

# Fetch movies
curl http://localhost:5000/api/movies/fetch?page=1&limit=10
```

---

## Frontend Integration Example

```javascript
// Fetch movies with pagination
async function fetchMovies(page = 1, category = null) {
    const params = new URLSearchParams({
        page: page,
        limit: 18,
        sort: 'latest'
    });
    
    if (category) {
        params.append('category', category);
    }
    
    const response = await fetch(`http://localhost:5000/api/movies/fetch?${params}`);
    const data = await response.json();
    
    return data;
}

// Update watch progress
async function updateWatchProgress(movieId, currentTime, duration) {
    const response = await fetch('http://localhost:5000/api/watch-progress/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({
            movieId,
            currentTime,
            duration
        })
    });
    
    return await response.json();
}

// Create playlist
async function createPlaylist(name) {
    const response = await fetch('http://localhost:5000/api/playlist/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ name })
    });
    
    return await response.json();
}
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Movie IDs are MongoDB ObjectIds
- Playlist IDs are generated timestamps
- Session-based storage is temporary (use database for production)
- CORS is enabled for configured client URLs
- All responses include `success` boolean field

---

## Support

For issues or questions:
- GitHub: https://github.com/nduggahafizu/luganda-translated-movies
- Email: support@lugandamovies.com
