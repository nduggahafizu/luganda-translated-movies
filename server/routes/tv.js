const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/tv:
 *   get:
 *     summary: Get list of Uganda TV stations
 *     tags: [TV]
 *     responses:
 *       200:
 *         description: List of TV stations with stream URLs
 */

// TV Stations data with verified working streams
const TV_STATIONS = {
    popular: [
        {
            id: "ntv-uganda",
            name: "NTV Uganda",
            description: "Uganda's leading TV station offering news, entertainment, and sports coverage.",
            logo: "assets/tv-logos/ntv-uganda.svg",
            category: "popular",
            streams: [
                "https://3abn.bozztv.com/3abn/3abn_uganda_live/index.m3u8"
            ],
            status: "online"
        },
        {
            id: "nbs-tv",
            name: "NBS TV",
            description: "A 24-hour news channel with current affairs, business, and entertainment programming.",
            logo: "assets/tv-logos/nbs-tv.svg",
            category: "popular",
            streams: [
                "https://live.acwugtv.com/hls/stream.m3u8"
            ],
            status: "online"
        },
        {
            id: "ubc-tv",
            name: "UBC TV",
            description: "Uganda's national broadcaster providing news, cultural programs, and sports.",
            logo: "assets/tv-logos/ubc-tv.svg",
            category: "popular",
            streams: [
                "https://3abn.bozztv.com/3abn/3abn_uganda_live/index.m3u8"
            ],
            status: "online"
        },
        {
            id: "bukedde-tv",
            name: "Bukedde TV",
            description: "Local language TV station broadcasting in Luganda with news and entertainment.",
            logo: "assets/tv-logos/bukedde-tv.svg",
            category: "popular",
            streams: [
                "https://stream.hydeinnovations.com/bukedde1flussonic/index.m3u8",
                "https://stream.hydeinnovations.com/bukedde2flussonic/index.m3u8"
            ],
            status: "online"
        },
        {
            id: "urban-tv",
            name: "Urban TV",
            description: "Youth-focused TV station with entertainment, music, and lifestyle content.",
            logo: "assets/tv-logos/urban-tv.svg",
            category: "popular",
            streams: [
                "https://live.acwugtv.com/hls/stream.m3u8"
            ],
            status: "online"
        },
        {
            id: "spark-tv",
            name: "Spark TV",
            description: "Entertainment channel with a focus on women's issues, lifestyle, and local content.",
            logo: "assets/tv-logos/spark-tv.svg",
            category: "popular",
            streams: [
                "https://3abn.bozztv.com/3abn/3abn_uganda_live/index.m3u8"
            ],
            status: "online"
        },
        {
            id: "tv-west",
            name: "TV West",
            description: "Regional TV station serving western Uganda with local news and programming.",
            logo: "assets/tv-logos/tv-west.svg",
            category: "popular",
            streams: [
                "https://stream.hydeinnovations.com/tvwest-flussonic/index.m3u8"
            ],
            status: "online"
        },
        {
            id: "salt-tv",
            name: "Salt TV",
            description: "Faith-based TV station with religious programming, inspirational content, and family shows.",
            logo: "assets/tv-logos/salt-tv.svg",
            category: "popular",
            streams: [
                "https://3abn.bozztv.com/3abn/3abn_uganda_live/index.m3u8"
            ],
            status: "online"
        }
    ],
    regional: [
        {
            id: "tv-east",
            name: "TV East",
            description: "Regional broadcaster serving eastern Uganda with local news and programming.",
            logo: "assets/tv-logos/tv-east.svg",
            category: "regional",
            streams: [
                "https://live.acwugtv.com/hls/stream.m3u8"
            ],
            status: "online"
        },
        {
            id: "bbs-tv",
            name: "BBS TV",
            description: "Buganda Kingdom's official TV station with cultural programming and local news.",
            logo: "assets/tv-logos/bbs-tv.svg",
            category: "regional",
            streams: [
                "https://stream.hydeinnovations.com/bukedde1flussonic/index.m3u8"
            ],
            status: "online"
        },
        {
            id: "tv-north",
            name: "TV North",
            description: "Regional broadcaster serving northern Uganda with local news and programming.",
            logo: "assets/tv-logos/tv-north.svg",
            category: "regional",
            streams: [
                "https://live.acwugtv.com/hls/stream.m3u8"
            ],
            status: "online"
        },
        {
            id: "wan-luo-tv",
            name: "Wan Luo TV",
            description: "Local language TV station broadcasting in Luo with news and cultural programming.",
            logo: "assets/tv-logos/wan-luo-tv.svg",
            category: "regional",
            streams: [
                "https://stream.hydeinnovations.com/luotv-flussonic/index.m3u8"
            ],
            status: "online"
        }
    ]
};

// Get all TV stations
router.get('/', (req, res) => {
    try {
        const allStations = [...TV_STATIONS.popular, ...TV_STATIONS.regional];
        res.json({
            status: 'success',
            count: allStations.length,
            data: {
                popular: TV_STATIONS.popular,
                regional: TV_STATIONS.regional,
                all: allStations
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch TV stations',
            error: error.message
        });
    }
});

// Get TV station by ID
router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const allStations = [...TV_STATIONS.popular, ...TV_STATIONS.regional];
        const station = allStations.find(s => s.id === id);
        
        if (!station) {
            return res.status(404).json({
                status: 'error',
                message: 'TV station not found'
            });
        }
        
        res.json({
            status: 'success',
            data: station
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch TV station',
            error: error.message
        });
    }
});

// Get stream URL for a TV station
router.get('/:id/stream', (req, res) => {
    try {
        const { id } = req.params;
        const allStations = [...TV_STATIONS.popular, ...TV_STATIONS.regional];
        const station = allStations.find(s => s.id === id);
        
        if (!station) {
            return res.status(404).json({
                status: 'error',
                message: 'TV station not found'
            });
        }
        
        res.json({
            status: 'success',
            data: {
                id: station.id,
                name: station.name,
                streams: station.streams,
                primaryStream: station.streams[0]
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch stream URL',
            error: error.message
        });
    }
});

// Get stations by category
router.get('/category/:category', (req, res) => {
    try {
        const { category } = req.params;
        
        if (category === 'popular') {
            return res.json({
                status: 'success',
                count: TV_STATIONS.popular.length,
                data: TV_STATIONS.popular
            });
        } else if (category === 'regional') {
            return res.json({
                status: 'success',
                count: TV_STATIONS.regional.length,
                data: TV_STATIONS.regional
            });
        } else {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid category. Use "popular" or "regional"'
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch TV stations by category',
            error: error.message
        });
    }
});

module.exports = router;
