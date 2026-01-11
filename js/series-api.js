/**
 * Series API Client
 * Frontend client for interacting with the TV series API
 */

class SeriesAPI {
    constructor() {
        this.baseUrl = window.CONFIG?.API_BASE_URL || 'http://localhost:5000';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchWithCache(url, options = {}) {
        const cacheKey = url;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.cache.set(cacheKey, { data, timestamp: Date.now() });
            return data;
        } catch (error) {
            console.error('Series API Error:', error);
            throw error;
        }
    }

    /**
     * Get all series with pagination and filters
     */
    async getAllSeries(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.set('page', params.page);
        if (params.limit) queryParams.set('limit', params.limit);
        if (params.genre) queryParams.set('genre', params.genre);
        if (params.year) queryParams.set('year', params.year);
        if (params.status) queryParams.set('status', params.status);
        if (params.sort) queryParams.set('sort', params.sort);
        if (params.vj) queryParams.set('vj', params.vj);

        const url = `${this.baseUrl}/api/series?${queryParams.toString()}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get single series by ID or slug
     */
    async getSeriesById(id) {
        const url = `${this.baseUrl}/api/series/${id}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get episodes for a specific season
     */
    async getSeasonEpisodes(seriesId, seasonNumber) {
        const url = `${this.baseUrl}/api/series/${seriesId}/season/${seasonNumber}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get featured series
     */
    async getFeaturedSeries(limit = 10) {
        const url = `${this.baseUrl}/api/series/featured?limit=${limit}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get trending series
     */
    async getTrendingSeries(limit = 10) {
        const url = `${this.baseUrl}/api/series/trending?limit=${limit}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Search series
     */
    async searchSeries(query) {
        const url = `${this.baseUrl}/api/series/search?q=${encodeURIComponent(query)}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Search series from TMDB
     */
    async searchSeriesTMDB(query, page = 1) {
        const url = `${this.baseUrl}/api/tmdb/search/tv?query=${encodeURIComponent(query)}&page=${page}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get popular series from TMDB
     */
    async getPopularSeriesTMDB(page = 1) {
        const url = `${this.baseUrl}/api/tmdb/tv/popular?page=${page}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get trending series from TMDB
     */
    async getTrendingSeriesTMDB(timeWindow = 'week', page = 1) {
        const url = `${this.baseUrl}/api/tmdb/tv/trending?timeWindow=${timeWindow}&page=${page}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get TV show details from TMDB
     */
    async getTVShowDetailsTMDB(tvId) {
        const url = `${this.baseUrl}/api/tmdb/tv/${tvId}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get TV season details from TMDB
     */
    async getTVSeasonDetailsTMDB(tvId, seasonNumber) {
        const url = `${this.baseUrl}/api/tmdb/tv/${tvId}/season/${seasonNumber}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Get series by genre
     */
    async getSeriesByGenre(genre, limit = 20) {
        const url = `${this.baseUrl}/api/series/genre/${genre}?limit=${limit}`;
        return await this.fetchWithCache(url);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
const seriesAPI = new SeriesAPI();

// Sample fallback data when API is unavailable
const SAMPLE_SERIES = [
    { 
        _id: '1',
        title: "Breaking Bad", 
        startYear: 2008, 
        genres: ["Drama", "Crime", "Thriller"], 
        rating: { imdb: 9.5 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }, { seasonNumber: 5 }], 
        status: "completed", 
        poster: "https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
        description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
        translator: { name: "VJ Junior" }
    },
    { 
        _id: '2',
        title: "Stranger Things", 
        startYear: 2016, 
        genres: ["Sci-Fi", "Horror", "Drama"], 
        rating: { imdb: 8.7 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/9yxep7oJdkj3PLA3XRz0oJd9XnY.jpg",
        description: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces.",
        translator: { name: "VJ Emmy" }
    },
    { 
        _id: '3',
        title: "The Last of Us", 
        startYear: 2023, 
        genres: ["Drama", "Action", "Horror"], 
        rating: { imdb: 8.8 }, 
        seasons: [{ seasonNumber: 1 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/9ijMGlJKqcslswWUzTEwScm82Gs.jpg",
        description: "Joel and Ellie struggle to survive in a post-apocalyptic world filled with deadly creatures.",
        translator: { name: "VJ Junior" }
    },
    { 
        _id: '4',
        title: "Wednesday", 
        startYear: 2022, 
        genres: ["Comedy", "Mystery", "Fantasy"], 
        rating: { imdb: 8.1 }, 
        seasons: [{ seasonNumber: 1 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/9xeEGUZjgiKlI69jwIOi0hjKUIk.jpg",
        description: "Wednesday Addams investigates a monster killing spree while making new friends at Nevermore Academy.",
        translator: { name: "VJ Ice P" }
    },
    { 
        _id: '5',
        title: "Game of Thrones", 
        startYear: 2011, 
        genres: ["Fantasy", "Drama", "Action"], 
        rating: { imdb: 9.2 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }, { seasonNumber: 5 }, { seasonNumber: 6 }, { seasonNumber: 7 }, { seasonNumber: 8 }], 
        status: "completed", 
        poster: "https://image.tmdb.org/t/p/w500/qmJGd5IfURq8iPQ9KF3les47vFS.jpg",
        description: "Nine noble families fight for control over the mythical lands of Westeros.",
        translator: { name: "VJ Jingo" }
    },
    { 
        _id: '6',
        title: "The Mandalorian", 
        startYear: 2019, 
        genres: ["Sci-Fi", "Action", "Adventure"], 
        rating: { imdb: 8.7 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/eU1i6eHXlzMOlEq0ku1Rzq7Y4wA.jpg",
        description: "The travels of a lone bounty hunter in the outer reaches of the galaxy.",
        translator: { name: "VJ Emmy" }
    },
    { 
        _id: '7',
        title: "The Witcher", 
        startYear: 2019, 
        genres: ["Fantasy", "Drama", "Action"], 
        rating: { imdb: 8.0 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
        description: "Geralt of Rivia, a mutated monster-hunter, struggles to find his place in a world.",
        translator: { name: "VJ Junior" }
    },
    { 
        _id: '8',
        title: "House of the Dragon", 
        startYear: 2022, 
        genres: ["Fantasy", "Drama", "Action"], 
        rating: { imdb: 8.4 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/z2yahl2uefxDCl0nogcRBstwruJ.jpg",
        description: "The story of the Targaryen civil war that took place about 200 years before events portrayed in Game of Thrones.",
        translator: { name: "VJ Jingo" }
    },
    { 
        _id: '9',
        title: "The Boys", 
        startYear: 2019, 
        genres: ["Action", "Comedy", "Crime"], 
        rating: { imdb: 8.7 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/mY7SeH4HFFxW1hiI6cWuwCRKptN.jpg",
        description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers.",
        translator: { name: "VJ Ice P" }
    },
    { 
        _id: '10',
        title: "Peaky Blinders", 
        startYear: 2013, 
        genres: ["Drama", "Crime", "Thriller"], 
        rating: { imdb: 8.8 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }, { seasonNumber: 5 }, { seasonNumber: 6 }], 
        status: "completed", 
        poster: "https://image.tmdb.org/t/p/w500/vUUqzWa2LnHIVqkaKVlVGkVcZIW.jpg",
        description: "A gangster family epic set in 1900s England, centered on a gang who sew razor blades in the peaks of their caps.",
        translator: { name: "VJ Junior" }
    },
    { 
        _id: '11',
        title: "The Crown", 
        startYear: 2016, 
        genres: ["Drama", "Biography", "History"], 
        rating: { imdb: 8.6 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }, { seasonNumber: 5 }, { seasonNumber: 6 }], 
        status: "completed", 
        poster: "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg",
        description: "Follows the political rivalries and romance of Queen Elizabeth II's reign.",
        translator: { name: "VJ Emmy" }
    },
    { 
        _id: '12',
        title: "Squid Game", 
        startYear: 2021, 
        genres: ["Thriller", "Drama", "Action"], 
        rating: { imdb: 8.0 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
        description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games.",
        translator: { name: "VJ Ice P" }
    },
    { 
        _id: '13',
        title: "Money Heist", 
        startYear: 2017, 
        genres: ["Thriller", "Crime", "Drama"], 
        rating: { imdb: 8.2 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }, { seasonNumber: 5 }], 
        status: "completed", 
        poster: "https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
        description: "A criminal mastermind recruits a team of criminals to pull off the biggest heist in recorded history.",
        translator: { name: "VJ Jingo" }
    },
    { 
        _id: '14',
        title: "Loki", 
        startYear: 2021, 
        genres: ["Sci-Fi", "Fantasy", "Action"], 
        rating: { imdb: 8.2 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }], 
        status: "completed", 
        poster: "https://image.tmdb.org/t/p/w500/kEl2t3OhXc3Zb9FBh1AuYzRTgZp.jpg",
        description: "The mercurial villain Loki resumes his role as the God of Mischief in a new series.",
        translator: { name: "VJ Junior" }
    },
    { 
        _id: '15',
        title: "The Bear", 
        startYear: 2022, 
        genres: ["Drama", "Comedy"], 
        rating: { imdb: 8.6 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/zCH1oHfvn0o5W1KCQU8YqCjjJjR.jpg",
        description: "A young chef from the fine dining world returns to Chicago to run his family's sandwich shop.",
        translator: { name: "VJ Emmy" }
    },
    { 
        _id: '16',
        title: "Yellowstone", 
        startYear: 2018, 
        genres: ["Drama", "Western"], 
        rating: { imdb: 8.7 }, 
        seasons: [{ seasonNumber: 1 }, { seasonNumber: 2 }, { seasonNumber: 3 }, { seasonNumber: 4 }, { seasonNumber: 5 }], 
        status: "ongoing", 
        poster: "https://image.tmdb.org/t/p/w500/peNC0eyc3TQJa6x4TdKcBPNP4t0.jpg",
        description: "A ranching family in Montana faces off against others encroaching on their land.",
        translator: { name: "VJ Ice P" }
    }
];

/**
 * Get series with fallback to sample data
 */
async function getSeriesWithFallback(params = {}) {
    try {
        const response = await seriesAPI.getAllSeries(params);
        if (response.success && response.data.length > 0) {
            return response;
        }
        throw new Error('No data from API');
    } catch (error) {
        console.log('Using sample series data (API unavailable)');
        let filteredSeries = [...SAMPLE_SERIES];
        
        // Apply filters
        if (params.genre) {
            filteredSeries = filteredSeries.filter(s => 
                s.genres.some(g => g.toLowerCase() === params.genre.toLowerCase())
            );
        }
        if (params.year) {
            filteredSeries = filteredSeries.filter(s => s.startYear === parseInt(params.year));
        }
        if (params.status) {
            filteredSeries = filteredSeries.filter(s => s.status === params.status);
        }
        
        // Apply sorting
        if (params.sort === 'rating') {
            filteredSeries.sort((a, b) => b.rating.imdb - a.rating.imdb);
        } else if (params.sort === 'title') {
            filteredSeries.sort((a, b) => a.title.localeCompare(b.title));
        } else if (params.sort === 'year') {
            filteredSeries.sort((a, b) => b.startYear - a.startYear);
        }
        
        // Pagination
        const page = params.page || 1;
        const limit = params.limit || 20;
        const start = (page - 1) * limit;
        const paginatedSeries = filteredSeries.slice(start, start + limit);
        
        return {
            success: true,
            data: paginatedSeries,
            pagination: {
                page,
                limit,
                total: filteredSeries.length,
                pages: Math.ceil(filteredSeries.length / limit)
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { seriesAPI, SAMPLE_SERIES, getSeriesWithFallback };
}
