# 🍃 MongoDB Atlas Setup Guide for Luganda Movies

**Quick Setup:** Follow these steps to set up a FREE MongoDB Atlas cloud database (512MB free forever)

---

## 📋 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account

1. **Go to MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Click "Try Free" or "Sign Up"

2. **Sign Up Options:**
   - Use Google account (fastest)
   - Or use email and create password

3. **Complete Registration:**
   - Verify your email if using email signup
   - Answer the welcome questions (optional)

---

### Step 2: Create a Free Cluster

1. **Choose Deployment Type:**
   - Select **"M0 FREE"** (512MB storage, free forever)
   - ✅ No credit card required

2. **Select Cloud Provider & Region:**
   - **Provider:** AWS (recommended) or Google Cloud
   - **Region:** Choose closest to you or Uganda:
     - `eu-west-1` (Ireland) - Good for Europe/Africa
     - `us-east-1` (Virginia) - Good for Americas
     - `ap-southeast-1` (Singapore) - Good for Asia

3. **Cluster Name:**
   - Keep default or name it: `luganda-movies-cluster`

4. **Click "Create Deployment"**
   - Wait 1-3 minutes for cluster creation

---

### Step 3: Create Database User

1. **Security Quickstart will appear:**
   - **Username:** Create a username (e.g., `luganda_admin`)
   - **Password:** Create a strong password
   - ⚠️ **IMPORTANT:** Save these credentials securely!

2. **Click "Create Database User"**

---

### Step 4: Set Up Network Access

1. **Add IP Address:**
   - Click "Add My Current IP Address" (for development)
   - **For production:** Add `0.0.0.0/0` (allow from anywhere)
   - ⚠️ Note: `0.0.0.0/0` allows all IPs (use with authentication)

2. **Click "Finish and Close"**

---

### Step 5: Get Connection String

1. **Click "Connect" on your cluster**

2. **Choose Connection Method:**
   - Select "Drivers"
   - Driver: **Node.js**
   - Version: **5.5 or later**

3. **Copy Connection String:**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

4. **Replace placeholders:**
   - Replace `<username>` with your database username
   - Replace `<password>` with your database password
   - Add database name: `/luganda-movies` before the `?`

   **Final format:**
   ```
   mongodb+srv://luganda_admin:YourPassword123@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority
   ```

---

### Step 6: Update Your .env File

1. **Open or create:** `server/.env`

2. **Add your connection string:**
   ```env
   # MongoDB Atlas Connection
   MONGODB_URI=mongodb+srv://luganda_admin:YourPassword123@cluster0.xxxxx.mongodb.net/luganda-movies?retryWrites=true&w=majority

   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # JWT Secret (generate a random string)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # Session Secret (generate a random string)
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   ```

3. **Save the file**

---

### Step 7: Test Connection

1. **Restart your backend server:**
   ```bash
   .\start-backend.bat
   ```

2. **Check for success message:**
   ```
   ✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
   ```

3. **Test with curl:**
   ```bash
   curl.exe http://localhost:5000/api/health
   ```

   **Expected response:**
   ```json
   {
     "status": "success",
     "message": "Luganda Movies API is running",
     "database": "connected"
   }
   ```

---

## 🎯 Quick Setup Script

I'll create an automated setup script for you. Just run:

```bash
.\setup-mongodb-atlas.bat
```

This will:
1. Check if .env exists
2. Prompt for MongoDB connection string
3. Update .env file
4. Test connection
5. Restart server

---

## 🔒 Security Best Practices

### 1. **Protect Your Credentials**
   - ✅ Never commit `.env` file to Git
   - ✅ Use strong passwords
   - ✅ Rotate credentials regularly

### 2. **Network Security**
   - For development: Use your current IP
   - For production: Use `0.0.0.0/0` with strong authentication

### 3. **Database User Permissions**
   - Create separate users for different environments
   - Use read-only users where possible

---

## 📊 MongoDB Atlas Features (Free Tier)

✅ **Included in Free Tier:**
- 512MB storage
- Shared RAM
- Shared vCPU
- No credit card required
- Automatic backups (limited)
- SSL/TLS encryption
- MongoDB Compass access
- Atlas Search (limited)

---

## 🛠️ Troubleshooting

### Issue 1: "Authentication Failed"
**Solution:**
- Check username and password are correct
- Ensure password doesn't contain special characters (or URL encode them)
- Verify database user was created

### Issue 2: "Connection Timeout"
**Solution:**
- Check IP whitelist in Network Access
- Verify internet connection
- Try adding `0.0.0.0/0` temporarily

### Issue 3: "Database Not Found"
**Solution:**
- MongoDB will create the database automatically on first write
- Ensure database name is in connection string: `/luganda-movies`

### Issue 4: "Too Many Connections"
**Solution:**
- Free tier has connection limits
- Close unused connections
- Implement connection pooling (already done in our code)

---

## 📱 MongoDB Compass (Optional GUI)

**Download MongoDB Compass:**
1. Visit: https://www.mongodb.com/try/download/compass
2. Download and install
3. Connect using your connection string
4. View and manage data visually

---

## 🚀 Next Steps After Setup

Once MongoDB is connected:

1. **Seed Initial Data:**
   ```bash
   cd server
   node seeds/vjSeeder.js
   ```

2. **Test All Endpoints:**
   ```bash
   .\test-backend-api.bat
   ```

3. **View Data in Atlas:**
   - Go to Atlas Dashboard
   - Click "Browse Collections"
   - See your data

---

## 💡 Alternative: Local MongoDB (Advanced)

If you prefer local installation:

1. **Download MongoDB Community:**
   - https://www.mongodb.com/try/download/community
   - Choose Windows, latest version

2. **Install:**
   - Run installer
   - Choose "Complete" installation
   - Install as Windows Service

3. **Update .env:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/luganda-movies
   ```

4. **Start MongoDB:**
   ```bash
   net start MongoDB
   ```

---

## 📞 Support

**MongoDB Atlas Support:**
- Documentation: https://docs.atlas.mongodb.com/
- Community Forums: https://www.mongodb.com/community/forums/
- University (Free Courses): https://university.mongodb.com/

**Need Help?**
- Check server logs for detailed error messages
- Run `.\fix-mongodb.bat` for automated troubleshooting
- Review MONGODB_SETUP.md for additional guidance

---

## ✅ Verification Checklist

Before proceeding, ensure:

- [ ] MongoDB Atlas account created
- [ ] Free cluster deployed
- [ ] Database user created with password
- [ ] IP address whitelisted (0.0.0.0/0 for development)
- [ ] Connection string copied
- [ ] .env file updated with connection string
- [ ] Server restarted
- [ ] Connection successful (check server logs)
- [ ] Health check returns "database": "connected"

---

**Your MongoDB Atlas database is now ready for Luganda Movies! 🎬🇺🇬**
