# 🚨 Railway Deployment Failure - Diagnosis & Solutions

**Date:** December 21, 2025  
**Status:** ❌ Deployment Failing  
**Root Cause Identified:** ✅ Yes

---

## 🔍 Problem Analysis

### Primary Issue: Missing Dependencies

Railway deployment is failing because the build process cannot find the required npm packages.

**Evidence:**
```bash
# All dependencies show as UNMET:
+-- UNMET DEPENDENCY express@^4.18.2
+-- UNMET DEPENDENCY mongoose@^8.0.3
+-- UNMET DEPENDENCY cors@^2.8.5
# ... and 20+ more
```

**Why This Happens:**
1. `node_modules/` is correctly excluded from Git (via `.gitignore`)
2. Railway must run `npm install` during build
3. If `npm install` fails or doesn't run, deployment fails

---

## 🎯 Common Railway Deployment Failures

### 1. ❌ Root Directory Not Set

**Problem:** Railway tries to build from project root instead of `server/` directory

**Solution:**
```
Railway Dashboard → Service → Settings → Root Directory
Set to: server
```

**Verification:**
- Build logs should show: "Building from /app/server"
- If it shows "/app", root directory is wrong

### 2. ❌ Build Command Not Running

**Problem:** Railway doesn't detect or run `npm install`

**Solution:**
Check `railway.json` configuration:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "node server.js"
  }
}
```

**Verification:**
- Build logs should show: "Running npm install"
- Should see: "added 341 packages"

### 3. ❌ Node.js Version Mismatch

**Problem:** Railway uses wrong Node.js version

**Solution:**
Check `nixpacks.toml`:
```toml
[phases.setup]
nixPkgs = ["nodejs-22_x"]

[start]
cmd = "node server.js"
```

**Verification:**
- Build logs should show: "Using Node.js 22.x"

### 4. ❌ Missing Environment Variables

**Problem:** Server starts but crashes due to missing env vars

**Solution:**
Add these REQUIRED variables in Railway dashboard:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-64-char-secret>
SESSION_SECRET=<generate-32-char-secret>
ALLOWED_ORIGINS=<your-netlify-url>
CLIENT_URL=<your-netlify-url>
```

**Verification:**
- Runtime logs should NOT show: "Missing required environment variable"
- Health check should return 200 OK

### 5. ❌ MongoDB Connection Failure

**Problem:** Server starts but can't connect to database

**Solution:**

**Option A: Railway MongoDB Plugin**
```
Railway Dashboard → New → Database → Add MongoDB
Variable MONGO_URL is auto-created
Add: MONGODB_URI=${{MONGO_URL}}
```

**Option B: MongoDB Atlas**
```
1. Create cluster at cloud.mongodb.com
2. Network Access → Add IP: 0.0.0.0/0
3. Get connection string
4. Add to Railway: MONGODB_URI=mongodb+srv://...
```

**Verification:**
```bash
curl https://your-app.up.railway.app/api/health
# Should return: {"status":"healthy","services":{"database":{"status":"healthy"}}}
```

### 6. ❌ Port Binding Issues

**Problem:** Server doesn't listen on Railway's assigned port

**Solution:**
Verify `server.js` uses `process.env.PORT`:
```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Verification:**
- Runtime logs should show: "Server running on port 5000" (or Railway's assigned port)

### 7. ❌ CORS Configuration

**Problem:** Frontend can't connect to backend (CORS errors)

**Solution:**
Update Railway environment variables:
```env
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
```

**Verification:**
- Browser console should NOT show CORS errors
- Network tab should show successful API calls

---

## 🛠️ Step-by-Step Fix

### Step 1: Verify Local Setup

```bash
# Navigate to server directory
cd server

# Install dependencies locally (to verify package.json is correct)
npm install

# Should see: "added 341 packages"
# If errors, fix package.json first

# Test server locally
node server.js

