# 🚀 Deploying to Netlify - watch.unrulymovies.com

## Overview

Your subdomain `watch.unrulymovies.com` can host your **frontend** on Netlify. However, you'll need to deploy your **backend** separately (e.g., on Render, Railway, or Heroku) since Netlify only hosts static sites.

---

## 📋 Deployment Architecture

```
Frontend (Netlify)          Backend (Render/Railway)
watch.unrulymovies.com  →   api.unrulymovies.com
     ↓                            ↓
  HTML/CSS/JS              Node.js + MongoDB
```

---

## Part 1: Deploy Frontend to Netlify

### Step 1: Prepare Frontend Files

Create a `netlify.toml` configuration file:

```toml
[build]
  publish = "."
  command = "echo 'No build needed'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer-when-downgrade"
```

### Step 2: Update API URLs

Before deploying, update your JavaScript files to use your backend URL:

**In `js/luganda-movies-api.js`:**
```javascript
// Change this:
const API_URL = 'http://localhost:5000/api';

// To this (after backend is deployed):
const API_URL = 'https://your-backend-url.com/api';
```

### Step 3: Deploy to Netlify

#### Option A: Using Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

#### Option B: Using Netlify Dashboard
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your project folder
4. Configure custom domain: `watch.unrulymovies.com`

### Step 4: Configure Custom Domain

1. In Netlify Dashboard, go to **Site settings** → **Domain management**
2. Click **Add custom domain**
3. Enter: `watch.unrulymovies.com`
4. Netlify will provide DNS records to add to your domain registrar

**DNS Records to Add:**
```
Type: CNAME
Name: watch
Value: [your-netlify-site].netlify.app
```

---

## Part 2: Deploy Backend (Node.js + MongoDB)

### Option A: Deploy to Render (Recommended - Free Tier)

#### Step 1: Create `render.yaml`
```yaml
services:
  - type: web
    name: unruly-movies-api
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && node server.js
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: TMDB_API_KEY
        sync: false
      - key: PESAPAL_CONSUMER_KEY
        sync: false
      - key: PESAPAL_CONSUMER_SECRET
        sync: false
      - key: JWT_SECRET
        sync: false
```

#### Step 2: Deploy to Render
1. Go to https://render.com/
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** unruly-movies-api
   - **Root Directory:** server
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
6. Add environment variables from your `.env` file
7. Click "Create Web Service"

Your backend will be at: `https://unruly-movies-api.onrender.com`

### Option B: Deploy to Railway

1. Go to https://railway.app/
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Add environment variables
6. Deploy

### Option C: Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create unruly-movies-api

# Add MongoDB addon (or use MongoDB Atlas)
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set TMDB_API_KEY=7713c910b9503a1da0d0e6e448bf890e
heroku config:set PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
# ... add other env vars

# Deploy
git subtree push --prefix server heroku main
```

---

## Part 3: Connect Frontend to Backend

### Update API URLs in Frontend

**File: `js/luganda-movies-api.js`**
```javascript
// Production API URL (after backend deployment)
const API_URL = 'https://unruly-movies-api.onrender.com/api';

// Or if you set up custom domain for backend:
// const API_URL = 'https://api.unrulymovies.com/api';
```

**File: `js/main.js`** (if it has API calls)
```javascript
const API_BASE_URL = 'https://unruly-movies-api.onrender.com/api';
```

### Enable CORS on Backend

Make sure your backend allows requests from your Netlify domain.

**File: `server/server.js`**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:8000',
    'https://watch.unrulymovies.com',
    'https://unrulymovies.com'
  ],
  credentials: true
}));
```

---

## Part 4: SEO Optimization for Google

### 1. Add Meta Tags

Your HTML files already have good meta tags, but ensure they're complete:

```html
<head>
  <title>Luganda Movies - Watch VJ Translated Movies Online</title>
  <meta name="description" content="Watch thousands of Luganda translated movies. Stream the latest VJ translations and classic films in HD quality.">
  <meta name="keywords" content="luganda movies, vj movies, uganda movies, vj junior, vj emmy, vj ice p">
  <meta property="og:title" content="Luganda Movies - VJ Translated Movies">
  <meta property="og:description" content="Watch thousands of Luganda translated movies online">
  <meta property="og:url" content="https://watch.unrulymovies.com">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
</head>
```

### 2. Create `robots.txt`

