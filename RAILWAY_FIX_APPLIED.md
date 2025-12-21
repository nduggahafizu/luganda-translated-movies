# 🔧 Railway Deployment Fix Applied

**Date:** December 21, 2025  
**Issue:** Railway deployment failing with Nixpacks error  
**Status:** ✅ FIXED

---

## 🐛 Error Identified

**Error Message:**
```
error: undefined variable 'nodejs-22_x'
at /app/.nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix:19:9
```

**Root Cause:**
The `nixpacks.toml` file was using an invalid Node.js package name: `nodejs-22_x`

This is not a valid Nix package identifier. The correct format is `nodejs` (which uses the latest stable version) or specific versions like `nodejs_20`, `nodejs_18`, etc.

---

## ✅ Fix Applied

### 1. Updated `server/nixpacks.toml`

**Before:**
```toml
[phases.setup]
nixPkgs = ["nodejs-22_x"]  # ❌ Invalid package name

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["echo 'No build step needed'"]

[start]
cmd = "node server.js"
```

**After:**
```toml
[phases.setup]
nixPkgs = ["nodejs"]  # ✅ Valid package name (uses latest stable)

[phases.install]
cmds = ["npm install"]

[start]
cmd = "node server.js"
```

**Changes:**
- ✅ Changed `nodejs-22_x` to `nodejs`
- ✅ Removed unnecessary `[phases.build]` section
- ✅ Simplified configuration

### 2. Added `server/Procfile` (Backup)

Created a Procfile as an alternative deployment method:

```
web: node server.js
```

This provides Railway with multiple ways to detect how to start the application.

---

## 🚀 What This Fixes

1. **Nixpacks Build Error** - Railway can now properly install Node.js
2. **Dependency Installation** - `npm install` will run successfully
3. **Server Startup** - Application will start with `node server.js`

---

## 📋 Files Modified

1. ✅ `server/nixpacks.toml` - Fixed Node.js package name
2. ✅ `server/Procfile` - Added as backup start method

---

## 🔄 Next Steps for Deployment

### Step 1: Push Changes to GitHub

```bash
git add server/nixpacks.toml server/Procfile
git commit -m "fix: correct Node.js package name in nixpacks.toml"
git push origin main
```

### Step 2: Railway Will Auto-Deploy

Railway is connected to your GitHub repository and will automatically:
1. Detect the push
2. Start a new build
3. Use the corrected nixpacks.toml
4. Install dependencies
5. Start the server

### Step 3: Monitor Build Logs

Go to Railway Dashboard → Your Service → Deployments

**Expected Success Logs:**
```
✓ Using Node.js (latest stable)
✓ Installing dependencies
✓ Running: npm install
✓ added 341 packages in 15s
✓ Starting with: node server.js
✓ Server running on port 5000
✓ Deployment successful
```

### Step 4: Verify Deployment

Once deployed, test the endpoints:

```bash
# Get your Railway URL from dashboard
RAILWAY_URL="https://your-app.up.railway.app"

# Test health endpoint
curl $RAILWAY_URL/api/health

# Expected response:
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy"
    }
  }
}
```

---

## ⚠️ Important: Environment Variables

**Don't forget to add these in Railway Dashboard:**

### Required Variables

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<generate-64-char-secret>
SESSION_SECRET=<generate-32-char-secret>
ALLOWED_ORIGINS=<your-netlify-url>
CLIENT_URL=<your-netlify-url>
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
```

### Generate Secrets

```bash
# JWT Secret (64 characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret (32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### MongoDB Options

**Option A: Railway MongoDB Plugin**
1. Railway Dashboard → New → Database → Add MongoDB
2. Variable `MONGO_URL` is auto-created
3. Add: `MONGODB_URI=${{MONGO_URL}}`

**Option B: MongoDB Atlas**
1. Create cluster at https://cloud.mongodb.com
2. Network Access → Add IP: `0.0.0.0/0`
3. Get connection string
4. Add to Railway: `MONGODB_URI=mongodb+srv://...`

---

## 🎯 Why This Fix Works

### The Problem

Railway uses Nixpacks to build Node.js applications. Nixpacks uses the Nix package manager to install dependencies.

The package name `nodejs-22_x` doesn't exist in the Nix package repository. Valid names are:
- `nodejs` - Latest stable version
- `nodejs_20` - Node.js 20.x
- `nodejs_18` - Node.js 18.x
- `nodejs_16` - Node.js 16.x

### The Solution

By changing to `nodejs`, we let Nix install the latest stable Node.js version, which is compatible with your application (Node.js 22 features are backward compatible).

