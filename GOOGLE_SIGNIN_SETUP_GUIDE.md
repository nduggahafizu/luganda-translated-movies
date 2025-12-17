# 🔐 Google Sign-In Setup Guide

**Complete guide to enable Google Sign-In for your Luganda Movies website**

---

## 📋 Prerequisites

- Google Account
- Access to Google Cloud Console
- Backend server running
- MongoDB database

---

## 🚀 Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create New Project
1. Click "Select a project" dropdown
2. Click "NEW PROJECT"
3. Enter project name: "Luganda Movies"
4. Click "CREATE"

### 1.3 Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "ENABLE"

---

## 🔑 Step 2: Create OAuth 2.0 Credentials

### 2.1 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Click "CREATE"

**Fill in the form:**
- App name: `Luganda Movies`
- User support email: `your-email@gmail.com`
- App logo: Upload your logo (optional)
- Application home page: `https://lugandamovies.com`
- Authorized domains: `lugandamovies.com`
- Developer contact: `your-email@gmail.com`

4. Click "SAVE AND CONTINUE"
5. Skip "Scopes" (click "SAVE AND CONTINUE")
6. Add test users (your email)
7. Click "SAVE AND CONTINUE"

### 2.2 Create OAuth Client ID
1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "Luganda Movies Web Client"

**Authorized JavaScript origins:**
```
http://localhost:5500
http://127.0.0.1:5500
https://lugandamovies.com
https://www.lugandamovies.com
```

**Authorized redirect URIs:**
```
http://localhost:5500/login.html
https://lugandamovies.com/login.html
```

5. Click "CREATE"
6. **COPY YOUR CLIENT ID** - You'll need this!

Example: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

---

## ⚙️ Step 3: Configure Frontend

### 3.1 Update auth.js

Open `js/auth.js` and replace:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
```

With your actual Client ID:

```javascript
const GOOGLE_CLIENT_ID = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
```

### 3.2 Update API URL

In `js/auth.js`, update:

```javascript
const API_URL = 'http://localhost:5000'; // For local development
// OR
const API_URL = 'https://api.lugandamovies.com'; // For production
```

---

## 🔧 Step 4: Setup Backend

### 4.1 Install Required Packages

```bash
cd server
npm install google-auth-library passport passport-google-oauth20
```

### 4.2 Create Google Auth Controller

File: `server/controllers/googleAuthController.js`

```javascript
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token and create/login user
exports.googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;
        
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture, sub: googleId } = payload;
        
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create new user
            user = await User.create({
                fullName: name,
                email,
                profileImage: picture,
                googleId,
                provider: 'google',
                verified: true // Google emails are pre-verified
            });
        } else {
            // Update existing user
            user.googleId = googleId;
            user.profileImage = picture;
            user.lastLogin = new Date();
            await user.save();
        }
        
        // Generate JWT token
        const jwtToken = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(200).json({
            status: 'success',
            message: 'Google sign-in successful',
            data: {
                token: jwtToken,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    profileImage: user.profileImage,
                    subscription: user.subscription
                }
            }
        });
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        res.status(401).json({
            status: 'error',
            message: 'Invalid Google token',
            error: error.message
        });
    }
};
```

### 4.3 Create Auth Route

File: `server/routes/auth.js` (or update existing)

```javascript
const express = require('express');
const router = express.Router();
const { googleSignIn } = require('../controllers/googleAuthController');

// Google Sign-In
router.post('/google', googleSignIn);

module.exports = router;
```

### 4.4 Register Route in server.js

In `server/server.js`, add:

```javascript
const authRoutes = require('./routes/auth');

// Routes
app.use('/api/auth', authRoutes);
```

### 4.5 Update .env File

Add to `server/.env`:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
```

---

## 🧪 Step 5: Test Google Sign-In

### 5.1 Start Backend Server

```bash
cd server
npm start
```

### 5.2 Open Login Page

```bash
# Open in browser
start login.html
```

### 5.3 Click "Sign in with Google"

1. Click the Google Sign-In button
2. Select your Google account
3. Grant permissions
4. You should be redirected to homepage
5. Check if you're logged in (user menu should appear)

---

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] OAuth consent screen configured
- [ ] OAuth Client ID created
- [ ] Client ID added to `auth.js`
- [ ] Backend packages installed
- [ ] Google auth controller created
- [ ] Auth route registered
- [ ] Environment variables set
- [ ] Backend server running
- [ ] Google Sign-In button appears on login page
- [ ] Can sign in with Google account
- [ ] User data saved to database
- [ ] JWT token generated
- [ ] Redirected to homepage after login
- [ ] User menu shows logged-in state

---

## 🐛 Troubleshooting

### Issue: "Invalid Client ID"

**Solution:**
- Check that Client ID in `auth.js` matches Google Cloud Console
- Ensure no extra spaces or quotes
- Verify domain is authorized in Google Cloud Console

### Issue: "Redirect URI mismatch"

**Solution:**
- Add your exact URL to "Authorized redirect URIs" in Google Cloud Console
- Include both `http://` and `https://` versions
- Include `www` and non-`www` versions

### Issue: "Google button not showing"

**Solution:**
- Check browser console for errors
- Verify Google Sign-In script is loaded: `<script src="https://accounts.google.com/gsi/client" async defer></script>`
- Check that `google-signin-btn` div exists in HTML

### Issue: "Backend error 401"

**Solution:**
- Verify `GOOGLE_CLIENT_ID` in `.env` matches your actual Client ID
- Check that `google-auth-library` package is installed
- Ensure backend server is running

### Issue: "User not created in database"

**Solution:**
- Check MongoDB connection
- Verify User model exists
- Check backend logs for errors

---

## 🔒 Security Best Practices

### 1. Keep Secrets Secret
- Never commit `.env` file to Git
- Use different Client IDs for development and production
- Rotate JWT secret regularly

### 2. Validate Tokens
- Always verify Google tokens on backend
- Never trust client-side validation alone
- Set appropriate token expiry times

### 3. HTTPS Only in Production
- Use HTTPS for all production URLs
- Enable HSTS headers
- Use secure cookies

### 4. Rate Limiting
- Implement rate limiting on auth endpoints
- Prevent brute force attacks
- Monitor for suspicious activity

---

## 📊 What Happens When User Signs In

```
1. User clicks "Sign in with Google"
   ↓
2. Google popup opens
   ↓
3. User selects account and grants permissions
   ↓
4. Google returns ID token to frontend
   ↓
5. Frontend sends token to backend (/api/auth/google)
   ↓
6. Backend verifies token with Google
   ↓
7. Backend checks if user exists in database
   ↓
8. If new: Create user | If existing: Update user
   ↓
9. Backend generates JWT token
   ↓
10. Frontend receives JWT + user data
   ↓
11. Frontend saves to localStorage/sessionStorage
   ↓
12. User redirected to homepage
   ↓
13. ✅ User is logged in!
```

---

## 🎯 Next Steps After Setup

1. **Test thoroughly** - Try signing in with multiple Google accounts
2. **Add error handling** - Handle edge cases gracefully
3. **Implement logout** - Clear tokens and redirect
4. **Add profile page** - Show user info from Google
5. **Protect routes** - Require authentication for certain pages
6. **Add subscription** - Link Google account to subscription plans

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check backend logs
3. Verify all environment variables are set
4. Ensure MongoDB is running
5. Test with a fresh Google account

---

**Created:** December 17, 2024  
**Status:** Ready to implement  
**Estimated setup time:** 30-45 minutes
