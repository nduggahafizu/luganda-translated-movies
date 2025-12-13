# How to Use the Backend Features - Step by Step Guide

This guide shows you exactly how to use the new backend features in your Luganda Movies platform.

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd server
npm install
```

This will install the new `express-session` package.

### Step 2: Set Up Environment Variables

Create or update `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/luganda-movies
NODE_ENV=development
SESSION_SECRET=my-super-secret-key-change-this-in-production
CLIENT_URL=http://localhost:3000
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Step 3: Start MongoDB

Make sure MongoDB is running:

```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or start manually
mongod
```

### Step 4: Start the Backend Server

```bash
cd server
npm run dev
```

You should see:
```
🚀 Server running on port 5000
📍 Environment: development
🌐 API URL: http://localhost:5000
✅ MongoDB Connected Successfully
```

### Step 5: Test the API

Open a new terminal and test:

```bash
# Test health check
curl http://localhost:5000/api/health

# Test movies endpoint
curl http://localhost:5000/api/movies/fetch?page=1&limit=5
```

---

## 📖 Feature 1: Pagination & Filtering (Movies API)

### How It Works

The Movies API lets you fetch movies with pagination, filtering, and sorting - just like MyVJ!

### Basic Usage

**Fetch first page of movies:**
```javascript
// In your frontend JavaScript
async function loadMovies() {
    const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&limit=18');
    const data = await response.json();
    
    console.log('Movies:', data.movies);
    console.log('Pagination:', data.pagination);
    
    // Display movies
    displayMovies(data.movies);
    
    // Check if there are more pages
    if (data.pagination.hasMore) {
        console.log('More movies available!');
    }
}
```

### Advanced Filtering

**Filter by genre:**
```javascript
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&category=action');
```

**Filter by VJ:**
```javascript
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&vj=VJ Junior');
```

**Filter by quality:**
```javascript
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&quality=hd');
```

**Search movies:**
```javascript
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&search=fast furious');
```

**Sort movies:**
```javascript
// Sort by popularity
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&sort=popular');

// Sort by rating
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&sort=rating');

// Sort by title
const response = await fetch('http://localhost:5000/api/movies/fetch?page=1&sort=title');
```

### Infinite Scroll Implementation

```javascript
let currentPage = 1;
let isLoading = false;

// Load more movies when user scrolls to bottom
window.addEventListener('scroll', async () => {
    if (isLoading) return;
    
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    
    // If user is near bottom (within 200px)
    if (scrollPosition >= pageHeight - 200) {
        isLoading = true;
        currentPage++;
        
        const response = await fetch(`http://localhost:5000/api/movies/fetch?page=${currentPage}&limit=18`);
        const data = await response.json();
        
        // Append new movies to existing list
        appendMovies(data.movies);
        
        isLoading = false;
        
        // Stop loading if no more pages
        if (!data.pagination.hasMore) {
            console.log('All movies loaded!');
        }
    }
});
```

### Complete Example

```html
<!-- Add to your HTML -->
<div id="movies-container"></div>
<div id="loading" style="display: none;">Loading...</div>

<script>
let currentPage = 1;
let isLoading = false;

async function loadMovies(page = 1, append = false) {
    if (isLoading) return;
    isLoading = true;
    
    document.getElementById('loading').style.display = 'block';
    
    try {
        const response = await fetch(`http://localhost:5000/api/movies/fetch?page=${page}&limit=18&sort=latest`);
        const data = await response.json();
        
        if (data.success) {
            if (append) {
                appendMovies(data.movies);
            } else {
                displayMovies(data.movies);
            }
            
            // Update pagination info
            console.log(`Page ${data.pagination.page} of ${data.pagination.pages}`);
            
            return data.pagination.hasMore;
        }
    } catch (error) {
        console.error('Error loading movies:', error);
    } finally {
        isLoading = false;
        document.getElementById('loading').style.display = 'none';
    }
}

function displayMovies(movies) {
    const container = document.getElementById('movies-container');
    container.innerHTML = '';
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        container.appendChild(movieCard);
    });
}

function appendMovies(movies) {
    const container = document.getElementById('movies-container');
    
    movies.forEach(movie => {
        const movieCard = createMovieCard(movie);
        container.appendChild(movieCard);
    });
}

function createMovieCard(movie) {
    const div = document.createElement('div');
    div.className = 'movie-card';
    div.innerHTML = `
        <img src="${movie.poster_url}" alt="${movie.title}">
        <h3>${movie.title}</h3>
        <p>VJ: ${movie.vj}</p>
        <p>Rating: ${movie.rating}/10</p>
        <p>Quality: ${movie.quality.toUpperCase()}</p>
    `;
    return div;
}

// Load initial movies
loadMovies(1);

// Infinite scroll
window.addEventListener('scroll', async () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition >= pageHeight - 200) {
        currentPage++;
        const hasMore = await loadMovies(currentPage, true);
        
        if (!hasMore) {
            console.log('No more movies to load');
        }
    }
});
</script>
```

---

## 📖 Feature 2: Watch Progress Tracking

### How It Works

The Watch Progress API saves where users stopped watching, so they can resume later.

### Basic Usage

**Update progress while watching:**
```javascript
// In your video player code
const videoPlayer = document.getElementById('video-player');

