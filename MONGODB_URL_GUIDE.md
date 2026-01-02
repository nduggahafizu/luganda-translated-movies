# 🗄️ MongoDB URL Setup Guide for Railway

**Current Status:** You have local MongoDB with data (8 movies, 11 VJs, 16 users)  
**Goal:** Get MongoDB URL for Railway deployment

---

## 🎯 You Have 2 Options

### Option 1: Railway MongoDB Plugin (Easiest - For Testing)
### Option 2: MongoDB Atlas (Recommended - For Production)

---

## 🚂 Option 1: Railway MongoDB Plugin

**Best for:** Quick testing, development  
**Pros:** One-click setup, automatic connection  
**Cons:** Limited to 500MB, not ideal for production  
**Cost:** Included in Railway free tier

### How to Set Up:

1. **In Railway Dashboard:**
   - Click "New" button
   - Select "Database"
   - Choose "Add MongoDB"
   - Railway creates instance automatically

2. **Railway Auto-Creates Variable:**
   - Variable name: `MONGO_URL`
   - Value: `mongodb://mongo:password@mongodb.railway.internal:27017`

3. **Add MONGODB_URI Variable:**
   - Click "Variables" tab
   - Add new variable:
     ```
     Name: MONGODB_URI
     Value: ${{MONGO_URL}}
     ```
   - This references the auto-created MONGO_URL

4. **Done!** Railway handles the connection automatically.

### MongoDB URL Format (Railway Plugin):
```
mongodb://mongo:password@mongodb.railway.internal:27017
```

**You don't need to copy this - Railway creates it automatically!**

---

## ☁️ Option 2: MongoDB Atlas (Recommended)

**Best for:** Production, better performance, more storage  
**Pros:** 512MB free forever, production-ready, automatic backups  
**Cons:** Requires separate signup (5 minutes)  
**Cost:** FREE (M0 tier)

### Step-by-Step Setup:

#### 1. Create MongoDB Atlas Account

1. Go to https://cloud.mongodb.com
2. Click "Try Free" or "Sign In"
3. Sign up with Google (easiest) or email
4. Verify your email if needed

#### 2. Create a Free Cluster

1. Click "Build a Database" or "Create"
2. Choose **"M0 FREE"** tier
3. Select cloud provider: **AWS** (recommended)
4. Select region: **Choose closest to your users** (e.g., US East for USA)
5. Cluster name: `luganda-movies` (or any name)
6. Click "Create Cluster"
7. Wait 3-5 minutes for cluster creation

#### 3. Create Database User

1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Authentication Method: **Password**
4. Username: `luganda-admin` (or any name)
5. Password: Click "Autogenerate Secure Password" (COPY THIS!)
6. Database User Privileges: **Read and write to any database**
7. Click "Add User"

**IMPORTANT:** Save the password! You'll need it for the connection string.

#### 4. Configure Network Access

1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. IP Address: `0.0.0.0/0` (auto-filled)
5. Click "Confirm"

**Why 0.0.0.0/0?** Railway uses dynamic IPs, so we need to allow all IPs.

#### 5. Get Connection String

1. Click "Database" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. Copy the connection string:
   ```
   mongodb+srv://luganda-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

#### 6. Customize Connection String

Replace `<password>` with your actual password and add database name:

**Before:**
```
mongodb+srv://luganda-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

**After:**
```
mongodb+srv://luganda-admin:YOUR_ACTUAL_PASSWORD@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

**Changes:**
- Replace `<password>` with the password you copied
- Add `/luganda-movies` before the `?` to specify database name

**Example:**
```
mongodb+srv://luganda-admin:MySecurePass123@cluster0.abc123.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

#### 7. Add to Railway

1. In Railway dashboard
2. Click "Variables" tab
3. Add new variable:
   ```
   Name: MONGODB_URI
   Value: mongodb+srv://luganda-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
   ```
4. Save

#### 8. Migrate Your Data

Since you have local data, you need to migrate it to Atlas:

**Option A: Export and Import**
```bash
# Export from local MongoDB
mongodump --db luganda-movies --out /tmp/mongodb-backup

# Import to Atlas (replace with your connection string)
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/luganda-movies" /tmp/mongodb-backup/luganda-movies
```

**Option B: Re-seed on Railway**
After Railway deploys, run seed scripts:
```bash
# Using Railway CLI
railway run npm run seed:vjs
railway run node scripts/seedSampleMovies.js
```

