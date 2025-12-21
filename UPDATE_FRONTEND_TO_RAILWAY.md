# 🔄 Update Frontend to Use Railway Backend

**Current Status:** Your website is live but still pointing to old Render backend  
**Action Required:** Update config.js with your Railway URL

---

## 🎯 Quick Fix (3 Steps)

### Step 1: Get Your Railway URL

1. Go to: https://railway.app
2. Click your backend service
3. Look for the **"Domains"** section
4. Copy the URL (looks like: `https://luganda-movies-api-production.up.railway.app`)

---

### Step 2: Update config.js

**File:** `js/config.js` (line 20)

**Current (WRONG):**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api.onrender.com', // Old Render URL
```

**Update to (CORRECT):**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://YOUR_RAILWAY_URL.up.railway.app', // Your Railway URL
```

**Example:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api-production.up.railway.app',
```

---

### Step 3: Commit and Push

```bash
git add js/config.js
git commit -m "Update backend URL to Railway"
git push origin main
```

Netlify will automatically redeploy (takes 1-2 minutes).

---

## ✅ Verification

After Netlify redeploys:

### 1. Check Browser Console

1. Open your site: https://watch.unrulymovies.com
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Look for config log showing Railway URL:
   ```
   Backend URL: https://your-railway-url.up.railway.app
   ```

### 2. Check Network Tab

1. In DevTools, go to **Network** tab
2. Reload the page
3. Look for API calls to your Railway URL
4. Verify they return **200 OK** status

### 3. Test Features

- **Movies page:** Should load movie listings
- **VJ Translators:** Should show VJ profiles
- **Google Sign-In:** Should work (if configured)
- **Movie playback:** Should stream videos

---

## 🔍 Current Status

**Frontend:** ✅ Live at https://watch.unrulymovies.com  
**Backend:** ✅ Deployed on Railway  
**Connection:** ❌ Not connected (still using old Render URL)

**After updating config.js:**
**Connection:** ✅ Connected to Railway

---

## 🐛 If Issues Persist

### Issue: API calls fail with CORS errors

**Solution:** Update Railway environment variables:
```env
ALLOWED_ORIGINS=https://watch.unrulymovies.com,https://www.watch.unrulymovies.com
CLIENT_URL=https://watch.unrulymovies.com
```

### Issue: Google Sign-In doesn't work

**Solution:** Update Google Cloud Console:
1. Go to: https://console.cloud.google.com
2. APIs & Services → Credentials
3. Add to **Authorized JavaScript origins:**
   ```
   https://watch.unrulymovies.com
   https://www.watch.unrulymovies.com
   ```
4. Add to **Authorized redirect URIs:**
   ```
   https://watch.unrulymovies.com/login.html
   https://watch.unrulymovies.com/register.html
   ```

### Issue: Railway backend not responding

**Check Railway logs:**
1. Railway Dashboard → Your service
2. Click "Deployments"
3. Check logs for errors
4. Verify MongoDB is connected

---

## 📊 What's Working Now

✅ **Frontend (Netlify):**
- Site loads successfully
- All pages render correctly
- Navigation works
- Movie listings display
- No JavaScript errors

✅ **Backend (Railway):**
- Server running
- MongoDB connected
- No Redis errors (caching disabled)
- API endpoints ready

❌ **Connection:**
- Frontend still pointing to old backend
- Need to update config.js

---

## 🎯 Summary

**What you need to do:**
1. Get Railway URL from dashboard
2. Update `js/config.js` line 20
3. Commit and push
4. Wait for Netlify to redeploy
5. Test the site

**Time required:** ~5 minutes

---

**Status:** 🟡 ALMOST DONE - Just need to update one line!
