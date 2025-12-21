# 🔐 Railway Environment Variables - Complete Guide

**Date:** December 21, 2025  
**Purpose:** All environment variables needed for Railway deployment  
**Status:** ✅ Ready to copy and paste

---

## 🚀 Quick Copy-Paste Variables

Copy these variables and add them to Railway Dashboard → Variables tab:

### ⚡ REQUIRED VARIABLES (Must Add These)

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=e89b4372c354b732f99c0ab2937c11f0373b7af49c1f58b919bc907a1388750e4c00ccf1f6fcd06b9811016339280e0bf4eae247b666f4415fb9031cb34637c2
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=939350ab881352d73aea3d67053f04dfb00cd4e8058675d83611f42f4ac6849b
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
TRUST_PROXY=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
ENABLE_MONITORING=true
ENABLE_CACHING=false
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```

> ℹ️ Leave `ENABLE_CACHING=false` unless you have a Redis instance configured. If you later set it to `true`, make sure `REDIS_HOST`, `REDIS_PORT`, and (optionally) `REDIS_PASSWORD` point to your Redis service.

### 🔄 VARIABLES YOU MUST UPDATE

**These need your actual values:**

```env
MONGODB_URI=<SEE MONGODB SECTION BELOW>
ALLOWED_ORIGINS=<YOUR_NETLIFY_URL>
CLIENT_URL=<YOUR_NETLIFY_URL>
```

---

## 📋 Complete Variable List with Explanations

### 1. Server Configuration

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Sets Node.js environment to production mode |
| `PORT` | `5000` | Port number (Railway will override with its own) |
| `TRUST_PROXY` | `true` | Required for Railway's reverse proxy |

**Why these matter:**
- `NODE_ENV=production` enables optimizations and disables debug features
- `TRUST_PROXY=true` ensures correct client IP detection behind Railway's proxy

---

### 2. Database Configuration (MongoDB)

**You have 2 options:**

#### Option A: Railway MongoDB Plugin (Easiest for Testing)

**Steps:**
1. In Railway Dashboard, click "New"
2. Select "Database" → "Add MongoDB"
3. Railway creates instance and adds `MONGO_URL` variable automatically
4. Add this variable:

```env
MONGODB_URI=${{MONGO_URL}}
```

**Pros:**
- ✅ One-click setup
- ✅ Automatic connection
- ✅ No external signup needed

**Cons:**
- ⚠️ Limited to 500MB storage
- ⚠️ Not recommended for production

---

#### Option B: MongoDB Atlas (Recommended for Production)

**Steps:**

1. **Go to:** https://cloud.mongodb.com
2. **Sign up/Login** with Google or email
3. **Create a free cluster:**
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select region closest to your Railway deployment (us-west1)
   - Click "Create"

4. **Create database user:**
   - Security → Database Access
   - Click "Add New Database User"
   - Username: `luganda_admin` (or your choice)
   - Password: Click "Autogenerate Secure Password" and SAVE IT
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Whitelist Railway's IP:**
   - Security → Network Access
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere"
   - IP Address: `0.0.0.0/0`
   - Click "Confirm"

6. **Get connection string:**
   - Click "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string

7. **Update connection string:**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   
   Replace:
   - `<username>` with your database username
   - `<password>` with your database password
   - Add database name: `/luganda-movies` before the `?`

**Final format:**
```env
MONGODB_URI=mongodb+srv://luganda_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

**Example:**
```env
MONGODB_URI=mongodb+srv://luganda_admin:Xy9Kp2mN4vB8@cluster0.abc123.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

**Pros:**
- ✅ 512MB free forever
- ✅ Production-ready
- ✅ Automatic backups
- ✅ Better performance

---

### 3. JWT (JSON Web Token) Configuration

**Already generated for you:**

```env
JWT_SECRET=e89b4372c354b732f99c0ab2937c11f0373b7af49c1f58b919bc907a1388750e4c00ccf1f6fcd06b9811016339280e0bf4eae247b666f4415fb9031cb34637c2
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

