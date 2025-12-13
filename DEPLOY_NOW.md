# 🚀 Deploy Your Site in 5 Minutes

## You're 5 Minutes Away from Going Live!

Everything is ready. Just follow these simple steps:

---

## Step 1: Login to Netlify (1 minute)

1. Go to: https://app.netlify.com/
2. Login with your account (the one with `watch.unrulymovies.com`)

---

## Step 2: Deploy Your Site (2 minutes)

### Option A: Drag & Drop (Easiest)

1. Click **"Add new site"** → **"Deploy manually"**
2. Open Windows File Explorer
3. Navigate to: `C:\Users\dell\OneDrive\Desktop\unruly`
4. **Drag the entire `unruly` folder** into the Netlify upload area
5. Wait for upload to complete (1-2 minutes)

### Option B: Using Netlify CLI

```bash
# Install Netlify CLI (one time only)
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## Step 3: Configure Your Domain (2 minutes)

After deployment:

1. In Netlify dashboard, click **"Domain settings"**
2. Click **"Add custom domain"**
3. Enter: `watch.unrulymovies.com`
4. Click **"Verify"**

Netlify will show you DNS records to add. Go to your domain registrar and add:

```
Type: CNAME
Name: watch
Value: [your-site-name].netlify.app
```

**DNS propagation takes 1-24 hours** (usually 1-2 hours)

---

## ✅ Deployment Checklist

Before deploying, make sure:

- [x] All files are in the `unruly` folder
- [x] `netlify.toml` exists (✅ Created)
- [x] `robots.txt` exists (✅ Created)
- [x] `sitemap.xml` exists (✅ Created)
- [x] Logo is in `assets/images/logo.png` (✅ Installed)
- [x] TMDB API key is configured (✅ Added)
- [ ] Backend is deployed (Do this after frontend)

---

## After Frontend Deployment

### 1. Deploy Backend

Your backend needs to be deployed separately. Choose one:

**Render (Recommended - Free):**
1. Go to https://render.com/
2. Sign up/Login
3. Click "New +" → "Web Service"
4. Choose "Build and deploy from a Git repository" OR "Deploy from GitHub"
5. If you don't have GitHub, choose "Public Git repository" and use a temporary repo
6. Configure:
   - **Name:** unruly-movies-api
   - **Root Directory:** server
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
7. Add environment variables (copy from `server/.env`):
   - MONGODB_URI
   - TMDB_API_KEY
   - PESAPAL_CONSUMER_KEY
   - PESAPAL_CONSUMER_SECRET
   - JWT_SECRET
8. Click "Create Web Service"

Your backend will be at: `https://unruly-movies-api.onrender.com`

### 2. Update Frontend API URLs

After backend is deployed, update this file:

**File: `js/luganda-movies-api.js`**

Find this line:
```javascript
const API_URL = 'http://localhost:5000/api';
```

Change to:
```javascript
const API_URL = 'https://unruly-movies-api.onrender.com/api';
```

Then re-deploy to Netlify (drag & drop again).

### 3. Update Backend CORS

In your backend `server/server.js`, make sure CORS allows your Netlify domain:

```javascript
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

## Troubleshooting

### "I don't see the drag & drop area"
- Make sure you clicked "Deploy manually" not "Import from Git"
- Try using a different browser (Chrome works best)

### "My domain isn't working"
- DNS can take up to 24 hours to propagate
- Check your DNS records are correct
- Try accessing via the Netlify URL first: `[your-site].netlify.app`

### "API calls are failing"
- Make sure backend is deployed first
- Check API URLs are updated in frontend
- Verify CORS settings on backend

---

## What Happens After Deployment?

1. **Immediate:** Your site is live at `[random-name].netlify.app`
2. **1-2 hours:** Your custom domain `watch.unrulymovies.com` starts working
3. **1-2 weeks:** Google starts indexing your site
4. **Ongoing:** Netlify automatically provides:
   - HTTPS/SSL certificate
   - Global CDN
   - DDoS protection
   - Automatic backups

---

## Cost Breakdown

### Free Tier (Perfect for Starting)
- **Netlify:** Free (100GB bandwidth/month)
- **Render:** Free (750 hours/month, sleeps after 15 min inactivity)
- **MongoDB Atlas:** Free (512MB storage)
- **Total:** $0/month

### If You Need Always-On Backend
- **Render Starter:** $7/month (keeps backend always running)
- **Total:** $7/month

---

## Need Help?

If you get stuck:

1. **Netlify Support:** https://answers.netlify.com/
2. **Render Support:** https://render.com/docs
3. **Check deployment logs** in Netlify/Render dashboard

---

## You're Ready! 🎉

Everything is prepared. Just:
1. Login to Netlify
2. Drag & drop the `unruly` folder
3. Configure your domain

**Your site will be live at watch.unrulymovies.com!**

Good luck! 🚀
