const mongoose = require('mongoose');
const VJ = require('../models/VJ');
require('dotenv').config();

/* ===================================
   VJ Database Seeder
   Seeds database with known Ugandan VJs
   =================================== */

const vjs = [
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
        name: 'VJ Little T',
        fullName: 'VJ Little T',
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
        name: 'VJ Mox',
        fullName: 'VJ Mox',
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
        popular: false,
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
        name: 'VJ Kevo',
        fullName: 'VJ Kevo',
        bio: 'Emerging translator with a focus on contemporary dramas and indie films. VJ Kevo brings a fresh perspective to Luganda translations.',
        profileImage: '/assets/images/vjs/vj-kevo.jpg',
        specialties: ['drama', 'indie', 'documentary', 'biography'],
        languages: ['Luganda', 'English'],
        yearsActive: {
            start: 2017,
            end: new Date().getFullYear()
        },
        socialMedia: {
            facebook: 'https://www.facebook.com/vjkevo',
            instagram: 'https://www.instagram.com/vjkevo'
        },
        kpSoundsProfile: 'https://watch.kpsounds.com/category/vj-kevo',
        kpSoundsId: 'vj-kevo',
        verified: false,
        featured: false,
        popular: false,
        status: 'active',
        translationStyle: 'Thoughtful and nuanced translations. Focuses on character development and emotional depth.',
        stats: {
            totalMovies: 50,
            totalViews: 100000,
            followers: 10000
        },
        rating: {
            overall: 4.4,
            translationQuality: 4.5,
            audioQuality: 4.3,
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
    }
];

async function seedVJs() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luganda-movies');

        console.log('Connected to MongoDB');

        // Clear existing VJs (optional - comment out if you want to keep existing data)
        // await VJ.deleteMany({});
        // console.log('Cleared existing VJs');

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
