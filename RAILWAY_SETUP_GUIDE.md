# Railway Deployment Setup Guide 🚂

## Quick Setup (5 Minutes)

### Step 1: Set Environment Variables

Go to your Railway project → Settings → Variables and add:

```bash
# === CRITICAL - Required for CORS Fix ===
ALLOWED_ORIGINS=https://watch.unrulymovies.com,https://unrulymovies.com,https://www.unrulymovies.com

# === Required ===
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies

# === JWT Authentication ===
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# === Session ===
SESSION_SECRET=your-session-secret-minimum-32-characters

# === Optional but Recommended ===
TMDB_API_KEY=your-tmdb-api-key
LOG_LEVEL=info
ENABLE_CACHING=true
ENABLE_RATE_LIMITING=true
```

### Step 2: Generate Secure Secrets

Run these commands to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste into Railway environment variables.

### Step 3: Deploy

```bash
# Commit your changes
git add .
git commit -m "fix: resolve CSP and CORS issues"

# Push to trigger Railway deployment
git push origin main
```

### Step 4: Verify

```bash
# Test health endpoint
curl https://luganda-translated-movies-production.up.railway.app/api/health

# Test CORS
curl -H "Origin: https://watch.unrulymovies.com" \
     -X OPTIONS \
     https://luganda-translated-movies-production.up.railway.app/api/luganda-movies/latest
```

---

## Detailed Setup

### 1. Railway Project Configuration

#### Root Directory
Set to: `server`

This tells Railway to deploy the backend from the `server` directory.

#### Build Command
```bash
npm install
```

#### Start Command
```bash
npm start
```

#### Watch Paths
```
server/**
```

### 2. Environment Variables Explained

#### ALLOWED_ORIGINS (CRITICAL)
```bash
ALLOWED_ORIGINS=https://watch.unrulymovies.com,https://unrulymovies.com,https://www.unrulymovies.com
```
**Why:** This fixes the CORS error. Without this, the frontend cannot access the API.

#### MONGODB_URI
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority
```
**Get it from:** [MongoDB Atlas](https://cloud.mongodb.com)
1. Create a free cluster
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password

#### JWT_SECRET
```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```
**Why:** Used to sign authentication tokens. Must be long and random.

#### SESSION_SECRET
```bash
SESSION_SECRET=x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0
```
**Why:** Used to sign session cookies. Must be long and random.

### 3. MongoDB Atlas Setup

1. **Create Account:** [MongoDB Atlas](https://cloud.mongodb.com)
2. **Create Cluster:** Free tier (M0) is sufficient
3. **Create Database User:**
   - Username: `luganda-movies-user`
   - Password: Generate strong password
4. **Whitelist IP:** Add `0.0.0.0/0` (allow from anywhere)
5. **Get Connection String:** Click "Connect" → "Connect your application"

### 4. TMDB API Key (Optional)

1. **Create Account:** [TMDB](https://www.themoviedb.org/signup)
2. **Get API Key:** Settings → API → Request API Key
3. **Add to Railway:** `TMDB_API_KEY=your-key-here`

---

## Deployment Methods

### Method 1: GitHub Integration (Recommended)

1. **Connect Repository:**
   - Railway Dashboard → New Project
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select `server` as root directory

2. **Auto-Deploy:**
   - Every push to `main` triggers deployment
   - Railway builds and deploys automatically

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Method 3: Manual Deploy

1. Go to Railway Dashboard
2. Click "Deploy"
3. Select branch
4. Railway builds and deploys

---

## Monitoring & Debugging

### View Logs

**Railway Dashboard:**
1. Go to your project
2. Click on the service
3. Click "Logs" tab
4. View real-time logs

**Railway CLI:**
```bash
railway logs
```

### Check Deployment Status

**Railway Dashboard:**
- Green checkmark = Deployed successfully
- Yellow spinner = Building/Deploying
- Red X = Deployment failed

### Common Log Messages

✅ **Success:**
```
🚀 Server running on port 5000
📍 Environment: production
🌐 API URL: http://localhost:5000
```

❌ **MongoDB Connection Failed:**
```
❌ Database initialization error: MongoServerError
```
**Fix:** Check `MONGODB_URI` is correct

❌ **Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Fix:** Railway handles this automatically, ignore in production

### Health Check

```bash
# Should return JSON with status
curl https://luganda-translated-movies-production.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-12-27T12:00:00.000Z",
  "database": {
    "connected": true,
    "mode": "mongodb"
  }
}
```

---

## Testing CORS

### Test 1: OPTIONS Preflight

```bash
curl -i -X OPTIONS \
  -H "Origin: https://watch.unrulymovies.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://luganda-translated-movies-production.up.railway.app/api/luganda-movies/latest
