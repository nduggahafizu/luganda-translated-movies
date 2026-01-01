/* ===================================
   Movie Database Seeder
   Seeds database with Luganda translated movies
   =================================== */

require('dotenv').config();
const mongoose = require('mongoose');
const LugandaMovie = require('../models/LugandaMovie');

// Movies data to seed - genres must be lowercase to match schema
const moviesData = [
    // VJ Emmy Movies
    {
        originalTitle: 'Tommy Boy',
        lugandaTitle: 'Tommy Boy - Luganda',
        vjName: 'VJ Emmy',
        year: 1995,
        genres: ['comedy'],
        director: 'Peter Segal',
        duration: 97,
        description: 'Party animal Tommy Callahan is a dimwitted, good-natured heir to an auto-parts empire, who must save the family business by going on the road to sell brake pads.',
        poster: 'https://image.tmdb.org/t/p/w500/sZgBhOvT2Vj0Ds0mJNvuPLEaKCf.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/qJxzjUjCpTPvDHldNnlbRC4OqEh.jpg',
        video: { originalVideoPath: '/videos/tommy-boy.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.1, userRating: 3.4 },
        status: 'published'
    },
    {
        originalTitle: 'To the Limit',
        lugandaTitle: 'To the Limit - Luganda',
        vjName: 'VJ Emmy',
        year: 1995,
        genres: ['action'],
        director: 'Raymond Martino',
        duration: 96,
        description: 'A woman seeks revenge against the criminals who murdered her husband.',
        poster: 'https://image.tmdb.org/t/p/w500/rMHmXqxVBdLgzCdjpVPQRhTcz8x.jpg',
        video: { originalVideoPath: '/videos/to-the-limit.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 4.2, userRating: 6.7 },
        status: 'published'
    },
    {
        originalTitle: 'Secret Admirer',
        lugandaTitle: 'Secret Admirer - Luganda',
        vjName: 'VJ Emmy',
        year: 1985,
        genres: ['comedy', 'romance'],
        director: 'David Greenwalt',
        duration: 98,
        description: 'An anonymous love letter causes a series of misunderstandings in a small town.',
        poster: 'https://image.tmdb.org/t/p/w500/2Pt6LxAJnQp1nqWwIXt8G5LzqXP.jpg',
        video: { originalVideoPath: '/videos/secret-admirer.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.2, userRating: 5.7 },
        status: 'published'
    },
    {
        originalTitle: 'Prom Night',
        lugandaTitle: 'Prom Night - Luganda',
        vjName: 'VJ Emmy',
        year: 1980,
        genres: ['horror'],
        director: 'Paul Lynch',
        duration: 92,
        description: 'A masked killer stalks four teenagers at their high school prom, seeking revenge for an accidental death.',
        poster: 'https://image.tmdb.org/t/p/w500/6EYPKlfzJ9OLvuW4bNbRZBHGvl7.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/wQtYM0Y2YaVmWNXnQnqjLVjLKn0.jpg',
        video: { originalVideoPath: '/videos/prom-night.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 5.6, userRating: 6.3 },
        status: 'published'
    },
    {
        originalTitle: 'Cobra',
        lugandaTitle: 'Cobra - Luganda',
        vjName: 'VJ Emmy',
        year: 1986,
        genres: ['action', 'crime'],
        director: 'George P. Cosmatos',
        duration: 87,
        description: 'A tough-on-crime street cop must protect the only surviving witness to a strange murderous cult with ties to the Los Angeles underworld.',
        poster: 'https://image.tmdb.org/t/p/w500/lGloH8VDU8WKfEKkdI5cEdTn0AO.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/2RSirRqZKJqvJnNRq4uYOuqfaFf.jpg',
        video: { originalVideoPath: '/videos/cobra.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 5.9, userRating: 6.7 },
        status: 'published'
    },
    {
        originalTitle: 'Predator: Badlands',
        lugandaTitle: 'Predator: Badlands - Luganda',
        vjName: 'VJ Emmy',
        year: 2025,
        genres: ['action', 'sci-fi', 'horror'],
        director: 'Dan Trachtenberg',
        duration: 120,
        description: 'The Predator returns to Earth for a new hunt in the badlands.',
        poster: 'https://image.tmdb.org/t/p/w500/xNUqsfiIgFli3F7rnlrsMoeFffl.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/b3mdmjYTEL70j7nuXATUAD9qgu4.jpg',
        video: { originalVideoPath: '/videos/predator-badlands.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.9, userRating: 6.9 },
        status: 'published'
    },
    {
        originalTitle: 'Muzzle: City of Wolves',
        lugandaTitle: 'Muzzle: City of Wolves - Luganda',
        vjName: 'VJ Emmy',
        year: 2025,
        genres: ['action', 'thriller'],
        director: 'John Stalberg Jr.',
        duration: 105,
        description: 'A K-9 cop and his dog partner fight crime in a corrupt city.',
        poster: 'https://image.tmdb.org/t/p/w500/6AdXwFTRTAzggD2QUTt5B7JFGKL.jpg',
        video: { originalVideoPath: '/videos/muzzle.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.0, userRating: 6.9 },
        status: 'published'
    },
    {
        originalTitle: 'Dracula',
        lugandaTitle: 'Dracula - Luganda',
        vjName: 'VJ Emmy',
        year: 2022,
        genres: ['horror', 'romance'],
        director: 'Universal Pictures',
        duration: 110,
        description: 'A modern retelling of the classic vampire tale.',
        poster: 'https://image.tmdb.org/t/p/w500/sqj1FDkNO1SCn9qEXaJdU8tVXKV.jpg',
        video: { originalVideoPath: '/videos/dracula.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.7, userRating: 6.7 },
        status: 'published'
    },

    // VJ Ice P Movies
    {
        originalTitle: 'Hunting Jessica Brok',
        lugandaTitle: 'Hunting Jessica Brok - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'thriller'],
        director: 'Unknown',
        duration: 98,
        description: 'A dangerous game of cat and mouse unfolds as hunters become the hunted.',
        poster: 'https://image.tmdb.org/t/p/w500/zKqCcIjH7T6WJkbcKL8EBFJzKTz.jpg',
        video: { originalVideoPath: '/videos/hunting-jessica.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 4.5, userRating: 2.0 },
        status: 'published'
    },
    {
        originalTitle: 'Desert Lone Hero',
        lugandaTitle: 'Desert Lone Hero - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'adventure'],
        director: 'Unknown',
        duration: 105,
        description: 'A lone warrior fights for justice in the unforgiving desert.',
        poster: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
        video: { originalVideoPath: '/videos/desert-lone-hero.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.1, userRating: 6.1 },
        status: 'published'
    },
    {
        originalTitle: 'Madharaasi Part 1 Hindi',
        lugandaTitle: 'Madharaasi Part 1 - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'drama'],
        director: 'Prashanth Neel',
        duration: 150,
        description: 'An epic South Indian action drama - Part 1.',
        poster: 'https://image.tmdb.org/t/p/w500/j5cr2lQrBKhO9g0aX8I3bnqTM9.jpg',
        video: { originalVideoPath: '/videos/madharaasi-1.mp4', quality: 'hd' },
        requiredPlan: 'free',
        rating: { imdb: 7.5, userRating: 5.7 },
        status: 'published'
    },
    {
        originalTitle: 'Madharaasi Part 2 Hindi',
        lugandaTitle: 'Madharaasi Part 2 - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'drama'],
        director: 'Prashanth Neel',
        duration: 145,
        description: 'An epic South Indian action drama - Part 2.',
        poster: 'https://image.tmdb.org/t/p/w500/j5cr2lQrBKhO9g0aX8I3bnqTM9.jpg',
        video: { originalVideoPath: '/videos/madharaasi-2.mp4', quality: 'hd' },
        requiredPlan: 'free',
        rating: { imdb: 7.5, userRating: 6.7 },
        status: 'published'
    },
    {
        originalTitle: 'Thanal Part 1 Hindi',
        lugandaTitle: 'Thanal Part 1 - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['drama', 'thriller'],
        director: 'Malayalam Cinema',
        duration: 140,
        description: 'A gripping thriller from South India - Part 1.',
        poster: 'https://image.tmdb.org/t/p/w500/kTLxPiH0B0HKMpHvQjKkI8dAUpB.jpg',
        video: { originalVideoPath: '/videos/thanal-1.mp4', quality: 'hd' },
        requiredPlan: 'free',
        rating: { imdb: 7.0, userRating: 6.0 },
        status: 'published'
    },
    {
        originalTitle: 'Thanal Part 2 Hindi',
        lugandaTitle: 'Thanal Part 2 - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['drama', 'thriller'],
        director: 'Malayalam Cinema',
        duration: 135,
        description: 'A gripping thriller from South India - Part 2.',
        poster: 'https://image.tmdb.org/t/p/w500/kTLxPiH0B0HKMpHvQjKkI8dAUpB.jpg',
        video: { originalVideoPath: '/videos/thanal-2.mp4', quality: 'hd' },
        requiredPlan: 'free',
        rating: { imdb: 7.0, userRating: 6.0 },
        status: 'published'
    },
    {
        originalTitle: 'Kantara: A Legend Chapter 1 Part 2',
        lugandaTitle: 'Kantara Legend Part 2 - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'drama', 'thriller'],
        director: 'Rishab Shetty',
        duration: 160,
        description: 'The epic continuation of the Kantara legend.',
        poster: 'https://image.tmdb.org/t/p/w500/4WQFC2uGSgJZdM8JFLz0nxEbLbN.jpg',
        video: { originalVideoPath: '/videos/kantara-2.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 8.0, userRating: 7.1 },
        status: 'published'
    },

    // VJ Junior Movies
    {
        originalTitle: 'Office Christmas Party',
        lugandaTitle: 'Office Christmas Party - Luganda',
        vjName: 'VJ Junior',
        year: 2016,
        genres: ['comedy'],
        director: 'Josh Gordon',
        duration: 105,
        description: 'When his uptight CEO sister threatens to shut down his branch, the branch manager throws an epic Christmas party in order to land a big client and save the day.',
        poster: 'https://image.tmdb.org/t/p/w500/oYGJ0GXPjB6kqfdJDPG1zcvSHQR.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/dqm8r2FEMPb8EGwCfvLnCXhIhsj.jpg',
        video: { originalVideoPath: '/videos/office-christmas.mp4', quality: '4k' },
        requiredPlan: 'premium',
        rating: { imdb: 5.8, userRating: 6.5 },
        status: 'published'
    },
    {
        originalTitle: 'Now You See Me 3: Now You Dont',
        lugandaTitle: 'Now You See Me 3 - Luganda',
        vjName: 'VJ Junior',
        year: 2025,
        genres: ['action', 'thriller', 'crime'],
        director: 'Louis Leterrier',
        duration: 130,
        description: 'The Four Horsemen return for their most impossible heist yet.',
        poster: 'https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg',
        video: { originalVideoPath: '/videos/nysm3.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.9, userRating: 6.9 },
        status: 'published'
    },
    {
        originalTitle: 'Basic Instinct',
        lugandaTitle: 'Basic Instinct - Luganda',
        vjName: 'VJ Junior',
        year: 1992,
        genres: ['thriller', 'mystery'],
        director: 'Paul Verhoeven',
        duration: 127,
        description: 'A police detective is drawn into a web of seduction and murder by a beautiful crime novelist.',
        poster: 'https://image.tmdb.org/t/p/w500/fSn76XOxSgPHFnQIe0B7sCDPGFD.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/8EQMAG5oaLo7J2QOhVwVNbkC1Xm.jpg',
        video: { originalVideoPath: '/videos/basic-instinct.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.1, userRating: 5.8 },
        status: 'published'
    },
    {
        originalTitle: 'A Christmas Treasure',
        lugandaTitle: 'A Christmas Treasure - Luganda',
        vjName: 'VJ Junior',
        year: 2021,
        genres: ['romance', 'comedy'],
        director: 'Stefan Scaini',
        duration: 84,
        description: 'A heartwarming Christmas romance about finding love and treasure.',
        poster: 'https://image.tmdb.org/t/p/w500/gJL5kp5FMopB2sN4WZYnNT5uO5a.jpg',
        video: { originalVideoPath: '/videos/christmas-treasure.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.0, userRating: 6.0 },
        status: 'published'
    },
    {
        originalTitle: 'Welcome Home Roscoe Jenkins',
        lugandaTitle: 'Welcome Home Roscoe - Luganda',
        vjName: 'VJ Junior',
        year: 2008,
        genres: ['comedy'],
        director: 'Malcolm D. Lee',
        duration: 114,
        description: 'A talk show host returns to his Southern hometown for his parents anniversary and rediscovers his roots.',
        poster: 'https://image.tmdb.org/t/p/w500/s5sKKh3Xxv1T3Z9JqPxZWSTqWSJ.jpg',
        video: { originalVideoPath: '/videos/roscoe.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 5.1, userRating: 6.3 },
        status: 'published'
    },
    {
        originalTitle: 'Waiting to Exhale',
        lugandaTitle: 'Waiting to Exhale - Luganda',
        vjName: 'VJ Junior',
        year: 1995,
        genres: ['drama', 'romance'],
        director: 'Forest Whitaker',
        duration: 124,
        description: 'Four African-American women deal with relationships, careers, and friendship.',
        poster: 'https://image.tmdb.org/t/p/w500/wjIBPVaGrjlpLzXDqm7goGPz0Ar.jpg',
        video: { originalVideoPath: '/videos/waiting-exhale.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.1, userRating: 7.8 },
        status: 'published'
    },
    {
        originalTitle: 'Sisu 2: Road to Revenge',
        lugandaTitle: 'Sisu 2 - Luganda',
        vjName: 'VJ Junior',
        year: 2025,
        genres: ['action', 'adventure'],
        director: 'Jalmari Helander',
        duration: 110,
        description: 'The legendary Finnish soldier returns for another brutal mission.',
        poster: 'https://image.tmdb.org/t/p/w500/ygO9lowFMXWymATCrhoQXd6gCEh.jpg',
        video: { originalVideoPath: '/videos/sisu2.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.0, userRating: 5.9 },
        status: 'published'
    },
    {
        originalTitle: 'Margaux',
        lugandaTitle: 'Margaux - Luganda',
        vjName: 'VJ Junior',
        year: 2022,
        genres: ['horror', 'sci-fi'],
        director: 'Steven C. Miller',
        duration: 89,
        description: 'A group of college friends rent a luxury smart house for a weekend getaway, but the AI has deadly plans.',
        poster: 'https://image.tmdb.org/t/p/w500/m1K87JCSbWO1gAy2R9iqbPjvuFC.jpg',
        video: { originalVideoPath: '/videos/margaux.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 4.8, userRating: 6.3 },
        status: 'published'
    },
    {
        originalTitle: 'A Jazzmans Blues',
        lugandaTitle: 'A Jazzmans Blues - Luganda',
        vjName: 'VJ Junior',
        year: 2022,
        genres: ['drama', 'romance'],
        director: 'Tyler Perry',
        duration: 126,
        description: 'A forbidden love story set against the 1940s Deep South jazz scene.',
        poster: 'https://image.tmdb.org/t/p/w500/qVvyX7uvLKuJELPZS5VLZc8RLG7.jpg',
        video: { originalVideoPath: '/videos/jazzmans-blues.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.8, userRating: 7.4 },
        status: 'published'
    },
    {
        originalTitle: 'The Thomas Crown Affair',
        lugandaTitle: 'Thomas Crown Affair - Luganda',
        vjName: 'VJ Junior',
        year: 1999,
        genres: ['romance', 'thriller', 'crime'],
        director: 'John McTiernan',
        duration: 113,
        description: 'A billionaire businessman plays cat and mouse with an insurance investigator after stealing a priceless painting.',
        poster: 'https://image.tmdb.org/t/p/w500/3wTDrv6LJm6EvKqByQXEjgtcNPD.jpg',
        backdrop: 'https://image.tmdb.org/t/p/original/8KqqF4lkPCMf7mFLZNGG4nCJKvL.jpg',
        video: { originalVideoPath: '/videos/thomas-crown.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.8, userRating: 6.7 },
        status: 'published'
    },

    // TV Series
    {
        originalTitle: 'Walking on Thin Ice',
        lugandaTitle: 'Walking on Thin Ice - Luganda',
        vjName: 'VJ Fredy',
        year: 2025,
        genres: ['drama', 'romance'],
        director: 'Korean Drama',
        duration: 60,
        description: 'A Korean drama series about love and sacrifice.',
        poster: 'https://image.tmdb.org/t/p/w500/aKtxBKmQXVfH1Stqu1c2G3QLbNL.jpg',
        video: { originalVideoPath: '/videos/walking-thin-ice.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.5, userRating: 6.6 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Alex Rider',
        lugandaTitle: 'Alex Rider - Luganda',
        vjName: 'VJ Ice P',
        year: 2020,
        genres: ['action', 'drama', 'thriller'],
        director: 'Andreas Prochaska',
        duration: 45,
        description: 'A teenage spy reluctantly recruited into MI6.',
        poster: 'https://image.tmdb.org/t/p/w500/s79wvMsaJNxYPs3XKOzRjqYrfUX.jpg',
        video: { originalVideoPath: '/videos/alex-rider.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.1, userRating: 7.8 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Mr. Queen',
        lugandaTitle: 'Mr. Queen - Luganda',
        vjName: 'VJ Sammy',
        year: 2020,
        genres: ['comedy', 'drama', 'romance'],
        director: 'Yoon Sung-sik',
        duration: 70,
        description: 'A modern-day chef wakes up in the body of a Joseon-era queen.',
        poster: 'https://image.tmdb.org/t/p/w500/5cI44xK5ZNFQ0YSrJW3w5pKKXfJ.jpg',
        video: { originalVideoPath: '/videos/mr-queen.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 8.5, userRating: 8.5 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Coyote',
        lugandaTitle: 'Coyote - Luganda',
        vjName: 'VJ Baros',
        year: 2021,
        genres: ['drama', 'thriller'],
        director: 'Michael Chiklis',
        duration: 50,
        description: 'A border patrol agent discovers the human side of immigration.',
        poster: 'https://image.tmdb.org/t/p/w500/k2W0I1a3JDZnKyBnXBrGFGFLBF1.jpg',
        video: { originalVideoPath: '/videos/coyote.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 6.2, userRating: 7.8 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Man vs Baby',
        lugandaTitle: 'Man vs Baby - Luganda',
        vjName: 'VJ Junior',
        year: 2025,
        genres: ['comedy'],
        director: 'TV Series',
        duration: 30,
        description: 'A hilarious comedy series about the challenges of fatherhood.',
        poster: 'https://image.tmdb.org/t/p/w500/6VwCJUr6KF6VIwfXLVuUbLr7x0x.jpg',
        video: { originalVideoPath: '/videos/man-vs-baby.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.0, userRating: 7.3 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Rabbit Hole',
        lugandaTitle: 'Rabbit Hole - Luganda',
        vjName: 'VJ Junior',
        year: 2023,
        genres: ['drama', 'thriller'],
        director: 'John Requa',
        duration: 50,
        description: 'A corporate espionage expert becomes a target of the very system he helped create.',
        poster: 'https://image.tmdb.org/t/p/w500/goY5jvmTx3sVeTvHkbPRIhfHZi4.jpg',
        video: { originalVideoPath: '/videos/rabbit-hole.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.4, userRating: 7.1 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Genie, Make a Wish',
        lugandaTitle: 'Genie Make a Wish - Luganda',
        vjName: 'VJ M.K',
        year: 2025,
        genres: ['comedy', 'fantasy'],
        director: 'Thai Series',
        duration: 45,
        description: 'A magical comedy about wishes and their consequences.',
        poster: 'https://image.tmdb.org/t/p/w500/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
        video: { originalVideoPath: '/videos/genie-wish.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.3, userRating: 7.3 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Chasing in the Wild',
        lugandaTitle: 'Chasing in the Wild - Luganda',
        vjName: 'VJ Bonny',
        year: 2024,
        genres: ['action', 'drama'],
        director: 'Chinese Drama',
        duration: 45,
        description: 'An adventure series about survival in the wilderness.',
        poster: 'https://image.tmdb.org/t/p/w500/7Ebnf4IpOka6YNPt1YEgMt5FXa0.jpg',
        video: { originalVideoPath: '/videos/chasing-wild.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 8.0, userRating: 8.2 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Dear X',
        lugandaTitle: 'Dear X - Luganda',
        vjName: 'VJ Light',
        year: 2025,
        genres: ['drama', 'romance'],
        director: 'Korean Drama',
        duration: 60,
        description: 'A touching drama about letters to a lost love.',
        poster: 'https://image.tmdb.org/t/p/w500/8xWMh4vIJF6g7Z1YlnXKGSqLy3U.jpg',
        video: { originalVideoPath: '/videos/dear-x.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 8.0, userRating: 8.1 },
        contentType: 'series',
        status: 'published'
    },
    {
        originalTitle: 'Last Samurai Standing',
        lugandaTitle: 'Last Samurai Standing - Luganda',
        vjName: 'VJ Ice P',
        year: 2025,
        genres: ['action', 'drama'],
        director: 'Japanese Mini-Series',
        duration: 50,
        description: 'A mini-series about the last warriors of an ancient order.',
        poster: 'https://image.tmdb.org/t/p/w500/A9lQsmCwbw3aPCBPW4yoAqPJpJo.jpg',
        video: { originalVideoPath: '/videos/last-samurai.mp4', quality: 'hd' },
        requiredPlan: 'premium',
        rating: { imdb: 7.8, userRating: 8.0 },
        contentType: 'series',
        status: 'published'
    }
];

// Helper function to generate slug
function generateSlug(title, vjName) {
    const baseSlug = `${title}-${vjName}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    return baseSlug;
}

// Seed function
async function seedMovies() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies';
        console.log('📦 Connecting to MongoDB...');
        
        await mongoose.connect(mongoUri);
        
        console.log('✅ Connected to MongoDB');
        
        // Check existing movies
        const existingCount = await LugandaMovie.countDocuments();
        console.log(`📊 Existing movies in database: ${existingCount}`);
        
        // Prepare movies with slugs
        const moviesToInsert = moviesData.map(movie => ({
            ...movie,
            slug: generateSlug(movie.originalTitle, movie.vjName),
            contentType: movie.contentType || 'movie',
            language: 'Luganda',
            translationQuality: 4.5,
            views: Math.floor(Math.random() * 10000) + 100,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        
        // Insert movies (skip duplicates based on slug)
        let inserted = 0;
        let skipped = 0;
        
        for (const movie of moviesToInsert) {
            try {
                const exists = await LugandaMovie.findOne({ slug: movie.slug });
                if (exists) {
                    console.log(`⏭️  Skipping (exists): ${movie.originalTitle} by ${movie.vjName}`);
                    skipped++;
                } else {
                    await LugandaMovie.create(movie);
                    console.log(`✅ Added: ${movie.originalTitle} by ${movie.vjName}`);
                    inserted++;
                }
            } catch (err) {
                console.error(`❌ Error adding ${movie.originalTitle}:`, err.message);
            }
        }
        
        console.log('\n========================================');
        console.log(`✅ Seeding complete!`);
        console.log(`   - Inserted: ${inserted} movies`);
        console.log(`   - Skipped: ${skipped} (already exist)`);
        console.log(`   - Total in database: ${await LugandaMovie.countDocuments()}`);
        console.log('========================================\n');
        
        // Show summary by VJ
        const vjStats = await LugandaMovie.aggregate([
            { $group: { _id: '$vjName', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('Movies by VJ:');
        vjStats.forEach(vj => {
            console.log(`   ${vj._id}: ${vj.count} movies`);
        });
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
        process.exit(0);
    }
}

// Run seeder
seedMovies();
