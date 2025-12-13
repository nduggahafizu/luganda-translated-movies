# 🎬 TMDB API Setup Guide

## Your TMDB API Key
```
7713c910b9503a1da0d0e6e448bf890e
```

## Setup Instructions

### Step 1: Add API Key to .env File

Open `server/.env` and add this line at the end:

```env
TMDB_API_KEY=7713c910b9503a1da0d0e6e448bf890e
```

Your complete `.env` file should look like this:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d

# PesaPal Payment Configuration
PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
PESAPAL_CONSUMER_SECRET=qXoCe4qrb4RzDCr9nDu3y/yvTiU=
PESAPAL_ENVIRONMENT=sandbox
PESAPAL_IPN_URL=http://localhost:5000/api/payments/pesapal/ipn

# TMDB API Configuration
TMDB_API_KEY=7713c910b9503a1da0d0e6e448bf890e
```

### Step 2: Restart the Backend Server

1. Stop the current server (press Ctrl+C in the terminal)
2. Start it again:
   ```bash
   cd server
   node server.js
   ```

### Step 3: Test TMDB Integration

Run the test to verify it's working:
```bash
cd server
node tests/testTMDB.js
```

**Expected Output:**
```
✅ Search Movies: Found X results for "Spider-Man"
✅ Get Movie Details: Retrieved details for movie ID 634649
✅ Get Trending Movies: Retrieved X trending movies
✅ All TMDB tests passed!
```

## What TMDB API Enables

Once configured, your platform can:

1. **Search Movies** - Search TMDB's database of millions of movies
2. **Get Movie Details** - Fetch complete movie information:
   - Title, description, release date
   - Poster images and backdrops
   - Cast and crew information
   - Ratings and reviews
   - Genres and keywords

3. **Trending Movies** - Get currently trending movies
4. **Popular Movies** - Get most popular movies
5. **Movie Recommendations** - Get similar movie suggestions

## API Endpoints Available

After setup, these endpoints will work:

- `GET /api/tmdb/search?q=Spider-Man` - Search movies
- `GET /api/tmdb/movie/:id` - Get movie details
- `GET /api/tmdb/trending` - Get trending movies
- `GET /api/tmdb/popular` - Get popular movies

## Testing the API

### Using Browser
Visit: http://localhost:5000/api/tmdb/search?q=Avatar

### Using curl
```bash
curl http://localhost:5000/api/tmdb/search?q=Avatar
```

## Troubleshooting

### 401 Unauthorized Error
- Make sure you added the API key to `.env`
- Restart the server after adding the key
- Check there are no extra spaces in the `.env` file

### API Key Not Working
- Verify the key: `7713c910b9503a1da0d0e6e448bf890e`
- Check your TMDB account is active
- Ensure you're using the v3 API key (not v4)

## Next Steps

After TMDB is configured:

1. ✅ Search for movies in TMDB database
2. ✅ Display real movie posters and information
3. ✅ Link VJ translations to TMDB movies
4. ✅ Show trending and popular movies
5. ✅ Provide movie recommendations

---

**Need Help?**
- TMDB API Docs: https://developers.themoviedb.org/3
- Your API Key: `7713c910b9503a1da0d0e6e448bf890e`
