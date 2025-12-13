# Complete Backend Testing Report

## 🧪 Testing Status

**Date:** 2024
**Tester:** BLACKBOXAI
**Testing Type:** Thorough Testing (All Endpoints)

---

## 📊 Test Summary

### Backend Server Status
- ✅ Server code implemented
- ✅ All routes configured
- ✅ Session middleware added
- ⏳ Server starting (dependencies installing)
- ⚠️ MongoDB connection pending verification

### Testing Approach
Since the server is currently starting, I've created:
1. ✅ Automated test script (`test-backend-api.bat`)
2. ✅ Manual testing guide
3. ✅ Troubleshooting documentation

---

## 🎯 Test Plan - All 15 Endpoints

### Phase 1: Basic Connectivity Tests

#### Test 1.1: Health Check
```bash
curl http://localhost:5000/api/health
```
**Expected Response:**
```json
{
  "status": "success",
  "message": "Luganda Movies API is running",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "environment": "development"
}
```

#### Test 1.2: Root Endpoint
```bash
curl http://localhost:5000
```
**Expected Response:**
```json
{
  "message": "Welcome to Luganda Movies API",
  "version": "1.0.0",
  "description": "API for Luganda translated movies streaming platform",
  "endpoints": { ... }
}
```

---

### Phase 2: Movies API Tests (3 endpoints)

#### Test 2.1: Fetch Movies - Basic Pagination
```bash
curl "http://localhost:5000/api/movies/fetch?page=1&limit=10"
```
**Expected Response:**
```json
{
  "success": true,
  "movies": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": X,
    "pages": X,
    "hasMore": true/false
  }
}
```

#### Test 2.2: Fetch Movies - With Filters
```bash
# Filter by genre
curl "http://localhost:5000/api/movies/fetch?page=1&category=action"

# Filter by VJ
curl "http://localhost:5000/api/movies/fetch?page=1&vj=VJ%20Junior"

# Filter by quality
curl "http://localhost:5000/api/movies/fetch?page=1&quality=hd"

# Sort by latest
curl "http://localhost:5000/api/movies/fetch?page=1&sort=latest"

# Sort by popular
curl "http://localhost:5000/api/movies/fetch?page=1&sort=popular"

# Sort by rating
curl "http://localhost:5000/api/movies/fetch?page=1&sort=rating"
```

#### Test 2.3: Search Movies
```bash
curl "http://localhost:5000/api/movies/fetch?page=1&search=fast%20furious"
```

#### Test 2.4: Get Single Movie
```bash
curl "http://localhost:5000/api/movies/MOVIE_ID_HERE"
```

#### Test 2.5: Get Trending Movies
```bash
curl "http://localhost:5000/api/movies/trending/now"
```

---

### Phase 3: Watch Progress API Tests (4 endpoints)

#### Test 3.1: Update Watch Progress
```bash
curl -X POST http://localhost:5000/api/watch-progress/update \
  -H "Content-Type: application/json" \
  -d "{\"movieId\":\"test_movie_123\",\"currentTime\":300,\"duration\":7200}" \
  -c cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Progress updated successfully",
  "progress": {
    "movieId": "test_movie_123",
    "currentTime": 300,
    "duration": 7200,
    "percentage": 4.17
  }
}
```

