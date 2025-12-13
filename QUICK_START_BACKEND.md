# 🚀 Quick Start - Backend Server

## ✅ Backend is Starting!

The backend server is currently:
1. ✅ Installing dependencies (express-session)
2. ⏳ Will start the server automatically
3. ⏳ Will be available at http://localhost:5000

## 📋 What's Happening

```
[1/3] Installing dependencies...
[2/3] Checking MongoDB...
[3/3] Starting server...
```

## 🎯 Once Started, You'll See:

```
🚀 Server running on port 5000
📍 Environment: development
🌐 API URL: http://localhost:5000
✅ MongoDB Connected Successfully
```

## 🧪 Test Your Backend

Open a **NEW terminal** and run:

```bash
# Test 1: Health Check
curl http://localhost:5000/api/health

# Test 2: Fetch Movies
curl http://localhost:5000/api/movies/fetch?page=1&limit=5

# Test 3: Get Trending Movies
curl http://localhost:5000/api/movies/trending/now
```

Or open in browser:
- http://localhost:5000
- http://localhost:5000/api/health
- http://localhost:5000/api/movies/fetch?page=1&limit=10

## 📝 Available Endpoints

### Movies API
- `GET /api/movies/fetch` - Get paginated movies
- `GET /api/movies/:id` - Get single movie
- `GET /api/movies/trending/now` - Get trending movies

### Watch Progress API
- `POST /api/watch-progress/update` - Save progress
- `GET /api/watch-progress/:movieId` - Get progress
- `GET /api/watch-progress/user/all` - Get all progress

### Playlist API
- `POST /api/playlist/create` - Create playlist
- `POST /api/playlist/:playlistId/add` - Add movie
- `GET /api/playlist/user/all` - Get all playlists
- `GET /api/playlist/:playlistId` - Get playlist details

## 🔧 Troubleshooting

### If MongoDB Error Appears:

**Option 1: Start MongoDB Service**
```bash
net start MongoDB
```

**Option 2: Use MongoDB Atlas (Cloud)**
Update `server/.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies
```

### If Port 5000 is Busy:

Update `server/.env`:
```env
PORT=5001
```

Then restart: `.\start-backend.bat`

## 🎬 Next Steps

1. ✅ Wait for server to start (you'll see the success messages)
2. ✅ Test the endpoints using curl or browser
3. ✅ Open `HOW_TO_USE_BACKEND.md` for detailed usage examples
4. ✅ Integrate with your frontend using the code examples

## 📚 Documentation

- **HOW_TO_USE_BACKEND.md** - Complete usage guide with code examples
- **BACKEND_API_DOCUMENTATION.md** - Full API reference
- **BACKEND_COMPLETE.md** - Implementation summary

## 🎉 You're All Set!

Once you see the success messages, your backend is ready to use!

**Repository:** https://github.com/nduggahafizu/luganda-translated-movies.git
