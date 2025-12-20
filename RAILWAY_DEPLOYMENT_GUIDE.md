# 🚀 Railway Backend Deployment Guide

**Date:** December 20, 2025
**Status:** Ready for Deployment

---

## 📋 Current Setup Status

✅ **Frontend:** Deployed on Netlify (`watch.unruly.movies.com`)
✅ **Backend:** Connected to Railway via GitHub
✅ **Database:** MongoDB Atlas configured
✅ **Code:** Ready for production

---

## 🔧 Railway Environment Variables Setup

### Step 1: Access Railway Dashboard
1. Go to [Railway.app](https://railway.app)
2. Select your project
3. Go to **Variables** tab

### Step 2: Add Production Environment Variables

Copy these variables from your local `server/.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority

# TMDB API Key
TMDB_API_KEY=your_tmdb_api_key_here

# JWT & Session Secrets (Generate new ones for production)
JWT_SECRET=your-production-jwt-secret-here
SESSION_SECRET=your-production-session-secret-here

# CORS Origins (Allow your Netlify domain)
ALLOWED_ORIGINS=https://watch.unruly.movies.com,https://www.watch.unruly.movies.com
```

### Step 3: Deploy
Railway will automatically deploy when you push to GitHub. Or click **Deploy** manually.

### Step 4: Get Your Backend URL
After deployment, Railway will provide a URL like:
```
https://luganda-movies-production.up.railway.app
```

---

## 🔄 Update Frontend Configuration

### Step 1: Update API URL
Edit `js/luganda-movies-api.js`:

```javascript
// Replace this line:
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://your-backend-domain.com/api/luganda-movies'  // Replace with your actual backend URL
    : 'http://localhost:5000/api/luganda-movies';

// With your Railway URL:
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://luganda-movies-production.up.railway.app/api/luganda-movies'
    : 'http://localhost:5000/api/luganda-movies';
```

### Step 2: Commit and Push
```bash
git add js/luganda-movies-api.js
git commit -m "Update frontend to use production backend URL"
git push origin main
```

### Step 3: Netlify Auto-Deploy
Netlify will automatically redeploy your frontend with the new API URL.

---

## 🧪 Testing Production Deployment

### Test Backend Health
```bash
curl https://your-railway-url.up.railway.app/api/health
```

### Test Movies API
```bash
curl https://your-railway-url.up.railway.app/api/luganda-movies?limit=5
```

### Test Frontend Connection
Visit `https://watch.unruly.movies.com` and check if movies load from the backend.

---

## 📊 Expected Results

After successful deployment:
- ✅ Backend running on Railway
- ✅ Frontend connects to production API
- ✅ Movies display with TMDB posters
- ✅ No more ERR_CONNECTION_REFUSED errors
- ✅ Real movie data instead of mock data

---

## 🆘 Troubleshooting

### If Backend Won't Start:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure MongoDB Atlas connection string is correct

### If Frontend Can't Connect:
1. Verify the Railway URL in `js/luganda-movies-api.js`
2. Check CORS settings in Railway
3. Test backend endpoints directly

### If Movies Don't Load:
1. Check if movie population script ran successfully
2. Verify TMDB API key is working
3. Check Railway logs for scraper errors

---

## 🎯 Next Steps

1. **Set up Railway environment variables** ⏳
2. **Get Railway production URL** ⏳
3. **Update frontend API URL** ⏳
4. **Push changes to trigger deployment** ⏳
5. **Test production site** ⏳

**Your production deployment will be complete once these steps are done!** 🚀
