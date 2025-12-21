# 🎬 Run Movie Seeder - Import 12 Movies to Database

**Created:** Movie seeder script ready  
**Location:** `server/seeds/movieSeeder.js`  
**Purpose:** Import 12 sample movies to MongoDB database

---

## 🚀 Quick Start (3 Methods)

### **Method 1: Using Railway CLI** ⭐ Recommended

```bash
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Run the seeder
railway run npm run seed:movies
```

**Expected output:**
```
🌱 Starting movie seeder...
📦 Connecting to MongoDB...
✅ Connected to MongoDB
📍 Database: luganda-movies

📊 Current movies in database: 0

🎬 Importing 12 sample movies...

✅ [1/12] Lokah - Imported
✅ [2/12] Running Man - Imported
✅ [3/12] Kantara - Imported
✅ [4/12] Frankenstein - Imported
✅ [5/12] Predator: Badlands - Imported
✅ [6/12] Fist of Fury - Imported
✅ [7/12] War Season 1 - Imported
✅ [8/12] War Season 2 - Imported
✅ [9/12] War Season 3 - Imported
✅ [10/12] War Season 4 - Imported
✅ [11/12] Fast & Furious 9 - Imported
✅ [12/12] Black Panther - Imported

═══════════════════════════════════════
📊 SEEDING COMPLETE
═══════════════════════════════════════
✅ Successfully imported: 12 movies

📦 Total movies in database: 12

📋 Sample of imported movies:
   - Lokah (VJ Ice P, 2023) - 25420 views
   - Running Man (VJ Ice P, 2013) - 18900 views
   - Kantara (VJ Ice P, 2022) - 32100 views

🎉 Movie seeding completed successfully!

🔍 Verify by visiting:
   https://luganda-translated-movies-production.up.railway.app/api/luganda-movies

🌐 Your website will now show real data from the backend!
   https://watch.unrulymovies.com

🔌 Database connection closed
```

---

### **Method 2: Using Railway Dashboard**

1. **Go to Railway Dashboard:** https://railway.app
2. **Click your backend service**
3. **Go to "Settings" tab**
4. **Scroll to "Deploy"** section
5. **Click "Run Command"** or use the terminal
6. **Enter:** `npm run seed:movies`
7. **Press Enter** and watch the output

---

### **Method 3: Create Temporary Seed Endpoint**

If Railway CLI doesn't work, I can create an API endpoint to trigger seeding:

**Add to your backend:**
```javascript
// Temporary seed endpoint (remove after use)
app.post('/api/admin/seed-movies', async (req, res) => {
    // Run seeder logic
    // Return results
});
```

Then call it:
```bash
curl -X POST https://luganda-translated-movies-production.up.railway.app/api/admin/seed-movies
```

---

## 📋 What Gets Imported

### **12 Movies Total:**

1. **Lokah** (VJ Ice P, 2023) - 25.4K views
2. **Running Man** (VJ Ice P, 2013) - 18.9K views
3. **Kantara** (VJ Ice P, 2022) - 32.1K views
4. **Frankenstein** (VJ Ice P, 2015) - 14.2K views
5. **Predator: Badlands** (VJ Ice P, 2025) - 28.5K views
6. **Fist of Fury** (VJ Ice P, 1972) - 21.5K views
7. **War Season 1** (VJ Soul, 2024) - 35.6K views
8. **War Season 2** (VJ Soul, 2024) - 32.4K views
9. **War Season 3** (VJ Soul, 2024) - 29.8K views
10. **War Season 4** (VJ Soul, 2024) - 38.9K views
11. **Fast & Furious 9** (VJ Junior, 2021) - 15.4K views
12. **Black Panther** (VJ Emmy, 2018) - 28.4K views

### **Movie Details Include:**
- ✅ Original and Luganda titles
- ✅ VJ translator information
- ✅ Year, duration, director
- ✅ Genres and descriptions
- ✅ Ratings (IMDB, user, translation)
- ✅ Video quality (HD, 4K)
- ✅ Poster images
- ✅ View counts
- ✅ Featured/trending flags

---

## 🔄 If Movies Already Exist

The seeder checks if movies exist and asks for confirmation:

```
⚠️  WARNING: Database already has movies!

Options:
1. Keep existing movies (do nothing)
2. Delete all and reseed (run with --force flag)

To force reseed: npm run seed:movies -- --force
```

**To force reseed:**
```bash
railway run npm run seed:movies -- --force
```

---

## ✅ Verification After Seeding

### **Step 1: Check Backend API**

```bash
curl https://luganda-translated-movies-production.up.railway.app/api/luganda-movies
```

**Expected response:**
```json
{
  "success": true,
  "count": 12,
  "total": 12,
  "data": [
    {
      "_id": "...",
      "originalTitle": "Lokah",
      "vjName": "VJ Ice P",
      "year": 2023,
      "views": 25420,
      ...
    },
    ...
  ]
}
```

### **Step 2: Check Your Website**

1. Open: https://watch.unrulymovies.com
2. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
3. Open DevTools (F12) → Console
4. Look for: "Loaded X movies from backend"
5. Verify movies are showing (not sample data)

### **Step 3: Verify in MongoDB Atlas**

1. Go to: https://cloud.mongodb.com
2. Click "Browse Collections"
3. Select `luganda-movies` database
4. Click `lugandamovies` collection
5. Should see 12 documents

---

## 🐛 Troubleshooting

### **Issue: "Cannot connect to MongoDB"**

**Solution:**
- Verify MONGODB_URI is set in Railway variables
- Check MongoDB Atlas network access (0.0.0.0/0)
- Verify database user credentials

### **Issue: "Duplicate key error"**

**Solution:**
Movies already exist. Use --force flag:
```bash
railway run npm run seed:movies -- --force
```

### **Issue: "Railway CLI not found"**

**Solution:**
Install Railway CLI:
```bash
npm install -g @railway/cli
railway login
railway link
```

### **Issue: "Permission denied"**

**Solution:**
Make sure you're linked to the correct Railway project:
```bash
railway link
# Select your project from the list
```

---

## 📊 After Seeding

### **Backend Response Changes:**

**Before:**
```json
{
  "count": 0,
  "data": []
}
```

**After:**
```json
{
  "count": 12,
  "data": [12 movies...]
}
```

### **Frontend Behavior Changes:**

**Before:**
```javascript
// API returns empty, shows sample data
renderMovies(SAMPLE_LUGANDA_MOVIES);
```

**After:**
```javascript
// API returns 12 movies, shows real data
renderMovies(latestMovies);  // Real data from backend!
```

---

## 🎯 Next Steps After Seeding

### **1. Disable Sample Data Fallback**

Update `js/config.js`:
```javascript
ENABLE_SAMPLE_DATA: false,  // Disable sample data
```

This ensures the website only shows real data from backend.

### **2. Verify Website**

- Refresh https://watch.unrulymovies.com
- Check that movies are loading from backend
- Verify view counts match database
- Test movie playback

### **3. Add More Movies**

You can add more movies via:
- API POST endpoint
- MongoDB Compass
- Admin panel (if you create one)
- Additional seeder scripts

---

## 💡 Pro Tips

### **1. Seed Both VJs and Movies**

```bash
# Seed everything at once
railway run npm run seed:all
```

This runs both VJ and movie seeders.

### **2. Check Logs**

```bash
# View Railway logs while seeding
railway logs
```

### **3. Verify Data**

```bash
# Count movies
railway run node -e "require('./models/LugandaMovie').countDocuments().then(console.log)"
```

### **4. Reset Database**

```bash
# Delete all movies and reseed
railway run npm run seed:movies -- --force
```

---

## 📝 Summary

**Created:**
- ✅ `server/seeds/movieSeeder.js` - Seeder script
- ✅ `npm run seed:movies` - Package script
- ✅ `npm run seed:all` - Seed VJs + Movies

**To Run:**
```bash
railway run npm run seed:movies
```

**Result:**
- ✅ 12 movies imported to database
- ✅ Website shows real data
- ✅ No more sample data fallback

**Time:** ~2 minutes to run

---

## 🎉 Ready to Seed!

**Command:**
```bash
railway run npm run seed:movies
```

**After seeding, your website will show real data from the backend!** 🚀

---

**Status:** ✅ READY TO RUN  
**Next:** Run the command above to import movies
