# 🚀 Quick Deploy to watch.unrulymovies.com

## Prerequisites
- ✅ Netlify account with `watch.unrulymovies.com` configured
- ✅ Backend deployed (Render/Railway/Heroku)
- ✅ All files ready in this folder

## Option 1: Deploy via Netlify Dashboard (Easiest)

### Step 1: Prepare Files
All necessary files are ready:
- ✅ `netlify.toml` - Configuration
- ✅ `robots.txt` - SEO
- ✅ `sitemap.xml` - SEO
- ✅ All HTML, CSS, JS files

### Step 2: Deploy
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Deploy manually"
3. Drag and drop this entire folder
4. Wait for deployment (1-2 minutes)

### Step 3: Configure Domain
1. Go to Site settings → Domain management
2. Add custom domain: `watch.unrulymovies.com`
3. Add DNS record at your domain registrar:
   ```
   Type: CNAME
   Name: watch
   Value: [your-site-name].netlify.app
   ```

## Option 2: Deploy via Netlify CLI

### Step 1: Install Netlify CLI
```bash
npm install -g netlify-cli
```

### Step 2: Login
```bash
netlify login
```

### Step 3: Initialize Site
```bash
netlify init
```

### Step 4: Deploy
```bash
# Deploy to production
netlify deploy --prod

# Or deploy for preview first
netlify deploy
```

## Option 3: Deploy via Git (Continuous Deployment)

### Step 1: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit - Luganda Movies Platform"
git branch -M main
git remote add origin https://github.com/yourusername/unruly-movies.git
git push -u origin main
```

### Step 2: Connect to Netlify
1. Go to https://app.netlify.com/
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub
4. Select your repository
5. Configure:
   - **Build command:** (leave empty)
   - **Publish directory:** `.`
6. Click "Deploy site"

### Step 3: Configure Domain
Add `watch.unrulymovies.com` in Domain settings

## After Deployment Checklist

### 1. Update API URLs
After backend is deployed, update these files:

**File: `js/luganda-movies-api.js`**
```javascript
// Change from:
const API_URL = 'http://localhost:5000/api';

// To your production backend:
const API_URL = 'https://your-backend-url.onrender.com/api';
```

### 2. Test Your Site
- [ ] Visit https://watch.unrulymovies.com
- [ ] Test all pages load
- [ ] Test movie search
- [ ] Test navigation
- [ ] Test on mobile

### 3. Submit to Google
1. Go to https://search.google.com/search-console
2. Add property: `watch.unrulymovies.com`
3. Verify ownership
4. Submit sitemap: `https://watch.unrulymovies.com/sitemap.xml`

### 4. Monitor Performance
- Check Netlify Analytics
- Monitor page load speed
- Check for broken links

## Troubleshooting

### Issue: Site not loading
- Check Netlify deploy logs
- Verify all files uploaded correctly
- Check browser console for errors

### Issue: API calls failing
- Verify backend is deployed and running
- Check CORS settings on backend
- Verify API URLs are correct

### Issue: Custom domain not working
- Check DNS records are correct
- Wait 24-48 hours for DNS propagation
- Verify domain is added in Netlify

## Your Deployment URLs

- **Frontend:** https://watch.unrulymovies.com
- **Backend:** (Deploy to Render/Railway first)
- **Netlify Dashboard:** https://app.netlify.com/

## Cost: $0/month (Free Tier)

Netlify free tier includes:
- 100GB bandwidth/month
- Unlimited sites
- HTTPS/SSL automatic
- Global CDN
- Custom domain

---

**Ready to go live? Follow Option 1 for the quickest deployment!** 🚀
