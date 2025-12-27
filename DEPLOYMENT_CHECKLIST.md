# CSP Fix - Deployment Checklist

## 📋 Pre-Deployment

### Files to Deploy:
- [ ] `_headers` - Updated CSP policy
- [ ] `js/config.js` - Backend auto-detection
- [ ] `test-csp.html` - Testing page (optional)
- [ ] `validate-csp.js` - Validation script (optional)

### Verify Changes:
```bash
# Check _headers file
cat _headers | grep "Content-Security-Policy"

# Check config.js
cat js/config.js | grep "BACKEND_URL"

# Check git status
git status
```

## 🚀 Deployment Steps

### Step 1: Commit Changes
```bash
git add _headers js/config.js
git commit -m "Fix CSP violations - Add Video.js, YouTube, Railway backend, and Google Ads support"
git push origin main
```

### Step 2: Deploy to Netlify
- [ ] Push to repository
- [ ] Wait for Netlify build to complete
- [ ] Check deployment logs for errors

### Step 3: Verify Deployment
- [ ] Visit watch.unrulymovies.com
- [ ] Check that site loads without errors
- [ ] Verify CSP header is present

## ✅ Post-Deployment Testing

### Browser Testing:

#### 1. Clear Cache
- [ ] Open browser
- [ ] Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
- [ ] Select "Cached images and files"
- [ ] Clear cache
- [ ] Close and reopen browser

#### 2. Hard Refresh
- [ ] Navigate to watch.unrulymovies.com
- [ ] Press `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- [ ] Wait for page to fully reload

#### 3. Check Console
- [ ] Open DevTools (F12)
- [ ] Go to Console tab
- [ ] Look for CSP violation errors
- [ ] **Expected:** No CSP errors

#### 4. Check Network Tab
- [ ] Open DevTools (F12)
- [ ] Go to Network tab
- [ ] Reload page
- [ ] Look for failed requests (red)
- [ ] Check for "(blocked:csp)" status
- [ ] **Expected:** All requests successful

#### 5. Verify CSP Header
- [ ] Network tab → Select any request
- [ ] Click "Headers" tab
- [ ] Scroll to "Response Headers"
- [ ] Find "Content-Security-Policy"
- [ ] **Expected:** Should include all new domains

### Feature Testing:

#### Video Player
- [ ] Navigate to a movie page
- [ ] Check if Video.js player loads
- [ ] Try playing a video
- [ ] **Expected:** Player loads and plays

#### Backend API
- [ ] Open Console (F12)
- [ ] Run: `fetch(Config.BACKEND_URL + '/api/health').then(r => r.json()).then(console.log)`
- [ ] **Expected:** Returns health status

#### YouTube Embeds
- [ ] Find page with YouTube embed
- [ ] Check if video loads
- [ ] **Expected:** YouTube player visible

#### Google Ads
- [ ] Check if ads display on pages
- [ ] Look for ad placeholders
- [ ] **Expected:** Ads load (if configured)

#### TMDB Images
- [ ] Check if movie posters load
- [ ] Check if backdrop images load
- [ ] **Expected:** All images visible

### Automated Testing:

#### Run Test Page
- [ ] Navigate to `/test-csp.html`
- [ ] Click "Run All Tests"
- [ ] Check results
- [ ] **Expected:** All tests pass ✅

#### Run Validation Script
- [ ] Open Console (F12)
- [ ] Copy contents of `validate-csp.js`
- [ ] Paste into console
- [ ] Press Enter
- [ ] Check results
- [ ] **Expected:** Validation passed ✅

## 🔍 Verification Checklist

### Critical Features:
- [ ] ✅ Video.js player loads
- [ ] ✅ Railway backend API accessible
- [ ] ✅ TMDB API accessible
- [ ] ✅ Movie posters load
- [ ] ✅ YouTube embeds work
- [ ] ✅ Google Ads display (if configured)
- [ ] ✅ No CSP errors in console
- [ ] ✅ All API calls successful

### Configuration:
- [ ] ✅ Config.js detects correct backend
- [ ] ✅ Backend URL is Railway for watch.unrulymovies.com
- [ ] ✅ Environment detected correctly

### Security:
- [ ] ✅ HTTPS enforced
- [ ] ✅ frame-ancestors 'none' present
- [ ] ✅ X-Frame-Options: DENY present
- [ ] ✅ Only trusted domains allowed

## 🐛 Troubleshooting

### If CSP Errors Still Appear:

#### 1. Cache Issues
```bash
# Clear browser cache completely
# Try incognito/private mode
# Try different browser
```

#### 2. Deployment Issues
```bash
# Check Netlify deployment logs
# Verify _headers file is in root directory
# Check file permissions
```

#### 3. Configuration Issues
```bash
# Verify backend URL in config.js
# Check hostname detection logic
# Test in different environments
```

### Common Issues:

#### Issue: "Still seeing CSP errors"
**Solution:**
1. Clear browser cache completely
2. Hard refresh (Ctrl+Shift+R)
3. Try incognito mode
4. Check if _headers file deployed

#### Issue: "Backend API not accessible"
**Solution:**
1. Check backend URL in config.js
2. Verify Railway backend is running
3. Check CORS configuration
4. Test API directly in browser

#### Issue: "Video.js not loading"
**Solution:**
1. Check if vjs.zencdn.net in script-src
2. Check if vjs.zencdn.net in style-src
3. Verify CDN is accessible
4. Check network tab for blocked requests

#### Issue: "YouTube embeds not working"
**Solution:**
1. Check if www.youtube.com in script-src
2. Check if www.youtube.com in frame-src
3. Verify embed code is correct
4. Check for JavaScript errors

## 📊 Success Criteria

### All of the following must be true:
- ✅ No CSP violation errors in console
- ✅ All API calls successful (200 status)
- ✅ Video player loads and plays
- ✅ Images load correctly
- ✅ YouTube embeds work
- ✅ Google Ads display (if configured)
- ✅ Backend API accessible
- ✅ No blocked requests in Network tab

## 📞 Support

### If Issues Persist:

1. **Check Documentation:**
   - `CSP_FIX_COMPLETE.md` - Full details
   - `CSP_QUICK_REFERENCE.md` - Quick reference
   - `CSP_BEFORE_AFTER.md` - Comparison

2. **Run Diagnostics:**
   - Use `test-csp.html` for automated tests
   - Use `validate-csp.js` for validation
   - Check browser console for specific errors

3. **Review Logs:**
   - Netlify deployment logs
   - Browser console errors
   - Network tab blocked requests

4. **Verify Files:**
   - Ensure `_headers` is in root directory
   - Ensure `js/config.js` has correct backend URL
   - Check file permissions

## ✅ Final Sign-Off

### Deployment Complete When:
- [ ] All files deployed successfully
- [ ] All tests pass
- [ ] No CSP errors in console
- [ ] All features working
- [ ] Verified on production domain
- [ ] Documentation updated

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Production URL:** watch.unrulymovies.com  
**Status:** ⬜ Pending / ✅ Complete  

---

## 🎉 Post-Deployment

### Monitor for 24 Hours:
- [ ] Check error logs
- [ ] Monitor user reports
- [ ] Watch for new CSP violations
- [ ] Verify analytics tracking

### Update Documentation:
- [ ] Mark deployment as complete
- [ ] Update team on changes
- [ ] Archive old CSP policy
- [ ] Document any issues found

---

**Last Updated:** December 23, 2025  
**Version:** 1.0
