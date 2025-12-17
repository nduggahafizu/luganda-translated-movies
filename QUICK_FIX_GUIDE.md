# ⚡ Quick Fix Guide - Backend Not Working

**Issue:** Backend not working due to MongoDB not being connected  
**Status:** MongoDB downloaded ✅ - Ready to install

---

## 🚀 3-Step Quick Fix

### Step 1: Install MongoDB (5 minutes)

1. **Find the MongoDB installer**
   - Check your Downloads folder
   - Look for: `mongodb-windows-x86_64-*.msi`

2. **Run the installer**
   - Double-click the file
   - Choose "Complete" installation
   - ✅ **IMPORTANT:** Check "Install MongoDB as a Service"
   - Click through and install

3. **Verify installation**
   ```cmd
   sc query MongoDB
   ```
   
   Should show: `STATE: 4 RUNNING`

---

### Step 2: Test MongoDB Connection

Run this command from your project root:

```cmd
.\test-mongodb-connection.bat
```

**Expected Output:**
```
🧪 Testing MongoDB Connection...

✅ MongoDB Connected Successfully
✅ Found X collections in database

✅ MongoDB connection test passed!
```

**If you see errors:**
- "MongoDB service not found" → MongoDB not installed as service
- "ECONNREFUSED" → MongoDB service not running, try: `net start MongoDB`

---

### Step 3: Start Your Backend

```cmd
.\start-backend.bat
```

**Look for these success messages:**
```
✅ MongoDB Connected Successfully
📦 Database: mongodb://localhost:27017/luganda-movies
🚀 Server running on port 5000
```

---

## ✅ Verify Everything Works

Open a **NEW terminal** and test:

```cmd
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Luganda Movies API is running",
  "database": {
    "status": "connected"
  }
}
```

---

## 🔧 Common Issues & Quick Fixes

### Issue 1: "Cannot find module" error

**Cause:** Running command from wrong directory

**Fix:** Make sure you're in the project root directory:
```cmd
cd C:\Users\dell\OneDrive\Desktop\unruly
```

Then run the commands again.

---

### Issue 2: MongoDB service not starting

**Fix:**
```cmd
# Open Command Prompt as Administrator
# Then run:
net start MongoDB
```

---

### Issue 3: Port 27017 already in use

**Fix:**
```cmd
# Check what's using the port
netstat -ano | findstr :27017

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Restart MongoDB
net start MongoDB
```

---

### Issue 4: Backend still shows MongoDB warning

**Fix:**
1. Stop backend (Ctrl+C)
2. Make sure MongoDB is running: `sc query MongoDB`
3. If not running: `net start MongoDB`
4. Restart backend: `.\start-backend.bat`

---

## 📝 Quick Commands Reference

```cmd
# Check if MongoDB is installed
sc query MongoDB

# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB

# Test MongoDB connection
.\test-mongodb-connection.bat

# Start backend
.\start-backend.bat

# Test backend health
curl http://localhost:5000/api/health
```

---

## 🎯 What to Expect After Fix

### Before (Current State):
- ⚠️ Backend starts but shows MongoDB warning
- ⚠️ Only session-based features work
- ❌ Movies API doesn't work
- ❌ Database features unavailable

### After (Fixed State):
- ✅ Backend starts with MongoDB connected
- ✅ All features work perfectly
- ✅ Movies API returns data
- ✅ All database features available

---

## 🆘 Still Having Issues?

### Option A: Use the Diagnostic Tool
```cmd
.\diagnose-backend.bat
```

This will check:
- Node.js installation
- npm installation
- Dependencies
- MongoDB service status
- Connection test

### Option B: Check Detailed Guides

1. **MONGODB_POST_INSTALL_GUIDE.md** - Detailed installation steps
2. **BACKEND_DIAGNOSIS_AND_FIX.md** - Complete troubleshooting
3. **WHY_BACKEND_NOT_WORKING.md** - Full explanation

### Option C: Use MongoDB Atlas (Cloud Alternative)

If local MongoDB is giving you trouble:

1. Sign up: https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/luganda-movies
   ```
5. Restart backend

---

## ✨ Success Checklist

After following the steps, verify:

- [ ] MongoDB service is running (`sc query MongoDB` shows RUNNING)
- [ ] Test script passes (`.\test-mongodb-connection.bat`)
- [ ] Backend starts without warnings
- [ ] Health check shows database connected
- [ ] No error messages in terminal

---

## 🎊 You're Done!

Once all checks pass, your backend is fully operational! 🚀

**Next Steps:**
1. Test all API endpoints
2. Integrate with frontend
3. Add movies from TMDB
4. Deploy to production

---

**Remember:** Your backend code is excellent! It just needs MongoDB to unlock all features.