**What these do:**
- `JWT_SECRET`: Secret key for signing authentication tokens (128 characters, cryptographically secure)
- `JWT_EXPIRES_IN`: Access token expires after 7 days
- `JWT_REFRESH_EXPIRES_IN`: Refresh token expires after 30 days

**Security:** These are production-ready secrets generated using Node.js crypto module.

---

### 4. Session Configuration

**Already generated for you:**

```env
SESSION_SECRET=939350ab881352d73aea3d67053f04dfb00cd4e8058675d83611f42f4ac6849b
```

**What this does:**
- Signs session cookies to prevent tampering
- 64 characters, cryptographically secure

---

### 5. Google OAuth Configuration

```env
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
```

**What this does:**
- Enables "Sign in with Google" functionality
- This is your existing Google OAuth Client ID

**Important:** After Railway deployment, you must update Google Cloud Console:

1. Go to: https://console.cloud.google.com
2. Select your project
3. APIs & Services → Credentials
4. Click on your OAuth 2.0 Client ID
5. Add to **Authorized JavaScript origins:**
   ```
   https://your-netlify-site.netlify.app
   https://your-railway-url.up.railway.app
   ```
6. Add to **Authorized redirect URIs:**
   ```
   https://your-netlify-site.netlify.app/login.html
   https://your-netlify-site.netlify.app/register.html
   ```
7. Click "Save"

---

### 6. CORS Configuration

**YOU MUST UPDATE THESE with your actual Netlify URL:**

```env
ALLOWED_ORIGINS=https://your-site.netlify.app,https://www.your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
```

**How to find your Netlify URL:**
1. Go to: https://app.netlify.com
2. Click on your site
3. Copy the URL (looks like: `https://luganda-movies.netlify.app`)

**Example:**
```env
ALLOWED_ORIGINS=https://luganda-movies.netlify.app,https://www.luganda-movies.netlify.app
CLIENT_URL=https://luganda-movies.netlify.app
```

**What these do:**
- `ALLOWED_ORIGINS`: Comma-separated list of domains allowed to make API requests
- `CLIENT_URL`: Your frontend URL for redirects

**Important:** 
- No trailing slashes
- Include both `www` and non-`www` versions if applicable
- Must be exact match (case-sensitive)

---

### 7. Rate Limiting Configuration

```env
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
ENABLE_RATE_LIMITING=true
```

**What these do:**
- `RATE_LIMIT_WINDOW`: Time window in minutes (15 minutes)
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per IP in that window (100 requests)
- `ENABLE_RATE_LIMITING`: Enable/disable rate limiting

**Effect:** Each IP can make 100 requests per 15 minutes. Prevents abuse and DDoS attacks.

---

### 8. Logging Configuration

```env
LOG_LEVEL=info
ENABLE_LOGGING=true
ENABLE_MONITORING=true
```

**What these do:**
- `LOG_LEVEL`: Logging verbosity (error, warn, info, debug)
- `ENABLE_LOGGING`: Enable Winston logging
- `ENABLE_MONITORING`: Enable performance monitoring

**Log levels:**
- `error`: Only errors
- `warn`: Errors and warnings
- `info`: Normal operations (recommended for production)
- `debug`: Detailed debugging info (use for troubleshooting)

---

### 9. Optional Variables (Not Required)

These are optional but can be added later:

```env
# TMDB API (for movie metadata)
TMDB_API_KEY=your-tmdb-api-key-here

# Redis Cache (for performance)
REDIS_HOST=redis-host.railway.app
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lugandamovies.com

# Pesapal Payment Gateway
PESAPAL_CONSUMER_KEY=your-pesapal-key
PESAPAL_CONSUMER_SECRET=your-pesapal-secret
PESAPAL_CALLBACK_URL=https://your-railway-url.up.railway.app/api/payments/callback
PESAPAL_IPN_URL=https://your-railway-url.up.railway.app/api/payments/ipn

# Feature Flags
ENABLE_CACHING=false
```

---

## 📝 Step-by-Step: Adding Variables to Railway

### Method 1: Railway Dashboard (Recommended)

