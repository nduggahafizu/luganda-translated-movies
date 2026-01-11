const axios = require('axios');

/* ===================================
   TMDB API Service
   The Movie Database API Integration
   =================================== */

class TMDBService {
    constructor() {
        // Get API key from environment variable
        this.apiKey = process.env.TMDB_API_KEY || '';
        this.baseUrl = 'https://api.themoviedb.org/3';
        this.imageBaseUrl = 'https://image.tmdb.org/t/p';
        
        // Cache for API responses (in-memory, consider Redis for production)
        this.cache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
    }

    /**
     * Make API request to TMDB
     */
    async makeRequest(endpoint, params = {}) {
        try {
            // Add API key to params
            params.api_key = this.apiKey;
            
            // Create cache key
            const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
            
            // Check cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }
            
            // Make request
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                params,
                timeout: 10000
            });
            
            // Cache response
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });
            
            return response.data;
        } catch (error) {
            console.error('TMDB API Error:', error.message);
            throw new Error(`TMDB API request failed: ${error.message}`);
        }
    }

    /**
     * Search movies by title
     */
    async searchMovies(query, page = 1, year = null) {
        const params = {
            query,
            page,
            include_adult: false
        };
        
        if (year) {
            params.year = year;
        }
        
        return await this.makeRequest('/search/movie', params);
    }

    /**
     * Search TV series by title
     */
    async searchTVShows(query, page = 1, year = null) {
        const params = {
            query,
            page,
            include_adult: false
        };
        
        if (year) {
            params.first_air_date_year = year;
        }
        
        return await this.makeRequest('/search/tv', params);
    }

    /**
     * Search both movies and TV series (multi search)
     */
    async searchMulti(query, page = 1) {
        const params = {
            query,
            page,
            include_adult: false
        };
        
        return await this.makeRequest('/search/multi', params);
    }

    /**
     * Get TV show details by TMDB ID
     */
    async getTVShowDetails(tvId) {
        return await this.makeRequest(`/tv/${tvId}`, {
            append_to_response: 'credits,videos,images,keywords,similar,content_ratings'
        });
    }

    /**
     * Get TV show season details
     */
    async getTVSeasonDetails(tvId, seasonNumber) {
        return await this.makeRequest(`/tv/${tvId}/season/${seasonNumber}`);
    }

    /**
     * Get TV show episode details
     */
    async getTVEpisodeDetails(tvId, seasonNumber, episodeNumber) {
        return await this.makeRequest(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
    }

    /**
     * Get popular TV shows
     */
    async getPopularTVShows(page = 1) {
        return await this.makeRequest('/tv/popular', { page });
    }

    /**
     * Get trending TV shows
     */
    async getTrendingTVShows(timeWindow = 'week', page = 1) {
        return await this.makeRequest(`/trending/tv/${timeWindow}`, { page });
    }

    /**
     * Get top rated TV shows
     */
    async getTopRatedTVShows(page = 1) {
        return await this.makeRequest('/tv/top_rated', { page });
    }

    /**
     * Get currently airing TV shows
     */
    async getOnTheAirTVShows(page = 1) {
        return await this.makeRequest('/tv/on_the_air', { page });
    }

    /**
     * Get TV shows airing today
     */
    async getAiringTodayTVShows(page = 1) {
        return await this.makeRequest('/tv/airing_today', { page });
    }

    /**
     * Discover TV shows with filters
     */
    async discoverTVShows(filters = {}) {
        const params = {
            page: filters.page || 1,
            sort_by: filters.sortBy || 'popularity.desc',
            include_adult: false
        };

        if (filters.year) params.first_air_date_year = filters.year;
        if (filters.genreIds) params.with_genres = filters.genreIds.join(',');
        if (filters.minRating) params['vote_average.gte'] = filters.minRating;
        if (filters.minVotes) params['vote_count.gte'] = filters.minVotes;
        if (filters.language) params.with_original_language = filters.language;

        return await this.makeRequest('/discover/tv', params);
    }

    /**
     * Get TV show genres list
     */
    async getTVGenres() {
        return await this.makeRequest('/genre/tv/list');
    }

    /**
     * Get movie details by TMDB ID
     */
    async getMovieDetails(movieId) {
        return await this.makeRequest(`/movie/${movieId}`, {
            append_to_response: 'credits,videos,images,keywords,similar'
        });
    }

    /**
     * Get popular movies
     */
    async getPopularMovies(page = 1) {
        return await this.makeRequest('/movie/popular', { page });
    }

    /**
     * Get trending movies
     */
    async getTrendingMovies(timeWindow = 'week', page = 1) {
        return await this.makeRequest(`/trending/movie/${timeWindow}`, { page });
    }

    /**
     * Get top rated movies
     */
    async getTopRatedMovies(page = 1) {
        return await this.makeRequest('/movie/top_rated', { page });
    }

    /**
     * Get now playing movies
     */
    async getNowPlayingMovies(page = 1) {
        return await this.makeRequest('/movie/now_playing', { page });
    }

    /**
     * Get upcoming movies
     */
    async getUpcomingMovies(page = 1) {
        return await this.makeRequest('/movie/upcoming', { page });
    }

    /**
     * Get movies by genre
     */
    async getMoviesByGenre(genreId, page = 1) {
        return await this.makeRequest('/discover/movie', {
            with_genres: genreId,
            page,
            sort_by: 'popularity.desc'
        });
    }

    /**
     * Get movie genres list
     */
    async getGenres() {
        return await this.makeRequest('/genre/movie/list');
    }

    /**
     * Get movie cast and crew
     */
    async getMovieCredits(movieId) {
        return await this.makeRequest(`/movie/${movieId}/credits`);
    }

    /**
     * Get movie videos (trailers, teasers)
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
        return await this.makeRequest(`/movie/${movieId}/similar`, { page });
    }

    /**
     * Get movie recommendations
     */
    async getMovieRecommendations(movieId, page = 1) {
        return await this.makeRequest(`/movie/${movieId}/recommendations`, { page });
    }

    /**
     * Discover movies with filters
     */
    async discoverMovies(filters = {}) {
        const params = {
            page: filters.page || 1,
            sort_by: filters.sortBy || 'popularity.desc',
            include_adult: false
        };

        if (filters.year) params.year = filters.year;
        if (filters.genreIds) params.with_genres = filters.genreIds.join(',');
        if (filters.minRating) params['vote_average.gte'] = filters.minRating;
        if (filters.minVotes) params['vote_count.gte'] = filters.minVotes;
        if (filters.language) params.with_original_language = filters.language;

        return await this.makeRequest('/discover/movie', params);
    }

    /**
     * Get person details (actor/director)
     */
    async getPersonDetails(personId) {
        return await this.makeRequest(`/person/${personId}`, {
            append_to_response: 'movie_credits,images'
        });
    }

    /**
     * Search for people
     */
    async searchPeople(query, page = 1) {
        return await this.makeRequest('/search/person', {
            query,
            page,
            include_adult: false
        });
    }

    /**
     * Get image URL
     */
    getImageUrl(path, size = 'original') {
        if (!path) return null;
        
        // Available sizes: w92, w154, w185, w342, w500, w780, original
        return `${this.imageBaseUrl}/${size}${path}`;
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

    /**
     * Get complete TV series with ALL seasons and episodes
     * This is the main function for importing a series with all data
     */
    async getTVSeriesComplete(tmdbId) {
        try {
            // Step 1: Get main series info
            const seriesInfo = await this.getTVShowDetails(tmdbId);
            
            if (!seriesInfo) {
                throw new Error('TV series not found');
            }

            // Step 2: Fetch ALL seasons with episodes
            const seasons = [];
            const numberOfSeasons = seriesInfo.number_of_seasons || 0;

            for (let seasonNum = 1; seasonNum <= numberOfSeasons; seasonNum++) {
                try {
                    const seasonData = await this.getTVSeasonDetails(tmdbId, seasonNum);
                    
                    if (seasonData) {
                        // Format episodes for this season
                        const episodes = (seasonData.episodes || []).map(ep => ({
                            episodeNumber: ep.episode_number,
                            name: ep.name || `Episode ${ep.episode_number}`,
                            overview: ep.overview || '',
                            airDate: ep.air_date || null,
                            stillPath: ep.still_path ? this.getImageUrl(ep.still_path, 'w500') : null,
                            runtime: ep.runtime || 0,
                            voteAverage: ep.vote_average || 0,
                            // Video URLs will be added manually by admin
                            video: {
                                embedUrl: '',
                                streamtapeId: '',
                                archiveUrl: '',
                                provider: ''
                            },
                            vjName: '',
                            isTranslated: false
                        }));

                        seasons.push({
                            seasonNumber: seasonNum,
                            name: seasonData.name || `Season ${seasonNum}`,
                            overview: seasonData.overview || '',
                            airDate: seasonData.air_date || null,
                            posterPath: seasonData.poster_path ? this.getImageUrl(seasonData.poster_path, 'w500') : null,
                            episodeCount: episodes.length,
                            episodes: episodes
                        });
                    }
                } catch (seasonError) {
                    console.error(`Error fetching season ${seasonNum}:`, seasonError.message);
                    // Continue with other seasons even if one fails
                }
            }

            // Step 3: Calculate totals
            const totalEpisodes = seasons.reduce((sum, s) => sum + s.episodes.length, 0);

            // Step 4: Format complete series data for database
            return {
                contentType: 'series',
                tmdbId: seriesInfo.id,
                originalTitle: seriesInfo.name || seriesInfo.original_name,
                lugandaTitle: seriesInfo.name || seriesInfo.original_name, // Admin can change
                description: seriesInfo.overview || '',
                year: seriesInfo.first_air_date ? new Date(seriesInfo.first_air_date).getFullYear() : null,
                rating: {
                    imdb: seriesInfo.vote_average || 0,
                    userRating: 0,
                    totalRatings: seriesInfo.vote_count || 0
                },
                genres: seriesInfo.genres ? seriesInfo.genres.map(g => g.name.toLowerCase()) : [],
                poster: this.getPosterUrl(seriesInfo.poster_path),
                backdrop: this.getBackdropUrl(seriesInfo.backdrop_path),
                country: seriesInfo.origin_country && seriesInfo.origin_country[0] 
                    ? seriesInfo.origin_country[0] 
                    : 'USA',
                originalLanguage: seriesInfo.original_language || 'en',
                metaData: {
                    tmdbId: seriesInfo.id.toString()
                },
                cast: seriesInfo.credits && seriesInfo.credits.cast 
                    ? seriesInfo.credits.cast.slice(0, 10).map(actor => ({
                        name: actor.name,
                        character: actor.character,
                        image: this.getProfileUrl(actor.profile_path)
                    }))
                    : [],
                director: seriesInfo.created_by && seriesInfo.created_by.length > 0
                    ? seriesInfo.created_by.map(c => c.name).join(', ')
                    : 'Unknown',
                // TV Series specific fields
                seasons: seasons,
                totalSeasons: numberOfSeasons,
                totalEpisodes: totalEpisodes,
                seriesStatus: seriesInfo.status || 'Unknown',
                networks: seriesInfo.networks ? seriesInfo.networks.map(n => n.name) : [],
                lastAirDate: seriesInfo.last_air_date || null,
                nextEpisodeToAir: seriesInfo.next_episode_to_air ? {
                    airDate: seriesInfo.next_episode_to_air.air_date,
                    episodeNumber: seriesInfo.next_episode_to_air.episode_number,
                    seasonNumber: seriesInfo.next_episode_to_air.season_number,
                    name: seriesInfo.next_episode_to_air.name
                } : null,
                // Default values
                vjName: '',
                status: 'draft',
                isFeatured: false,
                views: 0,
                translationDate: new Date()
            };
        } catch (error) {
            console.error('Error fetching complete TV series:', error);
            throw error;
        }
    }

    /**
     * Search and get complete series data (convenience method)
     */
    async searchAndImportSeries(query, year = null) {
        try {
            // Search for the series
            const searchResults = await this.searchTVShows(query, 1, year);
            
            if (!searchResults.results || searchResults.results.length === 0) {
                throw new Error('No TV series found');
            }

            // Get the first result's complete data
            const firstResult = searchResults.results[0];
            return await this.getTVSeriesComplete(firstResult.id);
        } catch (error) {
            console.error('Error searching and importing series:', error);
            throw error;
        }
    }

    /**
     * Format movie data for our database
     */
    formatMovieForDatabase(tmdbMovie) {
        return {
            tmdbId: tmdbMovie.id,
            originalTitle: tmdbMovie.title,
            description: tmdbMovie.overview,
            year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
            duration: tmdbMovie.runtime || 0,
            rating: {
                imdb: tmdbMovie.vote_average || 0,
                userRating: 0,
                totalRatings: tmdbMovie.vote_count || 0
            },
            genres: tmdbMovie.genres ? tmdbMovie.genres.map(g => g.name.toLowerCase()) : [],
            poster: this.getPosterUrl(tmdbMovie.poster_path),
            backdrop: this.getBackdropUrl(tmdbMovie.backdrop_path),
            country: tmdbMovie.production_countries && tmdbMovie.production_countries[0] 
                ? tmdbMovie.production_countries[0].name 
                : 'USA',
            originalLanguage: tmdbMovie.original_language || 'en',
            metaData: {
                tmdbId: tmdbMovie.id.toString(),
                imdbId: tmdbMovie.imdb_id || null
            },
            cast: tmdbMovie.credits && tmdbMovie.credits.cast 
                ? tmdbMovie.credits.cast.slice(0, 10).map(actor => ({
                    name: actor.name,
                    character: actor.character,
                    image: this.getProfileUrl(actor.profile_path)
                }))
                : [],
            director: tmdbMovie.credits && tmdbMovie.credits.crew
                ? (tmdbMovie.credits.crew.find(c => c.job === 'Director') || {}).name || 'Unknown'
                : 'Unknown',
            trailer: tmdbMovie.videos && tmdbMovie.videos.results
                ? this.getYoutubeUrl(tmdbMovie.videos.results.find(v => v.type === 'Trailer'))
                : null
        };
    }

    /**
     * Get YouTube URL from video object
     */
    getYoutubeUrl(video) {
        if (!video || video.site !== 'YouTube') return null;
        return `https://www.youtube.com/watch?v=${video.key}`;
    }

    /**
     * Map TMDB genre IDs to our genre names
     */
    mapGenreIdToName(genreId) {
        const genreMap = {
            28: 'action',
            12: 'adventure',
            16: 'animation',
            35: 'comedy',
            80: 'crime',
            99: 'documentary',
            18: 'drama',
            10751: 'family',
            14: 'fantasy',
            36: 'history',
            27: 'horror',
            10402: 'music',
            9648: 'mystery',
            10749: 'romance',
            878: 'sci-fi',
            10770: 'tv-movie',
            53: 'thriller',
            10752: 'war',
            37: 'western'
        };
        
        return genreMap[genreId] || 'other';
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout
        };
    }
}

// Export singleton instance
module.exports = new TMDBService();
