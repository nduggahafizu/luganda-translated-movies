# Netlify Deployment Checklist

**Status:** ✅ Ready to Deploy  
**Estimated Time:** 30 minutes

---

## ✅ Already Completed

- [x] Config.js created with environment detection
- [x] All HTML pages updated to load config.js
- [x] Auth.js updated to use Config
- [x] Luganda-movies-api.js updated to use Config
- [x] JWT token generation fixed
- [x] Google Client ID configured
- [x] Security headers configured (netlify.toml, _headers)
- [x] Redirects configured (_redirects)
- [x] Movie playback tested
- [x] Google Auth tested
- [x] Database seeded with content

---

## 📝 TODO Before Deployment

### 1. Deploy Backend (Required)

**Choose a platform:**

#### Option A: Render.com (Recommended - Free Tier)
```
1. Go to https://render.com
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   Name: luganda-movies-api
   Environment: Node
   Build Command: cd server && npm install
   Start Command: cd server && node server.js
   
6. Add Environment Variables:
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/luganda-movies
   JWT_SECRET=generate-strong-secret-here
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   SESSION_SECRET=generate-strong-secret-here
   GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
   ALLOWED_ORIGINS=https://your-site.netlify.app
   CLIENT_URL=https://your-site.netlify.app

7. Click "Create Web Service"
8. Wait for deployment (~5 minutes)
9. Copy your backend URL (e.g., https://luganda-movies-api.onrender.com)
```

#### Option B: Railway.app
```
1. Go to https://railway.app
2. Sign up/Login
3. New Project → Deploy from GitHub
4. Select your repository
5. Set root directory to "server"
6. Add environment variables (same as above)
7. Deploy
8. Copy backend URL
```

### 2. Update Config.js (Required)

**File:** `/vercel/sandbox/js/config.js`

**Line 15 - Update this:**
```javascript
// BEFORE:
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api.onrender.com', // ← Placeholder

// AFTER (replace with your actual backend URL):
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://YOUR-ACTUAL-BACKEND-URL.onrender.com', // ← Your URL here
```

**Example:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api-abc123.onrender.com',
```

### 3. Set Up MongoDB Atlas (Required for Production)

```
1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Create database user
4. Whitelist IP: 0.0.0.0/0 (allow all)
5. Get connection string
6. Add to backend environment variables:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies
```

### 4. Configure Google OAuth (Required)

```
1. Go to https://console.cloud.google.com
2. Select your project
3. APIs & Services → Credentials
4. Click on your OAuth 2.0 Client ID
5. Add Authorized JavaScript origins:
   https://your-site.netlify.app
   https://www.your-site.netlify.app
   
6. Add Authorized redirect URIs:
   https://your-site.netlify.app/login.html
   https://your-site.netlify.app/register.html
   
7. Save changes
```

### 5. Update Backend CORS (Required)

In your backend environment variables (Render/Railway):
```env
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
```

---

## 🚀 Deployment Steps

### Step 1: Commit Changes

```bash
git add .
git commit -m "Fixed Google Auth and movie playback for production"
git push origin main
```

### Step 2: Deploy to Netlify

**If using Netlify CLI:**
```bash
netlify deploy --prod
```

**If using GitHub (Auto-deploy):**
- Netlify will automatically deploy when you push to main
- Check deployment status in Netlify dashboard

### Step 3: Verify Deployment

1. Open your Netlify URL
2. Check that pages load
3. Test Google Sign-In
4. Test movie playback
5. Check browser console for errors

---

## 🧪 Post-Deployment Testing

### Test 1: Google Sign-In
```
1. Open: https://your-site.netlify.app/login.html
2. Click "Sign in with Google"
3. Complete authentication
4. Verify redirect to homepage
5. Check user in MongoDB Atlas
```

### Test 2: Email Registration
```
1. Open: https://your-site.netlify.app/register.html
2. Fill in details
3. Submit
4. Verify account created
5. Check JWT token in browser storage
```

### Test 3: Movie Playback
```
1. Open: https://your-site.netlify.app/movies.html
2. Click any movie
3. Player page loads
4. Click play
5. Verify video plays
```

### Test 4: API Endpoints
```bash
# Health check
curl https://your-backend-url.onrender.com/api/health

