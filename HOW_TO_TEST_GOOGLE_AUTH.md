# How to Test Google Authentication

## 🎯 Quick Start Guide

Your Google Authentication is configured and ready! Here's how to test it.

---

## ✅ Prerequisites (Already Done)

- [x] MongoDB installed and running
- [x] Backend server configured
- [x] Frontend server running
- [x] Google Client ID configured
- [x] Sample data seeded

---

## 🧪 Method 1: Browser Testing (Recommended)

### Step 1: Access the Login Page
Open your browser and navigate to:
```
http://localhost:8000/login.html
```

### Step 2: Use Google Sign-In
1. Look for the **"Sign in with Google"** button
2. Click the button
3. A Google popup will appear
4. Select your Google account
5. Grant the requested permissions
6. You'll be automatically logged in and redirected to the homepage

### Step 3: Verify Login
After successful login, you should:
- See your name/profile in the navigation bar
- Be able to access protected pages
- Have a JWT token saved in browser storage

### Step 4: Check Database
Verify the user was created in MongoDB:
```bash
mongosh --eval "use luganda-movies; db.users.find().pretty()"
```

---

## 🧪 Method 2: API Testing (Command Line)

### Test 1: Google Auth Endpoint
```bash
# Test that endpoint exists and validates tokens
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"token": "test-invalid-token"}'

# Expected: 401 Unauthorized (correct behavior)
```

### Test 2: Email/Password Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "testuser@example.com",
    "password": "SecurePassword123!"
  }'

# Expected: 201 Created with JWT token
```

### Test 3: Email/Password Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!"
  }'

# Expected: 200 OK with JWT token
```

### Test 4: Check Users in Database
```bash
mongosh --eval "use luganda-movies; db.users.countDocuments()"
mongosh --eval "use luganda-movies; db.users.find({}, {fullName: 1, email: 1, provider: 1})"
```

---

## 🧪 Method 3: Automated Test Suite

Run the comprehensive test suite:

```bash
cd /vercel/sandbox
node test-google-auth.js
```

This will test:
- ✅ Google Auth endpoint availability
- ✅ Token validation
- ✅ Email/password registration
- ✅ Email/password login
- ✅ Invalid credentials handling
- ✅ Google OAuth configuration

---

## 📸 What You Should See

### Login Page (http://localhost:8000/login.html)

```
┌─────────────────────────────────────────────┐
│                                             │
│           [Luganda Movies Logo]             │
│                                             │
│            Welcome Back                     │
│        Login to continue watching           │
│                                             │
│  Email Address                              │
│  [___________________________________]      │
│                                             │
│  Password                                   │
│  [___________________________________] 👁    │
│                                             │
│  ☐ Remember me    Forgot Password?         │
│                                             │
│  [          Login          ]                │
│                                             │
│  ─────────── OR ───────────                 │
│                                             │
│  [  🔵  Sign in with Google  ]              │
│  [  📘  Sign in with Facebook ]             │
│                                             │
│  Don't have an account? Sign Up             │
│                                             │
└─────────────────────────────────────────────┘
```

### After Google Sign-In Success

```
✅ Login successful! Redirecting...
→ Redirected to http://localhost:8000/
→ User profile visible in navigation
→ JWT token saved in browser
```

---

## 🔍 Verification Steps

### 1. Check Backend Logs
```bash
tail -f /tmp/backend-new.log
```

Look for:
```
Google Sign-In: { email: 'user@gmail.com', name: 'User Name', googleId: '...' }
New user created: 6946d...
```

### 2. Check Browser Console
Open browser DevTools (F12) and check:
- No JavaScript errors
- Google GSI library loaded
- Auth token saved in localStorage/sessionStorage

### 3. Check Database
```bash
mongosh --eval "use luganda-movies; db.users.find().pretty()"
```

Should show user with:
- fullName
- email
- googleId
- profileImage (from Google)
- provider: 'google'
- verified: true

### 4. Test Protected Pages
Try accessing:
```
http://localhost:8000/profile.html
```

- If logged in: Page loads
- If not logged in: Redirects to login.html

---

## 🎨 Frontend Features

