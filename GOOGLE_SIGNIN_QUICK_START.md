# 🚀 Google Sign-In Quick Start

**Get Google Sign-In working in 5 minutes!**

---

## ✅ What's Already Done

- ✅ Frontend has Google Sign-In button
- ✅ Backend controller created (`server/controllers/googleAuthController.js`)
- ✅ Auth route added (`/api/auth/google`)
- ✅ Frontend JavaScript ready (`js/auth.js`)

---

## 🎯 What You Need To Do

### Step 1: Install Google Auth Library (2 minutes)

```bash
.\install-google-auth.bat
```

This installs the `google-auth-library` package needed for backend.

---

### Step 2: Get Google Client ID (5 minutes)

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/

2. **Create a project** (if you don't have one):
   - Click "Select a project" → "NEW PROJECT"
   - Name: "Luganda Movies"
   - Click "CREATE"

3. **Enable Google+ API:**
   - Go to "APIs & Services" → "Library"
   - Search "Google+ API"
   - Click "ENABLE"

4. **Configure OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Select "External"
   - Fill in:
     - App name: `Luganda Movies`
     - User support email: Your email
     - Developer contact: Your email
   - Click "SAVE AND CONTINUE" (skip other steps)

5. **Create OAuth Client ID:**
   - Go to "APIs & Services" → "Credentials"
   - Click "CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Luganda Movies Web"
   - **Authorized JavaScript origins:**
     ```
     http://localhost:5500
     http://127.0.0.1:5500
     ```
   - **Authorized redirect URIs:**
     ```
     http://localhost:5500/login.html
     ```
   - Click "CREATE"
   - **COPY YOUR CLIENT ID!**

---

### Step 3: Configure Your App (2 minutes)

#### 3.1 Update Frontend

Open `js/auth.js` and replace line 7:

```javascript
// BEFORE:
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

// AFTER (use your actual Client ID):
const GOOGLE_CLIENT_ID = '123456789-abc123def456.apps.googleusercontent.com';
```

#### 3.2 Update Backend

Open `server/.env` and add:

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com

# JWT Secret (use a random string)
JWT_SECRET=your-super-secret-random-string-here-make-it-long
```

**Generate a random JWT secret:**
```javascript
// Run this in browser console:
console.log(require('crypto').randomBytes(64).toString('hex'));
```

Or just use a long random string like:
```
JWT_SECRET=my-super-secret-key-change-this-to-something-random-and-long-12345
```

---

### Step 4: Restart Backend (1 minute)

```bash
# Stop current backend (Ctrl+C)
# Then restart:
.\start-backend.bat
```

---

### Step 5: Test It! (1 minute)

1. Open `login.html` in your browser
2. Click "Sign in with Google" button
3. Select your Google account
4. Grant permissions
5. You should be redirected to homepage
6. Check if you're logged in (user menu should appear)

---

## 🎉 That's It!

Google Sign-In is now working!

---

## 🐛 Troubleshooting

### Google button not showing?

**Check:**
- Is `GOOGLE_CLIENT_ID` set in `js/auth.js`?
- Open browser console - any errors?
- Is Google script loaded? Check page source for: `<script src="https://accounts.google.com/gsi/client"`

### "Invalid Client ID" error?

**Fix:**
- Copy Client ID again from Google Cloud Console
- Make sure no extra spaces or quotes
- Update both `js/auth.js` AND `server/.env`

### Backend error "Cannot find module 'google-auth-library'"?

**Fix:**
```bash
cd server
npm install google-auth-library
```

### "Redirect URI mismatch" error?

**Fix:**
- Go to Google Cloud Console → Credentials
- Edit your OAuth Client ID
- Add your exact URL to "Authorized redirect URIs"
- Example: `http://localhost:5500/login.html`

---

## 📊 How It Works

```
1. User clicks "Sign in with Google"
   ↓
2. Google popup opens
   ↓
3. User selects account
   ↓
4. Google returns token to frontend
   ↓
5. Frontend sends token to: POST /api/auth/google
   ↓
6. Backend verifies token with Google
   ↓
7. Backend creates/updates user in MongoDB
   ↓
8. Backend generates JWT token
   ↓
9. Frontend saves JWT + user data
   ↓
10. User redirected to homepage
   ↓
11. ✅ User is logged in!
```

---

## 📝 Files Modified

### Created:
- ✅ `server/controllers/googleAuthController.js` - Handles Google auth
- ✅ `GOOGLE_SIGNIN_SETUP_GUIDE.md` - Detailed guide
- ✅ `GOOGLE_SIGNIN_QUICK_START.md` - This file
- ✅ `install-google-auth.bat` - Install script

### Modified:
- ✅ `server/routes/auth.js` - Added `/google` route
- ⏳ `js/auth.js` - Need to add your Client ID
- ⏳ `server/.env` - Need to add Google credentials

---

## 🔐 Security Notes

- ✅ Never commit `.env` file to Git
- ✅ Use different Client IDs for dev and production
- ✅ Keep JWT_SECRET secret and random
- ✅ Use HTTPS in production

---

## 📞 Need More Help?

See the detailed guide: `GOOGLE_SIGNIN_SETUP_GUIDE.md`

---

**Total setup time: ~10 minutes**  
**Difficulty: Easy** 🟢
