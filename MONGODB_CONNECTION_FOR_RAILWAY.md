# 🔗 Your MongoDB Connection String for Railway

## ⚠️ IMPORTANT: Fix Your Connection String

Your current connection string has issues that need to be corrected:

**Your original string:**
```
mongodb+srv://nduggahafizu67:<nduggahaf67> @hafithu67.nyi9cp3.mongodb.net/?appName=hafithu67
```

**Issues found:**
1. ❌ Space before `@` (should be no space)
2. ❌ Password in angle brackets `<nduggahaf67>` (should be actual password without brackets)
3. ❌ Missing database name
4. ❌ Missing required parameters

---

## ✅ CORRECTED CONNECTION STRING

### Format 1: If your password is literally "nduggahaf67"

```
MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
```

### Format 2: If you need to replace the password

```
MONGODB_URI=mongodb+srv://nduggahafizu67:YOUR_ACTUAL_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
```

---

## 🔍 Understanding the Connection String Parts

```
mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
              ↑              ↑              ↑                                ↑
           username       password      cluster host                  database name
```

**Breakdown:**
- **Protocol:** `mongodb+srv://`
- **Username:** `nduggahafizu67`
- **Password:** `nduggahaf67` (replace if different)
- **Cluster:** `hafithu67.nyi9cp3.mongodb.net`
- **Database:** `luganda-movies` (added)
- **Parameters:** `retryWrites=true&w=majority&appName=hafithu67`

---

## 📋 STEP-BY-STEP: Add to Railway

### Step 1: Get Your Actual Password

If you don't remember your MongoDB password:

1. Go to: https://cloud.mongodb.com
2. Click "Database Access" (left sidebar)
3. Find user: `nduggahafizu67`
4. Click "Edit"
5. Click "Edit Password"
6. Either:
   - Use existing password (if you remember it)
   - Click "Autogenerate Secure Password" and SAVE IT
7. Click "Update User"

### Step 2: Format Your Connection String

**Use this template:**
```
mongodb+srv://nduggahafizu67:YOUR_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
```

**Replace `YOUR_PASSWORD` with your actual password**

**Important:**
- ❌ Remove `< >` brackets
- ❌ Remove any spaces
- ✅ Password should be plain text
- ✅ No special characters need encoding (unless you have `@`, `:`, `/` in password)

### Step 3: Add to Railway

**Option A: Railway Dashboard (Recommended)**

1. Go to: https://railway.app
2. Click your project
3. Click your service (backend)
4. Click "Variables" tab
5. Click "New Variable"
6. Variable name: `MONGODB_URI`
7. Value: Paste your corrected connection string
8. Click "Add"

**Option B: Railway Raw Editor**

1. Go to Variables tab
2. Click "Raw Editor"
3. Add this line:
   ```
   MONGODB_URI=mongodb+srv://nduggahafizu67:YOUR_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
   ```
4. Click "Update Variables"

---

## 🔐 Special Characters in Password

If your password contains special characters, you need to URL encode them:

| Character | Encoded |
|-----------|---------|
| @ | %40 |
| : | %3A |
| / | %2F |
| ? | %3F |
| # | %23 |
| [ | %5B |
| ] | %5D |
| % | %25 |

**Example:**
- Password: `Pass@123`
- Encoded: `Pass%40123`
- Connection string: `mongodb+srv://nduggahafizu67:Pass%40123@hafithu67...`

---

## ✅ READY-TO-USE CONNECTION STRINGS

### Option 1: If password is "nduggahaf67"

**Copy this to Railway:**
```
MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
```

### Option 2: If you have a different password

**Copy this and replace YOUR_PASSWORD:**
```
MONGODB_URI=mongodb+srv://nduggahafizu67:YOUR_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
```

---

## 🧪 Test Your Connection String

Before adding to Railway, test it locally:

### Method 1: Using Node.js

Create a test file:
```javascript
// test-mongodb.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://nduggahafizu67:YOUR_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
```

Run it:
```bash
cd server
node test-mongodb.js
```

### Method 2: Using mongosh

```bash
mongosh "mongodb+srv://nduggahafizu67:YOUR_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67"
```

