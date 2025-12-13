# Kp Sounds Watch Integration Plan

## Overview
Build a legal, compliant Luganda movie streaming platform that:
- Uses TMDB API for movie metadata (100% legal)
- Links to Kp Sounds Watch for video content (no copyright infringement)
- Maintains a database of Ugandan VJs and their translations
- Provides a modern, user-friendly interface

## Phase 1: TMDB API Integration

### 1.1 TMDB Setup
- Register for free TMDB API key at https://www.themoviedb.org/settings/api
- API provides:
  - Movie metadata (titles, descriptions, posters, ratings)
  - Cast and crew information
  - Trailers and images
  - Genre information
  - 100% legal to use with attribution

### 1.2 TMDB API Client
Create `js/tmdb-api.js`:
- Search movies by title
- Get movie details
- Get popular/trending movies
- Get movie cast and crew
- Get movie images and posters
- Get movie videos/trailers

### 1.3 Backend TMDB Integration
Create `server/services/tmdbService.js`:
- Fetch and cache movie data
- Sync with local database
- Update movie metadata periodically

## Phase 2: VJ Database System

### 2.1 VJ Model Enhancement
Update `server/models/VJ.js`:
```javascript
{
  name: "VJ Junior",
  slug: "vj-junior",
  bio: "Top Ugandan movie translator",
  profileImage: "/images/vjs/vj-junior.jpg",
  socialMedia: {
    facebook: "...",
    youtube: "...",
    instagram: "..."
  },
  specialties: ["Action", "Thriller"],
  totalMovies: 150,
  totalViews: 500000,
  rating: 4.8,
  verified: true,
  kpSoundsProfile: "https://watch.kpsounds.com/category/vj-junior"
}
```

### 2.2 Known Ugandan VJs
- VJ Junior (most popular)
- VJ Ice P
- VJ Emmy
- VJ Jingo
- VJ Little T
- VJ Mox
- VJ Kevo
- VJ Mark
- VJ Bonny
- VJ Light
- VJ M.K

### 2.3 VJ-Movie Mapping
Create `server/models/VJTranslation.js`:
```javascript
{
  movieId: "tmdb_12345",
  originalTitle: "Fast & Furious 9",
  lugandaTitle: "Abantu Abangufu 9",
  vjId: "vj-junior",
  translationQuality: 4.5,
  kpSoundsUrl: "https://watch.kpsounds.com/movie/...",
  translationDate: "2023-06-15",
  audioQuality: "HD",
  subtitles: ["Luganda", "English"]
}
```

## Phase 3: Content Linking Strategy (Legal Approach)

### 3.1 Video Embedding Options
**Option A: Direct Link to Kp Sounds Watch**
- Link users to Kp Sounds Watch for viewing
- Display: "Watch on Kp Sounds Watch"
- No copyright issues
- Respects their platform

**Option B: Embed with Permission**
- Contact Kp Sounds Watch for embedding permission
- Use iframe embedding if allowed
- Proper attribution

**Option C: Own Content**
- Only host videos you have rights to
- User-uploaded content with verification
- Partnership with VJs directly

### 3.2 Implementation
```javascript
// In movie detail page
if (movie.kpSoundsUrl) {
  // Show "Watch on Kp Sounds Watch" button
  // Opens in new tab or embedded player (if permitted)
} else if (movie.ownVideoUrl) {
  // Use own video player
} else {
  // Show "Coming Soon" or "Request Translation"
}
```

## Phase 4: Web Scraping (Ethical & Legal)

### 4.1 Kp Sounds Watch Data Collection
**What to Scrape (Publicly Available Info Only):**
- VJ names and movie counts
- Movie titles (for matching with TMDB)
- Translation availability
- Public URLs

**What NOT to Scrape:**
- Video files
- Copyrighted images (use TMDB instead)
- User data
- Protected content

### 4.2 Scraper Implementation
Create `server/services/kpSoundsScraper.js`:
```javascript
// Ethical scraping with:
- Rate limiting (1 request per 2 seconds)
- robots.txt compliance
- User-agent identification
- Caching to minimize requests
- Only public data
```

### 4.3 Data Sync Strategy
- Run scraper weekly (not real-time)
- Cache results in database
- Manual verification of data
- Respect their terms of service

## Phase 5: Enhanced Features

### 5.1 Movie Discovery
- TMDB trending movies
- Filter by VJ translator
- Filter by genre
- Search by Luganda title
- Year and rating filters

### 5.2 VJ Profiles
- VJ biography
- Movies translated by VJ
- Translation quality ratings
- Social media links
- Statistics

### 5.3 User Features
- Watchlist
- Favorites
- Rating system (for translations)
- Comments and reviews
- Request translations

### 5.4 Admin Panel
- Add VJ translations manually
- Map TMDB movies to VJ translations
- Manage VJ profiles
- Moderate user content
- Analytics dashboard

## Phase 6: Legal Compliance