// Save progress every 5 seconds
setInterval(async () => {
    const currentTime = videoPlayer.currentTime;
    const duration = videoPlayer.duration;
    
    await fetch('http://localhost:5000/api/watch-progress/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // IMPORTANT: Include cookies for session
        body: JSON.stringify({
            movieId: 'movie_id_123',
            currentTime: currentTime,
            duration: duration
        })
    });
}, 5000); // Every 5 seconds
```

**Get saved progress when loading video:**
```javascript
async function loadVideo(movieId) {
    // Get saved progress
    const response = await fetch(`http://localhost:5000/api/watch-progress/${movieId}`, {
        credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success && data.progress) {
        // Resume from saved position
        const savedTime = data.progress.currentTime;
        const percentage = data.progress.percentage;
        
        console.log(`Resuming from ${percentage}% (${savedTime} seconds)`);
        
        // Set video to saved position
        videoPlayer.currentTime = savedTime;
        
        // Show resume notification
        showNotification(`Resume from ${percentage}%?`);
    }
}
```

### Complete Video Player Example

```html
<video id="video-player" controls>
    <source src="movie.mp4" type="video/mp4">
</video>
<div id="resume-notification" style="display: none;">
    <p>Resume from <span id="resume-percentage"></span>%?</p>
    <button onclick="resumeVideo()">Resume</button>
    <button onclick="startFromBeginning()">Start Over</button>
</div>

<script>
const videoPlayer = document.getElementById('video-player');
const movieId = 'movie_id_123'; // Get from URL or data attribute
let savedProgress = null;

// Load saved progress when page loads
async function init() {
    const response = await fetch(`http://localhost:5000/api/watch-progress/${movieId}`, {
        credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success && data.progress && data.progress.percentage > 5) {
        savedProgress = data.progress;
        
        // Show resume option
        document.getElementById('resume-percentage').textContent = data.progress.percentage;
        document.getElementById('resume-notification').style.display = 'block';
    }
}

function resumeVideo() {
    if (savedProgress) {
        videoPlayer.currentTime = savedProgress.currentTime;
        videoPlayer.play();
        document.getElementById('resume-notification').style.display = 'none';
    }
}

function startFromBeginning() {
    videoPlayer.currentTime = 0;
    videoPlayer.play();
    document.getElementById('resume-notification').style.display = 'none';
}

// Save progress periodically
setInterval(async () => {
    if (!videoPlayer.paused && videoPlayer.currentTime > 0) {
        await fetch('http://localhost:5000/api/watch-progress/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                movieId: movieId,
                currentTime: videoPlayer.currentTime,
                duration: videoPlayer.duration
            })
        });
    }
}, 5000);

// Save progress when user leaves
window.addEventListener('beforeunload', async () => {
    if (videoPlayer.currentTime > 0) {
        await fetch('http://localhost:5000/api/watch-progress/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                movieId: movieId,
                currentTime: videoPlayer.currentTime,
                duration: videoPlayer.duration
            })
        });
    }
});