### Login Page Features
- ✅ Google Sign-In button (styled, responsive)
- ✅ Email/password form
- ✅ Remember me checkbox
- ✅ Password visibility toggle
- ✅ Forgot password link
- ✅ Register link
- ✅ Loading states
- ✅ Error notifications
- ✅ Success notifications

### Auth Flow Features
- ✅ Automatic redirect after login
- ✅ Token persistence (localStorage/sessionStorage)
- ✅ Auto-login on page load (if token valid)
- ✅ Protected route handling
- ✅ Logout functionality
- ✅ Token expiry handling

---

## 🔐 Security Verification

### Check Security Headers
```bash
curl -I http://localhost:5000/api/auth/google
```

Should include:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

### Check CORS
```bash
curl -H "Origin: http://localhost:8000" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:5000/api/auth/google -v
```

Should allow origin: http://localhost:8000

### Check Rate Limiting
```bash
# Make multiple rapid requests
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/google \
    -H "Content-Type: application/json" \
    -d '{"token": "test"}' &
done
```

Should eventually return 429 Too Many Requests

---

## 📊 Expected API Responses

### Successful Google Sign-In
```json
{
  "status": "success",
  "message": "Google sign-in successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6946d...",
      "fullName": "John Doe",
      "email": "john@gmail.com",
      "profileImage": "https://lh3.googleusercontent.com/...",
      "subscription": {
        "plan": "free",
        "status": "active"
      },
      "verified": true
    }
  }
}
```

### Invalid Google Token
```json
{
  "status": "error",
  "message": "Invalid Google token. Please try again.",
  "error": "Wrong number of segments in token: ..."
}
```

### Successful Registration
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "6946d...",
      "fullName": "Test User",
      "email": "test@example.com",
      "subscription": {
        "plan": "free",
        "status": "active"
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

### Google Sign-In Button Not Showing
1. Check browser console for errors
2. Verify Google GSI library loaded:
   ```javascript
   console.log(typeof google !== 'undefined')
   ```
3. Check network tab for blocked requests

### "Invalid Google Token" Error
- Normal for test tokens
- Real Google tokens work correctly
- Backend is validating properly

### Backend Not Responding
```bash
# Check if running
ps aux | grep "node server.js"

# Restart if needed
pkill -f "node server.js"
cd /vercel/sandbox/server && node server.js &
```

### MongoDB Not Connected
```bash
# Check MongoDB
ps aux | grep mongod

# Start if needed
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 \
  --logpath /data/db/mongod.log --fork
```

---

## 📱 Mobile Testing

The Google Auth also works on mobile devices:

1. Access from mobile browser:
   ```
   http://your-ip-address:8000/login.html
   ```

2. Google Sign-In adapts to mobile
3. Touch-friendly interface
4. Responsive design

---

## 🎉 Success Indicators

You'll know Google Auth is working when:

- ✅ Google Sign-In button appears on login page
- ✅ Clicking button opens Google account selector
- ✅ After selecting account, you're redirected to homepage
- ✅ Your name appears in the navigation bar
- ✅ User record created in MongoDB
- ✅ JWT token saved in browser storage
- ✅ Can access protected pages
- ✅ Logout works correctly

---

## 📊 Current Status

| Component | Status | Ready to Test |
|-----------|--------|---------------|
| Google Client ID | ✅ Configured | Yes |
| Backend Endpoint | ✅ Working | Yes |
| Frontend Button | ✅ Integrated | Yes |
| MongoDB | ✅ Connected | Yes |
| JWT Tokens | ✅ Configured | Yes |
| User Model | ✅ Ready | Yes |
| Protected Routes | ✅ Working | Yes |

---

## 🚀 Ready to Test!

Your Google Authentication is **fully configured and ready to test**!

**Recommended Testing Order:**
1. Open http://localhost:8000/login.html in browser
2. Click "Sign in with Google"
3. Complete Google authentication
4. Verify redirect to homepage
5. Check user in database
6. Test logout
7. Test "Remember Me" feature

**Status: ✅ READY FOR TESTING**

---

**Last Updated:** December 20, 2025  
**Configuration:** Complete  
**Status:** Operational
