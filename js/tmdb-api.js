/**
 * TMDB API Client (Secure Proxy Version)
 * All requests go through backend to keep API keys secure
 */

class TMDBApiClient {
    constructor() {
        // Use Config if available, otherwise default to localhost
        this.baseUrl = (typeof Config !== 'undefined' && Config.BACKEND_URL) 
            ? Config.BACKEND_URL 
            : 'http://localhost:5000';
        this.apiPath = '/api/tmdb';
    }

    /**
     * Make API request through backend proxy
     */
    async makeRequest(endpoint, options = {}) {
        try {
            const url = `${this.baseUrl}${this.apiPath}${endpoint}`;
            const response = await fetch(url, {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...(options.body && { body: JSON.stringify(options.body) })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }

            return data.data;
        } catch (error) {
            console.error('TMDB API Error:', error);
            throw error;
        }
    }

    /**
     * Search movies
     */
    async searchMovies(query, page = 1, year = null) {
        const params = new URLSearchParams({ query, page });
        if (year) params.append('year', year);
        
        return await this.makeRequest(`/search/movies?${params}`);
    }

    /**
     * Get popular movies
     */
    async getPopularMovies(page = 1) {
        return await this.makeRequest(`/movies/popular?page=${page}`);
    }

    /**
     * Get trending movies
     */
    async getTrendingMovies(timeWindow = 'week', page = 1) {
        return await this.makeRequest(`/movies/trending?timeWindow=${timeWindow}&page=${page}`);
    }

    /**
     * Get top rated movies
     */
    async getTopRatedMovies(page = 1) {
        return await this.makeRequest(`/movies/top-rated?page=${page}`);
    }

    /**
     * Get now playing movies
     */
    async getNowPlayingMovies(page = 1) {
        return await this.makeRequest(`/movies/now-playing?page=${page}`);
    }

    /**
     * Get upcoming movies
     */
    async getUpcomingMovies(page = 1) {
        return await this.makeRequest(`/movies/upcoming?page=${page}`);
    }

    /**
     * Get movie details
     */
    async getMovieDetails(movieId) {
        return await this.makeRequest(`/movie/${movieId}`);
    }

    /**
     * Get movie credits (cast and crew)
     */
    async getMovieCredits(movieId) {
        return await this.makeRequest(`/movie/${movieId}/credits`);
    }

    /**
     * Get movie videos (trailers)
     */
    async getMovieVideos(movieId) {
        return await this.makeRequest(`/movie/${movieId}/videos`);
    }

    /**
     * Get movie images
     */
    async getMovieImages(movieId) {
        return await this.makeRequest(`/movie/${movieId}/images`);
    }

    /**
     * Get similar movies
     */
    async getSimilarMovies(movieId, page = 1) {
        return await this.makeRequest(`/movie/${movieId}/similar?page=${page}`);
    }

    /**
     * Get movie recommendations
     */
    async getMovieRecommendations(movieId, page = 1) {
        return await this.makeRequest(`/movie/${movieId}/recommendations?page=${page}`);
    }

    /**
     * Get genres
     */
    async getGenres() {
        return await this.makeRequest('/genres');
    }

    /**
     * Get movies by genre
     */
    async getMoviesByGenre(genreId, page = 1) {
        return await this.makeRequest(`/movies/genre/${genreId}?page=${page}`);
    }

    /**
     * Discover movies with filters
     */
    async discoverMovies(filters = {}) {
        return await this.makeRequest('/movies/discover', {
            method: 'POST',
            body: filters
        });
    }

    /**
     * Get person details
     */
    async getPersonDetails(personId) {
        return await this.makeRequest(`/person/${personId}`);
    }

    /**
     * Search people
     */
    async searchPeople(query, page = 1) {
        const params = new URLSearchParams({ query, page });
        return await this.makeRequest(`/search/people?${params}`);
    }

    /**
     * Get image URL
     */
    getImageUrl(path, size = 'original') {
        if (!path) return null;
        return `https://image.tmdb.org/t/p/${size}${path}`;
    }

    /**
     * Get poster URL
     */
    getPosterUrl(path, size = 'w500') {
        return this.getImageUrl(path, size);
    }

    /**
     * Get backdrop URL
     */
    getBackdropUrl(path, size = 'original') {
        return this.getImageUrl(path, size);
    }

    /**
     * Get profile URL (for actors)
     */
    getProfileUrl(path, size = 'w185') {
        return this.getImageUrl(path, size);
    }
}

// Export singleton instance
const tmdbApi = new TMDBApiClient();

// Example usage:
/*
// Search for movies
const results = await tmdbApi.searchMovies('Inception');

// Get popular movies
const popular = await tmdbApi.getPopularMovies();

// Get movie details
const movie = await tmdbApi.getMovieDetails(550);

// Get poster URL
const posterUrl = tmdbApi.getPosterUrl(movie.poster_path);
*/
