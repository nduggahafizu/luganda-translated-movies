# CSP (Content Security Policy) Fix - Complete

## Issue Identified
The Content Security Policy in `_headers` was blocking API calls to external services. The `connect-src` directive was too restrictive, only allowing:
- `'self'` (same origin)
- `https://image.tmdb.org`

This blocked all API calls to:
- Backend API (`https://luganda-movies-api.onrender.com`)
- TMDB API (`https://api.themoviedb.org`)
- Google OAuth APIs
- IPTV.org APIs
- Localhost development server

## Fix Applied

### Updated `_headers` File
Modified the Content-Security-Policy header to include all necessary domains:

**Before:**
```
connect-src 'self' https://image.tmdb.org;
```

**After:**
```
connect-src 'self' https://image.tmdb.org https://api.themoviedb.org https://luganda-movies-api.onrender.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com http://localhost:5000 https://*.iptv.org;
```

### Complete CSP Policy Now Includes:

#### 1. **connect-src** (API Calls)
- `'self'` - Same origin requests
- `https://image.tmdb.org` - TMDB images
- `https://api.themoviedb.org` - TMDB API
- `https://luganda-movies-api.onrender.com` - Backend API
- `https://accounts.google.com` - Google OAuth
- `https://oauth2.googleapis.com` - Google OAuth tokens
- `https://www.googleapis.com` - Google APIs
- `http://localhost:5000` - Local development
- `https://*.iptv.org` - IPTV streaming APIs

#### 2. **script-src** (JavaScript)
- `'self'` - Same origin scripts
- `'unsafe-inline'` - Inline scripts (required for some functionality)
- `https://pagead2.googlesyndication.com` - Google AdSense
- `https://fonts.googleapis.com` - Google Fonts
- `https://fonts.gstatic.com` - Google Fonts
- `https://accounts.google.com` - Google OAuth
- `https://apis.google.com` - Google APIs

#### 3. **frame-src** (iFrames)
- `'self'` - Same origin frames
- `https://accounts.google.com` - Google OAuth popup

#### 4. **Other Directives**
- `default-src 'self'` - Default to same origin
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` - Styles
- `font-src 'self' https://fonts.gstatic.com` - Fonts
- `img-src 'self' data: https:` - Images from any HTTPS source
- `frame-ancestors 'none'` - Prevent clickjacking

## Files Modified
1. `_headers` - Updated CSP policy

## Testing Recommendations

### 1. Test API Connectivity
```javascript
// Test backend API
fetch('https://luganda-movies-api.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('Backend:', d))
  .catch(e => console.error('Backend Error:', e));

// Test TMDB API
fetch('https://api.themoviedb.org/3/movie/popular?api_key=YOUR_KEY')
  .then(r => r.json())
  .then(d => console.log('TMDB:', d))
  .catch(e => console.error('TMDB Error:', e));
```

### 2. Check Browser Console
- Open browser DevTools (F12)
- Go to Console tab
- Look for CSP violation errors (should be gone now)
- Check Network tab for failed requests

### 3. Test Features
- ✅ Movie loading from backend API
- ✅ TMDB movie data fetching
- ✅ Google OAuth login
- ✅ Uganda TV streaming
- ✅ Image loading from TMDB
- ✅ Local development (localhost:5000)

## Deployment

### Netlify
The `_headers` file is automatically deployed with your site. After deployment:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh the page (Ctrl+Shift+R)
3. Test API calls

### Verification
Check response headers using browser DevTools:
```
Network Tab → Select any request → Headers → Response Headers
Look for: Content-Security-Policy
```

## Security Notes

### Why These Domains Are Safe
- **TMDB APIs**: Official movie database API
- **Google APIs**: Official Google OAuth and services
- **Render.com**: Your own backend API
- **IPTV.org**: Public IPTV streaming service

### Security Best Practices Maintained
- ✅ `frame-ancestors 'none'` - Prevents clickjacking
- ✅ `X-Frame-Options: DENY` - Additional clickjacking protection
- ✅ `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- ✅ `Strict-Transport-Security` - Forces HTTPS
- ✅ Limited `script-src` - Only trusted domains
- ✅ No `unsafe-eval` - Prevents eval() attacks

### Future Additions
If you need to add more API domains, update the `connect-src` directive in `_headers`:
```
connect-src 'self' https://your-new-api.com;
```

## Troubleshooting

### If APIs Still Blocked
1. **Clear Cache**: Browser cache might have old CSP
2. **Check Deployment**: Ensure `_headers` file is deployed
3. **Check Console**: Look for specific CSP violations
4. **Verify Headers**: Use DevTools to check actual CSP header

### Common CSP Errors
```
Refused to connect to 'https://api.example.com' because it violates the following Content Security Policy directive: "connect-src 'self'"
```
**Solution**: Add the domain to `connect-src` in `_headers`

### Development vs Production
- Development: `http://localhost:5000` is allowed
- Production: Uses `https://luganda-movies-api.onrender.com`
- Both are now included in CSP

## Status
✅ **FIXED** - All API calls should now work without CSP blocking

## Next Steps
1. Deploy the updated `_headers` file
2. Clear browser cache
3. Test all API-dependent features
4. Monitor browser console for any remaining CSP violations

---
**Date**: December 23, 2025
**Issue**: CSP blocking API calls
**Resolution**: Updated `connect-src` directive to include all required API domains
