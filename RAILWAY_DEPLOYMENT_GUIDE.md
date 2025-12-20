# 🚂 Railway.app Backend Deployment Guide

**Platform:** Railway.app  
**Backend:** Luganda Movies API  
**Status:** ✅ Ready to Deploy

---

## ✅ Why Railway is Perfect for Your Backend

- ✅ **Free Tier:** $5 free credit monthly (enough for small apps)
- ✅ **Easy Setup:** Deploy in minutes
- ✅ **MongoDB Support:** Built-in MongoDB plugin or connect to Atlas
- ✅ **Auto-Deploy:** Connects to GitHub for automatic deployments
- ✅ **Environment Variables:** Easy to configure
- ✅ **Custom Domains:** Free SSL certificates
- ✅ **Logs:** Real-time logging and monitoring
- ✅ **Node.js 22:** Supports latest Node.js

---

## 🚀 Quick Deployment Steps

### Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login" or "Start a New Project"
3. Sign in with GitHub (recommended)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your Luganda Movies repository
4. Railway will detect it's a Node.js project

### Step 3: Configure Root Directory

Since your backend is in the `server` folder:

1. Click on your service
2. Go to "Settings"
3. Scroll to "Root Directory"
4. Set to: `server`
5. Click "Save"

### Step 4: Add Environment Variables

Click "Variables" tab and add these:

```env
NODE_ENV=production
PORT=5000

# MongoDB (Option 1: Use Railway's MongoDB plugin)
# Leave empty for now, we'll add MongoDB plugin

# MongoDB (Option 2: Use MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-64-char-string
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Session
SESSION_SECRET=your-session-secret-change-this-to-random-32-char-string

# Google OAuth
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com

# CORS - Update with your Netlify URL
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Feature Flags
ENABLE_CACHING=false
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
ENABLE_MONITORING=true

# Optional
TMDB_API_KEY=your-tmdb-api-key-if-you-have-one
```

### Step 5: Add MongoDB (Choose One Option)

#### Option A: Railway MongoDB Plugin (Recommended for Testing)

1. In your Railway project, click "New"
2. Select "Database" → "Add MongoDB"
3. Railway will create a MongoDB instance
4. It will automatically add `MONGO_URL` variable
5. Rename it to `MONGODB_URI` or update your code to use `MONGO_URL`

#### Option B: MongoDB Atlas (Recommended for Production)

1. Go to https://cloud.mongodb.com
2. Create free cluster (M0 Sandbox)
3. Create database user
4. Network Access → Add IP: `0.0.0.0/0` (allow all)
5. Get connection string
6. Add to Railway variables as `MONGODB_URI`

### Step 6: Deploy

1. Railway will automatically deploy
2. Wait 2-5 minutes for build and deployment
3. Check deployment logs for any errors
4. Once deployed, you'll get a URL like:
   ```
   https://luganda-movies-api-production.up.railway.app
   ```

### Step 7: Verify Deployment

Test your Railway backend:

```bash
# Health check
curl https://your-app.up.railway.app/api/health

# Movies endpoint
curl https://your-app.up.railway.app/api/luganda-movies

# VJs endpoint
curl https://your-app.up.railway.app/api/vjs
```

---

## 📝 Railway Configuration Files Created

I've created these files for you:

### 1. `server/railway.json`
Railway-specific configuration:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### 2. `server/nixpacks.toml`
Build configuration:
```toml
[phases.setup]
nixPkgs = ["nodejs-22_x"]

[start]
cmd = "node server.js"
```

### 3. `server/.railwayignore`
Files to exclude from deployment:
```
node_modules/
.env.local
tests/
*.md
```

---

## 🔧 Update Frontend Config

After Railway gives you a URL, update your frontend:

**File:** `js/config.js` (line 15)

```javascript
// Update this line with your Railway URL:
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://your-app-name.up.railway.app', // ← Your Railway URL here
```

Then commit and push to trigger Netlify redeploy:
```bash
git add js/config.js
git commit -m "Update backend URL to Railway"
git push origin main
```

---

## 🔐 Generate Strong Secrets

Before deploying, generate strong secrets:

```bash
# Generate JWT_SECRET (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy these and use them in Railway environment variables.

---

## 🗄️ MongoDB Options for Railway

### Option 1: Railway MongoDB Plugin (Easiest)

**Pros:**
- ✅ One-click setup
- ✅ Automatic connection
- ✅ Included in Railway
- ✅ Good for testing

**Cons:**
- ⚠️ Limited storage (500MB free)
- ⚠️ Not recommended for production

**Setup:**
1. In Railway project → "New" → "Database" → "MongoDB"
2. Railway creates instance and adds `MONGO_URL`
3. Update your code or rename variable to `MONGODB_URI`

### Option 2: MongoDB Atlas (Recommended)

**Pros:**
- ✅ 512MB free forever
- ✅ Production-ready
- ✅ Better performance
- ✅ Automatic backups
- ✅ Global distribution

**Cons:**
- ⚠️ Requires separate signup

**Setup:**
1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Create database user
4. Whitelist IP: `0.0.0.0/0`
5. Get connection string
6. Add to Railway as `MONGODB_URI`

---

## 📋 Railway Deployment Checklist

### Before Deploying

- [x] Backend code ready (`server/` directory)
- [x] `package.json` has start script
- [x] Railway config files created
- [ ] GitHub repository pushed
- [ ] Railway account created
- [ ] MongoDB choice made (Plugin or Atlas)

### During Deployment

- [ ] Create Railway project
- [ ] Connect GitHub repository
- [ ] Set root directory to `server`
- [ ] Add environment variables
- [ ] Add MongoDB (plugin or Atlas)
- [ ] Deploy and wait for build
- [ ] Copy Railway URL

### After Deployment

- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Seed database (if using new MongoDB)
- [ ] Update frontend config.js
- [ ] Update Google OAuth settings
- [ ] Test from Netlify frontend

---

## 🌐 Update CORS for Railway

Your backend needs to allow requests from Netlify.

**In Railway Environment Variables:**
```env
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
```

**Replace `your-site.netlify.app` with your actual Netlify URL.**

---

## 🧪 Testing Railway Deployment

### Test 1: Health Check
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "state": "connected"
    }
  }
}
```

### Test 2: Movies Endpoint
```bash
curl https://your-app.up.railway.app/api/luganda-movies
```

Expected: List of movies (or empty array if not seeded)

### Test 3: Google Auth Endpoint
```bash
curl -X POST https://your-app.up.railway.app/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "test"}'
```

Expected: 401 error (correct - validates tokens)

---

## 🌱 Seeding Data on Railway

After deployment, seed your database:

### Option 1: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run seed command
railway run npm run seed:vjs
```

### Option 2: Using MongoDB Compass

1. Connect to your MongoDB (Atlas or Railway)
2. Import data manually
3. Or use mongorestore

### Option 3: API Endpoint (if you create one)

Create a seed endpoint in your backend (protected):
```javascript
router.post('/api/admin/seed', async (req, res) => {
  // Run seeding logic
});
```

---

## 🔄 Auto-Deploy from GitHub

Railway can auto-deploy when you push to GitHub:

1. In Railway project settings
2. Enable "Auto-Deploy"
3. Select branch (usually `main`)
4. Every push triggers deployment

---

## 💰 Railway Pricing

**Free Tier:**
- $5 credit per month
- ~500 hours of usage
- Perfect for development/small apps

**Pro Plan ($20/month):**
- $20 credit included
- Better performance
- More resources
- Priority support

**For your app:** Free tier should be sufficient initially!

---

## 🐛 Common Issues & Solutions

### Issue 1: Build Fails
**Solution:**
- Check Railway logs
- Verify `package.json` is correct
- Ensure all dependencies are listed
- Check Node.js version compatibility

### Issue 2: MongoDB Connection Fails
**Solution:**
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas IP whitelist (0.0.0.0/0)
- Verify database user credentials
- Check connection string format

### Issue 3: CORS Errors
**Solution:**
- Add Netlify URL to `ALLOWED_ORIGINS`
- Verify CORS middleware is configured
- Check Railway logs for CORS errors

### Issue 4: Environment Variables Not Working
**Solution:**
- Verify variables are set in Railway dashboard
- Check for typos in variable names
- Redeploy after adding variables
- Use Railway CLI to check: `railway variables`

---

## 📊 Expected Railway Setup

After successful deployment:

```
Railway Project: luganda-movies-api
├── Service: Backend API
│   ├── URL: https://luganda-movies-api-production.up.railway.app
│   ├── Status: Running
│   ├── Memory: ~100-200 MB
│   └── CPU: < 5%
│
└── Database: MongoDB (if using Railway plugin)
    ├── Status: Running
    ├── Storage: 500 MB
    └── Connection: Automatic