// Initialize
init();
</script>
```

### Show Progress Bars on Movie Cards

```javascript
// Get all user's watch progress
async function loadWatchProgress() {
    const response = await fetch('http://localhost:5000/api/watch-progress/user/all', {
        credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
        // Add progress bars to movie cards
        Object.keys(data.progress).forEach(movieId => {
            const progress = data.progress[movieId];
            const movieCard = document.querySelector(`[data-movie-id="${movieId}"]`);
            
            if (movieCard && progress.percentage > 5) {
                // Add progress bar
                const progressBar = document.createElement('div');
                progressBar.className = 'watch-progress';
                progressBar.innerHTML = `
                    <div class="watch-progress-fill" style="width: ${progress.percentage}%"></div>
                `;
                movieCard.appendChild(progressBar);
            }
        });
    }
}

// Call when loading movies
loadWatchProgress();
```

---

## 📖 Feature 3: Playlist Management

### How It Works

Users can create playlists and add their favorite movies to them.

### Basic Usage

**Create a playlist:**
```javascript
async function createPlaylist(name) {
    const response = await fetch('http://localhost:5000/api/playlist/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name })
    });
    
    const data = await response.json();
    
    if (data.success) {
        console.log('Playlist created:', data.playlist);
        return data.playlist.id;
    }
}
```

**Add movie to playlist:**
```javascript
async function addToPlaylist(playlistId, movieId) {
    const response = await fetch(`http://localhost:5000/api/playlist/${playlistId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId: movieId })
    });
    
    const data = await response.json();
    
    if (data.success) {
        console.log('Movie added to playlist!');
        showNotification('Added to playlist!');
    }
}
```

**Get all playlists:**
```javascript
async function loadPlaylists() {
    const response = await fetch('http://localhost:5000/api/playlist/user/all', {
        credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
        console.log('User playlists:', data.playlists);
        displayPlaylists(data.playlists);
    }
}
```

### Complete Playlist UI Example

```html
<!-- Playlist Management UI -->
<div id="playlist-section">
    <h2>My Playlists</h2>
    
    <!-- Create Playlist Form -->
    <div class="create-playlist">
        <input type="text" id="playlist-name" placeholder="Playlist name">
        <button onclick="createNewPlaylist()">Create Playlist</button>
    </div>
    
    <!-- Playlists List -->
    <div id="playlists-container"></div>
</div>

<!-- Add to Playlist Button (on movie cards) -->
<button class="add-to-playlist-btn" data-movie-id="movie_123" onclick="showPlaylistModal(this)">
    + Add to Playlist
</button>

<!-- Playlist Modal -->
<div id="playlist-modal" style="display: none;">
    <div class="modal-content">
        <h3>Add to Playlist</h3>
        <div id="playlist-options"></div>
        <button onclick="closePlaylistModal()">Cancel</button>
    </div>
</div>

<script>
// Create new playlist
async function createNewPlaylist() {
    const name = document.getElementById('playlist-name').value;
    
    if (!name) {
        alert('Please enter a playlist name');
        return;
    }
    
    const response = await fetch('http://localhost:5000/api/playlist/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: name })
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Playlist created!');
        document.getElementById('playlist-name').value = '';
        loadPlaylists(); // Refresh list
    }
}

// Load all playlists
async function loadPlaylists() {
    const response = await fetch('http://localhost:5000/api/playlist/user/all', {
        credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
        displayPlaylists(data.playlists);
    }
}

function displayPlaylists(playlists) {
    const container = document.getElementById('playlists-container');
    container.innerHTML = '';
    
    playlists.forEach(playlist => {
        const div = document.createElement('div');
        div.className = 'playlist-item';
        div.innerHTML = `
            <h3>${playlist.name}</h3>
            <p>${playlist.movies.length} movies</p>
            <button onclick="viewPlaylist('${playlist.id}')">View</button>
            <button onclick="deletePlaylist('${playlist.id}')">Delete</button>
        `;
        container.appendChild(div);
    });
}

// Show modal to add movie to playlist
async function showPlaylistModal(button) {
    const movieId = button.getAttribute('data-movie-id');
    
    // Load playlists
    const response = await fetch('http://localhost:5000/api/playlist/user/all', {
        credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
        const optionsContainer = document.getElementById('playlist-options');
        optionsContainer.innerHTML = '';
        
        data.playlists.forEach(playlist => {
            const button = document.createElement('button');
            button.textContent = playlist.name;
            button.onclick = () => addMovieToPlaylist(playlist.id, movieId);
            optionsContainer.appendChild(button);
        });
        
        document.getElementById('playlist-modal').style.display = 'block';
    }
}

async function addMovieToPlaylist(playlistId, movieId) {
    const response = await fetch(`http://localhost:5000/api/playlist/${playlistId}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ movieId: movieId })
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Movie added to playlist!');
        closePlaylistModal();
    } else {
        alert(data.error || 'Failed to add movie');
    }
}

function closePlaylistModal() {
    document.getElementById('playlist-modal').style.display = 'none';
}

// View playlist details
async function viewPlaylist(playlistId) {
    const response = await fetch(`http://localhost:5000/api/playlist/${playlistId}`, {
        credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
        console.log('Playlist:', data.playlist);
        console.log('Movies:', data.playlist.movieDetails);
        // Display playlist movies
    }
}

// Delete playlist
async function deletePlaylist(playlistId) {
    if (!confirm('Delete this playlist?')) return;
    
    const response = await fetch(`http://localhost:5000/api/playlist/${playlistId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    
    const data = await response.json();
    
    if (data.success) {
        alert('Playlist deleted!');
        loadPlaylists(); // Refresh list
    }
}

// Load playlists on page load
loadPlaylists();
</script>
```

---

## 🔧 Troubleshooting

### Issue: "CORS Error"

**Solution:** Make sure you're including `credentials: 'include'` in all fetch requests:

```javascript
fetch('http://localhost:5000/api/...', {
    credentials: 'include'  // This is required for sessions!
})
```

### Issue: "Session not persisting"

**Solution:** Check that:
1. Backend is running
2. You're using `credentials: 'include'` in fetch
3. Browser allows cookies from localhost

### Issue: "Cannot connect to MongoDB"

**Solution:**
```bash
# Start MongoDB
net start MongoDB

# Or check if it's running
mongo --version
```

### Issue: "Port 5000 already in use"

**Solution:** Change port in `.env`:
```env
PORT=5001
```

---

## 📝 Summary

You now have:
1. ✅ **Pagination & Filtering** - Load movies page by page with filters
2. ✅ **Watch Progress** - Save and resume video playback
3. ✅ **Playlists** - Create and manage movie collections

All features work with sessions, so no login required for basic functionality!

For more details, see `BACKEND_API_DOCUMENTATION.md`