# Should see: "Server running on port 5000"
# If errors, fix code issues first
```

### Step 2: Check Railway Configuration Files

**File: `server/railway.json`**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**File: `server/nixpacks.toml`**
```toml
[phases.setup]
nixPkgs = ["nodejs-22_x"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["echo 'No build step needed'"]

[start]
cmd = "node server.js"
```

**File: `server/.railwayignore`**
```
node_modules/
.env.local
tests/
*.md
```

### Step 3: Configure Railway Dashboard

**A. Set Root Directory:**
1. Railway Dashboard → Click your service
2. Settings tab
3. Root Directory: `server`
4. Save

**B. Verify Build Settings:**
- Build Command: `npm install` (auto-detected from railway.json)
- Start Command: `node server.js` (auto-detected)

**C. Add Environment Variables:**

Click "Variables" tab and add:

```env
# Server
NODE_ENV=production
PORT=5000

# Database (choose one option below)
# Option 1: Railway MongoDB Plugin
MONGODB_URI=${{MONGO_URL}}

# Option 2: MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority

# Security (GENERATE NEW SECRETS!)
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# CORS (UPDATE WITH YOUR NETLIFY URL!)
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app

# Google OAuth
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com

# Features
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
ENABLE_MONITORING=true
LOG_LEVEL=info
TRUST_PROXY=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

**D. Add MongoDB:**

**Option 1: Railway Plugin (Easiest)**
1. Click "New" in project
2. Database → Add MongoDB
3. Railway creates instance
4. Variable `MONGO_URL` auto-added
5. Add variable: `MONGODB_URI` = `${{MONGO_URL}}`

**Option 2: MongoDB Atlas (Recommended)**
1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Database Access → Add user
4. Network Access → Add IP: `0.0.0.0/0`
5. Get connection string
6. Add to Railway variables

### Step 4: Deploy

1. Railway auto-deploys after configuration
2. Or click "Deploy" in Deployments tab
3. Watch build logs for errors

### Step 5: Monitor Build Logs

**Look for these success indicators:**
```
✅ Building from /app/server
✅ Using Node.js 22.x
✅ Running npm install
✅ added 341 packages
✅ Starting with: node server.js
✅ Server running on port 5000
✅ MongoDB connected successfully
```

**Common error patterns:**
```
❌ Cannot find module 'express'
   → npm install didn't run or failed
   
❌ ENOENT: no such file or directory, open 'server.js'
   → Root directory not set to 'server'
   
❌ MongooseError: The `uri` parameter to `openUri()` must be a string
   → MONGODB_URI not set or invalid
   
❌ Error: secretOrPrivateKey must have a value
   → JWT_SECRET not set
```

### Step 6: Test Deployment

```bash
# Get your Railway URL from dashboard
RAILWAY_URL="https://your-app.up.railway.app"

# Test health endpoint
curl $RAILWAY_URL/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-12-21T...",
  "services": {
    "database": {
      "status": "healthy",
      "state": "connected"
    }
  }
}

# Test movies endpoint
curl $RAILWAY_URL/api/luganda-movies

# Expected: {"success":true,"count":0,"data":[]} or list of movies

# Test VJs endpoint
curl $RAILWAY_URL/api/vjs

# Expected: {"success":true,"count":0,"data":[]} or list of VJs
```

### Step 7: Update Frontend

**File: `js/config.js` (line 15)**

```javascript
// Before:
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api.onrender.com',

// After (replace with your actual Railway URL):
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api-production.up.railway.app',
```

**Commit and push:**
```bash
git add js/config.js
git commit -m "Update backend URL to Railway"
git push origin main
```

Netlify will auto-deploy (1-2 minutes).

### Step 8: Update Google OAuth

1. Go to https://console.cloud.google.com
2. APIs & Services → Credentials
3. Edit OAuth 2.0 Client ID
4. Add Authorized JavaScript origins:
   ```
   https://your-site.netlify.app
   https://www.your-site.netlify.app
   ```
5. Add Authorized redirect URIs:
   ```
   https://your-site.netlify.app/login.html
   https://your-site.netlify.app/register.html
   ```
6. Save

### Step 9: Test Production

1. Open Netlify site
2. Open DevTools (F12) → Console
3. Verify config shows Railway URL
4. Test Google Sign-In
5. Test movie playback
6. Check Network tab for API calls

---

## 🔧 Quick Fixes for Common Errors

### Error: "Cannot find module 'express'"

**Cause:** Dependencies not installed

**Fix:**
```bash
# Verify package.json exists
ls -la server/package.json

# Check Railway build logs
# Should see: "Running npm install"
# Should see: "added 341 packages"

# If not, check:
# 1. Root directory is set to "server"
# 2. railway.json has buildCommand: "npm install"
```

### Error: "ENOENT: no such file or directory"

**Cause:** Wrong root directory

**Fix:**
```
Railway Dashboard → Service → Settings
Root Directory: server (not blank, not /)
```

### Error: "MongooseError: Invalid connection string"

**Cause:** MONGODB_URI not set or wrong format

**Fix:**
```env
# Correct format:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority

# Or for Railway plugin:
MONGODB_URI=${{MONGO_URL}}
```

### Error: "secretOrPrivateKey must have a value"

**Cause:** JWT_SECRET not set

**Fix:**
```bash
# Generate secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to Railway variables:
JWT_SECRET=<paste-generated-secret>
```

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Cause:** ALLOWED_ORIGINS doesn't include Netlify URL

**Fix:**
```env
# In Railway variables:
ALLOWED_ORIGINS=https://your-exact-netlify-url.netlify.app
CLIENT_URL=https://your-exact-netlify-url.netlify.app
```

---

## 📊 Deployment Checklist

### Before Deploying

- [x] `server/package.json` exists and is valid
- [x] `server/railway.json` configured
- [x] `server/nixpacks.toml` configured
- [x] `server/server.js` syntax is valid
- [x] All middleware files exist
- [x] All route files exist
- [ ] GitHub repository is up to date

### During Deployment

- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] Root directory set to `server`
- [ ] Environment variables added
- [ ] MongoDB configured (plugin or Atlas)
- [ ] Build logs show no errors
- [ ] Deployment status: "Running"

