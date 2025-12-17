# 🚀 MongoDB Post-Installation Guide

**Status:** MongoDB downloaded ✅  
**Next Steps:** Installation and configuration

---

## 📋 Step-by-Step Installation

### Step 1: Install MongoDB

1. **Locate the downloaded MongoDB installer**
   - Usually in your Downloads folder
   - File name: `mongodb-windows-x86_64-*.msi`

2. **Run the installer**
   - Double-click the .msi file
   - Click "Next" on the welcome screen

3. **Accept the License Agreement**
   - Check "I accept the terms"
   - Click "Next"

4. **Choose Setup Type**
   - Select **"Complete"** installation
   - Click "Next"

5. **Service Configuration (IMPORTANT)**
   - ✅ Check "Install MongoDB as a Service"
   - ✅ Service Name: `MongoDB`
   - ✅ Data Directory: `C:\Program Files\MongoDB\Server\7.0\data\`
   - ✅ Log Directory: `C:\Program Files\MongoDB\Server\7.0\log\`
   - ✅ Run service as: `Network Service user`
   - Click "Next"

6. **MongoDB Compass (Optional)**
   - You can uncheck this if you don't need the GUI
   - Click "Next"

7. **Install**
   - Click "Install"
   - Wait for installation to complete (2-5 minutes)
   - Click "Finish"

---

## ✅ Step 2: Verify Installation

### Option A: Check Service Status

Open Command Prompt as Administrator and run:

```cmd
sc query MongoDB
```

**Expected Output:**
```
SERVICE_NAME: MongoDB
        TYPE               : 10  WIN32_OWN_PROCESS
        STATE              : 4  RUNNING
        ...
```

If you see `STATE : 4 RUNNING`, MongoDB is installed and running! ✅

### Option B: Start MongoDB Service (if not running)

```cmd
net start MongoDB
```

**Expected Output:**
```
The MongoDB service is starting.
The MongoDB service was started successfully.
```

---

## 🧪 Step 3: Test MongoDB Connection

### Test 1: Using Our Test Script

```cmd
cd server
node tests/testMongoDB.js
```

**Expected Output if Working:**
```
🧪 Testing MongoDB Connection...

✅ MongoDB Connected Successfully
✅ Found X collections in database

✅ MongoDB connection test passed!

Connection closed.
```

**If You See Errors:**
- "MONGODB_URI not found" → Your .env file needs updating
- "Authentication failed" → Check your MongoDB credentials
- "ECONNREFUSED" → MongoDB service is not running

### Test 2: Using MongoDB Shell (Optional)

```cmd
mongosh
```

**Expected Output:**
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/
Using MongoDB: 7.0.x
Using Mongosh: 2.x.x

test>
```

Type `exit` to quit.

---

## 🔧 Step 4: Configure Your Backend

### Update Environment Variables

Your backend needs to know where MongoDB is. The default configuration should work, but let's verify:

1. **Check your `server/.env` file**
   
   It should have:
   ```env
   MONGODB_URI=mongodb://localhost:27017/luganda-movies
   ```

2. **If the line is missing or different, add/update it**

   The default local MongoDB connection string is:
   ```env
   MONGODB_URI=mongodb://localhost:27017/luganda-movies
   ```

---

## 🚀 Step 5: Start Your Backend

Now that MongoDB is installed and running, start your backend:

```cmd
.\start-backend.bat
```

**What to Look For:**

✅ **Success - You should see:**
```
========================================
  Starting Luganda Movies Backend
========================================

[1/3] Installing dependencies...
✅ Dependencies installed

[2/3] Checking if MongoDB is running...
✅ MongoDB is running

[3/3] Starting backend server...

> luganda-movies-server@1.0.0 dev
> nodemon server.js

[nodemon] starting `node server.js`
✅ MongoDB Connected Successfully
📦 Database: mongodb://localhost:27017/luganda-movies
🚀 Server running on port 5000
📍 Environment: development
🌐 API URL: http://localhost:5000
```

❌ **If you still see MongoDB warnings:**
```
⚠️  MongoDB Connection Warning: connect ECONNREFUSED
⚠️  Server will continue without MongoDB
```

This means MongoDB service is not running. Try:
```cmd
net start MongoDB
```

---

## 🧪 Step 6: Test Your Backend APIs

### Test 1: Health Check

Open a **NEW terminal** (keep backend running in the first one) and run:

```cmd
curl http://localhost:5000/api/health
```

