# 🔐 Add TMDB API Key to Netlify (Secure Method)

## ⚠️ IMPORTANT: Do NOT Add API Key to Code Files!

Your TMDB API key should **NEVER** be added directly to code files because:
- ❌ It will be exposed publicly on GitHub
- ❌ Anyone can see and use your API key
- ❌ Your API quota can be exhausted by others
- ❌ Security risk

## ✅ Correct Method: Use Netlify Environment Variables

### Step 1: Go to Netlify Dashboard

1. Visit: https://app.netlify.com/
2. Login to your account
3. Click on your site: **watch.unrulymovies.com**

### Step 2: Add Environment Variable

1. Click **"Site settings"** (in the top menu)
2. In the left sidebar, click **"Environment variables"**
3. Click **"Add a variable"** button
4. Click **"Add a single variable"**

### Step 3: Enter Your TMDB API Key

**Key:** `TMDB_API_KEY`
**Value:** `7713c910b9503a1da0d0e6e448bf890e`

5. Click **"Create variable"**

### Step 4: Redeploy Your Site

After adding the environment variable:

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"**
3. Select **"Deploy site"**
4. Wait for deployment to complete (1-2 minutes)

## 📋 Environment Variables to Add

If you're using the backend server, add these:

### 1. TMDB API Key
- **Key:** `TMDB_API_KEY`
- **Value:** `7713c910b9503a1da0d0e6e448bf890e`
- **Purpose:** Access TMDB movie database

### 2. MongoDB Connection (if using backend)
- **Key:** `MONGODB_URI`
- **Value:** `mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies`
- **Purpose:** Connect to MongoDB database

### 3. OpenRouter API Key (if using AI features)
- **Key:** `OPENROUTER_API_KEY`
- **Value:** `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`
- **Purpose:** AI-powered features

## 🔍 How to Verify

After adding environment variables and redeploying:

1. Check Netlify deploy logs
2. Look for "Environment variables loaded"
3. Test your site functionality
4. Check browser console for API errors

## 📝 Using Environment Variables in Code

In your backend code (Node.js), access them like this:

```javascript
// server/services/tmdbService.js
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Make API requests
const response = await fetch(
  `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`
);
```

In frontend code, you'll need to proxy through your backend to keep the key secure.

## ⚠️ Security Best Practices

### DO:
✅ Store API keys in Netlify environment variables
✅ Use `.env` file locally (add to `.gitignore`)
✅ Rotate keys if exposed
✅ Use different keys for dev/production

### DON'T:
❌ Commit API keys to GitHub
❌ Share API keys publicly
❌ Use API keys directly in frontend JavaScript
❌ Leave exposed keys active

## 🔄 If Your Key Was Exposed

If you accidentally committed an API key to GitHub:

1. **Revoke the old key immediately**
   - Go to TMDB account settings
   - Generate a new API key
   - Delete the old key

2. **Remove from Git history**
   ```bash
   git filter-branch --force --index-filter \
   "git rm --cached --ignore-unmatch path/to/file" \
   --prune-empty --tag-name-filter cat -- --all
   ```

3. **Add new key to Netlify**
   - Follow steps above with new key

4. **Update `.gitignore`**
   - Ensure `.env` is listed
   - Commit `.gitignore` changes

## 📞 Quick Reference

**Your TMDB API Key:** `7713c910b9503a1da0d0e6e448bf890e`

**Where to add it:**
- Netlify Dashboard → Site Settings → Environment Variables

**Variable name:** `TMDB_API_KEY`

**After adding:**
- Trigger a new deploy
- Test your site

## ✅ Checklist

- [ ] Logged into Netlify
- [ ] Opened site settings
- [ ] Clicked "Environment variables"
- [ ] Added `TMDB_API_KEY` variable
- [ ] Value: `7713c910b9503a1da0d0e6e448bf890e`
- [ ] Saved variable
- [ ] Triggered new deploy
- [ ] Waited for deploy to complete
- [ ] Tested site functionality

## 🎯 Expected Result

After adding the environment variable:
- ✅ TMDB API requests work
- ✅ Movie data loads correctly
- ✅ No API key visible in browser
- ✅ Secure and protected

---

**Remember: NEVER commit API keys to GitHub! Always use environment variables.**

**Your TMDB API key is now ready to be added securely to Netlify!**
