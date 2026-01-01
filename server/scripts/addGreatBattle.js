const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority';

async function addMovie() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected!');

        const movie = {
            originalTitle: 'The Great Battle',
            lugandaTitle: 'Olutalo Olunene',
            title: 'The Great Battle',
            slug: 'the-great-battle-vj-ice-p',
            overview: 'In 645 AD, the Tang dynasty raises a massive force to invade Goguryeo. The Goguryeo troops, led by General Yang Man-chun, defend the strategic fortress Ansi against the overwhelming Tang army in an epic 88-day battle.',
            description: 'In 645 AD, General Yang Man-chun and his soldiers defend the Ansi fortress against the invading Tang dynasty army in an epic 88-day battle.',
            releaseDate: new Date('2018-09-19'),
            year: 2018,
            runtime: 136,
            duration: 136,
            genres: ['action', 'drama', 'history', 'war'],
            poster: 'https://image.tmdb.org/t/p/w500/udFVRP6MXBiG0O58xUBCHnQy9Y5.jpg',
            backdrop: 'https://image.tmdb.org/t/p/original/5a7cocgyVuFubJYjxqE9M0SXQGD.jpg',
            rating: { imdb: 7.0, userRating: 7.0, totalRatings: 0 },
            originalLanguage: 'ko',
            country: 'South Korea',
            director: 'Kim Kwang-sik',
            vjName: 'VJ Ice P',
            video: {
                originalVideoPath: 'streamtape',
                lugandaVideoPath: null,
                embedUrl: 'https://streamtape.com/e/ggzPYa3Q2AuqWkz/',
                streamtapeId: 'ggzPYa3Q2AuqWkz',
                provider: 'streamtape',
                quality: 'hd',
                duration: 136,
                format: 'mp4'
            },
            status: 'published',
            featured: true,
            trending: true,
            views: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await mongoose.connection.db.collection('lugandamovies').insertOne(movie);
        console.log('Movie added! ID:', result.insertedId);
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('Connection closed');
    }
}

addMovie();
