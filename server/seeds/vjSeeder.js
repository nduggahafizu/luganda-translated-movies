const mongoose = require('mongoose');
const VJ = require('../models/VJ');
require('dotenv').config();

/* ===================================
   VJ Database Seeder
   Seeds database with known Ugandan VJs
   =================================== */

const vjs = [
    {
        name: 'Vj Jovan',
        fullName: 'Vj Jovan',
        bio: 'Popular movie translator known for action and thriller movies. Vj Jovan brings energy and clarity to Luganda translations.',
        profileImage: '/assets/images/vjs/vj-jovan.jpg',
        specialties: ['action', 'thriller', 'crime'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjjovan'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-jovan',
        kpSoundsId: 'vj-jovan',
        verified: false,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Clear and energetic narration style with good voice projection.',
        stats: {
            totalMovies: 70,
            totalViews: 150000,
            followers: 15000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Tom',
        fullName: 'Vj Tom',
        bio: 'Versatile translator specializing in comedy and drama. Vj Tom is known for his humorous and relatable translations.',
        profileImage: '/assets/images/vjs/vj-tom.jpg',
        specialties: ['comedy', 'drama', 'romance'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjtom'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-tom',
        kpSoundsId: 'vj-tom',
        verified: false,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Humorous and engaging with great timing for comedic content.',
        stats: {
            totalMovies: 85,
            totalViews: 180000,
            followers: 18000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Shao Khan',
        fullName: 'Vj Shao Khan',
        bio: 'Known for martial arts and action movies. Vj Shao Khan brings intensity to action-packed translations.',
        profileImage: '/assets/images/vjs/vj-shao-khan.jpg',
        specialties: ['action', 'martial-arts', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjshaokhan'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-shao-khan',
        kpSoundsId: 'vj-shao-khan',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Intense and dynamic, perfect for action sequences.',
        stats: {
            totalMovies: 60,
            totalViews: 120000,
            followers: 12000
        },
        rating: {
            overall: 4.4,
            translationQuality: 4.5,
            audioQuality: 4.3,
            consistency: 4.4
        }
    },
    {
        name: 'Vj Kevo',
        fullName: 'Vj Kevo',
        bio: 'Popular translator known for diverse content including action, comedy, and drama.',
        profileImage: '/assets/images/vjs/vj-kevo.jpg',
        specialties: ['action', 'comedy', 'drama'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2014,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjkevo'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-kevo',
        kpSoundsId: 'vj-kevo',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Versatile and consistent across multiple genres.',
        stats: {
            totalMovies: 95,
            totalViews: 200000,
            followers: 22000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Kevin',
        fullName: 'Vj Kevin',
        bio: 'Modern translator popular with younger audiences. Known for contemporary movies and series.',
        profileImage: '/assets/images/vjs/vj-kevin.jpg',
        specialties: ['action', 'thriller', 'sci-fi'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2018,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjkevin',
            youtube: 'https://www.youtube.com/@vjkevin'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-kevin',
        kpSoundsId: 'vj-kevin',
        verified: true,
        featured: true,
        popular: true,
        status: 'active',
        translationStyle: 'Modern and energetic style appealing to younger viewers.',
        stats: {
            totalMovies: 75,
            totalViews: 170000,
            followers: 19000
        },
        rating: {
            overall: 4.7,
            translationQuality: 4.7,
            audioQuality: 4.6,
            consistency: 4.7
        }
    },
    {
        name: 'Vj Kriss Sweet',
        fullName: 'Vj Kriss Sweet',
        bio: 'Specializes in romantic and drama content. Known for emotional and heartfelt translations.',
        profileImage: '/assets/images/vjs/vj-kriss-sweet.jpg',
        specialties: ['romance', 'drama', 'comedy'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjkrisssweet'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-kriss-sweet',
        kpSoundsId: 'vj-kriss-sweet',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Emotional and expressive, perfect for romantic content.',
        stats: {
            totalMovies: 55,
            totalViews: 110000,
            followers: 11000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Hd',
        fullName: 'Vj Hd',
        bio: 'Known for high-quality translations with excellent audio clarity.',
        profileImage: '/assets/images/vjs/vj-hd.jpg',
        specialties: ['action', 'thriller', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjhd'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-hd',
        kpSoundsId: 'vj-hd',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'High-quality audio with professional narration.',
        stats: {
            totalMovies: 80,
            totalViews: 165000,
            followers: 17000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.8,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Dan De',
        fullName: 'Vj Dan De',
        bio: 'Versatile translator with expertise in multiple genres from action to comedy.',
        profileImage: '/assets/images/vjs/vj-dan-de.jpg',
        specialties: ['action', 'comedy', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjdande'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-dan-de',
        kpSoundsId: 'vj-dan-de',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Versatile and adaptable to different movie types.',
        stats: {
            totalMovies: 65,
            totalViews: 130000,
            followers: 13000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Sammy',
        fullName: 'Vj Sammy',
        bio: 'Popular translator known for consistent quality across various genres.',
        profileImage: '/assets/images/vjs/vj-sammy.jpg',
        specialties: ['action', 'drama', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjsammy'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-sammy',
        kpSoundsId: 'vj-sammy',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Consistent and reliable with good voice quality.',
        stats: {
            totalMovies: 90,
            totalViews: 190000,
            followers: 20000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.7
        }
    },
    {
        name: 'Vj Ivo',
        fullName: 'Vj Ivo',
        bio: 'Experienced translator with a focus on action and thriller content.',
        profileImage: '/assets/images/vjs/vj-ivo.jpg',
        specialties: ['action', 'thriller', 'crime'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2014,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjivo'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-ivo',
        kpSoundsId: 'vj-ivo',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Strong narration for action-packed content.',
        stats: {
            totalMovies: 85,
            totalViews: 175000,
            followers: 18000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Isma K',
        fullName: 'Vj Isma K',
        bio: 'Known for diverse content and engaging narration style.',
        profileImage: '/assets/images/vjs/vj-isma-k.jpg',
        specialties: ['comedy', 'drama', 'romance'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjismak'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-isma-k',
        kpSoundsId: 'vj-isma-k',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Engaging and entertaining across multiple genres.',
        stats: {
            totalMovies: 60,
            totalViews: 125000,
            followers: 12500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'VJ Junior',
        fullName: 'VJ Junior',
        bio: 'One of Uganda\'s most popular and prolific movie translators. Known for high-quality Luganda translations of action, thriller, and sci-fi movies. VJ Junior has been translating movies for over a decade and has built a massive following across Uganda.',
        profileImage: '/assets/images/vjs/vj-junior.jpg',
        specialties: ['action', 'thriller', 'sci-fi', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2010,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjjuniorofficial',
            youtube: 'https://www.youtube.com/@vjjunior'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-junior',
        kpSoundsId: 'vj-junior',
        verified: true,
        featured: true,
        popular: true,
        status: 'active',
        translationStyle: 'Known for energetic and engaging translations with excellent voice modulation. Maintains cultural relevance while staying true to the original content.',
        signature: 'Webale kunonyereza! (Thanks for watching!)',
        stats: {
            totalMovies: 150,
            totalViews: 500000,
            followers: 50000
        },
        rating: {
            overall: 4.8,
            translationQuality: 4.9,
            audioQuality: 4.7,
            consistency: 4.8
        }
    },
    {
        name: 'Vj Little T',
        fullName: 'Vj Little T',
        bio: 'Young and energetic translator specializing in modern blockbusters and superhero movies. VJ Little T brings fresh energy to Luganda movie translations.',
        profileImage: '/assets/images/vjs/vj-little-t.jpg',
        specialties: ['action', 'sci-fi', 'superhero', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjlittlet',
            youtube: 'https://www.youtube.com/@vjlittlet',
            tiktok: 'https://www.tiktok.com/@vjlittlet'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-litle-t',
        kpSoundsId: 'vj-litle-t',
        verified: true,
        featured: true,
        popular: true,
        status: 'active',
        translationStyle: 'Modern and energetic style. Popular among younger audiences for superhero and sci-fi translations.',
        signature: 'Ekyo kyali kya maanyi! (That was powerful!)',
        stats: {
            totalMovies: 80,
            totalViews: 250000,
            followers: 30000
        },
        rating: {
            overall: 4.7,
            translationQuality: 4.7,
            audioQuality: 4.6,
            consistency: 4.7
        }
    },
    {
        name: 'VJ Ice P',
        fullName: 'VJ Ice P',
        bio: 'Renowned for translating Asian cinema, particularly Chinese martial arts films and Korean dramas. VJ Ice P brings a unique style to Luganda translations, making complex storylines accessible to Ugandan audiences.',
        profileImage: '/assets/images/vjs/vj-ice-p.jpg',
        specialties: ['action', 'martial-arts', 'drama', 'asian-cinema'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2012,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjicep',
            youtube: 'https://www.youtube.com/@vjicep'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-ice-p',
        kpSoundsId: 'vj-ice-p',
        verified: true,
        featured: true,
        popular: true,
        status: 'active',
        translationStyle: 'Specializes in Asian cinema with clear narration and cultural adaptation. Known for making complex plots easy to follow.',
        signature: 'Kino kyakoma! (This is amazing!)',
        stats: {
            totalMovies: 120,
            totalViews: 350000,
            followers: 35000
        },
        rating: {
            overall: 4.7,
            translationQuality: 4.8,
            audioQuality: 4.6,
            consistency: 4.7
        }
    },
    {
        name: 'VJ Emmy',
        fullName: 'VJ Emmy',
        bio: 'Popular translator known for romantic comedies, dramas, and family-friendly content. VJ Emmy has a talent for bringing emotional depth to Luganda translations.',
        profileImage: '/assets/images/vjs/vj-emmy.jpg',
        specialties: ['romance', 'comedy', 'drama', 'family'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2013,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjemmy',
            youtube: 'https://www.youtube.com/@vjemmy'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-emmy',
        kpSoundsId: 'vj-emmy',
        verified: true,
        featured: true,
        popular: true,
        status: 'active',
        translationStyle: 'Emotional and expressive translations. Excellent at conveying romantic and dramatic scenes with cultural sensitivity.',
        signature: 'Omukwano gwa mazima! (True love!)',
        stats: {
            totalMovies: 100,
            totalViews: 280000,
            followers: 28000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'VJ Jingo',
        fullName: 'VJ Jingo',
        bio: 'Veteran translator with a focus on classic Hollywood films and action movies. VJ Jingo is known for his deep voice and authoritative narration style.',
        profileImage: '/assets/images/vjs/vj-jingo.jpg',
        specialties: ['action', 'thriller', 'crime', 'classic-films'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2008,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjjingo'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-jingo',
        kpSoundsId: 'vj-jingo',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Classic narration style with deep voice. Known for translating Hollywood classics and action-packed thrillers.',
        stats: {
            totalMovies: 90,
            totalViews: 200000,
            followers: 20000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.4
        }
    },
    {
        name: 'VJ Mark',
        fullName: 'VJ Mark',
        bio: 'Experienced translator specializing in war movies, historical dramas, and epic films. Known for detailed narration.',
        profileImage: '/assets/images/vjs/vj-mark.jpg',
        specialties: ['war', 'history', 'epic', 'drama'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2011,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjmark'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-mark',
        kpSoundsId: 'vj-mark',
        verified: true,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Detailed and informative. Excellent at historical context and epic storytelling.',
        stats: {
            totalMovies: 65,
            totalViews: 120000,
            followers: 12000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'VJ Bonny',
        fullName: 'VJ Bonny',
        bio: 'Popular for comedy translations and light-hearted content. VJ Bonny brings humor and entertainment to Luganda movies.',
        profileImage: '/assets/images/vjs/vj-bonny.jpg',
        specialties: ['comedy', 'family', 'animation', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjbonny',
            youtube: 'https://www.youtube.com/@vjbonny'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-bonny',
        kpSoundsId: 'vj-bonny',
        verified: false,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Humorous and entertaining. Great at comedy timing and family-friendly content.',
        signature: 'Ekisesa nnyo! (Very funny!)',
        stats: {
            totalMovies: 60,
            totalViews: 180000,
            followers: 18000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'VJ Light',
        fullName: 'VJ Light',
        bio: 'Emerging talent in the VJ community, focusing on Korean dramas and Asian content. Bringing K-drama culture to Uganda.',
        profileImage: '/assets/images/vjs/vj-light.jpg',
        specialties: ['drama', 'romance', 'korean-drama', 'asian-cinema'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2019,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjlight',
            instagram: 'https://www.instagram.com/vjlight',
            tiktok: 'https://www.tiktok.com/@vjlight'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-light',
        kpSoundsId: 'vj-light',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Specializes in K-dramas with cultural adaptation. Popular among younger, K-drama loving audiences.',
        stats: {
            totalMovies: 40,
            totalViews: 90000,
            followers: 12000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'VJ M.K',
        fullName: 'VJ M.K',
        bio: 'Versatile translator with experience across multiple genres. Known for consistent quality and reliable translations.',
        profileImage: '/assets/images/vjs/vj-mk.jpg',
        specialties: ['action', 'drama', 'thriller', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjmk'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-mk',
        kpSoundsId: 'vj-mk',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Consistent and reliable across multiple genres. Known for professional quality.',
        stats: {
            totalMovies: 55,
            totalViews: 110000,
            followers: 11000
        },
        rating: {
            overall: 4.4,
            translationQuality: 4.5,
            audioQuality: 4.3,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Mox',
        fullName: 'Vj Mox',
        bio: 'Versatile translator known for horror, thriller, and mystery movies. VJ Mox excels at creating suspenseful atmospheres in Luganda.',
        profileImage: '/assets/images/vjs/vj-mox.jpg',
        specialties: ['horror', 'thriller', 'mystery', 'suspense'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2014,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjmox'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-mox',
        kpSoundsId: 'vj-mox',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Master of suspense and horror. Creates tension through voice modulation and pacing.',
        stats: {
            totalMovies: 70,
            totalViews: 150000,
            followers: 15000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Muba',
        fullName: 'Vj Muba',
        bio: 'Popular translator known for action and adventure content.',
        profileImage: '/assets/images/vjs/vj-muba.jpg',
        specialties: ['action', 'adventure', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjmuba'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-muba',
        kpSoundsId: 'vj-muba',
        verified: false,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Energetic and action-focused narration.',
        stats: {
            totalMovies: 75,
            totalViews: 155000,
            followers: 16000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Eddy',
        fullName: 'Vj Eddy',
        bio: 'Experienced translator with diverse content portfolio.',
        profileImage: '/assets/images/vjs/vj-eddy.jpg',
        specialties: ['drama', 'comedy', 'romance'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjeddy'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-eddy',
        kpSoundsId: 'vj-eddy',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Versatile across multiple genres.',
        stats: {
            totalMovies: 65,
            totalViews: 135000,
            followers: 13500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Kam',
        fullName: 'Vj Kam',
        bio: 'Known for thriller and crime translations.',
        profileImage: '/assets/images/vjs/vj-kam.jpg',
        specialties: ['thriller', 'crime', 'mystery'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjkam'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-kam',
        kpSoundsId: 'vj-kam',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Suspenseful and engaging narration.',
        stats: {
            totalMovies: 55,
            totalViews: 115000,
            followers: 11500
        },
        rating: {
            overall: 4.4,
            translationQuality: 4.5,
            audioQuality: 4.3,
            consistency: 4.4
        }
    },
    {
        name: 'Vj Lance',
        fullName: 'Vj Lance',
        bio: 'Modern translator popular with younger audiences.',
        profileImage: '/assets/images/vjs/vj-lance.jpg',
        specialties: ['action', 'sci-fi', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2018,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjlance',
            youtube: 'https://www.youtube.com/@vjlance'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-lance',
        kpSoundsId: 'vj-lance',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Modern and engaging style.',
        stats: {
            totalMovies: 50,
            totalViews: 105000,
            followers: 10500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj KS',
        fullName: 'Vj KS',
        bio: 'Versatile translator with consistent quality output.',
        profileImage: '/assets/images/vjs/vj-ks.jpg',
        specialties: ['action', 'drama', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjks'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-ks',
        kpSoundsId: 'vj-ks',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Consistent and professional.',
        stats: {
            totalMovies: 60,
            totalViews: 125000,
            followers: 12500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Ulio',
        fullName: 'Vj Ulio',
        bio: 'Known for action and adventure translations.',
        profileImage: '/assets/images/vjs/vj-ulio.jpg',
        specialties: ['action', 'adventure', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjulio'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-ulio',
        kpSoundsId: 'vj-ulio',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Action-packed and energetic.',
        stats: {
            totalMovies: 85,
            totalViews: 175000,
            followers: 18000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Aaron',
        fullName: 'Vj Aaron',
        bio: 'Popular for diverse content across multiple genres.',
        profileImage: '/assets/images/vjs/vj-aaron.jpg',
        specialties: ['comedy', 'drama', 'romance'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjaaron'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-aaron',
        kpSoundsId: 'vj-aaron',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Versatile and entertaining.',
        stats: {
            totalMovies: 60,
            totalViews: 125000,
            followers: 12500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Cabs',
        fullName: 'Vj Cabs',
        bio: 'Known for consistent quality translations.',
        profileImage: '/assets/images/vjs/vj-cabs.jpg',
        specialties: ['action', 'thriller', 'drama'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjcabs'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-cabs',
        kpSoundsId: 'vj-cabs',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Professional and consistent.',
        stats: {
            totalMovies: 80,
            totalViews: 165000,
            followers: 17000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Banks',
        fullName: 'Vj Banks',
        bio: 'Experienced translator with wide appeal.',
        profileImage: '/assets/images/vjs/vj-banks.jpg',
        specialties: ['action', 'adventure', 'comedy'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjbanks'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-banks',
        kpSoundsId: 'vj-banks',
        verified: false,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Engaging and entertaining.',
        stats: {
            totalMovies: 75,
            totalViews: 155000,
            followers: 16000
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Jimmy',
        fullName: 'Vj Jimmy',
        bio: 'Popular translator known for action content.',
        profileImage: '/assets/images/vjs/vj-jimmy.jpg',
        specialties: ['action', 'thriller', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjjimmy'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-jimmy',
        kpSoundsId: 'vj-jimmy',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Energetic action narration.',
        stats: {
            totalMovies: 65,
            totalViews: 135000,
            followers: 13500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Baros',
        fullName: 'Vj Baros',
        bio: 'Known for diverse content translations.',
        profileImage: '/assets/images/vjs/vj-baros.jpg',
        specialties: ['drama', 'action', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjbaros'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-baros',
        kpSoundsId: 'vj-baros',
        verified: true,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Professional and versatile.',
        stats: {
            totalMovies: 70,
            totalViews: 145000,
            followers: 14500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Kimuli',
        fullName: 'Vj Kimuli',
        bio: 'Popular translator with consistent quality.',
        profileImage: '/assets/images/vjs/vj-kimuli.jpg',
        specialties: ['action', 'comedy', 'drama'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjkimuli'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-kimuli',
        kpSoundsId: 'vj-kimuli',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Reliable and entertaining.',
        stats: {
            totalMovies: 80,
            totalViews: 165000,
            followers: 17000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.6,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Fredy',
        fullName: 'Vj Fredy',
        bio: 'Known for action and thriller translations.',
        profileImage: '/assets/images/vjs/vj-fredy.jpg',
        specialties: ['action', 'thriller', 'crime'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjfredy'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-fredy',
        kpSoundsId: 'vj-fredy',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Intense and engaging.',
        stats: {
            totalMovies: 85,
            totalViews: 175000,
            followers: 18000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Jumpers',
        fullName: 'Vj Jumpers',
        bio: 'Versatile translator with diverse portfolio.',
        profileImage: '/assets/images/vjs/vj-jumpers.jpg',
        specialties: ['action', 'adventure', 'comedy'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjjumpers'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-jumpers',
        kpSoundsId: 'vj-jumpers',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Energetic and entertaining.',
        stats: {
            totalMovies: 60,
            totalViews: 125000,
            followers: 12500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Ashim',
        fullName: 'Vj Ashim',
        bio: 'Known for quality translations across genres.',
        profileImage: '/assets/images/vjs/vj-ashim.jpg',
        specialties: ['drama', 'romance', 'comedy'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2016,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjashim'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-ashim',
        kpSoundsId: 'vj-ashim',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Professional and consistent.',
        stats: {
            totalMovies: 65,
            totalViews: 135000,
            followers: 13500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Pauleta',
        fullName: 'Vj Pauleta',
        bio: 'Popular translator with wide audience appeal.',
        profileImage: '/assets/images/vjs/vj-pauleta.jpg',
        specialties: ['action', 'thriller', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjpauleta'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-pauleta',
        kpSoundsId: 'vj-pauleta',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Engaging and professional.',
        stats: {
            totalMovies: 90,
            totalViews: 185000,
            followers: 19000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Martin K',
        fullName: 'Vj Martin K',
        bio: 'Experienced translator known for diverse content.',
        profileImage: '/assets/images/vjs/vj-martin-k.jpg',
        specialties: ['action', 'drama', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2014,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjmartink'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-martin-k',
        kpSoundsId: 'vj-martin-k',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Professional and reliable.',
        stats: {
            totalMovies: 95,
            totalViews: 195000,
            followers: 20000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Henrico',
        fullName: 'Vj Henrico',
        bio: 'Modern translator with fresh perspective.',
        profileImage: '/assets/images/vjs/vj-henrico.jpg',
        specialties: ['action', 'sci-fi', 'adventure'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2018,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjhenrico',
            youtube: 'https://www.youtube.com/@vjhenrico'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-henrico',
        kpSoundsId: 'vj-henrico',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Modern and energetic.',
        stats: {
            totalMovies: 55,
            totalViews: 115000,
            followers: 11500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.5,
            audioQuality: 4.4,
            consistency: 4.5
        }
    },
    {
        name: 'Vj Uncle T',
        fullName: 'Vj Uncle T',
        bio: 'Veteran translator with extensive experience.',
        profileImage: '/assets/images/vjs/vj-uncle-t.jpg',
        specialties: ['action', 'thriller', 'crime'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2012,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjunclet'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-uncle-t',
        kpSoundsId: 'vj-uncle-t',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Experienced and authoritative.',
        stats: {
            totalMovies: 100,
            totalViews: 210000,
            followers: 22000
        },
        rating: {
            overall: 4.7,
            translationQuality: 4.7,
            audioQuality: 4.6,
            consistency: 4.7
        }
    },
    {
        name: 'Vj Soul',
        fullName: 'Vj Soul',
        bio: 'Known for emotional and dramatic translations.',
        profileImage: '/assets/images/vjs/vj-soul.jpg',
        specialties: ['drama', 'romance', 'thriller'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2015,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjsoul'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-soul',
        kpSoundsId: 'vj-soul',
        verified: true,
        featured: false,
        popular: true,
        status: 'active',
        translationStyle: 'Emotional and expressive.',
        stats: {
            totalMovies: 85,
            totalViews: 175000,
            followers: 18000
        },
        rating: {
            overall: 4.6,
            translationQuality: 4.7,
            audioQuality: 4.5,
            consistency: 4.6
        }
    },
    {
        name: 'Vj Nelly',
        fullName: 'Vj Nelly',
        bio: 'Popular for diverse content across multiple genres.',
        profileImage: '/assets/images/vjs/vj-nelly.jpg',
        specialties: ['comedy', 'drama', 'romance'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjnelly'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-nelly',
        kpSoundsId: 'vj-nelly',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Versatile and entertaining.',
        stats: {
            totalMovies: 70,
            totalViews: 145000,
            followers: 14500
        },
        rating: {
            overall: 4.5,
            translationQuality: 4.6,
            audioQuality: 4.4,
            consistency: 4.5
        }
    }
];

async function seedVJs() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies');

        console.log('Connected to MongoDB');

        // Clear existing VJs (optional - comment out if you want to keep existing data)
        await VJ.deleteMany({});
        console.log('Cleared existing VJs');

        // Insert VJs
        for (const vjData of vjs) {
            const existingVJ = await VJ.findOne({ name: vjData.name });
            
            if (existingVJ) {
                console.log(`VJ ${vjData.name} already exists, updating...`);
                await VJ.findByIdAndUpdate(existingVJ._id, vjData);
            } else {
                console.log(`Creating VJ ${vjData.name}...`);
                await VJ.create(vjData);
            }
        }

        console.log(`\n✅ Successfully seeded ${vjs.length} VJs!`);
        console.log('\nVJ Summary:');
        console.log(`- Verified: ${vjs.filter(v => v.verified).length}`);
        console.log(`- Featured: ${vjs.filter(v => v.featured).length}`);
        console.log(`- Popular: ${vjs.filter(v => v.popular).length}`);
        console.log(`- Active: ${vjs.filter(v => v.status === 'active').length}`);

        // Display VJ list
        console.log('\nSeeded VJs:');
        vjs.forEach((vj, index) => {
            console.log(`${index + 1}. ${vj.name} - ${vj.specialties.join(', ')}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding VJs:', error);
        process.exit(1);
    }
}

// Run seeder
seedVJs();