**Option C: Use MongoDB Compass (GUI)**
1. Download MongoDB Compass: https://www.mongodb.com/products/compass
2. Connect to local MongoDB: `mongodb://localhost:27017`
3. Export collections
4. Connect to Atlas: `mongodb+srv://...`
5. Import collections

---

## 📋 MongoDB URL Formats

### Local MongoDB (Current)
```
mongodb://localhost:27017/luganda-movies
```
**Use for:** Local development only

### Railway MongoDB Plugin
```
mongodb://mongo:password@mongodb.railway.internal:27017
```
**Use for:** Quick testing on Railway  
**Note:** Railway auto-creates this

### MongoDB Atlas (Recommended)
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
```
**Use for:** Production deployment  
**Note:** You create this on cloud.mongodb.com

---

## 🔧 Complete Railway Environment Variables

Here's the complete list with MongoDB URL:

### If Using Railway MongoDB Plugin:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=${{MONGO_URL}}
JWT_SECRET=5d3dedb7703c17d0cca507428c5d1affbb19081416525aeaa8847f1f4903068b752a1cb2e46a007fb10e25b01a8bbb96a3c00bfafaacaf6262d265cb420d9d3c
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=1292790d161bb803fb82e765a5ca4163255c58ee587010ab0997c242ef5d5645
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
ALLOWED_ORIGINS=https://your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
TRUST_PROXY=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
```

### If Using MongoDB Atlas:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://luganda-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
JWT_SECRET=5d3dedb7703c17d0cca507428c5d1affbb19081416525aeaa8847f1f4903068b752a1cb2e46a007fb10e25b01a8bbb96a3c00bfafaacaf6262d265cb420d9d3c
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=1292790d161bb803fb82e765a5ca4163255c58ee587010ab0997c242ef5d5645
GOOGLE_CLIENT_ID=573762962600-nr77v5emb2spn7aleg9p2l7c0d6be3a9.apps.googleusercontent.com
ALLOWED_ORIGINS=https://your-site.netlify.app
CLIENT_URL=https://your-site.netlify.app
TRUST_PROXY=true
ENABLE_RATE_LIMITING=true
ENABLE_LOGGING=true
LOG_LEVEL=info
```

---

## 🎯 My Recommendation

**Use MongoDB Atlas** because:
- ✅ Free 512MB (vs Railway's 500MB)
- ✅ Production-ready
- ✅ Better performance
- ✅ Automatic backups
- ✅ Works even if you change hosting providers
- ✅ Easy to scale later

**Setup time:** ~10 minutes

---

## 📝 Quick MongoDB Atlas Setup

### 1. Create Account (2 min)
```
→ Go to https://cloud.mongodb.com
→ Sign up with Google (fastest)
→ Verify email
```

### 2. Create Cluster (3 min)
```
→ Click "Build a Database"
→ Choose "M0 FREE"
→ Provider: AWS
→ Region: us-east-1 (or closest to you)
→ Name: luganda-movies
→ Create
```

### 3. Create User (1 min)
```
→ Database Access → Add New Database User
→ Username: luganda-admin
→ Password: Autogenerate (COPY IT!)
→ Privileges: Read and write to any database
→ Add User
```

### 4. Allow Access (1 min)
```
→ Network Access → Add IP Address
→ Allow Access from Anywhere
→ IP: 0.0.0.0/0
→ Confirm
```

### 5. Get Connection String (1 min)
```
→ Database → Connect
→ Connect your application
→ Copy connection string
→ Replace <password> with your password
→ Add /luganda-movies before the ?
```

### 6. Test Connection (1 min)
```bash
# Test locally first
mongosh "mongodb+srv://luganda-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/luganda-movies"

# If it connects, you're good!
```

### 7. Migrate Data (2 min)
```bash
# Export from local
mongodump --db luganda-movies --out /tmp/backup

# Import to Atlas
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/luganda-movies" /tmp/backup/luganda-movies
```

---

## 🔍 Verify Your MongoDB URL

A correct MongoDB Atlas URL looks like this:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database-name?retryWrites=true&w=majority
```

**Parts explained:**
- `mongodb+srv://` - Protocol (SRV for Atlas)
- `username:password` - Your database user credentials
- `@cluster0.xxxxx.mongodb.net` - Your cluster address
- `/database-name` - Your database name (luganda-movies)
- `?retryWrites=true&w=majority` - Connection options

