# Quick Reference - Luganda Movies Application

## 🚀 Current Status: ✅ FULLY OPERATIONAL

---

## 📊 System Overview

| Component | Status | Details |
|-----------|--------|---------|
| MongoDB | ✅ Running | v7.0.28, PID: 12853 |
| Backend API | ✅ Running | Port 5000, PID: 13707 |
| Frontend | ✅ Running | Port 8000, PID: 5056 |
| Database | ✅ Connected | luganda-movies |
| Movies | ✅ 8 docs | Seeded |
| VJs | ✅ 11 docs | Seeded |

---

## 🔗 Quick Access URLs

```
Frontend:     http://localhost:8000
Backend:      http://localhost:5000
API Docs:     http://localhost:5000/api-docs
Health:       http://localhost:5000/api/health
Movies:       http://localhost:5000/api/luganda-movies
VJs:          http://localhost:5000/api/vjs
```

---

## 🎬 Sample API Requests

### Get All Movies
```bash
curl http://localhost:5000/api/luganda-movies
```

### Get All VJs
```bash
curl http://localhost:5000/api/vjs
```

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Search Movies
```bash
curl "http://localhost:5000/api/luganda-movies?search=avatar"
```

### Filter by VJ
```bash
curl "http://localhost:5000/api/luganda-movies?vjName=VJ%20Junior"
```

### Filter by Genre
```bash
curl "http://localhost:5000/api/luganda-movies?genre=action"
```

---

## 🛠️ Server Management

### Check Running Servers
```bash
# MongoDB
ps aux | grep mongod | grep -v grep

# Backend
ps aux | grep "node server.js" | grep -v grep

# Frontend
ps aux | grep "python3 -m http.server" | grep -v grep
```

### Stop Servers
```bash
# Stop Backend
pkill -f "node server.js"

# Stop Frontend
pkill -f "python3 -m http.server"

# Stop MongoDB
mongod --dbpath /data/db --shutdown
```

### Start Servers
```bash
# Start MongoDB
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 \
  --logpath /data/db/mongod.log --fork

# Start Backend
cd /vercel/sandbox/server && node server.js &

# Start Frontend
cd /vercel/sandbox && python3 -m http.server 8000 &
```

---

## 💾 MongoDB Commands

### Connect to MongoDB Shell
```bash
mongosh
```

### View Collections
```bash
mongosh --eval "use luganda-movies; show collections"
```

### Count Documents
```bash
# Count movies
mongosh --eval "use luganda-movies; db.lugandamovies.countDocuments()"

# Count VJs
mongosh --eval "use luganda-movies; db.vjs.countDocuments()"
```

### View Sample Data
```bash
# View first movie
mongosh --eval "use luganda-movies; db.lugandamovies.findOne()"

# View all VJ names
mongosh --eval "use luganda-movies; db.vjs.find({}, {name: 1})"
```

### Clear Collections
```bash
# Clear movies (careful!)
mongosh --eval "use luganda-movies; db.lugandamovies.deleteMany({})"

# Clear VJs (careful!)
mongosh --eval "use luganda-movies; db.vjs.deleteMany({})"
```

---

## 🌱 Seeding Data

### Seed VJs
```bash
cd /vercel/sandbox/server
npm run seed:vjs
```

### Seed Movies
```bash
cd /vercel/sandbox/server
node scripts/seedSampleMovies.js
```

---

## 📝 Environment Configuration

Location: `/vercel/sandbox/server/.env`

Key settings:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/luganda-movies
JWT_SECRET=test-jwt-secret-key-for-development-only
```

---

## 🧪 Testing

### Test Backend Health
```bash
curl http://localhost:5000/api/health | python3 -m json.tool
```

### Test Database Connection
```bash
curl -s http://localhost:5000/api/health | \
  python3 -c "import sys, json; \
  data=json.load(sys.stdin); \
  print('Database:', data['services']['database']['status'])"
```

### Test Frontend
```bash
curl -I http://localhost:8000/
```

---

## 📚 Documentation Files

- `CONNECTION_SUMMARY.txt` - This summary
- `MONGODB_CONNECTION_SUCCESS.md` - Detailed MongoDB setup
- `WEB_FUNCTIONALITY_TEST_REPORT.md` - Initial functionality tests
- `SERVERS_RUNNING.md` - Server management guide
- `QUICK_TEST_SUMMARY.md` - Quick test overview

---

## 🎯 Common Tasks

### Add a New Movie
```bash
cd /vercel/sandbox/server
# Edit scripts/seedSampleMovies.js to add your movie
node scripts/seedSampleMovies.js
```

### View Logs
```bash
# MongoDB logs
tail -f /data/db/mongod.log

# Backend logs (if redirected)
tail -f /tmp/backend.log
```

### Restart Everything
```bash
# Stop all
pkill -f "node server.js"
pkill -f "python3 -m http.server"
mongod --dbpath /data/db --shutdown

# Wait a moment
sleep 2

# Start all
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 \
  --logpath /data/db/mongod.log --fork
cd /vercel/sandbox/server && node server.js &
cd /vercel/sandbox && python3 -m http.server 8000 &
```

---

## 🔍 Troubleshooting

### MongoDB Won't Start
```bash
# Check if already running
ps aux | grep mongod

# Check data directory permissions
ls -la /data/db

# Check logs
tail -50 /data/db/mongod.log
```

### Backend Can't Connect
```bash
# Verify MongoDB is running
mongosh --eval "db.version()"

# Check .env file
cat /vercel/sandbox/server/.env | grep MONGODB_URI

# Check backend logs
ps aux | grep "node server.js"
```

### Frontend Not Loading
```bash
# Check if server is running
curl -I http://localhost:8000/

# Check if files exist
ls -la /vercel/sandbox/index.html
```

---

## 📊 Current Data

### Movies (8)
1. Fast & Furious 9 - VJ Junior
2. Black Panther - VJ Emmy
3. Avatar: The Way of Water - VJ Emmy
4. The Marvels - VJ Little T
5. Wonka - VJ Bonny
6. Guardians of the Galaxy Vol. 3 - VJ Junior
7. Spider-Man: Across the Spider-Verse - VJ Little T
8. Song of the Assassins - VJ Ice P

### VJs (11)
VJ Junior, VJ Ice P, VJ Emmy, VJ Jingo, VJ Little T, VJ Mox, VJ Kevo, VJ Mark, VJ Bonny, VJ Light, VJ M.K

---

## ✅ Success Checklist

- [x] MongoDB installed and running
- [x] Backend connected to MongoDB
- [x] Frontend serving pages
- [x] Database seeded with sample data
- [x] All API endpoints working
- [x] Health checks passing
- [x] Documentation complete

---

**Last Updated:** December 20, 2025  
**Status:** 🎉 100% OPERATIONAL
