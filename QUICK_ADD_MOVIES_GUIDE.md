# 🚀 Quick Guide: Add New VJ Movies

## ⚡ Fast Method (3 Steps)

### Step 1: Edit the Script
```bash
nano server/scripts/addMovies.js
```

Add your movies to the `moviesToAdd` array:
```javascript
{
    title: 'Movie Title',
    vj: 'VJ Ice P',
    lugandaTitle: 'Movie Title (Luganda)',
    customData: {
        translationRating: 4.8,
        featured: true,
        trending: true
    }
}
```

### Step 2: Run the Script
```bash
cd server
node scripts/addMovies.js
```

### Step 3: Verify
```bash
node scripts/verifyMovies.js
```

---

## 📋 Movie Template

Copy and paste this template for each new movie:

```javascript
{
    title: 'MOVIE_TITLE_HERE',           // English title from TMDB
    vj: 'VJ_NAME_HERE',                  // VJ Ice P, VJ Junior, VJ Emmy, VJ Soul
    lugandaTitle: 'TITLE (Luganda)',     // Luganda translated title
    customData: {
        translationRating: 4.5,          // 0-5 rating
        featured: false,                 // true/false
        trending: false                  // true/false
    }
}
```

---

## 🎬 Example: Adding Today's Movies

```javascript
const moviesToAdd = [
    // VJ Ice P
    {
        title: 'John Wick 5',
        vj: 'VJ Ice P',
        lugandaTitle: 'John Wick 5 (Luganda)',
        customData: {
            translationRating: 4.9,
            featured: true,
            trending: true
        }
    },
    
    // VJ Junior
    {
        title: 'Fast X Part 2',
        vj: 'VJ Junior',
        lugandaTitle: 'Fast X Part 2 (Luganda)',
        customData: {
            translationRating: 4.7,
            trending: true
        }
    },
    
    // VJ Emmy
    {
        title: 'Avatar 3',
        vj: 'VJ Emmy',
        lugandaTitle: 'Avatar 3 (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true
        }
    }
];
```

---

## ✅ What Happens Automatically

When you run the script, it automatically:
1. ✅ Searches TMDB for the movie
2. ✅ Downloads poster image
3. ✅ Gets movie description
4. ✅ Fetches cast and crew
5. ✅ Gets release year and duration
6. ✅ Assigns genres
7. ✅ Adds VJ name
8. ✅ Saves to database
9. ✅ Prevents duplicates

---

## 🔍 Troubleshooting

### Movie Not Found
If you see "Movie not found on TMDB":
- Check spelling
- Try alternative title
- Search on https://www.themoviedb.org first

### Already Exists
If you see "Movie already exists":
- This is normal - prevents duplicates
- Movie is already in database

### Connection Error
If you see "MongoDB connection error":
- Check internet connection
- Verify .env file has correct MONGODB_URI

---

## 📊 Check Your Movies

### View All Movies
```bash
cd server
node scripts/verifyMovies.js
```

### Test API
```bash
curl http://localhost:5000/api/luganda-movies
```

### Count Movies
```bash
curl http://localhost:5000/api/luganda-movies | grep "total"
```

---

## 🎯 Daily Workflow

1. **Morning**: Collect new movie titles from VJs
2. **Edit**: Add movies to `addMovies.js`
3. **Run**: Execute the script
4. **Verify**: Check movies were added
5. **Upload**: Upload video files (later)
6. **Test**: Verify on website

---

## 💡 Pro Tips

### Mark as Featured
```javascript
featured: true  // Shows on homepage
```

### Mark as Trending
```javascript
trending: true  // Shows in trending section
```

### High Rating
```javascript
translationRating: 5.0  // Best quality translation
```

### Multiple Parts
```javascript
// Part 1
{
    title: 'Movie Name',
    lugandaTitle: 'Movie Name Part 1 (Luganda)'
}

// Part 2
{
    title: 'Movie Name 2',
    lugandaTitle: 'Movie Name Part 2 (Luganda)'
}
```

---

## 🚀 Quick Commands

```bash
# Add movies
cd server && node scripts/addMovies.js

# Verify movies
cd server && node scripts/verifyMovies.js

# Start backend
cd server && node server.js

# Test API
curl http://localhost:5000/api/health
```

---

## 📞 Need Help?

- **Full Guide**: `HOW_TO_ADD_MOVIES_DAILY.md`
- **API Docs**: `BACKEND_API_DOCUMENTATION.md`
- **TMDB Setup**: `TMDB_API_SETUP.md`

---

**That's it! Adding movies is now super easy! 🎉**
