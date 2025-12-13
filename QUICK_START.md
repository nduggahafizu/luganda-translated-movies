# 🚀 Quick Start Guide - Luganda Movies Platform

## Your MongoDB Atlas Connection

**Connection String:**
```
mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies
```

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js installed (download from https://nodejs.org/)
- [ ] MongoDB Atlas account set up (already done ✅)
- [ ] Internet connection
- [ ] VS Code or terminal access

## 5-Minute Setup

### Step 1: Update .env File (IMPORTANT!)

Open `server/.env` file and update the MongoDB connection:

```env
MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

**The TMDB API key is already configured!**

### Step 2: Whitelist Your IP in MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Login
3. Click "Network Access" → "Add IP Address"
4. Choose "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

### Step 3: Install Dependencies

Open terminal in VS Code and run:

```bash
cd server
npm install
```

Wait for installation to complete (~2-3 minutes).

### Step 4: Test MongoDB Connection

```bash
npm run test:mongodb
```

**Expected:** ✅ Successfully connected to MongoDB Atlas!

### Step 5: Seed VJ Database

```bash
npm run seed:vjs
```

**Expected:** ✅ Successfully seeded 11 VJs!

### Step 6: Test TMDB Integration

```bash
npm run test:tmdb
```

**Expected:** ✅ All TMDB tests passed!

### Step 7: Start Backend Server

```bash
npm start
```

**Expected:** Server running on port 5000

### Step 8: Open Frontend

In a new terminal (keep server running):

```bash
# Go back to project root
cd ..

# Start frontend server
python -m http.server 8000
```

**Or use:**
```bash
npx http-server -p 8000
```

### Step 9: Open in Browser

- **Frontend:** http://localhost:8000
- **Backend API:** http://localhost:5000/api/vjs

## Test API Endpoints

Once server is running, test these:

```bash
# Get all VJs
curl http://localhost:5000/api/vjs

# Get VJ Junior
curl http://localhost:5000/api/vjs/vj-junior

# Search movies
curl http://localhost:5000/api/tmdb/search?q=Spider-Man

# Get trending movies
curl http://localhost:5000/api/tmdb/trending
```

## What You Get

After setup, you'll have:

✅ **11 Ugandan VJs in database:**
- VJ Junior (action, thriller, sci-fi)
- VJ Ice P (Asian cinema specialist)
- VJ Emmy (romance, drama)
- VJ Jingo (classic films)
- VJ Little T (modern blockbusters)
- VJ Mox (horror, thriller)
- VJ Kevo (indie films)
- VJ Mark (war, history)
- VJ Bonny (comedy)
- VJ Light (K-dramas)
- VJ M.K (versatile)

✅ **TMDB Integration:**
- Search 1M+ movies
- Get movie details, cast, crew
- Trending and popular movies
- High-quality posters and images

✅ **Kp Sounds Watch Integration:**
- Ethical scraper for VJ data
- Links to Kp Sounds Watch videos
- No copyright violations

## Troubleshooting

### "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### "Authentication failed"
**Solution:** 
1. Verify password in `.env` is: `nduggahaf67`
2. Check MongoDB Atlas > Database Access

### "IP not whitelisted"
**Solution:**
1. Go to MongoDB Atlas > Network Access
2. Add IP: 0.0.0.0/0 (allow all)

### "Port 5000 already in use"
**Solution:** Change PORT in `.env` to 5001

### "Cannot find module"
**Solution:** Run `npm install` in server directory

## File Structure

```
luganda-movies/
├── server/
│   ├── .env                    ← UPDATE THIS!
│   ├── package.json
│   ├── server.js
│   ├── models/
│   │   ├── VJ.js              ← VJ database model
│   │   └── LugandaMovie.js
│   ├── services/
│   │   ├── tmdbService.js     ← TMDB API integration
│   │   └── kpSoundsScraper.js ← Kp Sounds scraper
│   ├── seeds/
│   │   └── vjSeeder.js        ← Seed 11 VJs
│   └── tests/
│       ├── testMongoDB.js     ← Test MongoDB
│       └── testTMDB.js        ← Test TMDB
├── js/
│   ├── main.js
│   ├── luganda-movies-api.js
│   └── tmdb-api.js
├── index.html
├── movies.html
└── Documentation files...
```

## Next Steps

After successful setup:

1. **Explore VJ Profiles:**
   - Visit http://localhost:5000/api/vjs
   - See all 11 VJs with their specialties

2. **Search Movies:**
   - Use TMDB API to search movies
   - Get movie details, cast, ratings

3. **Map VJ Translations:**
   - Link TMDB movies to VJ translations
   - Add Kp Sounds Watch URLs

4. **Customize Frontend:**
   - Update movie cards with TMDB data
   - Add VJ filtering
   - Implement search

5. **Deploy:**
   - Backend: Heroku, Railway, or DigitalOcean
   - Frontend: Netlify or Vercel
   - Use MongoDB Atlas (already cloud-based)

## Support Files

- **INTEGRATION_PLAN.md** - Complete strategy
- **IMPLEMENTATION_TODO.md** - Detailed checklist
- **SETUP_GUIDE.md** - Full installation guide
- **MONGODB_SETUP.md** - MongoDB Atlas setup
- **README.md** - Project overview

## Commands Cheat Sheet

```bash
# Install dependencies
cd server && npm install

# Test MongoDB
npm run test:mongodb

# Test TMDB
npm run test:tmdb

# Seed VJs
npm run seed:vjs

# Start server
npm start

# Start frontend
cd .. && python -m http.server 8000
```

## Success Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file updated with MongoDB URI
- [ ] IP whitelisted in MongoDB Atlas
- [ ] MongoDB connection successful
- [ ] 11 VJs seeded in database
- [ ] TMDB tests passing
- [ ] Backend server running (port 5000)
- [ ] Frontend accessible (port 8000)
- [ ] API endpoints responding

## You're Ready! 🎉

Once all steps are complete, you have:
- ✅ Working backend with MongoDB Atlas
- ✅ TMDB API integration
- ✅ 11 Ugandan VJs in database
- ✅ Kp Sounds Watch integration
- ✅ Legal and ethical implementation
- ✅ Ready for development

**Start building your Luganda Movies platform!**

---

**Need Help?**
- Check SETUP_GUIDE.md for detailed instructions
- Check MONGODB_SETUP.md for MongoDB issues
- Review error messages carefully
- Verify all prerequisites are installed
