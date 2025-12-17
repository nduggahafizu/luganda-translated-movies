# 📥 Kp Sounds Watch Import Guide

**Import all latest movies and VJs from watch.kpsounds.com into your database**

---

## 🚀 Quick Start

### Option 1: Using Batch File (Easiest)

```bash
.\import-from-kpsounds.bat
```

Then choose:
1. Import everything (VJs + Movies + Trending) - **RECOMMENDED**
2. Import VJs only
3. Import Movies only
4. Update Trending status

### Option 2: Using Command Line

```bash
cd server
node scripts/importFromKpSounds.js all 50
```

---

## 📋 Available Commands

### 1. Import Everything (Recommended)

```bash
node scripts/importFromKpSounds.js all 50
```

**What it does:**
- ✅ Scrapes all VJs from watch.kpsounds.com
- ✅ Imports up to 50 movies per VJ
- ✅ Updates trending status for popular movies
- ✅ Updates VJ statistics

**Time:** ~5-10 minutes (depending on number of VJs)

---

### 2. Import VJs Only

```bash
node scripts/importFromKpSounds.js vjs
```

**What it does:**
- ✅ Scrapes all VJ names and profiles
- ✅ Creates VJ records in database
- ✅ Skips existing VJs

**Time:** ~1-2 minutes

---

### 3. Import Movies Only

```bash
node scripts/importFromKpSounds.js movies 50
```

**What it does:**
- ✅ Imports movies for all VJs in database
- ✅ Up to 50 movies per VJ (adjustable)
- ✅ Skips existing movies
- ✅ Updates VJ statistics

**Time:** ~5-10 minutes

**Note:** VJs must be imported first!

---

### 4. Update Trending Status

```bash
node scripts/importFromKpSounds.js trending 20
```

**What it does:**
- ✅ Scrapes trending movies from Kp Sounds
- ✅ Marks them as trending in your database
- ✅ Updates view counts

**Time:** ~1 minute

---

## 🎯 Recommended Workflow

### First Time Setup

```bash
# Step 1: Import VJs
.\import-from-kpsounds.bat
# Choose option 2

# Step 2: Import Movies
.\import-from-kpsounds.bat
# Choose option 3

# Step 3: Update Trending
.\import-from-kpsounds.bat
# Choose option 4
```

### Regular Updates (Daily/Weekly)

```bash
# Import everything (will skip duplicates)
.\import-from-kpsounds.bat
# Choose option 1
```

---

## 📊 What Gets Imported

### VJ Information

```javascript
{
  name: "VJ Ice P",
  slug: "vj-ice-p",
  bio: "Professional Luganda movie translator from Uganda",
  profileImage: "...",
  socialMedia: {
    kpSounds: "https://watch.kpsounds.com/category/vj-ice-p"
  },
  stats: {
    totalMovies: 0,
    totalViews: 0,
    averageRating: 0
  },
  verified: true,
  active: true
}
```

### Movie Information

```javascript
{
  originalTitle: "Fast & Furious 9",
  lugandaTitle: "Fast & Furious 9 (Luganda)",
  vjName: "VJ Junior",
  vjId: "vj-junior",
  description: "...",
  year: 2021,
  duration: 120,
  rating: {
    imdb: 5.2,
    userRating: 5.2,
    translationRating: 4.5
  },
  genres: ["action"],
  poster: "...",
  video: {
    originalVideoPath: "/videos/...",
    quality: "hd"
  },
  hosting: {
    provider: "custom",
    url: "...",
    streamUrl: "https://watch.kpsounds.com/..."
  },
  status: "published",
  translationDate: "2024-12-17T..."
}
```

---

## ⚙️ Configuration

### Adjust Movies Per VJ

```bash
# Import 100 movies per VJ instead of 50
node scripts/importFromKpSounds.js movies 100
```

### Adjust Trending Limit

```bash
# Get top 50 trending movies
node scripts/importFromKpSounds.js trending 50
```

---

## 🔍 Monitoring Progress

The script provides real-time feedback:

```
╔════════════════════════════════════════════════════════╗
║   Kp Sounds Watch → Luganda Movies Database Import    ║
╚════════════════════════════════════════════════════════╝

Command: all
Limit: 50 movies per VJ

📥 Importing VJs from Kp Sounds Watch...

Found 15 VJs to import

✅ Imported: VJ Ice P
✅ Imported: VJ Emmy
✅ Imported: VJ Junior
⏭️  Skipped: VJ Soul (already exists)
...

📊 VJ Import Summary:
   Imported: 12
   Skipped: 3
   Total: 15

📥 Importing all movies from all VJs...

Found 15 VJs in database

📥 Importing movies for VJ Ice P...
Found 50 movies

✅ Imported: Lokah
✅ Imported: Running Man
⏭️  Skipped: Kantara (already exists)
...

📊 Movies Import Summary for VJ Ice P:
   Imported: 45
   Skipped: 5
   Total: 50

...

╔════════════════════════════════════════════════════════╗
║                   Import Complete!                     ║
╚════════════════════════════════════════════════════════╝

✅ Total items processed: 687

📊 Database Statistics:
   VJs: 15
   Total Movies: 687
   Published Movies: 687
   Trending Movies: 20
   Featured Movies: 0
```

