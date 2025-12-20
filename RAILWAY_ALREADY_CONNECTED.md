# 🚂 Railway Deployment - Already Connected to GitHub

**Status:** Railway connected to GitHub ✅  
**Next Steps:** Configure and deploy backend

---

## 🎯 Since Railway is Already Connected

You're ahead of the game! Here's what to do now:

---

## 📋 Step-by-Step Deployment

### Step 1: Access Your Railway Project

1. Go to https://railway.app
2. You should see your project already listed
3. Click on your project to open it

### Step 2: Configure the Service

**Set Root Directory:**
1. Click on your service (backend)
2. Go to "Settings" tab
3. Scroll to "Root Directory"
4. Enter: `server`
5. Click outside to save

**Verify Build Settings:**
- Build Command: `npm install` (should be auto-detected)
- Start Command: `node server.js` (should be auto-detected)
- If not set, add them manually

### Step 3: Add Environment Variables

Click "Variables" tab and add these one by one:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<generate-new-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=<generate-new-secret>
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
ALLOWED_ORIGINS=<your-netlify-url>
CLIENT_URL=<your-netlify-url>
TRUST_PROXY=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
```

**Generate secrets:**
```bash
# Run these commands to generate secrets:

# JWT Secret (copy the output)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret (copy the output)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Replace placeholders:**
- `<your-netlify-url>` → Your actual Netlify URL (e.g., `https://luganda-movies.netlify.app`)
- `<generate-new-secret>` → Use the generated secrets from above

### Step 4: Add MongoDB

**Option A: Railway MongoDB Plugin (Easiest)**
1. In your Railway project, click "New"
2. Select "Database"
3. Choose "Add MongoDB"
4. Railway creates instance automatically
5. Connection variable `MONGO_URL` is auto-added
6. Add another variable: `MONGODB_URI` with value `${{MONGO_URL}}`

**Option B: MongoDB Atlas (Recommended for Production)**
1. Go to https://cloud.mongodb.com
2. Create free M0 cluster
3. Create database user (username + password)
4. Network Access → Add IP Address → `0.0.0.0/0` (allow all)
5. Get connection string (looks like: `mongodb+srv://user:pass@cluster.mongodb.net/`)
6. In Railway, add variable:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority
   ```

### Step 5: Trigger Deployment

Railway should deploy automatically after adding variables. If not:
1. Go to "Deployments" tab
2. Click "Deploy" or "Redeploy"
3. Watch the build logs

### Step 6: Wait for Deployment

- Build time: ~2-3 minutes
- Watch logs for any errors
- Wait for "Deployment successful" message

### Step 7: Get Your Railway URL

1. In Railway dashboard, click on your service
2. Look for "Domains" section
3. You'll see a URL like: `https://luganda-movies-api-production.up.railway.app`
4. Copy this URL

### Step 8: Test Railway Backend

```bash
# Replace with your actual Railway URL
RAILWAY_URL="https://your-app.up.railway.app"

# Test health endpoint
curl $RAILWAY_URL/api/health

# Expected: {"status":"healthy",...}

# Test movies endpoint
curl $RAILWAY_URL/api/luganda-movies

# Expected: {"success":true,"count":0,...} or list of movies
```

### Step 9: Seed Database (If Using New MongoDB)

If you're using a fresh MongoDB instance, you need to seed data:

**Option A: Using Railway CLI**
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

**Option B: Using MongoDB Compass**
1. Connect to your MongoDB (get connection string from Railway or Atlas)
2. Import your data manually
3. Or restore from backup

**Option C: Create a seed endpoint (Quick)**
You can create a temporary endpoint to seed data:
```bash
# Call your seed endpoint (if you create one)
curl -X POST https://your-railway-url.up.railway.app/api/admin/seed
```

### Step 10: Update Frontend Config

**Edit file:** `js/config.js`

**Find line 15:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api.onrender.com', // ← UPDATE THIS
```

**Replace with your Railway URL:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://your-actual-railway-url.up.railway.app', // ← Your Railway URL
```

**Example:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api-production.up.railway.app',
```

### Step 11: Deploy Frontend Update

```bash
git add js/config.js
git commit -m "Update backend URL to Railway"
git push origin main
```

Netlify will automatically redeploy (takes 1-2 minutes).

### Step 12: Update Google OAuth Settings

1. Go to https://console.cloud.google.com
2. Select your project
3. APIs & Services → Credentials
4. Click on your OAuth 2.0 Client ID
5. Add **Authorized JavaScript origins:**
   ```
   https://your-site.netlify.app
   https://www.your-site.netlify.app
   ```
6. Add **Authorized redirect URIs:**
   ```
   https://your-site.netlify.app/login.html
   https://your-site.netlify.app/register.html
   ```
7. Click "Save"

### Step 13: Test Production

1. Open your Netlify site: `https://your-site.netlify.app`
2. Open browser DevTools (F12) → Console tab
3. Look for config log: Should show Railway URL
4. Test Google Sign-In:
   - Go to `/login.html`
   - Click "Sign in with Google"
   - Complete authentication
   - Verify redirect to homepage