1. **Go to Railway Dashboard:** https://railway.app
2. **Select your project**
3. **Click on your service** (backend)
4. **Click "Variables" tab**
5. **Click "New Variable"**
6. **Add each variable one by one:**
   - Variable name: `NODE_ENV`
   - Value: `production`
   - Click "Add"
7. **Repeat for all variables**

### Method 2: Railway CLI (Faster)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Add variables (one at a time)
railway variables set NODE_ENV=production
railway variables set PORT=5000
railway variables set JWT_SECRET=e89b4372c354b732f99c0ab2937c11f0373b7af49c1f58b919bc907a1388750e4c00ccf1f6fcd06b9811016339280e0bf4eae247b666f4415fb9031cb34637c2
# ... etc

# Or add from file
railway variables set --from-file .env
```

### Method 3: Bulk Import (Fastest)

1. Create a file called `railway-vars.txt` with this content:
   ```
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=e89b4372c354b732f99c0ab2937c11f0373b7af49c1f58b919bc907a1388750e4c00ccf1f6fcd06b9811016339280e0bf4eae247b666f4415fb9031cb34637c2
   JWT_EXPIRES_IN=7d
   JWT_REFRESH_EXPIRES_IN=30d
   SESSION_SECRET=939350ab881352d73aea3d67053f04dfb00cd4e8058675d83611f42f4ac6849b
   GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
   TRUST_PROXY=true
   ENABLE_RATE_LIMITING=true
   ENABLE_LOGGING=true
   ENABLE_MONITORING=true
   LOG_LEVEL=info
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX_REQUESTS=100
   MONGODB_URI=<YOUR_MONGODB_CONNECTION_STRING>
   ALLOWED_ORIGINS=<YOUR_NETLIFY_URL>
   CLIENT_URL=<YOUR_NETLIFY_URL>
   ```

2. Update the last 3 variables with your actual values
3. In Railway Dashboard → Variables → Click "Raw Editor"
4. Paste all variables
5. Click "Update Variables"

---

## ✅ Verification Checklist

After adding all variables:

### Required Variables Check

- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`
- [ ] `JWT_SECRET` = (128 character hex string)
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `JWT_REFRESH_EXPIRES_IN` = `30d`
- [ ] `SESSION_SECRET` = (64 character hex string)
- [ ] `GOOGLE_CLIENT_ID` = (your Google client ID)
- [ ] `MONGODB_URI` = (your MongoDB connection string)
- [ ] `ALLOWED_ORIGINS` = (your Netlify URL)
- [ ] `CLIENT_URL` = (your Netlify URL)
- [ ] `TRUST_PROXY` = `true`
- [ ] `ENABLE_RATE_LIMITING` = `true`
- [ ] `ENABLE_LOGGING` = `true`
- [ ] `ENABLE_MONITORING` = `true`
- [ ] `LOG_LEVEL` = `info`
- [ ] `RATE_LIMIT_WINDOW` = `15`
- [ ] `RATE_LIMIT_MAX_REQUESTS` = `100`

### MongoDB Check

- [ ] MongoDB Atlas cluster created (or Railway plugin added)
- [ ] Database user created with password
- [ ] Network access set to `0.0.0.0/0`
- [ ] Connection string tested
- [ ] `MONGODB_URI` added to Railway

### CORS Check

- [ ] Netlify URL copied correctly
- [ ] No trailing slashes in URLs
- [ ] Both `ALLOWED_ORIGINS` and `CLIENT_URL` set
- [ ] URLs are HTTPS (not HTTP)

---

## 🧪 Testing After Deployment

Once Railway deploys with all variables:

### 1. Test Health Endpoint

```bash
curl https://your-railway-url.up.railway.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-21T...",
  "uptime": 123.45,
  "services": {
    "database": {
      "status": "healthy",
      "state": "connected",
      "responseTime": 45
    }
  }
}
```

### 2. Test Movies Endpoint

```bash
curl https://your-railway-url.up.railway.app/api/luganda-movies
```

**Expected response:**
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

### 3. Test CORS