---

## ⚠️ MongoDB Atlas Configuration Checklist

Make sure these are configured in MongoDB Atlas:

### 1. Network Access (CRITICAL)

1. Go to: https://cloud.mongodb.com
2. Click "Network Access" (left sidebar)
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere"
5. IP Address: `0.0.0.0/0`
6. Click "Confirm"

**Why:** Railway's servers need to access your MongoDB from any IP.

### 2. Database User

1. Click "Database Access" (left sidebar)
2. Verify user `nduggahafizu67` exists
3. Verify it has "Read and write to any database" privileges
4. If not, click "Edit" and update privileges

### 3. Database Name

The database `luganda-movies` will be created automatically when your app first connects.

---

## 🚨 Common Connection Errors & Solutions

### Error: "Authentication failed"

**Cause:** Wrong password or username

**Solution:**
1. Go to MongoDB Atlas → Database Access
2. Reset password for user `nduggahafizu67`
3. Update connection string with new password

### Error: "Connection timeout"

**Cause:** IP not whitelisted

**Solution:**
1. Go to MongoDB Atlas → Network Access
2. Add IP: `0.0.0.0/0` (allow all)
3. Wait 1-2 minutes for changes to propagate

### Error: "Invalid connection string"

**Cause:** Formatting issues (spaces, brackets, etc.)

**Solution:**
- Remove all spaces
- Remove `< >` brackets
- Ensure no line breaks
- Use the corrected format above

### Error: "Server selection timeout"

**Cause:** Cluster not accessible or wrong cluster URL

**Solution:**
1. Verify cluster URL: `hafithu67.nyi9cp3.mongodb.net`
2. Check cluster is running in MongoDB Atlas
3. Verify network access is configured

---

## 📊 Complete Railway Variables with MongoDB

Here's your complete set of variables including MongoDB:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=e89b4372c354b732f99c0ab2937c11f0373b7af49c1f58b919bc907a1388750e4c00ccf1f6fcd06b9811016339280e0bf4eae247b666f4415fb9031cb34637c2
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=939350ab881352d73aea3d67053f04dfb00cd4e8058675d83611f42f4ac6849b
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
TRUST_PROXY=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
ENABLE_MONITORING=true
LOG_LEVEL=info
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
MONGODB_URI=mongodb+srv://nduggahafizu67:YOUR_PASSWORD@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
ALLOWED_ORIGINS=YOUR_NETLIFY_URL
CLIENT_URL=YOUR_NETLIFY_URL
```

**Replace:**
- `YOUR_PASSWORD` with your actual MongoDB password
- `YOUR_NETLIFY_URL` with your Netlify site URL

---

## ✅ Verification After Adding to Railway

Once you add the MONGODB_URI to Railway:

1. **Railway will redeploy** (2-3 minutes)
2. **Check deployment logs** for:
   ```
   ✅ MongoDB connected successfully
   ✅ Server running on port 5000
   ```
3. **Test health endpoint:**
   ```bash
   curl https://your-railway-url.up.railway.app/api/health
   ```
4. **Expected response:**
   ```json
   {
     "status": "healthy",
     "services": {
       "database": {
         "status": "healthy",
         "state": "connected"
       }
     }
   }
   ```

---

## 🎯 Quick Summary

**Your MongoDB Details:**
- **Cluster:** hafithu67.nyi9cp3.mongodb.net
- **Username:** nduggahafizu67
- **Password:** nduggahaf67 (or your actual password)
- **Database:** luganda-movies

**Corrected Connection String:**
```
mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority&appName=hafithu67
```

**Add to Railway as:**
```
Variable name: MONGODB_URI
Value: (paste corrected connection string above)
```

**Railway will automatically redeploy and connect to your MongoDB!**

---

## 📞 Need Help?

**MongoDB Atlas:** https://cloud.mongodb.com  
**Railway Dashboard:** https://railway.app  
**Connection String Docs:** https://www.mongodb.com/docs/manual/reference/connection-string/

---

**Status:** ✅ READY TO ADD TO RAILWAY  
**Next Step:** Copy corrected connection string and add to Railway Variables