```

---

## 🔗 Integration with Netlify

### Step 1: Get Railway URL

After deployment, Railway gives you a URL like:
```
https://luganda-movies-api-production.up.railway.app
```

### Step 2: Update Frontend Config

Edit `js/config.js`:
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api-production.up.railway.app',
```

### Step 3: Update Google OAuth

Add Railway URL to Google Cloud Console:
```
Authorized JavaScript origins:
- https://your-site.netlify.app
- https://luganda-movies-api-production.up.railway.app

Authorized redirect URIs:
- https://your-site.netlify.app/login.html
```

### Step 4: Test Integration

```bash
# From your Netlify site, test:
# 1. Open browser console
# 2. Go to your Netlify URL
# 3. Check Network tab
# 4. Verify API calls go to Railway URL
```

---

## 📝 Environment Variables for Railway

Copy these to Railway dashboard:

```env
# Server
NODE_ENV=production
PORT=5000

# Database (if using MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority

# JWT (Generate new secrets!)
JWT_SECRET=GENERATE_NEW_64_CHAR_SECRET_HERE
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Session (Generate new secret!)
SESSION_SECRET=GENERATE_NEW_32_CHAR_SECRET_HERE

# Google OAuth
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com

# CORS (Update with your Netlify URL)
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Features
ENABLE_CACHING=false
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
ENABLE_MONITORING=true

# Optional
TMDB_API_KEY=your-tmdb-key-here
TRUST_PROXY=true
```

---

## 🎯 Step-by-Step Railway Deployment

### 1. Prepare Your Repository

```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. **Login to Railway:** https://railway.app
2. **New Project:** Click "New Project"
3. **Deploy from GitHub:** Select this option
4. **Choose Repository:** Select your Luganda Movies repo
5. **Wait:** Railway detects Node.js automatically

### 3. Configure Service

1. **Click on the service** (it will be named after your repo)
2. **Settings Tab:**
   - Root Directory: `server`
   - Build Command: `npm install` (auto-detected)
   - Start Command: `node server.js` (auto-detected)
   - Port: Railway auto-detects from your code

### 4. Add MongoDB

**Option A: Railway Plugin**
1. Click "New" in your project
2. Select "Database"
3. Choose "Add MongoDB"
4. Railway creates instance
5. Connection string auto-added as `MONGO_URL`
6. Add variable: `MONGODB_URI=${{MONGO_URL}}`

**Option B: MongoDB Atlas**
1. Create cluster on MongoDB Atlas
2. Get connection string
3. Add to Railway variables as `MONGODB_URI`

### 5. Add Environment Variables

Click "Variables" tab and add all variables from the list above.

**Important:** Generate new secrets for production!

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6. Deploy

1. Railway automatically deploys after configuration
2. Watch the deployment logs
3. Wait for "Deployment successful" message
4. Copy your Railway URL from the dashboard

### 7. Test Deployment

```bash
# Replace with your actual Railway URL
RAILWAY_URL="https://your-app.up.railway.app"

# Test health
curl $RAILWAY_URL/api/health

# Test movies
curl $RAILWAY_URL/api/luganda-movies

# Test VJs
curl $RAILWAY_URL/api/vjs
```

### 8. Seed Database (If New MongoDB)

If you're using a fresh MongoDB instance:

```bash
# Option 1: Using Railway CLI
railway run npm run seed:vjs

# Option 2: Create seed endpoint and call it
curl -X POST https://your-app.up.railway.app/api/admin/seed
```

### 9. Update Frontend

Edit `js/config.js`:
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://your-actual-railway-url.up.railway.app',
```

Commit and push:
```bash
git add js/config.js
git commit -m "Update backend URL to Railway"
git push origin main
```

Netlify will auto-deploy with the new config.

### 10. Update Google OAuth

1. Go to Google Cloud Console
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID
4. Add Authorized JavaScript origins:
   ```
   https://your-site.netlify.app
   https://your-railway-url.up.railway.app
   ```
5. Add Authorized redirect URIs:
   ```
   https://your-site.netlify.app/login.html
   https://your-site.netlify.app/register.html
   ```
6. Save

---

## 🎬 Complete Deployment Flow

