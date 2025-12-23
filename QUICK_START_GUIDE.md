# Luganda Movies - Quick Start Guide

**Last Updated:** December 22, 2025

---

## 🚀 Quick Start (Development)

### Option 1: Use Start Script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Manual Start

**Start Backend:**
```bash
cd server
node server.js
```

**Start Frontend (in new terminal):**
```bash
FRONTEND_PORT=3000 node frontend-server.js
```

---

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main website |
| **Backend API** | http://localhost:5000 | REST API |
| **API Docs** | http://localhost:5000/api-docs | Swagger documentation |
| **Health Check** | http://localhost:5000/api/health | Server health status |

---

## 🛑 Stop Servers

### Option 1: Use Stop Script
```bash
./stop-dev.sh
```

### Option 2: Manual Stop
```bash
pkill -f "node server.js"
pkill -f "node frontend-server.js"
```

---

## 📊 System Status

### Check if Servers are Running
```bash
# Check backend
curl http://localhost:5000/api/health

# Check frontend
curl -I http://localhost:3000/
```

### View Logs
```bash
# Backend logs
tail -f /tmp/backend.log

# Frontend logs
tail -f /tmp/frontend.log
```

---

## 🧪 Testing

### Run Full Stack Test
```bash
node test-full-stack.js
```

### Test Individual Components
```bash
# Test backend API
curl http://localhost:5000/api/luganda-movies

# Test VJs endpoint
curl http://localhost:5000/api/vjs

# Test health
curl http://localhost:5000/api/health
```

---

## 📦 Sample Data

The system comes with sample data loaded automatically:

### Movies (4 samples)
- Lokah (VJ Ice P)
- Salaar (VJ Soul)
- Baby's Day Out (VJ Jingo)
- Pushpa 2 (VJ Ice P)

### VJs (3 samples)
- VJ Ice P
- VJ Jingo
- VJ Soul

---

## 🔧 Configuration

### Environment Variables

Backend configuration is in `server/.env`:
- `PORT=5000` - Backend port
- `NODE_ENV=development` - Environment
- `MONGODB_URI` - Database connection (optional)
- `JWT_SECRET` - JWT secret key
- `CORS` - Allowed origins

### Frontend Configuration

Frontend auto-detects environment in `js/config.js`:
- Localhost: Uses `http://localhost:5000`
- Production: Uses configured backend URL

---

## 📝 Common Tasks

### Add New Movie
```bash
cd server
node add-movie.js
```

### Seed VJ Data
```bash
cd server
npm run seed:vjs
```

### Run Tests
```bash
cd server
npm run test:all
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Port 5000 already in use
```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)
```

**Problem:** Dependencies not installed
```bash
cd server
npm install
```

### Frontend Won't Start

**Problem:** Port 3000 already in use
```bash
# Use different port
FRONTEND_PORT=8080 node frontend-server.js
```

### API Not Responding

**Problem:** CORS errors
- Check `ALLOWED_ORIGINS` in `server/.env`
- Ensure frontend URL is in allowed origins

**Problem:** 404 errors
- Verify backend is running: `curl http://localhost:5000/`
- Check API endpoint exists in Swagger docs

---

## 📚 Documentation

### Main Documentation
- `README.md` - Project overview
- `SYSTEM_VERIFICATION_REPORT.md` - System status
- `server/BACKEND_API_DOCUMENTATION.md` - API docs

### Setup Guides
- `SETUP_GUIDE.md` - Detailed setup
- `MONGODB_SETUP.md` - Database setup
- `GOOGLE_SIGNIN_SETUP_GUIDE.md` - OAuth setup

### Feature Guides
- `PLAYER_QUICK_START.md` - Video player
- `HOW_TO_ADD_MOVIES_DAILY.md` - Adding movies
- `ADMIN_GUIDE.md` - Admin features

---

## 🔐 Security Notes

### Development Mode
- JWT secrets are for development only
- CORS allows all localhost origins
- Rate limiting is relaxed

### Production Mode
- Change all secrets in `.env`
- Restrict CORS to production domains
- Enable HTTPS
- Use MongoDB Atlas or production database
- Add production API keys

---

## 📞 Support

### Check System Status
```bash
# View verification report
cat SYSTEM_VERIFICATION_REPORT.md

# Run health check
curl http://localhost:5000/api/health | python3 -m json.tool
```

### Get Help
- Check documentation in project root
- Review API docs at http://localhost:5000/api-docs
- Check logs in `/tmp/backend.log` and `/tmp/frontend.log`

---

## ✅ Verification Checklist

Before starting development, verify:

- [x] Dependencies installed (`npm install` in server/)
- [x] `.env` file exists in `server/` directory
- [x] Backend starts without errors
- [x] Frontend serves static files
- [x] API endpoints respond correctly
- [x] Sample data loads successfully
- [x] No security vulnerabilities (`npm audit`)

---

## 🎯 Next Steps

### For Development
1. Start servers: `./start-dev.sh`
2. Open browser: http://localhost:3000
3. Check API docs: http://localhost:5000/api-docs
4. Start coding!

### For Production
1. Set up MongoDB Atlas
2. Configure production environment variables
3. Deploy backend to Railway/Render
4. Deploy frontend to Netlify/Vercel
5. Update CORS and API URLs

---

**Happy Coding! 🎬🇺🇬**