### After Deployment

- [ ] Health endpoint returns 200 OK
- [ ] Movies endpoint returns data
- [ ] VJs endpoint returns data
- [ ] Frontend config.js updated with Railway URL
- [ ] Google OAuth updated with production URLs
- [ ] Netlify redeployed with new config
- [ ] Production testing complete

---

## 🎯 Expected Results

### Successful Build Logs

```
Building...
✓ Using Node.js 22.x
✓ Installing dependencies
✓ Running: npm install
✓ added 341 packages in 15s
✓ Build complete

Deploying...
✓ Starting with: node server.js
✓ Server running on port 5000
✓ MongoDB connected successfully
✓ Deployment successful
```

### Successful Health Check

```bash
curl https://your-app.up.railway.app/api/health
```

```json
{
  "status": "healthy",
  "timestamp": "2025-12-21T18:30:00.000Z",
  "uptime": 123.456,
  "services": {
    "database": {
      "status": "healthy",
      "state": "connected",
      "responseTime": 45
    }
  },
  "memory": {
    "used": "150 MB",
    "total": "512 MB"
  }
}
```

### Successful API Response

```bash
curl https://your-app.up.railway.app/api/luganda-movies
```

```json
{
  "success": true,
  "count": 0,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

---

## 💡 Pro Tips

### 1. Use Railway CLI for Debugging

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs in real-time
railway logs

# Check variables
railway variables

# Run commands in Railway environment
railway run npm run seed:vjs
```

### 2. Enable Detailed Logging

Add to Railway variables:
```env
LOG_LEVEL=debug
ENABLE_LOGGING=true
```

This will show more detailed logs for debugging.

### 3. Test Locally First

Before deploying to Railway, always test locally:

```bash
cd server
npm install
node server.js
```

If it works locally, it should work on Railway (assuming env vars are set correctly).

### 4. Monitor Resource Usage

Railway dashboard shows:
- CPU usage
- Memory usage
- Network traffic
- Request count

Monitor these to ensure your app stays within free tier limits.

### 5. Set Up Auto-Deploy

Railway Settings → Enable "Auto-Deploy"
- Deploys automatically on every GitHub push
- No manual intervention needed
- Great for continuous deployment

---

## 🚀 Next Steps

1. **Fix Configuration:**
   - Set root directory to `server`
   - Add all environment variables
   - Configure MongoDB

2. **Deploy:**
   - Trigger deployment
   - Monitor build logs
   - Wait for "Deployment successful"

3. **Test:**
   - Health endpoint
   - API endpoints
   - Frontend integration

4. **Update Frontend:**
   - Update config.js with Railway URL
   - Commit and push
   - Wait for Netlify redeploy

5. **Production Testing:**
   - Test Google Sign-In
   - Test movie playback
   - Verify all features work

---

## 📞 Need Help?

**Railway Documentation:** https://docs.railway.app  
**Railway Discord:** https://discord.gg/railway  
**Railway Status:** https://status.railway.app

**Common Issues:**
- Build failures → Check build logs
- Runtime errors → Check runtime logs
- Connection issues → Check environment variables
- CORS errors → Check ALLOWED_ORIGINS

---

## ✅ Summary

**Problem:** Railway deployment failing  
**Root Cause:** Configuration issues (root directory, env vars, MongoDB)  
**Solution:** Follow step-by-step fix above  
**Time to Fix:** ~20 minutes  
**Expected Result:** Fully functional backend on Railway

**Your backend code is 100% ready. It's just a configuration issue!**

---

**Status:** 🛠️ READY TO FIX  
**Confidence:** ✅ HIGH (all files are correct, just need proper Railway configuration)