```
1. Push code to GitHub
   ↓
2. Railway detects push
   ↓
3. Railway builds backend (npm install)
   ↓
4. Railway starts server (node server.js)
   ↓
5. Backend connects to MongoDB
   ↓
6. Railway provides public URL
   ↓
7. Update frontend config.js with Railway URL
   ↓
8. Push to GitHub
   ↓
9. Netlify auto-deploys frontend
   ↓
10. Frontend connects to Railway backend
   ↓
11. Everything works! 🎉
```

---

## 📊 Railway Dashboard Overview

After deployment, you'll see:

```
Project Dashboard:
├── Deployments
│   ├── Latest deployment status
│   ├── Build logs
│   └── Runtime logs
│
├── Metrics
│   ├── CPU usage
│   ├── Memory usage
│   └── Network traffic
│
├── Variables
│   ├── All environment variables
│   └── Add/edit variables
│
├── Settings
│   ├── Root directory
│   ├── Build/start commands
│   ├── Custom domain
│   └── Auto-deploy settings
│
└── Logs
    ├── Build logs
    ├── Deploy logs
    └── Runtime logs
```

---

## 🚨 Important Notes

### 1. Port Configuration
Railway automatically assigns a PORT. Your code already handles this:
```javascript
const PORT = process.env.PORT || 5000;
```
✅ No changes needed!

### 2. Database Connection
Make sure your MongoDB connection handles Railway's environment:
```javascript
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/luganda-movies';
```

### 3. CORS Configuration
Update ALLOWED_ORIGINS with your Netlify URL:
```env
ALLOWED_ORIGINS=https://your-site.netlify.app
```

### 4. Trust Proxy
Railway uses a reverse proxy, so enable:
```env
TRUST_PROXY=true
```

Your code already has:
```javascript
app.set('trust proxy', 1);
```
✅ Already configured!

---

## 🎯 Quick Start Commands

### Deploy to Railway

```bash
# 1. Install Railway CLI (optional)
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize in your project
cd /vercel/sandbox/server
railway init

# 4. Deploy
railway up

# 5. Open dashboard
railway open
```

### Or Use Web Interface (Easier)

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Configure and deploy
5. Done!

---

## 📈 Monitoring Your Railway Backend

### View Logs
```bash
# Using CLI
railway logs

# Or in dashboard
# Click on service → Logs tab
```

### Check Metrics
- CPU usage
- Memory usage
- Request count
- Response times

### Set Up Alerts
- Railway can notify you of deployment failures
- Configure in Settings → Notifications

---

## 💡 Pro Tips

### 1. Use Railway CLI for Quick Deploys
```bash
railway up  # Deploy current directory
railway logs  # View logs
railway variables  # List variables
railway run npm run seed:vjs  # Run commands
```

### 2. Enable Auto-Deploy
- Connects to GitHub
- Deploys on every push
- No manual intervention needed

### 3. Custom Domain (Optional)
- Railway provides free SSL
- Add your custom domain in Settings
- Update DNS records as instructed

### 4. Environment-Specific Variables
- Use different values for staging/production
- Railway supports multiple environments

---

## 🎉 Success Indicators

You'll know Railway deployment is successful when:

✅ Build completes without errors  
✅ Service shows "Running" status  
✅ Health endpoint returns 200 OK  
✅ MongoDB connection is healthy  
✅ API endpoints return data  
✅ Logs show no errors  
✅ Frontend can connect to backend  
✅ Google Auth works from Netlify  

---

## 📞 Next Steps After Railway Deployment

1. **Copy Railway URL** from dashboard
2. **Update `js/config.js`** with Railway URL
3. **Commit and push** to trigger Netlify redeploy
4. **Update Google OAuth** with production domains
5. **Test from Netlify** frontend
6. **Seed database** if needed
7. **Monitor logs** for any issues

---

## 🚀 Ready to Deploy!

Your backend is **100% ready** for Railway deployment!

**What you have:**
- ✅ Railway config files created
- ✅ Package.json with start script
- ✅ Environment variables documented
- ✅ MongoDB connection ready
- ✅ CORS configured
- ✅ Security features enabled
- ✅ All endpoints tested

**What you need to do:**
1. Create Railway project (5 min)
2. Connect GitHub repo (1 min)
3. Add environment variables (5 min)
4. Add MongoDB (2 min)
5. Deploy and wait (3 min)
6. Update frontend config (1 min)

**Total time: ~20 minutes** ⏱️

---

**Railway.app:** https://railway.app  
**Documentation:** https://docs.railway.app  
**Status:** ✅ READY TO DEPLOY