### 6.1 Copyright Protection
- ✅ Use TMDB API (legal, free, requires attribution)
- ✅ Link to Kp Sounds Watch (no hosting of their content)
- ✅ Proper attribution for all sources
- ✅ DMCA compliance policy
- ✅ Terms of Service
- ✅ Privacy Policy

### 6.2 Required Legal Pages
- Terms of Service
- Privacy Policy
- DMCA Policy
- Cookie Policy
- Attribution page (TMDB, Kp Sounds Watch)

### 6.3 Disclaimers
```
"This site uses the TMDB API but is not endorsed or certified by TMDB.
Video content is hosted by third-party providers. We do not host any video files.
All trademarks and copyrights belong to their respective owners."
```

## Phase 7: Technical Implementation

### 7.1 New Files to Create
```
server/
├── services/
│   ├── tmdbService.js          # TMDB API integration
│   ├── kpSoundsScraper.js      # Ethical scraper
│   └── movieSyncService.js     # Sync TMDB + VJ data
├── models/
│   ├── VJ.js                   # VJ model
│   └── VJTranslation.js        # VJ translation mapping
├── controllers/
│   ├── vjController.js         # VJ endpoints
│   └── tmdbController.js       # TMDB proxy endpoints
└── routes/
    ├── vjs.js                  # VJ routes
    └── tmdb.js                 # TMDB routes

js/
├── tmdb-api.js                 # Frontend TMDB client
├── vj-api.js                   # Frontend VJ client
└── kpsounds-integration.js     # Kp Sounds Watch integration

pages/
├── vj-profile.html             # VJ profile page
└── attribution.html            # Legal attribution
```

### 7.2 Database Schema Updates
```javascript
// Enhanced LugandaMovie model
{
  // TMDB data
  tmdbId: Number,
  tmdbData: {
    title: String,
    overview: String,
    posterPath: String,
    backdropPath: String,
    releaseDate: Date,
    voteAverage: Number,
    genres: [String],
    cast: [Object],
    runtime: Number
  },
  
  // VJ Translation data
  vjTranslations: [{
    vjId: ObjectId,
    lugandaTitle: String,
    translationQuality: Number,
    kpSoundsUrl: String,
    audioQuality: String,
    translationDate: Date
  }],
  
  // Video sources (legal only)
  videoSources: [{
    provider: String, // "kpsounds", "youtube", "own"
    url: String,
    quality: String,
    embedAllowed: Boolean
  }]
}
```

## Phase 8: Implementation Steps

### Step 1: TMDB Integration (Week 1)
1. Register TMDB API key
2. Create tmdbService.js
3. Create tmdb-api.js frontend client
4. Test movie search and details

### Step 2: VJ Database (Week 1-2)
1. Create VJ model
2. Create VJTranslation model
3. Manually add known VJs
4. Create VJ API endpoints

### Step 3: Kp Sounds Integration (Week 2)
1. Create ethical scraper
2. Scrape VJ and movie list
3. Map to TMDB movies
4. Store Kp Sounds URLs

### Step 4: Frontend Updates (Week 3)
1. Update movie cards with TMDB data
2. Add VJ filter functionality
3. Create VJ profile pages
4. Add "Watch on Kp Sounds" buttons

### Step 5: Legal Compliance (Week 3-4)
1. Add TMDB attribution
2. Create legal pages
3. Add disclaimers
4. Implement DMCA policy

### Step 6: Testing & Launch (Week 4)
1. Test all features
2. Verify legal compliance
3. Performance optimization
4. Launch

## Success Metrics

### Technical
- ✅ TMDB API integration working
- ✅ VJ database populated
- ✅ Legal video linking implemented
- ✅ No copyright violations

### User Experience
- Fast movie discovery
- Easy VJ filtering
- Clear video source attribution
- Mobile responsive

### Legal
- Full TMDB attribution
- No hosted copyrighted content
- Clear terms of service
- DMCA compliance

## Budget & Resources

### Free Resources
- TMDB API (free, 40 requests/10 seconds)
- MongoDB (free tier)
- Hosting (Netlify/Vercel free tier)

### Optional Paid
- Premium hosting ($5-20/month)
- CDN for images ($5-10/month)
- Domain name ($10-15/year)

## Risk Mitigation

### Copyright Risks
- ❌ Don't host video files
- ❌ Don't scrape video URLs
- ✅ Link to original sources
- ✅ Use legal APIs only

### Technical Risks
- Rate limiting: Cache TMDB data
- Scraper blocking: Respect robots.txt
- Data accuracy: Manual verification

### Legal Risks
- DMCA claims: Quick takedown process
- Terms violations: Regular compliance review
- User content: Moderation system

## Next Steps

1. Get TMDB API key
2. Review and approve this plan
3. Start with Phase 1 (TMDB Integration)
4. Proceed step by step

---

**Note**: This approach is 100% legal and respects all copyright laws while providing value to users by aggregating information and linking to legitimate sources.