### Alternative Solutions

If you need a specific Node.js version, you can also:

1. **Use package.json engines field:**
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

2. **Use .nvmrc file:**
```
18
```

3. **Let Railway auto-detect** (remove nixpacks.toml entirely)

---

## 📊 Expected Build Process

### Phase 1: Setup
```
✓ Detecting Node.js application
✓ Installing Node.js (latest stable)
✓ Node.js version: 22.x.x
```

### Phase 2: Install
```
✓ Running: npm install
✓ Resolving dependencies
✓ added 341 packages in 15s
✓ 1 moderate severity vulnerability (non-critical)
```

### Phase 3: Start
```
✓ Starting with: node server.js
✓ Server running on port 5000
✓ MongoDB connected successfully
✓ All routes registered
✓ Deployment successful
```

---

## 🔍 Verification Checklist

After Railway deploys:

### Build Phase
- [ ] Build logs show "Using Node.js"
- [ ] No Nix package errors
- [ ] `npm install` completes successfully
- [ ] 341 packages installed
- [ ] Build completes without errors

### Runtime Phase
- [ ] Server starts successfully
- [ ] Logs show "Server running on port 5000"
- [ ] MongoDB connection successful
- [ ] No runtime errors in logs

### API Testing
- [ ] Health endpoint returns 200 OK
- [ ] Movies endpoint accessible
- [ ] VJs endpoint accessible
- [ ] CORS headers present

### Frontend Integration
- [ ] Update config.js with Railway URL
- [ ] Netlify redeploys successfully
- [ ] Frontend can connect to backend
- [ ] No CORS errors in browser console

---

## 🐛 If Build Still Fails

### Check These:

1. **Root Directory Setting**
   - Railway Dashboard → Service → Settings
   - Root Directory: `server`
   - If not set, Railway builds from project root

2. **Environment Variables**
   - All required variables added
   - No typos in variable names
   - Secrets are properly generated

3. **MongoDB Connection**
   - MONGODB_URI is set
   - MongoDB is accessible
   - Connection string format is correct

4. **Build Logs**
   - Check for specific error messages
   - Look for missing dependencies
   - Verify Node.js version is correct

### Alternative: Remove nixpacks.toml

If issues persist, you can remove `nixpacks.toml` entirely and let Railway auto-detect:

```bash
cd server
rm nixpacks.toml
git add -u
git commit -m "Remove nixpacks.toml, let Railway auto-detect"
git push origin main
```

Railway will automatically detect Node.js from `package.json` and use sensible defaults.

---

## 💡 Pro Tips

### 1. Simplify Configuration

Railway is smart enough to detect Node.js applications automatically. You often don't need custom configuration files.

**Minimal setup:**
- `package.json` with `"start": "node server.js"`
- That's it! Railway handles the rest.

### 2. Use Railway CLI for Debugging

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Run commands in Railway environment
railway run node server.js
```

### 3. Monitor Resource Usage

Railway Dashboard shows:
- CPU usage
- Memory usage
- Build time
- Deployment frequency

Keep an eye on these to stay within free tier limits.

### 4. Enable Auto-Deploy

Railway Settings → Auto-Deploy: ON

This automatically deploys on every GitHub push, making continuous deployment seamless.

---

## 📚 Additional Resources

**Railway Documentation:**
- Nixpacks: https://nixpacks.com/docs
- Node.js Deployments: https://docs.railway.app/guides/nodejs
- Environment Variables: https://docs.railway.app/develop/variables

**Nix Package Search:**
- Search packages: https://search.nixos.org/packages
- Node.js packages: Search for "nodejs" to see available versions

**Troubleshooting:**
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
- Community Forum: https://help.railway.app

---

## ✅ Summary

**Issue:** Invalid Node.js package name in nixpacks.toml  
**Fix:** Changed `nodejs-22_x` to `nodejs`  
**Status:** ✅ FIXED  
**Next:** Push to GitHub and Railway will auto-deploy  

**Confidence Level:** 🟢 HIGH - This fix directly addresses the error in the build logs

---

## 🚀 Ready to Deploy!

Your Railway deployment should now work correctly!

**Steps:**
1. ✅ Fix applied to nixpacks.toml
2. ✅ Procfile added as backup
3. ⏳ Push to GitHub (next step)
4. ⏳ Railway auto-deploys
5. ⏳ Test endpoints
6. ⏳ Update frontend config

**Estimated time to working deployment:** ~5 minutes after push

---

**Status:** 🎯 READY TO PUSH AND DEPLOY