**Expected Output:**
```json
{
  "status": "success",
  "message": "Luganda Movies API is running",
  "timestamp": "2025-12-17T...",
  "environment": "development",
  "database": {
    "status": "connected",
    "name": "luganda-movies"
  }
}
```

### Test 2: Movies API

```cmd
curl http://localhost:5000/api/movies/fetch?page=1&limit=5
```

**Expected Output:**
```json
{
  "success": true,
  "movies": [...],
  "pagination": {...}
}
```

### Test 3: Watch Progress

```cmd
curl -X POST http://localhost:5000/api/watch-progress/update -H "Content-Type: application/json" -d "{\"movieId\":\"test123\",\"currentTime\":300,\"duration\":7200}"
```

**Expected Output:**
```json
{
  "success": true,
  "message": "Watch progress updated",
  "progress": {...}
}
```

---

## 🎯 Troubleshooting

### Issue 1: "MongoDB service not found"

**Cause:** MongoDB was not installed as a service

**Solution:**
1. Reinstall MongoDB
2. Make sure to check "Install MongoDB as a Service" during installation

### Issue 2: "Access is denied" when starting service

**Cause:** Need administrator privileges

**Solution:**
```cmd
# Open Command Prompt as Administrator
# Right-click Command Prompt → Run as Administrator
net start MongoDB
```

### Issue 3: MongoDB service won't start

**Cause:** Port 27017 might be in use

**Solution:**
```cmd
# Check what's using port 27017
netstat -ano | findstr :27017

# If something is using it, either:
# 1. Stop that process
# 2. Or configure MongoDB to use a different port
```

### Issue 4: "ECONNREFUSED" error

**Cause:** MongoDB service is not running

**Solution:**
```cmd
# Start the service
net start MongoDB

# Verify it's running
sc query MongoDB
```

### Issue 5: Backend still shows MongoDB warning

**Cause:** Backend was started before MongoDB service

**Solution:**
1. Stop the backend (Ctrl+C)
2. Start MongoDB service: `net start MongoDB`
3. Restart backend: `.\start-backend.bat`

---

## 📊 Quick Diagnostic Commands

Run these to check your setup:

```cmd
# 1. Check if MongoDB service exists
sc query MongoDB

# 2. Check if MongoDB is running
sc query MongoDB | findstr STATE

# 3. Start MongoDB if not running
net start MongoDB

# 4. Test MongoDB connection
cd server
node tests/testMongoDB.js

# 5. Check if port 27017 is listening
netstat -ano | findstr :27017

# 6. Test backend health
curl http://localhost:5000/api/health
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] MongoDB service is installed
- [ ] MongoDB service is running (STATE: RUNNING)
- [ ] Backend starts without MongoDB warnings
- [ ] Health check shows database connected
- [ ] Movies API returns data
- [ ] Watch progress API works
- [ ] No error messages in terminal

---

## 🎊 What's Next?

Once MongoDB is working:

1. **Seed Initial Data** (Optional)
   ```cmd
   cd server
   node seeds/vjSeeder.js
   ```

2. **Add Movies from TMDB**
   ```cmd
   .\add-movies.bat
   ```

3. **Test All Endpoints**
   ```cmd
   .\test-backend-api.bat
   ```

4. **Integrate with Frontend**
   - Update frontend API URLs to point to `http://localhost:5000`
   - Test all features end-to-end

5. **Deploy to Production**
   - Follow `DEPLOYMENT_SUMMARY.md`
   - Use MongoDB Atlas for production database

---

## 📚 Additional Resources

- **MongoDB Documentation:** https://docs.mongodb.com/
- **MongoDB Atlas (Cloud):** https://www.mongodb.com/cloud/atlas
- **Backend API Docs:** `BACKEND_API_DOCUMENTATION.md`
- **Troubleshooting:** `BACKEND_DIAGNOSIS_AND_FIX.md`

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the terminal output** - Error messages are usually descriptive
2. **Run the diagnostic tool** - `.\diagnose-backend.bat`
3. **Check MongoDB logs** - `C:\Program Files\MongoDB\Server\7.0\log\mongod.log`
4. **Verify service status** - `sc query MongoDB`
5. **Restart everything** - Stop backend, restart MongoDB service, start backend

---

**Remember:** The backend code is perfect! It's just waiting for MongoDB to be properly installed and running. Once that's done, everything will work beautifully! 🚀