```

**Expected headers:**
```
Access-Control-Allow-Origin: https://watch.unrulymovies.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
Access-Control-Allow-Credentials: true
```

### Test 2: GET Request

```bash
curl -i -H "Origin: https://watch.unrulymovies.com" \
  https://luganda-translated-movies-production.up.railway.app/api/luganda-movies/latest?limit=5
```

**Expected:**
- Status: 200 OK
- Header: `Access-Control-Allow-Origin: https://watch.unrulymovies.com`
- Body: JSON array of movies

### Test 3: Browser Console

Open `https://watch.unrulymovies.com` and run:

```javascript
fetch('https://luganda-translated-movies-production.up.railway.app/api/luganda-movies/latest?limit=5')
  .then(r => r.json())
  .then(data => console.log('✅ CORS working:', data))
  .catch(err => console.error('❌ CORS failed:', err));
```

---

## Troubleshooting

### Issue: Deployment Fails

**Check:**
1. Railway build logs for errors
2. `package.json` has correct scripts
3. All dependencies listed in `package.json`
4. No syntax errors in code

**Fix:**
```bash
# Test locally first
cd server
npm install
npm start
```

### Issue: CORS Still Blocked

**Check:**
1. `ALLOWED_ORIGINS` environment variable is set
2. Railway service restarted after adding variable
3. Frontend is using correct backend URL

**Fix:**
```bash
# View Railway environment variables
railway variables

# Should show:
# ALLOWED_ORIGINS=https://watch.unrulymovies.com,...
```

### Issue: MongoDB Connection Failed

**Check:**
1. `MONGODB_URI` is correct
2. MongoDB Atlas IP whitelist includes `0.0.0.0/0`
3. Database user has correct permissions

**Fix:**
1. Go to MongoDB Atlas
2. Network Access → Add IP Address → Allow from Anywhere
3. Database Access → Verify user exists

### Issue: 500 Internal Server Error

**Check Railway logs:**
```bash
railway logs
```

**Common causes:**
- Missing environment variables
- MongoDB connection failed
- Syntax error in code
- Missing dependencies

### Issue: API Slow or Timing Out

**Check:**
1. Railway service status
2. MongoDB Atlas cluster status
3. Network latency

**Fix:**
- Upgrade Railway plan for better performance
- Use MongoDB Atlas in same region as Railway
- Enable caching: `ENABLE_CACHING=true`

---

## Performance Optimization

### 1. Enable Caching

```bash
# Railway environment variables
ENABLE_CACHING=true
REDIS_HOST=your-redis-host  # Optional
REDIS_PORT=6379
```

### 2. Enable Compression

Already enabled in `server.js`:
```javascript
app.use(compression());
```

### 3. Rate Limiting

```bash
# Railway environment variables
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Indexing

Ensure MongoDB indexes are created:
```javascript
// Automatically created by Mongoose schemas
```

---

## Security Checklist

- [x] HTTPS enabled (Railway default)
- [x] CORS restricted to known domains
- [x] Rate limiting enabled
- [x] Helmet security headers
- [x] JWT authentication
- [x] Environment variables for secrets
- [x] MongoDB connection string secured
- [x] No secrets in code
- [x] Input validation
- [x] Error handling

---

## Scaling

### Horizontal Scaling

Railway automatically scales based on:
- CPU usage
- Memory usage
- Request volume

### Vertical Scaling

Upgrade Railway plan for:
- More CPU
- More memory
- Better performance

### Database Scaling

MongoDB Atlas:
- Free tier: M0 (512 MB)
- Paid tiers: M2, M5, M10, etc.
- Auto-scaling available

---

## Cost Estimation

### Railway
- **Free Tier:** $5 credit/month
- **Hobby Plan:** $5/month
- **Pro Plan:** $20/month

### MongoDB Atlas
- **Free Tier:** M0 (512 MB) - Forever free
- **Shared:** M2 ($9/month), M5 ($25/month)
- **Dedicated:** M10+ ($57+/month)

### Estimated Monthly Cost
- **Development:** $0 (free tiers)
- **Production (small):** $5-15/month
- **Production (medium):** $30-50/month

---

## Support & Resources

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **MongoDB Docs:** https://docs.mongodb.com
- **Project Docs:** See `BACKEND_API_DOCUMENTATION.md`

---

**Status:** ✅ Ready for deployment
**Last Updated:** December 27, 2025