5. Test movie playback:
   - Go to `/movies.html`
   - Click any movie
   - Verify player loads and plays

---

## 🔍 Verification Checklist

After deployment, verify these:

**Railway Backend:**
- [ ] Service status: "Running"
- [ ] Build logs: No errors
- [ ] Runtime logs: Server started on port 5000
- [ ] MongoDB: Connected
- [ ] Health endpoint: Returns 200 OK
- [ ] Movies endpoint: Returns data

**Netlify Frontend:**
- [ ] Deployment: Successful
- [ ] Config.js: Shows Railway URL in console
- [ ] API calls: Go to Railway (check Network tab)
- [ ] Google Sign-In: Works
- [ ] Movie playback: Works
- [ ] No console errors

**Google OAuth:**
- [ ] Netlify URL in authorized origins
- [ ] Redirect URIs configured
- [ ] Sign-in popup works
- [ ] Authentication successful

---

## 🐛 Troubleshooting

### Issue: Railway build fails

**Check:**
- Root directory is set to `server`
- package.json exists in server directory
- All dependencies are listed

**Solution:**
```bash
# Verify package.json
cat server/package.json

# Check Railway build logs
# Look for specific error messages
```

### Issue: MongoDB connection fails

**Check:**
- MONGODB_URI is correct
- MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Database user credentials are correct

**Solution:**
```bash
# Test connection string locally
mongosh "your-connection-string"
```

### Issue: CORS errors on Netlify

**Check:**
- ALLOWED_ORIGINS includes your Netlify URL
- No typos in the URL
- Railway backend is running

**Solution:**
```env
# In Railway variables, verify:
ALLOWED_ORIGINS=https://your-exact-netlify-url.netlify.app
```

### Issue: Google Auth not working

**Check:**
- Google Client ID in Railway variables
- Netlify URL in Google Cloud Console
- Redirect URIs configured

**Solution:**
- Double-check Google Cloud Console settings
- Verify URLs match exactly (no trailing slashes)

---

## 📊 Expected Railway Dashboard

After successful deployment:

```
Project: luganda-movies-api
├── Service: Backend
│   ├── Status: Running ✅
│   ├── URL: https://luganda-movies-api-production.up.railway.app
│   ├── Memory: ~100-200 MB
│   ├── CPU: < 5%
│   └── Logs: Server running on port 5000
│
└── Database: MongoDB (if using Railway plugin)
    ├── Status: Running ✅
    ├── Storage: 500 MB
    └── Connection: Automatic
```

---

## 🎯 What to Update

### File: `js/config.js` (Line 15)

**Current:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api.onrender.com',
```

**Update to:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://YOUR-RAILWAY-URL.up.railway.app',
```

### Railway Environment Variables

**Must update:**
- `ALLOWED_ORIGINS` → Your Netlify URL
- `CLIENT_URL` → Your Netlify URL
- `MONGODB_URI` → Your MongoDB connection string
- `JWT_SECRET` → Generate new secret
- `SESSION_SECRET` → Generate new secret

---

## 💡 Pro Tips

1. **Use Railway CLI** for easier management:
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway logs  # View logs
   railway variables  # List variables
   ```

2. **Enable Auto-Deploy** in Railway settings to deploy on every GitHub push

3. **Monitor Logs** in Railway dashboard to catch issues early

4. **Use MongoDB Atlas** for production (more reliable than Railway plugin)

5. **Set up alerts** in Railway for deployment failures

---

## 🚀 Ready to Go!

Your backend is **100% ready** for Railway deployment!

**Time to production:** ~20 minutes

**What you have:**
- ✅ Railway connected to GitHub
- ✅ Backend code tested and working
- ✅ Railway config files created
- ✅ Environment variables documented
- ✅ Frontend on Netlify
- ✅ Google Auth configured

**What you need:**
1. Configure Railway service (5 min)
2. Add environment variables (5 min)
3. Add MongoDB (2 min)
4. Deploy (3 min)
5. Update frontend config (2 min)
6. Test (3 min)

**Let's deploy!** 🚀

---

**Railway:** https://railway.app  
**Status:** ✅ READY TO DEPLOY