**Example:**
```
mongodb+srv://luganda-admin:MyPass123@cluster0.abc123.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

---

## ✅ Checklist for MongoDB URL

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster
- [ ] Created database user with password
- [ ] Saved password securely
- [ ] Allowed access from anywhere (0.0.0.0/0)
- [ ] Got connection string
- [ ] Replaced `<password>` with actual password
- [ ] Added `/luganda-movies` database name
- [ ] Tested connection locally
- [ ] Migrated data from local MongoDB
- [ ] Added to Railway as MONGODB_URI variable

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake 1: Forgot to replace `<password>`
```
mongodb+srv://user:<password>@cluster.mongodb.net/  ← WRONG
mongodb+srv://user:MyActualPass123@cluster.mongodb.net/  ← CORRECT
```

### ❌ Mistake 2: Missing database name
```
mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true  ← WRONG
mongodb+srv://user:pass@cluster.mongodb.net/luganda-movies?retryWrites=true  ← CORRECT
```

### ❌ Mistake 3: Special characters in password not encoded
If password has special characters like `@`, `#`, `%`, encode them:
```
@ → %40
# → %23
% → %25
```

Example:
```
Password: MyPass@123
Encoded: MyPass%40123
URL: mongodb+srv://user:MyPass%40123@cluster.mongodb.net/luganda-movies
```

### ❌ Mistake 4: IP not whitelisted
Make sure you added `0.0.0.0/0` in Network Access!

---

## 🧪 Test Your MongoDB URL

### Test Locally Before Adding to Railway:

```bash
# Test connection
mongosh "YOUR_MONGODB_URL_HERE"

# If it connects, run:
show dbs
use luganda-movies
show collections

# If you see your collections, it works!
```

### Test from Railway After Deployment:

```bash
# Using Railway CLI
railway run node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected!')).catch(e => console.error(e))"
```

---

## 📦 Migrate Your Data to Atlas

You have valuable data locally (8 movies, 11 VJs, 16 users). Here's how to migrate:

### Method 1: Using mongodump/mongorestore (Recommended)

```bash
# 1. Export from local MongoDB
mongodump --db luganda-movies --out /tmp/mongodb-backup

# 2. Verify export
ls -la /tmp/mongodb-backup/luganda-movies/

# 3. Import to Atlas (replace with your connection string)
mongorestore --uri "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/luganda-movies" /tmp/mongodb-backup/luganda-movies

# 4. Verify import
mongosh "mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/luganda-movies" --eval "db.lugandamovies.countDocuments()"
```

### Method 2: Using MongoDB Compass (GUI - Easier)

1. **Download MongoDB Compass:**
   - Go to https://www.mongodb.com/products/compass
   - Download and install

2. **Connect to Local MongoDB:**
   - Open Compass
   - Connection string: `mongodb://localhost:27017`
   - Connect

3. **Export Collections:**
   - Select `luganda-movies` database
   - For each collection (lugandamovies, vjs, users):
     - Click collection
     - Collection → Export Collection
     - Format: JSON
     - Save file

4. **Connect to Atlas:**
   - New Connection
   - Paste your Atlas connection string
   - Connect

5. **Import Collections:**
   - Select `luganda-movies` database
   - For each collection:
     - Add Data → Import File
     - Select your exported JSON
     - Import

### Method 3: Re-seed on Railway (Quickest)

If you don't mind re-creating the data:

```bash
# After Railway deploys, run:
railway run npm run seed:vjs
railway run node scripts/seedSampleMovies.js
```

---

## 🎯 Recommended Approach

**For Production (Recommended):**

1. **Use MongoDB Atlas** (10 minutes setup)
2. **Migrate your data** using mongodump/mongorestore (5 minutes)
3. **Add connection string to Railway** (1 minute)
4. **Test connection** (2 minutes)

**Total time:** ~20 minutes

**For Quick Testing:**

1. **Use Railway MongoDB Plugin** (2 minutes setup)
2. **Re-seed data** after deployment (3 minutes)
3. **Test** (2 minutes)

**Total time:** ~7 minutes

---

## 📋 MongoDB Atlas Connection String Template

```
mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
```