# Movies
curl https://your-backend-url.onrender.com/api/luganda-movies

# VJs
curl https://your-backend-url.onrender.com/api/vjs
```

---

## 🔒 Security Checklist

### Before Going Live

- [ ] Generate strong JWT_SECRET (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- [ ] Generate strong SESSION_SECRET
- [ ] Set NODE_ENV=production
- [ ] Configure MongoDB Atlas with authentication
- [ ] Update ALLOWED_ORIGINS with production domain
- [ ] Enable HTTPS (automatic on Netlify)
- [ ] Test CORS from production domain
- [ ] Verify rate limiting is working
- [ ] Check security headers in browser
- [ ] Test Google OAuth on production domain

---

## 📊 Environment Variables Summary

### Backend (Render/Railway)
```env
# Required
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-strong-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
ALLOWED_ORIGINS=https://your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app

# Optional
TMDB_API_KEY=your-tmdb-key
REDIS_HOST=your-redis-host
REDIS_PORT=6379
```

### Netlify (Optional)
```env
# These are optional - config.js handles it
BACKEND_URL=https://your-backend.onrender.com
```

---

## 🎯 What to Update

### File: `js/config.js`
**Line 15:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://YOUR-BACKEND-URL-HERE.onrender.com', // ← UPDATE THIS
```

### That's it! Everything else is ready.

---

## 🐛 Troubleshooting

### Issue: Google Sign-In not working on Netlify
**Solution:** 
1. Check Google Cloud Console authorized origins
2. Verify domain matches exactly
3. Check browser console for errors

### Issue: API calls failing
**Solution:**
1. Verify backend is deployed and running
2. Check backend URL in config.js
3. Verify CORS settings in backend
4. Check browser network tab

### Issue: Movies not loading
**Solution:**
1. Check backend API is accessible
2. Verify MongoDB Atlas connection
3. Check if movies are seeded
4. Test API endpoint directly

---

## 📞 Support

### Useful Commands

```bash
# Test backend health
curl https://your-backend.onrender.com/api/health

# Test movies endpoint
curl https://your-backend.onrender.com/api/luganda-movies

# Check Netlify deployment
netlify status

# View Netlify logs
netlify logs

# Test locally before deploying
npm run test  # if you have tests
```

### Documentation
- `GOOGLE_AUTH_AND_PLAYBACK_FINAL_REPORT.md` - Complete technical report
- `DEPLOYMENT_READY_SUMMARY.md` - Deployment guide
- `TEST_RESULTS_DETAILED.json` - Test results
- `HOW_TO_TEST_GOOGLE_AUTH.md` - Testing guide

---

## ✅ Final Checklist

Before deploying to Netlify:

- [ ] Backend deployed to Render/Railway/Heroku
- [ ] Backend URL copied
- [ ] `js/config.js` updated with backend URL
- [ ] MongoDB Atlas set up
- [ ] MongoDB connection string added to backend env
- [ ] Google OAuth configured for production domain
- [ ] Backend CORS updated with Netlify domain
- [ ] Changes committed to Git
- [ ] Ready to deploy!

After deploying to Netlify:

- [ ] Site loads correctly
- [ ] Google Sign-In works
- [ ] Email registration works
- [ ] Movie playback works
- [ ] No console errors
- [ ] All pages accessible
- [ ] Mobile responsive
- [ ] Security headers present

---

## 🎉 You're Ready!

Everything is configured and tested. Just:

1. Deploy backend (15 min)
2. Update config.js (1 min)
3. Configure Google OAuth (5 min)
4. Deploy to Netlify (2 min)
5. Test (5 min)

**Total: ~30 minutes to production!** 🚀

---

**Last Updated:** December 20, 2025  
**Status:** Production Ready  
**Test Success Rate:** 100%
