# 📽️ How to Add New Luganda Movies Daily

This guide shows you how to easily add new translated movies to your platform every day.

---

## 🎯 Quick Start

### Method 1: Using the Script (Easiest)

1. **Edit the movie list** in `server/scripts/addMovies.js`
2. **Run the script**: Double-click `add-movies.bat`
3. **Done!** Movies are added with posters from TMDB

### Method 2: Tell Me What to Add

Just give me the information in this format:

```
VJ Name: VJ Ice P
Movies:
- Lokah 1&2
- Running Man
- Kantara 1&2
- Frankenstein
- Predator Badlands
- Fist of Fury

VJ Name: VJ Soul
Series:
- War 1-4
```

I'll create the script and add them for you!

---

## 📋 Current Movies Added

### VJ Ice P (Movies)
✅ Lokah (Indian Movie)
✅ Running Man
✅ Kantara (Indian Movie)
✅ Frankenstein
✅ Predator Badlands
✅ Fist of Fury

### VJ Soul (Series)
✅ War Season 1-4

---

## 🔧 How to Add More Movies

### Step 1: Edit the Script

Open `server/scripts/addMovies.js` and find this section:

```javascript
const moviesToAdd = [
    {
        title: 'Movie Title',           // Original English title
        vj: 'VJ Ice P',                 // VJ translator name
        lugandaTitle: 'Title (Luganda)', // Luganda title (optional)
        customData: {
            translationRating: 4.8,      // Rating (0-5)
            featured: true,              // Show on homepage?
            trending: true               // Mark as trending?
        }
    },
    // Add more movies here...
];
```

### Step 2: Add Your Movies

Example - Adding a new movie:

```javascript
{
    title: 'John Wick',
    vj: 'VJ Emmy',
    lugandaTitle: 'John Wick (Luganda)',
    customData: {
        translationRating: 4.9,
        featured: true,
        trending: true
    }
}
```

### Step 3: Run the Script

```bash
# Option A: Double-click
add-movies.bat

# Option B: Command line
cd server
node scripts/addMovies.js
```

### Step 4: Verify

The script will:
- ✅ Search TMDB for the movie
- ✅ Download poster and movie info
- ✅ Add VJ translator name
- ✅ Save to database
- ✅ Show success message

---

## 🎬 What the Script Does

### Automatic Features

1. **Searches TMDB** - Finds the movie by title
2. **Gets Movie Info** - Title, year, description, rating
3. **Downloads Poster** - High-quality poster image
4. **Adds VJ Info** - Your VJ translator name
5. **Saves to Database** - Ready to display on website
6. **Prevents Duplicates** - Won't add same movie twice

### What You Need to Provide

- ✅ Movie title (English)
- ✅ VJ translator name
- ✅ Luganda title (optional)
- ✅ Translation rating (optional)

### What's Automatic

- ✅ Poster image from TMDB
- ✅ Movie description
- ✅ Release year
- ✅ Genre
- ✅ Cast information
- ✅ Director name
- ✅ IMDB rating

---

## 📝 Daily Workflow

### Every Day When You Have New Movies:

1. **Collect Information**
   - Movie titles
   - VJ translator names
   - Any special notes

2. **Update Script**
   - Open `server/scripts/addMovies.js`
   - Add new movies to the list
   - Save the file

3. **Run Script**
   - Double-click `add-movies.bat`
   - Wait for completion
   - Check success messages

4. **Upload Videos** (Later)
   - Upload video files to Google Cloud Storage
   - Link videos to movies in database

5. **Verify on Website**
   - Open your website
   - Check movies page
   - Verify posters and info are correct

---

## 🎯 Example: Adding Today's Movies

Let's say today you have these new translations:

**VJ Ice P:**
- Spider-Man: No Way Home
- Avatar: The Way of Water

**VJ Emmy:**
- Top Gun: Maverick

### Step 1: Edit the Script

```javascript
const moviesToAdd = [
    {
        title: 'Spider-Man: No Way Home',
        vj: 'VJ Ice P',
        lugandaTitle: 'Spider-Man: No Way Home (Luganda)',
        customData: {
            translationRating: 4.9,
            featured: true,
            trending: true
        }
    },
    {
        title: 'Avatar: The Way of Water',
        vj: 'VJ Ice P',
        lugandaTitle: 'Avatar: The Way of Water (Luganda)',
        customData: {
            translationRating: 4.8,
            featured: true
        }
    },
    {
        title: 'Top Gun: Maverick',
        vj: 'VJ Emmy',
        lugandaTitle: 'Top Gun: Maverick (Luganda)',
        customData: {
            translationRating: 4.7,
            trending: true
        }
    }
];
```

### Step 2: Run

```bash
add-movies.bat
```

### Step 3: Output

```
═══════════════════════════════════════════════════════
Adding Luganda Translated Movies
═══════════════════════════════════════════════════════

🎬 Adding: Spider-Man: No Way Home (VJ VJ Ice P)
   Searching TMDB...
   ✓ Found: Spider-Man: No Way Home (2021)
   Fetching full details...
   ✓ Added successfully! ID: 507f1f77bcf86cd799439011
   Poster: https://image.tmdb.org/t/p/original/...

🎬 Adding: Avatar: The Way of Water (VJ VJ Ice P)
   Searching TMDB...
   ✓ Found: Avatar: The Way of Water (2022)
   Fetching full details...
   ✓ Added successfully! ID: 507f1f77bcf86cd799439012
   Poster: https://image.tmdb.org/t/p/original/...

🎬 Adding: Top Gun: Maverick (VJ VJ Emmy)
   Searching TMDB...
   ✓ Found: Top Gun: Maverick (2022)
   Fetching full details...
   ✓ Added successfully! ID: 507f1f77bcf86cd799439013
   Poster: https://image.tmdb.org/t/p/original/...

═══════════════════════════════════════════════════════
Summary
═══════════════════════════════════════════════════════
✓ Successfully added: 3
✗ Failed: 0
⚠ Skipped (already exists): 0

Successfully added:
  - Spider-Man: No Way Home
  - Avatar: The Way of Water
  - Top Gun: Maverick

✅ All done!
```

