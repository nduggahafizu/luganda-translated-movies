# 🌐 Get Your Railway Public URL

**You provided:** `luganda-translated-movies.railway.internal`  
**Issue:** This is an **internal URL** (only works inside Railway's network)  
**You need:** The **public URL** that's accessible from the internet

---

## 🎯 How to Get Your Public URL

### Method 1: Railway Dashboard (Easiest)

1. Go to: https://railway.app
2. Click on your project
3. Click on your **backend service**
4. Look for the **"Settings"** tab
5. Scroll to **"Networking"** or **"Domains"** section
6. You'll see a URL like:
   ```
   https://luganda-translated-movies-production.up.railway.app
   ```
   OR
   ```
   https://web-production-XXXX.up.railway.app
   ```

### Method 2: Generate Public Domain

If you don't see a public URL:

1. In Railway Dashboard → Your service
2. Go to **"Settings"** tab
3. Find **"Networking"** section
4. Click **"Generate Domain"**
5. Railway will create a public URL like:
   ```
   https://your-service-name.up.railway.app
   ```

---

## 🔍 What Each URL Means

### ❌ Internal URL (What you have)
```
luganda-translated-movies.railway.internal
```
- Only accessible **within Railway's network**
- Used for **service-to-service** communication
- **NOT accessible** from the internet
- **Cannot be used** in your frontend

### ✅ Public URL (What you need)
```
https://luganda-translated-movies-production.up.railway.app
```
- Accessible from **anywhere on the internet**
- Has **HTTPS** (secure)
- Ends with **.up.railway.app**
- This is what you put in `config.js`

---

## 📝 Once You Have the Public URL

### Update config.js

**File:** `js/config.js` (line 20)

**Replace:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://YOUR_RAILWAY_URL_HERE.up.railway.app',
```

**With your actual URL:**
```javascript
BACKEND_URL: isLocalhost 
    ? 'http://localhost:5000'
    : 'https://luganda-translated-movies-production.up.railway.app',
```

### Commit and Push

```bash
git add js/config.js
git commit -m "Update backend URL to Railway public domain"
git push origin main
```

---

## 🧪 Test Your Railway Backend

Once you have the public URL, test it:

```bash
# Replace with your actual public URL
curl https://your-actual-url.up.railway.app/api/health
```

**Expected response:**
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

---

## 🔧 If You Can't Find the Public URL

### Option A: Check Deployment Logs

1. Railway Dashboard → Your service
2. Click "Deployments"
3. Look for a line like:
   ```
   Deployed to: https://your-service.up.railway.app
   ```

### Option B: Check Service Settings

1. Railway Dashboard → Your service
2. Settings tab
3. Look for "Public Networking" or "Domains"
4. If empty, click "Generate Domain"

### Option C: Use Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Get service URL
railway domain
```

---

## 📊 Common Railway URL Patterns

Your public URL will look like one of these:

```
https://luganda-translated-movies.up.railway.app
https://luganda-translated-movies-production.up.railway.app
https://web-production-1a2b.up.railway.app
https://backend-production-3c4d.up.railway.app
```

**Key characteristics:**
- ✅ Starts with `https://`
- ✅ Ends with `.up.railway.app`
- ✅ Contains your service name or random ID
- ✅ Accessible from anywhere

---

## ⚠️ Important Notes

### 1. Update CORS in Railway

Once you have the public URL, make sure your Railway environment variables include:

```env
ALLOWED_ORIGINS=https://watch.unrulymovies.com,https://www.watch.unrulymovies.com
CLIENT_URL=https://watch.unrulymovies.com
```

### 2. Update Google OAuth

Add your Railway public URL to Google Cloud Console:

**Authorized JavaScript origins:**
```
https://watch.unrulymovies.com
https://your-railway-url.up.railway.app
```

**Authorized redirect URIs:**
```
https://watch.unrulymovies.com/login.html
https://watch.unrulymovies.com/register.html
```

---

## 🎯 Quick Checklist

- [ ] Go to Railway Dashboard
- [ ] Find your backend service
- [ ] Look for "Domains" or "Networking" section
- [ ] Copy the public URL (ends with .up.railway.app)
- [ ] Test the URL with curl
- [ ] Update js/config.js with the URL
- [ ] Commit and push to GitHub
- [ ] Wait for Netlify to redeploy
- [ ] Test your website

---

## 💡 Pro Tip

You can also add a **custom domain** to Railway:

1. Railway Dashboard → Your service → Settings
2. "Custom Domains" section
3. Add your own domain (e.g., `api.unrulymovies.com`)
4. Update DNS records as instructed
5. Use that in your config.js instead

---

**Next Step:** Get your public Railway URL from the dashboard and share it here, then I'll help you update the config!