**Fill in:**
- `USERNAME` → Your database user (e.g., luganda-admin)
- `PASSWORD` → Your database password (from step 3)
- `CLUSTER` → Your cluster address (e.g., cluster0.abc123)
- `DATABASE` → luganda-movies

**Example:**
```
mongodb+srv://luganda-admin:MySecurePass123@cluster0.abc123.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

---

## 🔐 Security Best Practices

### 1. Strong Password
Use a strong password for MongoDB user:
- At least 16 characters
- Mix of letters, numbers, symbols
- Use Atlas auto-generate feature

### 2. Encode Special Characters
If password has special characters, encode them:
```javascript
// Use this to encode password
node -e "console.log(encodeURIComponent('MyPass@123#'))"
// Output: MyPass%40123%23
```

### 3. Keep Credentials Secret
- ✅ Store in Railway environment variables
- ✅ Never commit to Git
- ✅ Use different passwords for dev/production
- ❌ Don't share connection strings publicly

---

## 🧪 Test Your Setup

### Test 1: Connection String Format
```bash
# Verify format is correct
echo "mongodb+srv://user:pass@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority"

# Check for:
# ✅ Starts with mongodb+srv://
# ✅ Has username:password
# ✅ Has cluster address
# ✅ Has /database-name
# ✅ Has ?retryWrites=true&w=majority
```

### Test 2: Local Connection Test
```bash
# Test connection locally
mongosh "YOUR_MONGODB_ATLAS_URL"

# If successful, you'll see:
# Current Mongosh Log ID: ...
# Connecting to: mongodb+srv://...
# Using MongoDB: 7.0.x
# Using Mongosh: 2.x.x
```

### Test 3: Verify Data After Migration
```bash
# Check collections
mongosh "YOUR_ATLAS_URL" --eval "use luganda-movies; show collections"

# Count documents
mongosh "YOUR_ATLAS_URL" --eval "use luganda-movies; db.lugandamovies.countDocuments()"
mongosh "YOUR_ATLAS_URL" --eval "use luganda-movies; db.vjs.countDocuments()"
mongosh "YOUR_ATLAS_URL" --eval "use luganda-movies; db.users.countDocuments()"
```

---

## 💡 Quick Decision Guide

**Choose Railway MongoDB Plugin if:**
- ✅ You want to test quickly
- ✅ You don't mind re-seeding data
- ✅ You're okay with 500MB limit
- ✅ This is just for testing

**Choose MongoDB Atlas if:**
- ✅ You want production-ready setup
- ✅ You want to keep your existing data
- ✅ You need better performance
- ✅ You want automatic backups
- ✅ You might scale later

**My recommendation:** MongoDB Atlas (worth the extra 10 minutes)

---

## 🎯 Next Steps

### If Using Railway MongoDB Plugin:
1. In Railway: New → Database → Add MongoDB
2. Railway creates `MONGO_URL` variable
3. Add variable: `MONGODB_URI=${{MONGO_URL}}`
4. Deploy
5. Re-seed data using Railway CLI

### If Using MongoDB Atlas:
1. Create Atlas account (2 min)
2. Create free cluster (3 min)
3. Create database user (1 min)
4. Allow access from anywhere (1 min)
5. Get connection string (1 min)
6. Migrate data (5 min)
7. Add to Railway as `MONGODB_URI` (1 min)
8. Deploy

---

## 📞 Need Help?

### MongoDB Atlas Support:
- Docs: https://docs.atlas.mongodb.com
- Support: https://support.mongodb.com

### Railway Support:
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### Test Connection Issues:
```bash
# Check if URL is valid
mongosh "YOUR_URL" --eval "db.version()"

# Check Railway logs
railway logs

# Check MongoDB Atlas logs
# Atlas Dashboard → Metrics → Logs
```

---

## ✅ Summary

**You need a MongoDB URL for Railway. You have 2 options:**

1. **Railway MongoDB Plugin** (Quick - 5 min)
   - One-click setup
   - Auto-configured
   - Good for testing

2. **MongoDB Atlas** (Better - 15 min)
   - Production-ready
   - Free 512MB
   - Keep your data

**I recommend MongoDB Atlas for production!**

**After you get the URL:**
- Add to Railway as `MONGODB_URI` variable
- Deploy
- Test

**Need the URL format?**
```
mongodb+srv://username:password@cluster.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

---

**Status:** Ready to set up MongoDB! 🚀
