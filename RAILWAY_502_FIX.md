# 🔧 Railway 502 Error - Quick Fix

**Issue:** Server running on port 8080, but Railway domain configured for port 5000  
**Also:** Redis errors still appearing (old code deployed)

---

## 🎯 Two Issues to Fix

### Issue 1: Port Mismatch
- **Server logs show:** `Server running on port 8080`
- **Railway domain expects:** Port 5000
- **Result:** 502 Bad Gateway

### Issue 2: Old Code Deployed
- Redis errors still appearing
- Should show: `ℹ️ ENABLE_CACHING is not set to true - caching disabled`
- Instead shows: Multiple Redis connection errors

---

## ✅ Solution

### Step 1: Update Railway Domain Port

1. **Go to Railway Dashboard** → Your service
2. Click **"Settings"** tab
3. Find **"Networking"** section
4. Look for your domain: `luganda-translated-movies-production.up.railway.app`
5. Click **"Edit"** or the domain
6. Change port from **5000** to **8080**
7. Click **"Save"**

**OR**

Delete the current domain and regenerate with port **8080**.

---

### Step 2: Add ENABLE_CACHING Variable

1. **Railway Dashboard** → Your service
2. Click **"Variables"** tab
3. Add new variable:
   ```
   ENABLE_CACHING=false
   ```
4. Click **"Add"**

---

### Step 3: Trigger Redeploy

Railway should auto-redeploy after adding the variable. If not:

1. Go to **"Deployments"** tab
2. Click **"Redeploy"** on the latest deployment

---

## 🔍 Alternative: Fix Port in Code (Better Solution)

Instead of changing Railway domain port, let's ensure the server uses Railway's PORT variable:

### Check Railway Variables

Make sure you have:
```env
PORT=5000
```

If Railway sets `PORT=8080` automatically, that's fine. The server should use whatever Railway provides.

### The Issue

Your server.js has:
```javascript
const PORT = process.env.PORT || 5000;
```

This should work, but Railway might be setting PORT=8080. Let's verify:

1. **Railway Dashboard** → Variables
2. Check if `PORT` is set
3. If it's `8080`, change it to `5000`
4. If it's not set, add: `PORT=5000`

---

## 📊 Expected Logs After Fix

After fixing, you should see:

```
ℹ️  ENABLE_CACHING is not set to true - caching disabled
✅ MongoDB Connected Successfully
🚀 Server running on port 5000
📍 Environment: production
```

**No Redis errors!**

---

## 🧪 Test After Fix

```bash
curl https://luganda-translated-movies-production.up.railway.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-22T...",
  "services": {
    "database": {
      "status": "healthy",
      "state": "connected"
    }
  }
}
```

---

## 🎯 Quick Checklist

- [ ] Railway Variables → Add `ENABLE_CACHING=false`
- [ ] Railway Variables → Verify `PORT=5000` (or remove PORT variable)
- [ ] Railway Domain → Update port to match server (5000 or 8080)
- [ ] Wait for redeploy (2-3 minutes)
- [ ] Test health endpoint
- [ ] Verify no Redis errors in logs

---

## 💡 Recommended Approach

**Option A: Use Port 5000 (Recommended)**
1. Set `PORT=5000` in Railway variables
2. Configure domain for port 5000
3. Server will use port 5000

**Option B: Use Port 8080**
1. Remove `PORT` variable (let Railway set it)
2. Configure domain for port 8080
3. Server will use Railway's default port

**I recommend Option A (port 5000) for consistency.**

---

## 🔧 Step-by-Step Fix (Detailed)

### 1. Add ENABLE_CACHING Variable

```
Railway Dashboard
→ Your service
→ Variables tab
→ Click "New Variable"
→ Name: ENABLE_CACHING
→ Value: false
→ Click "Add"
```

### 2. Set PORT Variable

```
Railway Dashboard
→ Your service
→ Variables tab
→ Find PORT variable
→ If exists and is 8080, change to 5000
→ If doesn't exist, add: PORT=5000
→ Click "Add" or "Update"
```

### 3. Update Domain Port

```
Railway Dashboard
→ Your service
→ Settings tab
→ Networking section
→ Find your domain
→ Click domain or "Edit"
→ Change port to 5000
→ Save
```

### 4. Wait for Redeploy

Railway will automatically redeploy. Watch the logs:

```
Railway Dashboard
→ Deployments tab
→ Click latest deployment
→ Watch logs
```

Look for:
```
✅ MongoDB Connected Successfully
🚀 Server running on port 5000
```

### 5. Test

```bash
curl https://luganda-translated-movies-production.up.railway.app/api/health
```

Should return healthy status.

---

## 🚨 If Still Getting 502

### Check Logs for:

1. **Server crashed?**
   - Look for error messages
   - Check MongoDB connection

2. **Port still wrong?**
   - Verify domain port matches server port
   - Check Railway variables

3. **Environment variables missing?**
   - Verify all required variables are set
   - Check for typos

---

## 📝 Summary

**Problem:** Port mismatch (server on 8080, domain expects 5000)  
**Solution:** Set PORT=5000 in Railway variables and update domain port  
**Bonus:** Add ENABLE_CACHING=false to stop Redis errors  

**Time to fix:** ~5 minutes  
**Expected result:** Working API at your Railway URL

---

**Next:** After fixing, update your frontend config.js with the Railway URL!
