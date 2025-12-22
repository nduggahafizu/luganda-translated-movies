/**
 * Sample Luganda Movies Data
 * Used for development and in-memory mode
 */

module.exports = [
    // VJ Ice P Movies
    {
        _id: '1',
        originalTitle: 'Lokah',
        lugandaTitle: 'Lokah (Luganda)',
        slug: 'lokah-luganda',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        description: 'An intense Indian action drama that follows the journey of a fearless protagonist.',
        year: 2023,
        duration: 150,
        rating: {
            imdb: 7.5,
            userRating: 8.2,
            totalRatings: 1250,
            translationRating: 4.8,
            totalTranslationRatings: 450
        },
        genres: ['action', 'drama'],
        director: 'Director Name',
        writers: ['Writer 1'],
        originalLanguage: 'Hindi',
        availableLanguages: ['Hindi', 'Luganda'],
        country: 'India',
        poster: 'https://image.tmdb.org/t/p/w500/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg',
        video: {
            originalVideoPath: '/videos/lokah-original.mp4',
            lugandaVideoPath: '/videos/lokah-luganda.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        requiredPlan: 'free',
        status: 'published',
        featured: true,
        trending: true,
        views: 25420,
        likes: 1850,
        downloads: 320,
        tags: ['action', 'indian', 'drama'],
        ageRating: 'PG-13',
        translationQuality: 4.8,
        translationDate: new Date('2024-01-15'),
        metaData: {
            tmdbId: '12345',
            imdbId: 'tt1234567'
        }
    },
    {
        _id: '2',
        originalTitle: 'Running Man',
        lugandaTitle: 'Running Man (Luganda)',
        slug: 'running-man-luganda',
        vjName: 'VJ Ice P',
        vjId: 'vj-ice-p',
        description: 'A man wrongly accused of murder must run for his life while trying to prove his innocence.',
        year: 2013,
        duration: 127,
        rating: {
            imdb: 6.9,
            userRating: 7.8,
            totalRatings: 980,
            translationRating: 4.7,
            totalTranslationRatings: 380
        },
        genres: ['action', 'thriller'],
        director: 'Director Name',
        writers: ['Writer 1'],
        originalLanguage: 'Korean',
        availableLanguages: ['Korean', 'Luganda'],
        country: 'South Korea',
        poster: 'https://image.tmdb.org/t/p/w500/jfINh7Wr6vWwNq5k0jZF6o5YpXA.jpg',
        video: {
            originalVideoPath: '/videos/running-man-original.mp4',
            lugandaVideoPath: '/videos/running-man-luganda.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        requiredPlan: 'free',
        status: 'published',
        featured: true,
        trending: true,
        views: 18900,
        likes: 1420,
        downloads: 280,
        tags: ['action', 'korean', 'thriller'],
        ageRating: 'PG-13',
        translationQuality: 4.7,
        translationDate: new Date('2024-02-10'),
        metaData: {
            tmdbId: '23456',
            imdbId: 'tt2345678'
        }
    },
    // VJ Jingo Movies
    {
        _id: '11',
        originalTitle: 'Baby\'s Day Out',
        lugandaTitle: 'Baby\'s Day Out (Luganda)',
        slug: 'babys-day-out-luganda',
        vjName: 'VJ Jingo',
        vjId: 'vj-jingo',
        description: 'Three bumbling criminals kidnap a baby for ransom, but the clever infant escapes and embarks on an adventurous day exploring the city. The baby\'s innocent journey through Chicago becomes a hilarious chase as the incompetent kidnappers try to recapture him.',
        lugandaDescription: 'Abazzi basatu abatalina magezi bakwata omwana omuto nga bamwetaaga ensimbi. Naye omwana omugezi adduka n\'atambula mu kibuga nga yeeyagalira.',
        year: 1994,
        duration: 99,
        rating: {
            imdb: 6.2,
            userRating: 7.5,
            totalRatings: 850,
            translationRating: 4.7,
            totalTranslationRatings: 320
        },
        genres: ['comedy', 'family', 'adventure'],
        cast: [
            { name: 'Joe Mantegna', character: 'Eddie' },
            { name: 'Lara Flynn Boyle', character: 'Laraine Cotwell' },
            { name: 'Joe Pantoliano', character: 'Norby' },
            { name: 'Brian Haley', character: 'Veeko' }
        ],
        director: 'Patrick Read Johnson',
        writers: ['John Hughes'],
        originalLanguage: 'English',
        availableLanguages: ['English', 'Luganda'],
        country: 'USA',
        poster: 'https://image.tmdb.org/t/p/w500/uKQB3HjGLGKyYqxwGlz5l8p5Yvz.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/aQs8OT4JqGJhH9JyJWkSZbqJqQh.jpg',
        video: {
            originalVideoPath: '/videos/babys-day-out-original.mp4',
            lugandaVideoPath: '/videos/babys-day-out-luganda.mp4',
            quality: 'hd',
            format: 'mp4'
        },
        requiredPlan: 'free',
        status: 'published',
        featured: true,
        trending: true,
        views: 18750,
        likes: 1580,
        downloads: 295,
        tags: ['comedy', 'family', 'baby', 'adventure', 'chicago', 'funny', 'classic'],
        ageRating: 'PG',
        translationQuality: 4.7,
        translationDate: new Date('2024-12-20'),
        translationNotes: 'High-quality Luganda translation by VJ Jingo. Perfect for family viewing.',
        metaData: {
            tmdbId: '11212',
            imdbId: 'tt0109190'
        }
    },
    // VJ Soul Series
    {
        _id: '7',
        originalTitle: 'War Season 1',
        lugandaTitle: 'War Season 1 (Luganda)',
        slug: 'war-season-1-luganda',
        vjName: 'VJ Soul',
        vjId: 'vj-soul',
        description: 'An epic war series that follows soldiers through intense battles and personal struggles. Season 1.',
        year: 2024,
        duration: 480,
        rating: {
            imdb: 8.1,
            userRating: 8.7,
            totalRatings: 2100,
            translationRating: 4.8,
            totalTranslationRatings: 780
        },
        genres: ['action', 'drama', 'thriller'],
        director: 'Director Name',
        writers: ['Writer 1', 'Writer 2'],
        originalLanguage: 'English',
        availableLanguages: ['English', 'Luganda'],
        country: 'USA',
        poster: 'https://image.tmdb.org/t/p/w500/6UH52Fmau8RPsMAbQbjwN3wJSCj.jpg',
        video: {
            originalVideoPath: '/videos/war-s1-original.mp4',
            lugandaVideoPath: '/videos/war-s1-luganda.mp4',
            quality: '4k',
            format: 'mp4'
        },
        requiredPlan: 'free',
        status: 'published',
        featured: true,
        trending: true,
        views: 35600,
        likes: 2850,
        downloads: 520,
        tags: ['war', 'series', 'action', 'drama'],
        ageRating: 'R',
        translationQuality: 4.8,
        translationDate: new Date('2024-03-01'),
        metaData: {
            tmdbId: '34567',
            imdbId: 'tt3456789'
        }
    }
];