---

## 🛡️ Safety Features

### 1. Duplicate Prevention
- ✅ Checks if VJ already exists before importing
- ✅ Checks if movie already exists before importing
- ✅ Skips duplicates automatically

### 2. Rate Limiting
- ✅ 2 seconds between requests
- ✅ Respects Kp Sounds server
- ✅ Prevents overload

### 3. Error Handling
- ✅ Continues on individual errors
- ✅ Logs all errors
- ✅ Provides summary at end

### 4. Caching
- ✅ Caches scraped data for 24 hours
- ✅ Reduces redundant requests
- ✅ Faster re-runs

---

## 📈 Performance

### Expected Times

| Operation | VJs | Movies | Time |
|-----------|-----|--------|------|
| Import VJs | 15 | 0 | ~2 min |
| Import Movies (50/VJ) | 15 | 750 | ~10 min |
| Update Trending | 0 | 20 | ~1 min |
| **Full Import** | **15** | **750** | **~12 min** |

### Optimization Tips

1. **Start Small:** Import 10-20 movies per VJ first
2. **Incremental:** Run daily to catch new movies
3. **Off-Peak:** Run during low-traffic hours
4. **Monitor:** Check logs for errors

---

## 🐛 Troubleshooting

### Issue: "MongoDB Connection Error"

**Solution:**
```bash
# Make sure MongoDB is running
net start MongoDB

# Or check your .env file
MONGODB_URI=mongodb://localhost:27017/luganda-movies
```

### Issue: "Cannot find module"

**Solution:**
```bash
cd server
npm install
```

### Issue: "Scraping failed"

**Possible Causes:**
- Kp Sounds website is down
- Network connection issues
- Website structure changed

**Solution:**
- Wait and try again later
- Check your internet connection
- Contact support if persistent

### Issue: "No movies imported"

**Solution:**
```bash
# Make sure VJs are imported first
node scripts/importFromKpSounds.js vjs

# Then import movies
node scripts/importFromKpSounds.js movies 50
```

---

## 📝 Best Practices

### 1. Regular Updates

```bash
# Run weekly to get new movies
.\import-from-kpsounds.bat
```

### 2. Backup Before Import

```bash
# Backup your database first
mongodump --db luganda-movies --out ./backup
```

### 3. Verify After Import

```bash
# Check database stats
node scripts/importFromKpSounds.js all 0
```

### 4. Clean Up

```bash
# Remove duplicates if any
# (Script handles this automatically)
```

---

## 🎯 Use Cases

### Scenario 1: New Website Setup

```bash
# Import everything
.\import-from-kpsounds.bat
# Choose option 1
```

### Scenario 2: Add New VJ

```bash
# Import VJs (will add new ones)
.\import-from-kpsounds.bat
# Choose option 2

# Then import their movies
.\import-from-kpsounds.bat
# Choose option 3
```

### Scenario 3: Update Existing Content

```bash
# Import movies (skips existing)
.\import-from-kpsounds.bat
# Choose option 3
```

### Scenario 4: Refresh Trending

```bash
# Update trending status
.\import-from-kpsounds.bat
# Choose option 4
```

---

## 🔐 Ethical Considerations

This scraper follows ethical guidelines:

✅ **Respects robots.txt**  
✅ **Rate limiting** (2 seconds between requests)  
✅ **Only public data** (no protected content)  
✅ **Proper user-agent** identification  
✅ **Caching** to minimize requests  
✅ **No video scraping** (links to Kp Sounds)  

**Note:** This tool only imports metadata. Users are directed to watch.kpsounds.com for actual video streaming.

---

## 📞 Support

If you encounter issues:

1. Check this guide
2. Review error messages
3. Check MongoDB connection
4. Verify internet connection
5. Contact support

---

## 🎉 Success!

After running the import, you should see:

- ✅ All VJs from Kp Sounds in your database
- ✅ Latest movies for each VJ
- ✅ Trending movies marked
- ✅ Your homepage populated with content
- ✅ Newest movies appearing first (automatic)

**Your Luganda Movies website is now fully populated!** 🚀

---

**Created:** December 17, 2024  
**Version:** 1.0.0  
**Status:** Ready to use