```txt
User-agent: *
Allow: /
Sitemap: https://watch.unrulymovies.com/sitemap.xml
```

### 3. Create `sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://watch.unrulymovies.com/</loc>
    <lastmod>2025-01-10</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://watch.unrulymovies.com/movies.html</loc>
    <lastmod>2025-01-10</lastmod>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://watch.unrulymovies.com/subscribe.html</loc>
    <lastmod>2025-01-10</lastmod>
    <priority>0.7</priority>
  </url>
</urlset>
```

### 4. Submit to Google Search Console

1. Go to https://search.google.com/search-console
2. Add property: `watch.unrulymovies.com`
3. Verify ownership (Netlify makes this easy)
4. Submit your sitemap: `https://watch.unrulymovies.com/sitemap.xml`

### 5. Add Google Analytics

```html
<!-- Add to all HTML files before </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Part 5: Performance & Security

### 1. Enable HTTPS (Automatic on Netlify)
Netlify automatically provides SSL certificates for custom domains.

### 2. Add Security Headers

Already configured in `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### 3. Optimize Images

Compress your logo and movie posters:
```bash
# Install image optimizer
npm install -g imagemin-cli

# Optimize images
imagemin assets/images/*.png --out-dir=assets/images/optimized
```

### 4. Enable Caching

Add to `netlify.toml`:
```toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

---

## 📊 Deployment Checklist

### Frontend (Netlify)
- [ ] Create `netlify.toml` configuration
- [ ] Update API URLs to production backend
- [ ] Deploy to Netlify
- [ ] Configure custom domain: `watch.unrulymovies.com`
- [ ] Add DNS records
- [ ] Verify HTTPS is working
- [ ] Test all pages load correctly

### Backend (Render/Railway/Heroku)
- [ ] Choose hosting platform
- [ ] Deploy backend code
- [ ] Add all environment variables
- [ ] Configure CORS for Netlify domain
- [ ] Test API endpoints
- [ ] Verify MongoDB connection
- [ ] Set up custom domain (optional): `api.unrulymovies.com`

### SEO & Analytics
- [ ] Add/verify meta tags
- [ ] Create `robots.txt`
- [ ] Create `sitemap.xml`
- [ ] Submit to Google Search Console
- [ ] Add Google Analytics
- [ ] Test with Google's Mobile-Friendly Test

### Testing
- [ ] Test all pages on mobile
- [ ] Test all API calls work
- [ ] Test payment integration
- [ ] Test movie search and playback
- [ ] Check page load speed
- [ ] Verify all links work

---

## 🎯 Expected Results

After deployment:

1. **Frontend accessible at:** `https://watch.unrulymovies.com`
2. **Backend API at:** `https://unruly-movies-api.onrender.com`
3. **Google indexing:** Within 1-2 weeks
4. **SSL/HTTPS:** Automatic and free
5. **Global CDN:** Fast loading worldwide
6. **Uptime:** 99.9% (Netlify + Render)

---

## 💰 Cost Breakdown

### Free Tier (Recommended for Start)
- **Netlify:** Free (100GB bandwidth/month)
- **Render:** Free (750 hours/month)
- **MongoDB Atlas:** Free (512MB storage)
- **Total:** $0/month

### Paid Tier (For Growth)
- **Netlify Pro:** $19/month (1TB bandwidth)
- **Render Starter:** $7/month (always-on)
- **MongoDB Atlas M10:** $57/month (10GB storage)
- **Total:** ~$83/month

---

## 🆘 Troubleshooting

### Issue: API calls fail after deployment
**Solution:** Check CORS settings and update API URLs in frontend

### Issue: Custom domain not working
**Solution:** Verify DNS records are correct and propagated (can take 24-48 hours)

### Issue: Backend goes to sleep (Render free tier)
**Solution:** Upgrade to paid tier or use a cron job to ping it every 10 minutes

### Issue: Google not indexing site
**Solution:** Submit sitemap, create quality content, get backlinks

---

## 📞 Support Resources

- **Netlify Docs:** https://docs.netlify.com/
- **Render Docs:** https://render.com/docs
- **Google Search Console:** https://search.google.com/search-console
- **MongoDB Atlas:** https://www.mongodb.com/docs/atlas/

---

**Your subdomain `watch.unrulymovies.com` is perfect for hosting your Luganda Movies platform! Follow this guide to get it live and discoverable on Google.** 🚀