---

## 🔍 Troubleshooting

### Movie Not Found on TMDB

**Problem**: "Movie not found on TMDB: Movie Title"

**Solution**:
- Check spelling of movie title
- Try alternative title (e.g., "The Matrix" vs "Matrix")
- Search TMDB manually: https://www.themoviedb.org/
- Use the exact title from TMDB

### Movie Already Exists

**Problem**: "Movie already exists: Title by VJ Name"

**Solution**:
- This is normal - prevents duplicates
- Movie is already in database
- No action needed

### TMDB API Error

**Problem**: "TMDB API error" or "Rate limit exceeded"

**Solution**:
- Wait 10 seconds and try again
- Check TMDB API key in `.env`
- Verify internet connection

### Database Connection Error

**Problem**: "MongoDB connection error"

**Solution**:
- Start MongoDB: `net start MongoDB`
- Check MongoDB is running
- Verify MONGODB_URI in `.env`

---

## 📊 Movie Information Fields

### What Gets Saved

```javascript
{
    // Basic Info
    originalTitle: "Spider-Man: No Way Home",
    lugandaTitle: "Spider-Man: No Way Home (Luganda)",
    vjName: "VJ Ice P",
    
    // Details
    description: "Movie description from TMDB",
    year: 2021,
    duration: 148,
    
    // Ratings
    rating: {
        imdb: 8.4,
        translationRating: 4.9
    },
    
    // Categories
    genres: ["action", "adventure", "sci-fi"],
    
    // Media
    poster: "https://image.tmdb.org/t/p/original/...",
    backdrop: "https://image.tmdb.org/t/p/original/...",
    trailer: "https://www.youtube.com/watch?v=...",
    
    // Cast
    cast: [
        {
            name: "Tom Holland",
            character: "Peter Parker / Spider-Man"
        }
    ],
    director: "Jon Watts",
    
    // Status
    status: "published",
    featured: true,
    trending: true,
    
    // Video (updated later when uploaded)
    video: {
        originalVideoPath: null,  // Add after upload
        quality: "hd",
        format: "mp4"
    }
}
```

---

## 🎥 After Adding Movies

### Next Steps

1. **Upload Video Files**
   - Use Google Cloud Storage
   - Follow: `MY_GOOGLE_CLOUD_SETUP.md`
   - Link videos to movies

2. **Add Subtitles** (Optional)
   - Upload subtitle files
   - Link to movies

3. **Test on Website**
   - Browse movies page
   - Click on movie
   - Verify all info is correct

4. **Promote**
   - Mark as featured
   - Mark as trending
   - Add to homepage slider

---

## 💡 Tips & Best Practices

### For Better Results

1. **Use Exact Titles** - Match TMDB exactly
2. **Add Luganda Titles** - Makes it more authentic
3. **Set Ratings** - Help users find best translations
4. **Mark Featured** - Highlight best movies
5. **Mark Trending** - Show popular content

### For Series

```javascript
{
    title: 'Breaking Bad',
    vj: 'VJ Soul',
    lugandaTitle: 'Breaking Bad Season 1 (Luganda)',
    customData: {
        translationRating: 5.0,
        featured: true
    }
}
```

### For Sequels

```javascript
// Add each part separately
{
    title: 'John Wick',
    vj: 'VJ Ice P',
    lugandaTitle: 'John Wick Part 1 (Luganda)'
},
{
    title: 'John Wick: Chapter 2',
    vj: 'VJ Ice P',
    lugandaTitle: 'John Wick Part 2 (Luganda)'
}
```

---

## 📞 Need Help?

### Common Questions

**Q: Can I add multiple VJs for same movie?**
A: Yes! Just add the movie twice with different VJ names.

**Q: What if movie title is wrong on TMDB?**
A: Use the TMDB title in script, then update Luganda title.

**Q: Can I edit movie info later?**
A: Yes! Edit directly in MongoDB or create update script.

**Q: How do I delete a movie?**
A: Use MongoDB Compass or create delete script.

---

## ✅ Quick Checklist

Before adding movies daily:

- [ ] MongoDB is running
- [ ] TMDB API key is configured
- [ ] Internet connection is active
- [ ] Movie titles are correct
- [ ] VJ names are correct
- [ ] Script is updated with new movies
- [ ] Ready to run `add-movies.bat`

After adding movies:

- [ ] Check success messages
- [ ] Verify on website
- [ ] Upload video files (later)
- [ ] Test streaming (after upload)
- [ ] Promote featured movies

---

## 🎉 You're All Set!

Now you can easily add new Luganda translated movies every day:

1. **Tell me** what movies to add
2. **I'll update** the script
3. **You run** `add-movies.bat`
4. **Movies appear** on your website!

**Simple, fast, and automatic!** 🚀
