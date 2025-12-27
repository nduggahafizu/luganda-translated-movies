# CSP Quick Reference Guide

## Current Content Security Policy

### Full CSP Header (Single Line)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://adservice.google.com https://fonts.googleapis.com https://fonts.gstatic.com https://accounts.google.com https://apis.google.com https://vjs.zencdn.net https://www.youtube.com https://s.ytimg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vjs.zencdn.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://image.tmdb.org https://api.themoviedb.org https://luganda-movies-api.onrender.com https://luganda-translated-movies-production.up.railway.app https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://ep1.adtrafficquality.google https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google-analytics.com http://localhost:5000 https://*.iptv.org; frame-src 'self' https://accounts.google.com https://googleads.g.doubleclick.net https://www.youtube.com https://www.google.com https://tpc.googlesyndication.com; media-src 'self' blob: https: data:; worker-src 'self' blob:; child-src 'self' blob: https://accounts.google.com https://www.youtube.com; frame-ancestors 'none';
```

## Directive Breakdown

### 1. default-src
```
default-src 'self';
```
**Purpose:** Fallback for all other directives  
**Allows:** Same-origin resources only

### 2. script-src (JavaScript)
```
script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: 
  https://pagead2.googlesyndication.com 
  https://googleads.g.doubleclick.net 
  https://www.googletagservices.com 
  https://adservice.google.com 
  https://fonts.googleapis.com 
  https://fonts.gstatic.com 
  https://accounts.google.com 
  https://apis.google.com 
  https://vjs.zencdn.net 
  https://www.youtube.com 
  https://s.ytimg.com;
```
**Purpose:** Control JavaScript execution  
**Allows:**
- Same-origin scripts
- Inline scripts
- Dynamic eval()
- Blob URLs
- Google Ads & Services
- Google Fonts
- Google OAuth
- Video.js CDN
- YouTube

### 3. style-src (CSS)
```
style-src 'self' 'unsafe-inline' 
  https://fonts.googleapis.com 
  https://vjs.zencdn.net;
```
**Purpose:** Control stylesheet loading  
**Allows:**
- Same-origin styles
- Inline styles
- Google Fonts
- Video.js styles

### 4. font-src (Fonts)
```
font-src 'self' https://fonts.gstatic.com;
```
**Purpose:** Control font loading  
**Allows:**
- Same-origin fonts
- Google Fonts static files

### 5. img-src (Images)
```
img-src 'self' data: blob: https:;
```
**Purpose:** Control image loading  
**Allows:**
- Same-origin images
- Data URIs
- Blob URLs
- Any HTTPS image source

### 6. connect-src (API Calls)
```
connect-src 'self' 
  https://image.tmdb.org 
  https://api.themoviedb.org 
  https://luganda-movies-api.onrender.com 
  https://luganda-translated-movies-production.up.railway.app 
  https://accounts.google.com 
  https://oauth2.googleapis.com 
  https://www.googleapis.com 
  https://ep1.adtrafficquality.google 
  https://pagead2.googlesyndication.com 
  https://googleads.g.doubleclick.net 
  https://www.google-analytics.com 
  http://localhost:5000 
  https://*.iptv.org;
```
**Purpose:** Control fetch/XHR/WebSocket connections  
**Allows:**
- Same-origin requests
- TMDB API (images & data)
- Backend APIs (Railway & Render)
- Google OAuth & APIs
- Google Ads & Analytics
- Local development
- IPTV streaming

### 7. frame-src (iFrames)
```
frame-src 'self' 
  https://accounts.google.com 
  https://googleads.g.doubleclick.net 
  https://www.youtube.com 
  https://www.google.com 
  https://tpc.googlesyndication.com;
```
**Purpose:** Control iframe embedding  
**Allows:**
- Same-origin frames
- Google OAuth popups
- Google Ads frames
- YouTube embeds
- Google services

### 8. media-src (Video/Audio)
```
media-src 'self' blob: https: data:;
```
**Purpose:** Control media loading  
**Allows:**
- Same-origin media
- Blob URLs
- Any HTTPS media
- Data URIs

### 9. worker-src (Web Workers)
```
worker-src 'self' blob:;
```
**Purpose:** Control web worker creation  
**Allows:**
- Same-origin workers
- Blob workers

### 10. child-src (Child Contexts)
```
child-src 'self' blob: 
  https://accounts.google.com 
  https://www.youtube.com;
```
**Purpose:** Control nested browsing contexts  
**Allows:**
- Same-origin contexts
- Blob contexts
- Google OAuth
- YouTube

### 11. frame-ancestors
```
frame-ancestors 'none';
```
**Purpose:** Prevent clickjacking  
**Allows:** Site cannot be embedded in any frame

## Adding New Domains

### To Add a New API Domain:
1. Open `_headers` file
2. Find `connect-src` directive
3. Add domain before the semicolon
4. Example: `connect-src 'self' https://new-api.com ...;`

### To Add a New Script Source:
1. Open `_headers` file
2. Find `script-src` directive
3. Add domain before the semicolon
4. Example: `script-src 'self' https://new-cdn.com ...;`

### To Add a New Frame Source:
1. Open `_headers` file
2. Find `frame-src` directive
3. Add domain before the semicolon
4. Example: `frame-src 'self' https://new-embed.com ...;`

## Testing CSP Changes

### 1. Check Browser Console
Open DevTools (F12) → Console tab
Look for errors starting with:
- "Refused to connect to..."
- "Refused to load the script..."
- "Refused to load the stylesheet..."
- "Refused to frame..."

### 2. Check Network Tab
Open DevTools (F12) → Network tab
Look for:
- Failed requests (red)
- Status: (blocked:csp)

### 3. Use CSP Test Page
Navigate to `/test-csp.html` and run tests

### 4. Verify Headers
Network tab → Select any request → Headers → Response Headers
Look for: `Content-Security-Policy`

## Common Issues

### Issue: "Refused to connect to..."
**Cause:** Domain not in `connect-src`  
**Fix:** Add domain to `connect-src` directive

### Issue: "Refused to load the script..."
**Cause:** Domain not in `script-src`  
**Fix:** Add domain to `script-src` directive

### Issue: "Refused to load the stylesheet..."
**Cause:** Domain not in `style-src`  
**Fix:** Add domain to `style-src` directive

### Issue: "Refused to frame..."
**Cause:** Domain not in `frame-src`  
**Fix:** Add domain to `frame-src` directive

### Issue: Changes not taking effect
**Cause:** Browser cache  
**Fix:** 
1. Clear cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check deployment status

## Security Notes

### Safe Practices ✅
- Only add trusted domains
- Use HTTPS for all external resources
- Keep `frame-ancestors 'none'` to prevent clickjacking
- Regularly review and audit CSP policy

### Necessary Trade-offs ⚠️
- `'unsafe-inline'` - Required for inline scripts/styles
- `'unsafe-eval'` - Required for Video.js and some ad scripts
- `blob:` - Required for dynamic content generation

### Avoid ❌
- `'unsafe-inline'` in production (if possible)
- `'unsafe-eval'` in production (if possible)
- Wildcard `*` in any directive
- HTTP sources (use HTTPS only)

## Resources

### CSP Validators
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Validator](https://cspvalidator.org/)

### Documentation
- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Content Security Policy Reference](https://content-security-policy.com/)

### Testing Tools
- Browser DevTools Console
- Browser DevTools Network Tab
- `/test-csp.html` (included in project)

---
**Last Updated:** December 23, 2025  
**Version:** 2.0 (Comprehensive Update)
