# MongoDB Atlas Setup Instructions

## Your MongoDB Connection Details

**Connection String:**
```
mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

**Database Name:** `luganda-movies`

## Step-by-Step Setup

### Step 1: Update .env File

Since .env files cannot be edited directly in VS Code with this extension, you need to manually update it:

1. Open `server/.env` file in VS Code
2. Find the line with `MONGODB_URI`
3. Replace it with:
   ```
   MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority
   ```
4. Save the file

**OR** you can copy the `.env.example` file:
```bash
cd server
copy .env.example .env
```

### Step 2: Whitelist Your IP Address in MongoDB Atlas

1. Go to https://cloud.mongodb.com/
2. Log in with your account
3. Select your cluster (hafithu67)
4. Click on "Network Access" in the left sidebar
5. Click "Add IP Address"
6. Choose one of:
   - **Add Current IP Address** (recommended for development)
   - **Allow Access from Anywhere** (0.0.0.0/0) - less secure but easier

### Step 3: Verify Database User

1. In MongoDB Atlas, click "Database Access"
2. Verify user `nduggahafizu67` exists
3. Verify it has "Read and write to any database" permissions
4. If password is incorrect, click "Edit" and update it

### Step 4: Install Node.js (If Not Installed)

1. Download from: https://nodejs.org/
2. Install LTS version
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 5: Install Dependencies

```bash
cd server
npm install
```

This will install all required packages including:
- mongoose (MongoDB driver)
- express (web server)
- axios (HTTP client)
- dotenv (environment variables)
- And more...

### Step 6: Test MongoDB Connection

```bash
cd server
node tests/testMongoDB.js
```

**Expected Output:**
```
🧪 Testing MongoDB Connection...

Connecting to MongoDB Atlas...
URI: mongodb+srv://nduggahafizu67:****@hafithu67.nyi9cp3.mongodb.net/luganda-movies
✅ Successfully connected to MongoDB Atlas!

Testing database operations...
✅ Found 0 collections in database

✅ MongoDB connection test passed!

Connection closed.
```

### Step 7: Seed VJ Database

Once connection is successful, seed the database with VJ data:

```bash
cd server
node seeds/vjSeeder.js
```

**Expected Output:**
```
Connected to MongoDB
Creating VJ VJ Junior...
Creating VJ VJ Ice P...
Creating VJ VJ Emmy...
... (11 VJs total)

✅ Successfully seeded 11 VJs!

VJ Summary:
- Verified: 7
- Featured: 5
- Popular: 6
- Active: 11

Seeded VJs:
1. VJ Junior - action, thriller, sci-fi, adventure
2. VJ Ice P - action, martial-arts, drama, asian-cinema
3. VJ Emmy - romance, comedy, drama, family
... (and more)
```

### Step 8: Test TMDB Integration

```bash
cd server
node tests/testTMDB.js
```

This will test the TMDB API integration.

### Step 9: Start the Server

```bash
cd server
node server.js
```

**Expected Output:**
```
Server running on port 5000
MongoDB connected successfully
```

## Troubleshooting

### Error: "Authentication failed"

**Solution:**
1. Verify password is correct: `nduggahaf67`
2. Go to MongoDB Atlas > Database Access
3. Edit user and reset password if needed
4. Update `.env` file with new password

### Error: "IP not whitelisted"

**Solution:**
1. Go to MongoDB Atlas > Network Access
2. Click "Add IP Address"
3. Add your current IP or allow all (0.0.0.0/0)

### Error: "Cannot find module"

**Solution:**
```bash
cd server
npm install
```

### Error: "MONGODB_URI not found"

**Solution:**
1. Verify `.env` file exists in `server/` directory
2. Verify it contains the MONGODB_URI line
3. Restart your terminal/command prompt

## Verify Everything Works

After setup, you should be able to:

1. ✅ Connect to MongoDB Atlas
2. ✅ See 11 VJs in database
3. ✅ Query VJs through API
4. ✅ Search movies via TMDB
5. ✅ Start the server successfully

## Next Steps

Once MongoDB is connected and VJs are seeded:

1. **Test API Endpoints:**
   ```bash
   # Get all VJs
   curl http://localhost:5000/api/vjs
   
   # Get VJ by slug
   curl http://localhost:5000/api/vjs/vj-junior
   ```

2. **Start Frontend:**
   ```bash
   # In project root
   python -m http.server 8000
   # Or
   npx http-server -p 8000
   ```

3. **Open in Browser:**
   - Frontend: http://localhost:8000
   - Backend API: http://localhost:5000

## MongoDB Atlas Dashboard

Access your database at:
https://cloud.mongodb.com/

You can:
- View collections
- Browse documents
- Monitor performance
- Manage users
- Configure network access

## Security Recommendations

After development:

1. **Change Password:**
   - Use a strong, unique password
   - Update `.env` file

2. **Restrict IP Access:**
   - Remove "Allow from Anywhere"
   - Add only specific IPs

3. **Use Environment Variables:**
   - Never commit `.env` to Git
   - Use different credentials for production

4. **Enable Monitoring:**
   - Set up alerts in MongoDB Atlas
   - Monitor connection attempts

---

**Your MongoDB Atlas Cluster:** hafithu67.nyi9cp3.mongodb.net
**Database:** luganda-movies
**User:** nduggahafizu67
**Status:** Ready to use ✅
