/* ===================================
   Watchlist Manager
   Handles favorites, watch history, and watchlist
   =================================== */

const WatchlistManager = {
    storageKey: 'unruly_watchlist',
    historyKey: 'unruly_watch_history',
    favoritesKey: 'unruly_favorites',
    
    // Initialize
    init: function() {
        this.syncWithServer();
        this.bindEvents();
    },
    
    // Get watchlist from local storage
    getWatchlist: function() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    },
    
    // Get watch history from local storage
    getHistory: function() {
        const data = localStorage.getItem(this.historyKey);
        return data ? JSON.parse(data) : [];
    },
    
    // Get favorites from local storage
    getFavorites: function() {
        const data = localStorage.getItem(this.favoritesKey);
        return data ? JSON.parse(data) : [];
    },
    
    // Add to watchlist
    addToWatchlist: async function(movie) {
        const watchlist = this.getWatchlist();
        
        // Check if already exists
        if (watchlist.some(item => item.id === movie.id)) {
            this.showNotification('Already in watchlist', 'info');
            return false;
        }
        
        // Add with timestamp
        watchlist.unshift({
            ...movie,
            addedAt: new Date().toISOString()
        });
        
        localStorage.setItem(this.storageKey, JSON.stringify(watchlist));
        
        // Sync with server if logged in
        await this.syncAddToServer('watchlist', movie.id);
        
        this.showNotification('Added to watchlist', 'success');
        this.updateUI();
        
        return true;
    },
    
    // Remove from watchlist
    removeFromWatchlist: async function(movieId) {
        let watchlist = this.getWatchlist();
        watchlist = watchlist.filter(item => item.id !== movieId);
        
        localStorage.setItem(this.storageKey, JSON.stringify(watchlist));
        
        // Sync with server
        await this.syncRemoveFromServer('watchlist', movieId);
        
        this.showNotification('Removed from watchlist', 'success');
        this.updateUI();
        
        return true;
    },
    
    // Check if in watchlist
    isInWatchlist: function(movieId) {
        return this.getWatchlist().some(item => item.id === movieId);
    },
    
    // Add to favorites
    addToFavorites: async function(movie) {
        const favorites = this.getFavorites();
        
        if (favorites.some(item => item.id === movie.id)) {
            this.showNotification('Already in favorites', 'info');
            return false;
        }
        
        favorites.unshift({
            ...movie,
            addedAt: new Date().toISOString()
        });
        
        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        await this.syncAddToServer('favorites', movie.id);
        
        this.showNotification('Added to favorites', 'success');
        this.updateUI();
        
        return true;
    },
    
    // Remove from favorites
    removeFromFavorites: async function(movieId) {
        let favorites = this.getFavorites();
        favorites = favorites.filter(item => item.id !== movieId);
        
        localStorage.setItem(this.favoritesKey, JSON.stringify(favorites));
        await this.syncRemoveFromServer('favorites', movieId);
        
        this.showNotification('Removed from favorites', 'success');
        this.updateUI();
        
        return true;
    },
    
    // Check if in favorites
    isInFavorites: function(movieId) {
        return this.getFavorites().some(item => item.id === movieId);
    },
    
    // Toggle favorite
    toggleFavorite: async function(movie) {
        if (this.isInFavorites(movie.id)) {
            return this.removeFromFavorites(movie.id);
        } else {
            return this.addToFavorites(movie);
        }
    },
    
    // Toggle watchlist
    toggleWatchlist: async function(movie) {
        if (this.isInWatchlist(movie.id)) {
            return this.removeFromWatchlist(movie.id);
        } else {
            return this.addToWatchlist(movie);
        }
    },
    
    // Add to watch history
    addToHistory: function(movie, progress = 0, duration = 0) {
        let history = this.getHistory();
        
        // Remove if exists (we'll add fresh)
        history = history.filter(item => item.id !== movie.id);
        
        history.unshift({
            ...movie,
            watchedAt: new Date().toISOString(),
            progress: progress,
            duration: duration,
            percentComplete: duration > 0 ? Math.round((progress / duration) * 100) : 0
        });
        
        // Keep only last 100 items
        history = history.slice(0, 100);
        
        localStorage.setItem(this.historyKey, JSON.stringify(history));
        this.syncHistoryToServer(movie.id, progress, duration);
    },
    
    // Get continue watching (movies not finished)
    getContinueWatching: function() {
        const history = this.getHistory();
        return history.filter(item => 
            item.percentComplete > 5 && item.percentComplete < 90
        ).slice(0, 10);
    },
    
    // Clear history
    clearHistory: function() {
        localStorage.setItem(this.historyKey, JSON.stringify([]));
        this.showNotification('Watch history cleared', 'success');
        this.updateUI();
    },
    
    // Sync with server
    syncWithServer: async function() {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        try {
            const response = await fetch(`${API_CONFIG.API_URL}/api/users/preferences`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                
                // Merge server data with local data
                if (data.watchlist) {
                    this.mergeData(this.storageKey, data.watchlist);
                }
                if (data.favorites) {
                    this.mergeData(this.favoritesKey, data.favorites);
                }
            }
        } catch (error) {
            console.error('Error syncing with server:', error);
        }
    },
    
    // Merge local and server data
    mergeData: function(key, serverData) {
        const localData = JSON.parse(localStorage.getItem(key) || '[]');
        const merged = [...localData];
        
        serverData.forEach(serverItem => {
            if (!merged.some(item => item.id === serverItem.id)) {
                merged.push(serverItem);
            }
        });
        
        // Sort by addedAt
        merged.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
        
        localStorage.setItem(key, JSON.stringify(merged));
    },
    
    // Sync add to server
    syncAddToServer: async function(type, movieId) {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        try {
            await fetch(`${API_CONFIG.API_URL}/api/users/${type}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movieId })
            });
        } catch (error) {
            console.error(`Error syncing ${type} to server:`, error);
        }
    },
    
    // Sync remove from server
    syncRemoveFromServer: async function(type, movieId) {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        try {
            await fetch(`${API_CONFIG.API_URL}/api/users/${type}/${movieId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (error) {
            console.error(`Error removing from ${type}:`, error);
        }
    },
    
    // Sync history to server
    syncHistoryToServer: async function(movieId, progress, duration) {
        const token = localStorage.getItem('auth_token');
        if (!token) return;
        
        try {
            await fetch(`${API_CONFIG.API_URL}/api/users/history`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ movieId, progress, duration })
            });
        } catch (error) {
            console.error('Error syncing history:', error);
        }
    },
    
    // Bind events
    bindEvents: function() {
        // Bind watchlist buttons
        document.querySelectorAll('[data-action="watchlist"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const movieData = this.getMovieDataFromElement(btn);
                this.toggleWatchlist(movieData);
            });
        });
        
        // Bind favorite buttons
        document.querySelectorAll('[data-action="favorite"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const movieData = this.getMovieDataFromElement(btn);
                this.toggleFavorite(movieData);
            });
        });
    },
    
    // Get movie data from element
    getMovieDataFromElement: function(element) {
        return {
            id: element.dataset.movieId,
            title: element.dataset.movieTitle,
            poster: element.dataset.moviePoster,
            year: element.dataset.movieYear,
            vj: element.dataset.movieVj
        };
    },
    
    // Update UI buttons
    updateUI: function() {
        const watchlist = this.getWatchlist();
        const favorites = this.getFavorites();
        
        document.querySelectorAll('[data-action="watchlist"]').forEach(btn => {
            const movieId = btn.dataset.movieId;
            const isInList = watchlist.some(item => item.id === movieId);
            btn.classList.toggle('active', isInList);
            btn.setAttribute('aria-pressed', isInList);
        });
        
        document.querySelectorAll('[data-action="favorite"]').forEach(btn => {
            const movieId = btn.dataset.movieId;
            const isInList = favorites.some(item => item.id === movieId);
            btn.classList.toggle('active', isInList);
            btn.setAttribute('aria-pressed', isInList);
        });
        
        // Update counts
        const watchlistCount = document.querySelector('.watchlist-count');
        if (watchlistCount) {
            watchlistCount.textContent = watchlist.length;
        }
        
        const favoritesCount = document.querySelector('.favorites-count');
        if (favoritesCount) {
            favoritesCount.textContent = favorites.length;
        }
    },
    
    // Show notification
    showNotification: function(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelector('.watchlist-notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `watchlist-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                ${type === 'success' ? `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                ` : `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                `}
                <span>${message}</span>
            </div>
        `;
        
        // Add styles if not present
        if (!document.getElementById('watchlist-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'watchlist-notification-styles';
            style.textContent = `
                .watchlist-notification {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%) translateY(100px);
                    background: var(--background-light, #1a1a1a);
                    border: 1px solid var(--border-color, #333);
                    padding: 15px 25px;
                    border-radius: 12px;
                    z-index: 10000;
                    animation: slideUp 0.3s ease forwards;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                }
                
                .watchlist-notification.success {
                    border-color: var(--primary-color, #7CFC00);
                }
                
                .watchlist-notification.success svg {
                    color: var(--primary-color, #7CFC00);
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    color: var(--text-primary, #fff);
                    font-weight: 500;
                }
                
                @keyframes slideUp {
                    to {
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Create watchlist button
    createWatchlistButton: function(movieData) {
        const isInList = this.isInWatchlist(movieData.id);
        
        const btn = document.createElement('button');
        btn.className = `watchlist-btn ${isInList ? 'active' : ''}`;
        btn.setAttribute('data-action', 'watchlist');
        btn.setAttribute('data-movie-id', movieData.id);
        btn.setAttribute('data-movie-title', movieData.title);
        btn.setAttribute('data-movie-poster', movieData.poster);
        btn.setAttribute('aria-label', isInList ? 'Remove from watchlist' : 'Add to watchlist');
        btn.setAttribute('aria-pressed', isInList);
        
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isInList ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
        `;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleWatchlist(movieData);
        });
        
        return btn;
    },
    
    // Create favorite button
    createFavoriteButton: function(movieData) {
        const isInList = this.isInFavorites(movieData.id);
        
        const btn = document.createElement('button');
        btn.className = `favorite-btn ${isInList ? 'active' : ''}`;
        btn.setAttribute('data-action', 'favorite');
        btn.setAttribute('data-movie-id', movieData.id);
        btn.setAttribute('aria-label', isInList ? 'Remove from favorites' : 'Add to favorites');
        btn.setAttribute('aria-pressed', isInList);
        
        btn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="${isInList ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        `;
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleFavorite(movieData);
        });
        
        return btn;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    WatchlistManager.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WatchlistManager;
}
