# 🔧 How to Update Backend URL for Railway

After you deploy to Railway, you'll get a URL. Here's how to update your frontend:

---

## 📍 Step 1: Get Your Railway URL

After deploying to Railway, you'll see a URL like:
```
https://luganda-movies-api-production.up.railway.app
```

**Where to find it:**
1. Railway Dashboard → Your Project
2. Click on your service
3. Look for "Domains" section
4. Copy the `.up.railway.app` URL

---

## 📝 Step 2: Update Config.js

**File to edit:** `js/config.js`

**Find this line (around line 15):**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api.onrender.com', // ← UPDATE THIS LINE
```

**Replace with your Railway URL:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://YOUR-RAILWAY-URL.up.railway.app', // ← Your actual Railway URL
```

**Example:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-movies-api-production.up.railway.app',
```

---

## 💾 Step 3: Save and Deploy

```bash
# Save the file
# Then commit and push:

git add js/config.js
git commit -m "Update backend URL to Railway"
git push origin main
```

Netlify will automatically redeploy with the new configuration!

---

## ✅ Step 4: Verify

After Netlify redeploys:

1. Open your Netlify site
2. Open browser DevTools (F12)
3. Go to Console tab
4. Look for: `🔧 Luganda Movies Configuration:`
5. Verify it shows your Railway URL

**You should see:**
```
🔧 Luganda Movies Configuration:
   Environment: production
   Backend URL: https://your-railway-url.up.railway.app
   Hostname: your-site.netlify.app
   Is Localhost: false
   Is Netlify: true
```

---

## 🧪 Step 5: Test

### Test 1: API Connection
Open browser console on your Netlify site and run:
```javascript
fetch(Config.getApiUrl('/health'))
  .then(r => r.json())
  .then(d => console.log('Backend Health:', d))
```

### Test 2: Google Sign-In
1. Go to login page
2. Click "Sign in with Google"
3. Complete authentication
4. Verify it works!

### Test 3: Movie Playback
1. Go to movies page
2. Click any movie
3. Player loads
4. Video plays

---

## 🔄 If You Need to Change Railway URL Later

Just repeat steps 2-4:
1. Edit `js/config.js`
2. Update the URL
3. Commit and push
4. Netlify redeploys automatically

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch" errors

**Check:**
1. Is Railway backend running? (Check Railway dashboard)
2. Is the URL correct in config.js?
3. Are CORS settings correct in Railway env vars?

**Solution:**
```env
# In Railway, make sure you have:
ALLOWED_ORIGINS=https://your-site.netlify.app
```

### Issue: Google Auth not working

**Check:**
1. Is Google Client ID in Railway env vars?
2. Is Netlify URL in Google Cloud Console?
3. Are redirect URIs configured?

**Solution:**
- Add Netlify URL to Google Cloud Console authorized origins
- Add Railway URL to authorized origins (if needed)

### Issue: Movies not loading

**Check:**
1. Is MongoDB connected? (Check Railway logs)
2. Is database seeded?
3. Are API endpoints working?

**Solution:**
```bash
# Test Railway API directly
curl https://your-railway-url.up.railway.app/api/luganda-movies
```

---

## 📋 Quick Reference

### Your URLs

```
Frontend (Netlify):  https://your-site.netlify.app
Backend (Railway):   https://your-railway-url.up.railway.app
MongoDB:             Railway plugin or Atlas
```

### Files to Update

```
js/config.js         ← Update BACKEND_URL (line 15)
```

### Environment Variables to Set in Railway

```
ALLOWED_ORIGINS      ← Your Netlify URL
CLIENT_URL           ← Your Netlify URL
MONGODB_URI          ← Your MongoDB connection string
JWT_SECRET           ← Generate new secret
SESSION_SECRET       ← Generate new secret
```

---

## ✅ Checklist

- [ ] Railway project created
- [ ] GitHub repository connected
- [ ] Root directory set to `server`
- [ ] Environment variables added
- [ ] MongoDB configured (plugin or Atlas)
- [ ] Deployment successful
- [ ] Railway URL copied
- [ ] `js/config.js` updated with Railway URL
- [ ] Changes committed and pushed
- [ ] Netlify redeployed
- [ ] Google OAuth updated
- [ ] Tested from Netlify frontend

---

## 🎉 You're Almost There!

Once you update `js/config.js` with your Railway URL and push, your entire application will be live on Netlify with Railway backend!

**Estimated time:** 5 minutes to update and deploy! ⏱️

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app
