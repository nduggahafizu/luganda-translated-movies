# Complete Setup Guide - Luganda Movies Platform

## Prerequisites Installation

### 1. Install Node.js and npm
1. Download Node.js from: https://nodejs.org/
2. Choose LTS version (recommended)
3. Run installer and follow prompts
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### 2. Install MongoDB

**Option A: MongoDB Atlas (Cloud - Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create a free cluster
4. Get connection string
5. Update `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies
   ```

**Option B: Local MongoDB**
1. Download from: https://www.mongodb.com/try/download/community
2. Install MongoDB Community Server
3. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   sudo systemctl start mongod
   ```

## Installation Steps

### Step 1: Install Backend Dependencies
```bash
cd server
npm install
```

This will install:
- express (web server)
- mongoose (MongoDB ODM)
- axios (HTTP client)
- cheerio (web scraping)
- dotenv (environment variables)
- bcryptjs (password hashing)
- jsonwebtoken (authentication)
- cors (cross-origin requests)
- express-validator (input validation)
- express-rate-limit (API rate limiting)
- nodemailer (email sending)

### Step 2: Configure Environment Variables

The `.env` file is already created in `server/.env`. Verify these settings:

```env
# TMDB API Key (Get your own from https://www.themoviedb.org/settings/api)
TMDB_API_KEY=your_tmdb_api_key_here

# MongoDB Connection (update if using Atlas)
MONGODB_URI=mongodb://localhost:27017/luganda-movies

# Server Port
PORT=5000
```

### Step 3: Seed VJ Database
```bash
cd server
npm run seed:vjs
```

This will populate the database with 11 Ugandan VJs:
- VJ Junior
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

### Step 4: Test TMDB Integration
```bash
cd server
npm run test:tmdb
```

This will test:
- Movie search
- Movie details retrieval
- Trending movies
- Popular movies
- Genre listing
- Image URL generation
- Data formatting

### Step 5: Test Kp Sounds Scraper (Optional)
```bash
cd server
npm run test:scraper
```

This will test:
- VJ list scraping
- Movie data extraction
- Rate limiting
- Error handling

**Note**: This scraper is ethical and respects:
- robots.txt
- Rate limiting (2 seconds between requests)
- Only public data
- No video file scraping

### Step 6: Start Backend Server
```bash
cd server
npm start

# Or for development with auto-reload:
npm run dev
```

Server will start on: http://localhost:5000

### Step 7: Test API Endpoints

Once server is running, test these endpoints:

**VJ Endpoints:**
```bash
# Get all VJs
curl http://localhost:5000/api/vjs

# Get VJ by slug
curl http://localhost:5000/api/vjs/vj-junior

# Get popular VJs
curl http://localhost:5000/api/vjs/popular
```

**TMDB Endpoints:**
```bash
# Search movies
curl http://localhost:5000/api/tmdb/search?q=Spider-Man

# Get trending movies
curl http://localhost:5000/api/tmdb/trending

# Get movie details
curl http://localhost:5000/api/tmdb/movie/634649
```

**Luganda Movies Endpoints:**
```bash
# Get all movies
curl http://localhost:5000/api/luganda-movies

# Get featured movies
curl http://localhost:5000/api/luganda-movies/featured

# Get movies by VJ
curl http://localhost:5000/api/luganda-movies/vj/vj-junior
```

### Step 8: Start Frontend

**Option A: Using Python**
```bash
# In project root directory
python -m http.server 8000
```

**Option B: Using Node.js**
```bash
# In project root directory
npx http-server -p 8000
```

**Option C: Using VS Code Live Server**
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

Frontend will be available at: http://localhost:8000

## Testing Checklist

### ✅ Backend Tests

1. **TMDB Service**
   - [ ] Movie search working
   - [ ] Movie details retrieval
   - [ ] Trending movies loading
   - [ ] Popular movies loading
   - [ ] Genre listing
   - [ ] Image URLs generating correctly
   - [ ] Caching working

2. **VJ Model**
   - [ ] VJs seeded successfully
   - [ ] Can query VJs
   - [ ] Can filter by specialty
   - [ ] Can get popular VJs
   - [ ] Can get featured VJs

3. **Kp Sounds Scraper**
   - [ ] VJ list scraping
   - [ ] Movie data extraction
   - [ ] Rate limiting respected
   - [ ] Error handling working

4. **API Endpoints**
   - [ ] VJ endpoints responding
   - [ ] TMDB endpoints responding
   - [ ] Movie endpoints responding
   - [ ] CORS configured correctly

### ✅ Frontend Tests

1. **Homepage**
   - [ ] Hero slider loading
   - [ ] Featured movies displaying
   - [ ] Latest movies showing
   - [ ] VJ sections visible
   - [ ] Search working

2. **Movies Page**
   - [ ] Movie grid loading
   - [ ] Filters working
   - [ ] VJ filter working
   - [ ] Search working
   - [ ] Pagination working

3. **VJ Profile Page**
   - [ ] VJ info displaying
   - [ ] VJ movies loading
   - [ ] Rating system working
   - [ ] Social links working

4. **Player Page**
   - [ ] Movie details loading
   - [ ] "Watch on Kp Sounds" button
   - [ ] Proper attribution
   - [ ] Related movies showing

5. **Responsive Design**
   - [ ] Mobile view working
   - [ ] Tablet view working
   - [ ] Desktop view working
   - [ ] Navigation responsive

## Troubleshooting

### MongoDB Connection Issues

**Error**: "MongoNetworkError: failed to connect to server"

**Solution**:
1. Check MongoDB is running
2. Verify connection string in `.env`
3. Check firewall settings
4. For Atlas: Whitelist your IP address

### TMDB API Issues

**Error**: "TMDB API request failed"

**Solution**:
1. Verify API key in `.env`
2. Check internet connection
3. Verify API key is active at https://www.themoviedb.org/settings/api
4. Check rate limits (40 requests per 10 seconds)

### Port Already in Use

**Error**: "Port 5000 is already in use"

**Solution**:
1. Change PORT in `.env` to different number (e.g., 5001)
2. Or kill process using port:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:5000 | xargs kill -9
   ```

### CORS Errors

**Error**: "Access-Control-Allow-Origin"

**Solution**:
1. Verify CORS is configured in `server/server.js`
2. Check FRONTEND_URL in `.env` matches your frontend URL
3. Restart backend server

### Scraper Not Working

**Error**: "Scraper failed to fetch data"

**Solution**:
1. Check internet connection
2. Verify Kp Sounds Watch is accessible
3. Check rate limiting (2 seconds between requests)
4. May need to update selectors if site structure changed

## Next Steps

After successful setup:

1. **Populate Movie Database**
   - Run scraper to get movie data
   - Map TMDB movies to VJ translations
   - Add Kp Sounds URLs

2. **Create Admin Panel**
   - Add VJ translations manually
   - Manage movie mappings
   - Moderate user content

3. **Implement User Features**
   - User registration/login
   - Watchlist functionality
   - Rating system
   - Comments

4. **Deploy to Production**
   - Set up MongoDB Atlas
   - Deploy backend to Heroku/Railway
   - Deploy frontend to Netlify/Vercel
   - Configure custom domain

## Support

For issues or questions:
1. Check this guide first
2. Review error logs
3. Check TMDB API documentation
4. Review MongoDB documentation

## Legal Compliance

Remember:
- ✅ TMDB API requires attribution
- ✅ Link to Kp Sounds Watch (don't host their videos)
- ✅ Respect copyright laws
- ✅ Have DMCA policy
- ✅ Terms of Service and Privacy Policy

## Resources

- TMDB API Docs: https://developers.themoviedb.org/3
- MongoDB Docs: https://docs.mongodb.com/
- Express.js Docs: https://expressjs.com/
- Mongoose Docs: https://mongoosejs.com/
- Node.js Docs: https://nodejs.org/docs/

---

**Last Updated**: December 2024
**Version**: 1.0.0