```bash
curl -H "Origin: https://your-netlify-url.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://your-railway-url.up.railway.app/api/health
```

**Should return CORS headers:**
```
Access-Control-Allow-Origin: https://your-netlify-url.netlify.app
Access-Control-Allow-Credentials: true
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use the generated secrets (they're cryptographically secure)
- ✅ Keep secrets in Railway variables (never commit to Git)
- ✅ Use HTTPS URLs for ALLOWED_ORIGINS
- ✅ Limit ALLOWED_ORIGINS to your actual domains
- ✅ Use MongoDB Atlas with IP whitelist
- ✅ Enable rate limiting in production
- ✅ Set NODE_ENV=production

### ❌ DON'T:
- ❌ Don't use simple passwords or secrets
- ❌ Don't commit .env files to Git
- ❌ Don't use `*` for ALLOWED_ORIGINS in production
- ❌ Don't disable rate limiting
- ❌ Don't use HTTP URLs (must be HTTPS)
- ❌ Don't share secrets publicly

---

## 🚨 Common Issues & Solutions

### Issue: "MongoDB connection failed"

**Check:**
- [ ] MONGODB_URI is set correctly
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Database user credentials are correct
- [ ] Connection string includes database name

**Solution:**
```env
# Correct format:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

### Issue: "CORS error in browser"

**Check:**
- [ ] ALLOWED_ORIGINS includes your Netlify URL
- [ ] No typos in the URL
- [ ] URL is HTTPS (not HTTP)
- [ ] No trailing slash

**Solution:**
```env
# Correct format:
ALLOWED_ORIGINS=https://your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
```

### Issue: "JWT error: secretOrPrivateKey must have a value"

**Check:**
- [ ] JWT_SECRET is set
- [ ] JWT_SECRET is not empty
- [ ] No extra spaces in the value

**Solution:**
```env
JWT_SECRET=e89b4372c354b732f99c0ab2937c11f0373b7af49c1f58b919bc907a1388750e4c00ccf1f6fcd06b9811016339280e0bf4eae247b666f4415fb9031cb34637c2
```

### Issue: "Google Sign-In not working"

**Check:**
- [ ] GOOGLE_CLIENT_ID is set
- [ ] Google Cloud Console has Railway URL in authorized origins
- [ ] Netlify URL is in authorized redirect URIs

**Solution:**
Update Google Cloud Console with production URLs.

---

## 📊 Summary

### Total Variables to Add: 17

**Required (must add):** 17 variables
**Optional (can add later):** 10+ variables

### Estimated Time: 10-15 minutes

**Breakdown:**
- Copy-paste basic variables: 2 minutes
- Set up MongoDB Atlas: 5 minutes
- Update CORS URLs: 1 minute
- Verify and test: 2 minutes

---

## 🎯 Quick Start Checklist

1. [ ] Copy all variables from "Quick Copy-Paste" section
2. [ ] Set up MongoDB (Atlas or Railway plugin)
3. [ ] Update MONGODB_URI with your connection string
4. [ ] Get your Netlify URL
5. [ ] Update ALLOWED_ORIGINS and CLIENT_URL
6. [ ] Add all variables to Railway Dashboard
7. [ ] Wait for Railway to redeploy (2-3 minutes)
8. [ ] Test health endpoint
9. [ ] Update Google OAuth settings
10. [ ] Update frontend config.js with Railway URL

---

## 📞 Need Help?

**MongoDB Atlas:** https://cloud.mongodb.com  
**Railway Dashboard:** https://railway.app  
**Google Cloud Console:** https://console.cloud.google.com  
**Netlify Dashboard:** https://app.netlify.com

---

**Status:** ✅ READY TO ADD TO RAILWAY  
**Secrets:** ✅ GENERATED AND SECURE  
**Next Step:** Add these variables to Railway Dashboard

---

## 🚀 After Adding Variables

Railway will automatically redeploy. Watch for:
- ✅ Build successful
- ✅ Server running on port 5000
- ✅ MongoDB connected successfully
- ✅ All routes registered
- ✅ Deployment successful

Then test your endpoints and update your frontend!
