# 🔗 How to Connect GitHub to Netlify

## Complete Step-by-Step Guide

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ GitHub account (you have this)
- ✅ GitHub repository: `luganda-translated-movies` (you have this)
- ✅ Netlify account (free)

---

## 🚀 Method 1: Connect New Site to GitHub (Recommended)

### Step 1: Go to Netlify

1. Open your browser
2. Go to: https://app.netlify.com/
3. Log in (or sign up if you don't have an account)

### Step 2: Add New Site

1. Click **"Add new site"** button (top right)
2. Select **"Import an existing project"**

### Step 3: Connect to GitHub

1. Click **"Deploy with GitHub"**
2. You'll see a popup asking for GitHub authorization
3. Click **"Authorize Netlify"**
4. Enter your GitHub password if prompted

### Step 4: Select Your Repository

1. You'll see a list of your GitHub repositories
2. Find and click: **"luganda-translated-movies"**
3. If you don't see it, click **"Configure Netlify on GitHub"**
   - Select which repositories Netlify can access
   - Choose "All repositories" or select specific ones
   - Click **"Save"**

### Step 5: Configure Build Settings

Netlify will show build settings:

```
Branch to deploy: main
Build command: (leave empty)
Publish directory: . (or leave empty)
```

**Important:** Since this is a static site, you can leave these empty or use:
- **Build command:** (empty)
- **Publish directory:** `.` (current directory)

### Step 6: Add Environment Variables (CRITICAL!)

Before deploying, add your API key:

1. Click **"Show advanced"** or **"Add environment variables"**
2. Click **"New variable"**
3. Add:
   - **Key:** `TMDB_API_KEY`
   - **Value:** `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`
4. Click **"Add"**

### Step 7: Deploy!

1. Click **"Deploy site"** button
2. Wait 1-2 minutes for deployment
3. Your site will be live!

---

## 🔄 Method 2: Connect Existing Netlify Site to GitHub

If you already have a Netlify site but it's not connected to GitHub:

### Step 1: Go to Site Settings

1. Go to: https://app.netlify.com/
2. Click on your site (e.g., "unrulymovies")
3. Click **"Site settings"**

### Step 2: Change Repository

1. In the left sidebar, click **"Build & deploy"**
2. Scroll to **"Continuous deployment"** section
3. Click **"Link repository"** or **"Edit settings"**

### Step 3: Connect GitHub

1. Click **"GitHub"**
2. Authorize Netlify if prompted
3. Select your repository: **"luganda-translated-movies"**
4. Choose branch: **"main"**
5. Click **"Save"**

### Step 4: Configure Build Settings

Set these values:
- **Build command:** (leave empty)
- **Publish directory:** `.`
- **Branch:** `main`

### Step 5: Add Environment Variable

1. Go to **"Site settings"** → **"Environment variables"**
2. Click **"Add a variable"**
3. Add:
   - **Key:** `TMDB_API_KEY`
   - **Value:** `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`
4. Click **"Save"**

### Step 6: Trigger Deploy

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete

---

## 🎯 What Happens After Connection?

Once connected, Netlify will:

1. ✅ **Auto-deploy on every push** to main branch
2. ✅ **Build your site** automatically
3. ✅ **Deploy to production** when build succeeds
4. ✅ **Show deploy status** in dashboard
5. ✅ **Provide preview URLs** for each deploy

---

## 📊 Verify Connection

### Check 1: Netlify Dashboard

1. Go to: https://app.netlify.com/
2. Click on your site
3. You should see:
   - ✅ **"Connected to GitHub"** badge
   - ✅ Repository name displayed
   - ✅ Latest commit information

### Check 2: GitHub Repository

1. Go to: https://github.com/nduggahafizu/luganda-translated-movies
2. Click **"Settings"** tab
3. Click **"Webhooks"** in left sidebar
4. You should see a Netlify webhook listed

### Check 3: Test Auto-Deploy

1. Make a small change to any file
2. Commit and push to GitHub
3. Go to Netlify dashboard
4. You should see a new deploy triggered automatically

---

## 🔧 Configure Auto-Deploy Settings

### Enable/Disable Auto-Deploy

1. Go to: https://app.netlify.com/sites/YOUR_SITE/settings/deploys
2. Scroll to **"Deploy contexts"**
3. Configure:
   - **Production branch:** `main` (auto-deploy enabled)
   - **Branch deploys:** All branches or specific branches
   - **Deploy previews:** Pull requests

### Deploy Notifications

1. Go to **"Site settings"** → **"Build & deploy"**
2. Scroll to **"Deploy notifications"**
3. Add notifications for:
   - Deploy started
   - Deploy succeeded
   - Deploy failed
   - Via email, Slack, or webhook

---

## 🌐 Your Site URLs

After connection, you'll get:

1. **Production URL:** `https://YOUR_SITE_NAME.netlify.app`
   - Example: `https://unrulymovies.netlify.app`
   - Auto-deploys from `main` branch

2. **Deploy Preview URLs:** `https://deploy-preview-XX--YOUR_SITE.netlify.app`
   - Created for pull requests
   - Test changes before merging

3. **Branch Deploy URLs:** `https://BRANCH_NAME--YOUR_SITE.netlify.app`
   - Created for specific branches
   - Test features in isolation

---

## 🔐 Add Environment Variables

**CRITICAL:** Your site needs the API key to work!

### Via Netlify Dashboard:

1. Go to: https://app.netlify.com/sites/YOUR_SITE/settings/deploys#environment
2. Click **"Add a variable"** or **"New variable"**
3. Add:
   ```
   Key:   TMDB_API_KEY
   Value: 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
   ```
4. Click **"Save"**
5. Trigger new deploy for changes to take effect

### Via Netlify CLI (Alternative):

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Add environment variable
netlify env:set TMDB_API_KEY "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"
```

---

## 📝 Build Configuration (netlify.toml)

You already have a `netlify.toml` file. Here's what it should contain:

```toml
[build]
  publish = "."
  command = ""

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

This file is already in your repository, so Netlify will use these settings automatically.

---

## 🚨 Troubleshooting

### Problem: Repository Not Showing

**Solution:**
1. Go to: https://github.com/settings/installations
2. Find "Netlify"
3. Click "Configure"
4. Grant access to your repository
5. Go back to Netlify and refresh

### Problem: Deploy Failing

**Solution:**
1. Check deploy logs in Netlify
2. Look for error messages
3. Common issues:
   - Missing environment variables
   - Build command errors
   - File path issues

### Problem: Site Not Loading

**Solution:**
1. Check if deploy completed successfully
2. Verify environment variables are set
3. Check browser console for errors
4. Clear browser cache

### Problem: Changes Not Deploying

**Solution:**
1. Verify webhook exists in GitHub
2. Check if auto-deploy is enabled
3. Manually trigger deploy in Netlify
4. Check deploy logs for errors

---

## ✅ Connection Checklist

- [ ] Netlify account created
- [ ] GitHub repository exists
- [ ] Netlify connected to GitHub
- [ ] Repository selected in Netlify
- [ ] Build settings configured
- [ ] Environment variables added
- [ ] First deploy successful
- [ ] Site accessible via URL
- [ ] Auto-deploy working (test with a push)
- [ ] Webhook visible in GitHub settings

---

## 🎉 Success Indicators

You'll know everything is connected when:

✅ Netlify dashboard shows "Connected to GitHub"  
✅ Repository name displayed in Netlify  
✅ Webhook exists in GitHub settings  
✅ Push to GitHub triggers auto-deploy  
✅ Site deploys successfully  
✅ Site accessible at Netlify URL  
✅ Environment variables working  

---

## 📞 Quick Links

**Netlify Dashboard:**
- Main: https://app.netlify.com/
- Your Sites: https://app.netlify.com/teams/YOUR_TEAM/sites

**GitHub Repository:**
- Repo: https://github.com/nduggahafizu/luganda-translated-movies
- Settings: https://github.com/nduggahafizu/luganda-translated-movies/settings
- Webhooks: https://github.com/nduggahafizu/luganda-translated-movies/settings/hooks

**Netlify Docs:**
- GitHub Integration: https://docs.netlify.com/configure-builds/repo-permissions-linking/
- Environment Variables: https://docs.netlify.com/environment-variables/overview/

---

## 🚀 Next Steps After Connection

1. **Add Environment Variable**
   - Go to Netlify settings
   - Add `TMDB_API_KEY`
   - Trigger new deploy

2. **Test Your Site**
   - Visit your Netlify URL
   - Verify movies load
   - Test all functionality

3. **Revoke Old API Key**
   - Go to OpenRouter
   - Delete old exposed key
   - Security issue fully resolved!

---

**Need help?** Check the Netlify dashboard for detailed deploy logs and error messages!
