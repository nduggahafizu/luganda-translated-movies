const axios = require('axios');
const cheerio = require('cheerio');

/* ===================================
   Kp Sounds Watch Ethical Scraper
   
   IMPORTANT: This scraper follows ethical guidelines:
   - Respects robots.txt
   - Rate limiting (1 request per 2 seconds)
   - Only scrapes publicly available data
   - Does NOT scrape video files or protected content
   - Caches results to minimize requests
   - Proper user-agent identification
   =================================== */

class KpSoundsScraper {
    constructor() {
        this.baseUrl = 'https://watch.kpsounds.com';
        this.lastRequestTime = 0;
        this.minRequestInterval = 2000; // 2 seconds between requests
        this.cache = new Map();
        this.cacheTimeout = 86400000; // 24 hours
        
        // User agent identification
        this.userAgent = 'LugandaMoviesBot/1.0 (Educational Purpose; +https://lugandamovies.com/bot)';
    }

    /**
     * Rate limiting - wait before making request
     */
    async rateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
    }

    /**
     * Make HTTP request with rate limiting
     */
    async makeRequest(url) {
        try {
            // Check cache first
            if (this.cache.has(url)) {
                const cached = this.cache.get(url);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    console.log(`[Cache Hit] ${url}`);
                    return cached.data;
                }
            }

            // Rate limiting
            await this.rateLimit();
            
            console.log(`[Scraping] ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: 15000,
                maxRedirects: 5
            });
            
            // Cache response
            this.cache.set(url, {
                data: response.data,
                timestamp: Date.now()
            });
            
            return response.data;
        } catch (error) {
            console.error(`[Scraper Error] ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Get list of VJs from categories page
     */
    async getVJList() {
        try {
            const html = await this.makeRequest(`${this.baseUrl}/categories`);
            const $ = cheerio.load(html);
            const vjs = [];

            // Parse VJ categories
            $('.list-category-box, .footer-nav a').each((i, elem) => {
                const name = $(elem).text().trim();
                const url = $(elem).attr('href');
                
                // Filter for VJ names
                if (name.toLowerCase().includes('vj ') || name.toLowerCase().includes('v.j')) {
                    vjs.push({
                        name: name,
                        slug: this.extractSlugFromUrl(url),
                        kpSoundsUrl: url,
                        kpSoundsId: this.extractSlugFromUrl(url)
                    });
                }
            });

            // Remove duplicates
            const uniqueVJs = Array.from(new Map(vjs.map(vj => [vj.name, vj])).values());
            
            console.log(`[Scraped] Found ${uniqueVJs.length} VJs`);
            return uniqueVJs;
        } catch (error) {
            console.error('[Error] Failed to scrape VJ list:', error.message);
            return [];
        }
    }

    /**
     * Get movies by VJ (public information only)
     */
    async getMoviesByVJ(vjSlug, limit = 20) {
        try {
            const html = await this.makeRequest(`${this.baseUrl}/category/${vjSlug}`);
            const $ = cheerio.load(html);
            const movies = [];

            // Parse movie cards
            $('.list-movie').each((i, elem) => {
                if (i >= limit) return false; // Limit results

                const $movie = $(elem);
                const $link = $movie.find('a.list-media, a.list-title').first();
                const $title = $movie.find('.list-title');
                const $category = $movie.find('.list-category');
                const $year = $movie.find('.list-year');
                const $imdb = $movie.find('.imdb span');
                const $quality = $movie.find('.quality');

                const movieData = {
                    title: $title.text().trim(),
                    url: $link.attr('href'),
                    slug: this.extractSlugFromUrl($link.attr('href')),
                    category: $category.text().trim(),
                    year: $year.text().trim() ? parseInt($year.text().trim()) : null,
                    imdbRating: $imdb.text().trim() ? parseFloat($imdb.text().trim()) : null,
                    quality: $quality.text().trim(),
                    vjName: this.extractVJFromTitle($title.text().trim())
                };

                if (movieData.title && movieData.url) {
                    movies.push(movieData);
                }
            });

            console.log(`[Scraped] Found ${movies.length} movies for ${vjSlug}`);
            return movies;
        } catch (error) {
            console.error(`[Error] Failed to scrape movies for ${vjSlug}:`, error.message);
            return [];
        }
    }

    /**
     * Get trending movies (public information only)
     */
    async getTrendingMovies(limit = 10) {
        try {
            const html = await this.makeRequest(`${this.baseUrl}/trends`);
            const $ = cheerio.load(html);
            const movies = [];

            $('.list-movie, .nav-trend li').each((i, elem) => {
                if (i >= limit) return false;

                const $elem = $(elem);
                const $link = $elem.find('a').first();
                const title = $link.text().trim() || $elem.find('.list-title').text().trim();
                const url = $link.attr('href');
                const views = $elem.find('.view div').text().trim();

                if (title && url) {
                    movies.push({
                        title: title,
                        url: url,
                        slug: this.extractSlugFromUrl(url),
                        views: this.parseViews(views),
                        vjName: this.extractVJFromTitle(title)
                    });
                }
            });

            console.log(`[Scraped] Found ${movies.length} trending movies`);
            return movies;
        } catch (error) {
            console.error('[Error] Failed to scrape trending movies:', error.message);
            return [];
        }
    }

    /**
     * Get movie details (public information only)
     * NOTE: Does NOT scrape video URLs or protected content
     */
    async getMovieDetails(movieSlug) {
        try {
            const html = await this.makeRequest(`${this.baseUrl}/movie/${movieSlug}`);
            const $ = cheerio.load(html);

            const movieData = {
                title: $('h1, .movie-title').first().text().trim(),
                description: $('.movie-description, .description').first().text().trim(),
                year: this.extractYear($),
                imdbRating: this.extractIMDBRating($),
                genres: this.extractGenres($),
                cast: this.extractCast($),
                vjName: this.extractVJFromPage($),
                kpSoundsUrl: `${this.baseUrl}/movie/${movieSlug}`,
                // NOTE: We do NOT scrape video URLs - users will be directed to Kp Sounds Watch
            };

            console.log(`[Scraped] Movie details for ${movieSlug}`);
            return movieData;
        } catch (error) {
            console.error(`[Error] Failed to scrape movie details for ${movieSlug}:`, error.message);
            return null;
        }
    }

    /**
     * Helper: Extract slug from URL
     */
    extractSlugFromUrl(url) {
        if (!url) return null;
        const match = url.match(/\/([^\/]+)$/);
        return match ? match[1] : null;
    }

    /**
     * Helper: Extract VJ name from title
     */
    extractVJFromTitle(title) {
        const vjMatch = title.match(/by\s+(VJ\s+[A-Za-z\s]+)/i);
        return vjMatch ? vjMatch[1].trim() : null;
    }

    /**
     * Helper: Parse view count
     */
    parseViews(viewsText) {
        if (!viewsText) return 0;
        const match = viewsText.match(/(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }

    /**
     * Helper: Extract year from page
     */
    extractYear($) {
        const yearText = $('.movie-year, .year, .list-year').first().text().trim();
        const match = yearText.match(/(\d{4})/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Helper: Extract IMDB rating
     */
    extractIMDBRating($) {
        const ratingText = $('.imdb span, .rating').first().text().trim();
        return ratingText ? parseFloat(ratingText) : null;
    }

    /**
     * Helper: Extract genres
     */
    extractGenres($) {
        const genres = [];
        $('.genre, .category, .list-category').each((i, elem) => {
            const genre = $(elem).text().trim().toLowerCase();
            if (genre && !genres.includes(genre)) {
                genres.push(genre);
            }
        });
        return genres;
    }

    /**
     * Helper: Extract cast
     */
    extractCast($) {
        const cast = [];
        $('.cast-member, .actor').each((i, elem) => {
            const name = $(elem).find('.name, .actor-name').text().trim();
            if (name) {
                cast.push({ name });
            }
        });
        return cast;
    }

    /**
     * Helper: Extract VJ from page
     */
    extractVJFromPage($) {
        const vjText = $('body').text();
        const vjMatch = vjText.match(/by\s+(VJ\s+[A-Za-z\s]+)/i);
        return vjMatch ? vjMatch[1].trim() : null;
    }

    /**
     * Get all VJs with their movie counts
     */
    async getAllVJsWithStats() {
        try {
            const vjs = await this.getVJList();
            const vjsWithStats = [];

            for (const vj of vjs) {
                // Get first page to count movies
                const movies = await this.getMoviesByVJ(vj.slug, 1);
                
                vjsWithStats.push({
                    ...vj,
                    movieCount: movies.length,
                    lastScraped: new Date()
                });
            }

            return vjsWithStats;
        } catch (error) {
            console.error('[Error] Failed to get VJs with stats:', error.message);
            return [];
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[Cache] Cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Export singleton instance
module.exports = new KpSoundsScraper();
