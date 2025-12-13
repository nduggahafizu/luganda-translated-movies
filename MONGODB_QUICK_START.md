# 🚀 MongoDB Quick Start - 5 Minutes Setup

**Get your Luganda Movies backend fully operational with MongoDB in 5 minutes!**

---

## Option 1: Automated Setup (Recommended) ⚡

### Step 1: Run the Setup Script
```bash
.\setup-mongodb-atlas.bat
```

### Step 2: Follow the Prompts
1. The script will open MongoDB Atlas signup page
2. Create a FREE account (no credit card needed)
3. Copy your connection string
4. Paste it when prompted
5. Done! ✅

---

## Option 2: Manual Setup (5 Steps) 📝

### 1️⃣ Create MongoDB Atlas Account
- Go to: https://www.mongodb.com/cloud/atlas/register
- Sign up with Google (fastest) or email
- **FREE forever** - No credit card required

### 2️⃣ Create Free Cluster
- Click "Build a Database"
- Choose **M0 FREE** (512MB)
- Select region closest to you
- Click "Create"
- Wait 2-3 minutes

### 3️⃣ Create Database User
- Username: `luganda_admin`
- Password: Create a strong password
- **Save these credentials!**

### 4️⃣ Whitelist IP Address
- Click "Network Access"
- Click "Add IP Address"
- Add: `0.0.0.0/0` (allows all IPs for development)
- Click "Confirm"

### 5️⃣ Get Connection String
- Click "Connect" on your cluster
- Choose "Drivers"
- Copy the connection string
- Replace `<password>` with your password
- Add `/luganda-movies` before the `?`

**Example:**
```
mongodb+srv://luganda_admin:YourPassword@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

---

## 📝 Update .env File

Create or update `server/.env`:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://luganda_admin:YourPassword@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret (change this!)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Session Secret (change this!)
SESSION_SECRET=your-super-secret-session-key-min-32-characters-long
```

---

## ✅ Test Connection

### Start the Server:
```bash
.\start-backend.bat
```

### Check for Success:
Look for this message:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 Server running on port 5000
```

### Test with Curl:
```bash
curl.exe http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Luganda Movies API is running",
  "database": "connected"
}
```

---

## 🎯 What's Next?

### 1. Seed Initial Data (Optional)
```bash
cd server
node seeds/vjSeeder.js
cd ..
```

### 2. Test All Endpoints
```bash
.\test-backend-api.bat
```

### 3. Start Building!
Your backend is now fully operational with:
- ✅ MongoDB database connected
- ✅ All APIs working
- ✅ Session management
- ✅ Data persistence

---

## 🆘 Troubleshooting

### "Authentication Failed"
- Check username and password in connection string
- Ensure no special characters in password (or URL encode them)

### "Connection Timeout"
- Verify IP `0.0.0.0/0` is whitelisted
- Check internet connection
- Wait a few minutes for cluster to be ready

### "Cannot Connect"
- Ensure connection string has `/luganda-movies` before `?`
- Check for typos in connection string
- Verify cluster is running (green status in Atlas)

### Still Having Issues?
Run the troubleshooting script:
```bash
.\fix-mongodb.bat
```

Or check the detailed guide:
```
MONGODB_ATLAS_SETUP_GUIDE.md
```

---

## 💡 Pro Tips

1. **Save Your Credentials:** Store username/password securely
2. **Backup Connection String:** Keep a copy in a safe place
3. **Monitor Usage:** Check Atlas dashboard for storage/connection limits
4. **Upgrade Later:** Free tier is perfect for development, upgrade when needed

---

## 📊 Free Tier Limits

✅ **What You Get FREE:**
- 512MB storage (enough for thousands of movies)
- Shared RAM & CPU
- Automatic backups
- SSL/TLS encryption
- No credit card required
- No time limit

---

## 🎬 Ready to Go!

Your MongoDB is now set up! Your Luganda Movies platform can now:
- ✅ Store movies in database
- ✅ Manage user data
- ✅ Handle authentication
- ✅ Process payments
- ✅ Track watch progress
- ✅ Manage playlists

**Start building amazing features! 🚀🇺🇬**