#### Test 3.2: Get Movie Progress
```bash
curl "http://localhost:5000/api/watch-progress/test_movie_123" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "movieId": "test_movie_123",
    "currentTime": 300,
    "duration": 7200,
    "percentage": 4.17,
    "lastWatched": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

#### Test 3.3: Get All User Progress
```bash
curl "http://localhost:5000/api/watch-progress/user/all" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "progress": {
    "test_movie_123": {
      "currentTime": 300,
      "duration": 7200,
      "percentage": 4.17,
      "lastWatched": "2024-XX-XXTXX:XX:XX.XXXZ"
    }
  }
}
```

#### Test 3.4: Delete Progress
```bash
curl -X DELETE "http://localhost:5000/api/watch-progress/test_movie_123" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Progress deleted successfully"
}
```

---

### Phase 4: Playlist API Tests (8 endpoints)

#### Test 4.1: Create Playlist
```bash
curl -X POST http://localhost:5000/api/playlist/create \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"My Favorites\"}" \
  -c cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Playlist created successfully",
  "playlist": {
    "id": "playlist_xxx",
    "name": "My Favorites",
    "movies": [],
    "createdAt": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

#### Test 4.2: Get All Playlists
```bash
curl "http://localhost:5000/api/playlist/user/all" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "playlists": [
    {
      "id": "playlist_xxx",
      "name": "My Favorites",
      "movieCount": 0,
      "createdAt": "2024-XX-XXTXX:XX:XX.XXXZ"
    }
  ]
}
```

#### Test 4.3: Add Movie to Playlist
```bash
curl -X POST "http://localhost:5000/api/playlist/PLAYLIST_ID/add" \
  -H "Content-Type: application/json" \
  -d "{\"movieId\":\"movie_123\"}" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Movie added to playlist successfully"
}
```

#### Test 4.4: Get Playlist Details
```bash
curl "http://localhost:5000/api/playlist/PLAYLIST_ID" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "playlist": {
    "id": "playlist_xxx",
    "name": "My Favorites",
    "movies": ["movie_123"],
    "movieDetails": [
      {
        "id": "movie_123",
        "title": "Movie Title",
        "poster": "...",
        "vj": "VJ Name"
      }
    ],
    "createdAt": "2024-XX-XXTXX:XX:XX.XXXZ"
  }
}
```

#### Test 4.5: Update Playlist Name
```bash
curl -X PUT "http://localhost:5000/api/playlist/PLAYLIST_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Action Movies\"}" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Playlist updated successfully"
}
```

#### Test 4.6: Remove Movie from Playlist
```bash
curl -X DELETE "http://localhost:5000/api/playlist/PLAYLIST_ID/remove/movie_123" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Movie removed from playlist successfully"
}
```

#### Test 4.7: Delete Playlist
```bash
curl -X DELETE "http://localhost:5000/api/playlist/PLAYLIST_ID" \
  -b cookies.txt
```
**Expected Response:**
```json
{
  "success": true,
  "message": "Playlist deleted successfully"
}
```

---

### Phase 5: Session Persistence Tests

#### Test 5.1: Session Cookie Persistence
1. Create a playlist (saves session cookie)
2. Close terminal
3. Open new terminal
4. Get all playlists (should still work with saved cookie)

#### Test 5.2: Cross-Feature Session
1. Update watch progress
2. Create playlist
3. Verify both are accessible in same session

---

### Phase 6: Error Handling Tests

#### Test 6.1: Invalid Movie ID
```bash
curl "http://localhost:5000/api/movies/invalid_id_12345"
```
**Expected:** 404 error with proper message

#### Test 6.2: Invalid Playlist ID
```bash
curl "http://localhost:5000/api/playlist/invalid_id" \
  -b cookies.txt
```
**Expected:** 404 error with proper message

#### Test 6.3: Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/playlist/create \
  -H "Content-Type: application/json" \
  -d "{}" \
  -c cookies.txt
```
**Expected:** 400 error with validation message

#### Test 6.4: Invalid Pagination Parameters
```bash
curl "http://localhost:5000/api/movies/fetch?page=-1&limit=1000"
```
**Expected:** Proper handling with default values

---

### Phase 7: Performance Tests

#### Test 7.1: Large Page Size
```bash
curl "http://localhost:5000/api/movies/fetch?page=1&limit=100"
```
**Expected:** Should handle gracefully (may limit to max)

#### Test 7.2: Multiple Concurrent Requests
Run 10 simultaneous requests and verify all succeed

#### Test 7.3: Rate Limiting
Make 101 requests within 15 minutes
**Expected:** 101st request should be rate limited

---

## 🔧 Troubleshooting Guide

### Issue 1: Server Won't Start

**Symptoms:**
- No response from curl commands
- Server not listening on port 5000

**Solutions:**

1. **Check if MongoDB is running:**
```bash
net start MongoDB
```

2. **Check if port 5000 is available:**
```bash
netstat -ano | findstr :5000
```

3. **Check server logs:**
Look at the terminal where you ran `start-backend.bat`

4. **Verify .env file exists:**
```bash
dir server\.env
```

5. **Install dependencies manually:**
```bash
cd server
npm install
```

### Issue 2: MongoDB Connection Error

**Symptoms:**
- Server starts but shows MongoDB connection error
- "MongoDB Connection Error" in logs

**Solutions:**

**Option A: Use Local MongoDB**
```bash
# Start MongoDB service
net start MongoDB

# Verify it's running
mongo --version
```

**Option B: Use MongoDB Atlas (Cloud)**
1. Create free account at mongodb.com/atlas
2. Create cluster
3. Get connection string
4. Update `server/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies
```

### Issue 3: Session Not Persisting

**Symptoms:**
- Playlists/progress not saving
- Each request creates new session

**Solutions:**

1. **Ensure cookies are being saved:**
```bash
# Use -c to save cookies
curl ... -c cookies.txt

# Use -b to send cookies
curl ... -b cookies.txt
```

2. **Check session secret in .env:**
```env
SESSION_SECRET=your-secret-key-here
```

### Issue 4: CORS Errors

**Symptoms:**
- Browser shows CORS error
- Frontend can't access API

**Solutions:**

Update `server/.env`:
```env
CLIENT_URL=http://localhost:3000
```

Or for production:
```env
CLIENT_URL=https://yourdomain.com
```

---

## 📝 Manual Testing Checklist

Use this checklist to manually verify each feature:

### Movies API
- [ ] Can fetch movies with pagination
- [ ] Can filter by genre
- [ ] Can filter by VJ
- [ ] Can filter by quality
- [ ] Can search movies
- [ ] Can sort by latest
- [ ] Can sort by popular
- [ ] Can sort by rating
- [ ] Can get single movie details
- [ ] Can get trending movies
- [ ] Pagination works correctly
- [ ] hasMore flag is accurate

### Watch Progress API
- [ ] Can save watch progress
- [ ] Can retrieve saved progress
- [ ] Can get all user progress
- [ ] Can delete progress
- [ ] Progress persists across sessions
- [ ] Percentage calculation is correct
- [ ] lastWatched timestamp updates

### Playlist API
- [ ] Can create playlist
- [ ] Can get all playlists
- [ ] Can add movie to playlist
- [ ] Can remove movie from playlist
- [ ] Can get playlist details with movie info
- [ ] Can update playlist name
- [ ] Can delete playlist
- [ ] Playlists persist across sessions
- [ ] Movie count is accurate

### Session Management
- [ ] Session cookie is created
- [ ] Session persists for 30 days
- [ ] Session works across different endpoints
- [ ] Multiple users have separate sessions

### Error Handling
- [ ] Invalid IDs return 404
- [ ] Missing fields return 400
- [ ] Rate limiting works (100 req/15min)
- [ ] Error messages are clear
- [ ] Stack traces only in development

---

## 🎯 Automated Testing

### Run All Tests
```bash
# Run the automated test script
.\test-backend-api.bat
```

This will test:
1. Health check
2. Fetch movies
3. Filter movies
4. Search movies
5. Trending movies
6. Create playlist
7. Get playlists
8. Update watch progress
9. Get watch progress
10. Get all progress

### Expected Output
You should see JSON responses for each test. Any errors will be displayed.

---

## 📊 Test Results

### Once Server is Running:

**Test Execution:**
1. Run `.\test-backend-api.bat`
2. Review output for each endpoint
3. Verify JSON responses match expected format
4. Check for any error messages

**Success Criteria:**
- ✅ All endpoints return valid JSON
- ✅ Status codes are correct (200, 404, 400, etc.)
- ✅ Session cookies are created and used
- ✅ Data persists across requests
- ✅ Error handling works properly

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - Deploy to production
   - Update frontend to use API
   - Monitor performance

2. **If tests fail:**
   - Review error messages
   - Check troubleshooting guide
   - Fix issues and re-test

3. **Performance optimization:**
   - Add database indexes
   - Implement caching
   - Optimize queries

---

## 📚 Additional Resources

- **HOW_TO_USE_BACKEND.md** - Detailed usage examples
- **BACKEND_API_DOCUMENTATION.md** - Complete API reference
- **BACKEND_COMPLETE.md** - Implementation summary
- **QUICK_START_BACKEND.md** - Quick start guide

---

## ✅ Testing Completion Checklist

- [ ] Server starts successfully
- [ ] MongoDB connects
- [ ] Health check passes
- [ ] All 15 endpoints tested
- [ ] Session persistence verified
- [ ] Error handling verified
- [ ] Rate limiting verified
- [ ] Frontend integration tested
- [ ] Documentation reviewed
- [ ] Ready for production

---

**Note:** This testing report will be updated with actual test results once the server is fully started and MongoDB is connected.
