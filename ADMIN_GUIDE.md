# 🔧 Admin Guide - Luganda Movies Platform

## 📞 Updated Contact Information

✅ **Email:** nduggahafizu@gmail.com  
✅ **Phone/WhatsApp:** +256 743 311 809  
✅ **Website:** watch.unrulymovies.com

---

## 🔐 Login Issue - Why Users Can't Login

### Current Situation:
Your website is a **frontend-only** static site hosted on Netlify. The login functionality requires a **backend server** to work, which is currently **NOT deployed**.

### Why Login Doesn't Work:
1. **No Backend Server Running** - The Node.js backend in the `server/` folder is not deployed
2. **No Database Connection** - MongoDB is not connected to handle user authentication
3. **Frontend Only** - Netlify only hosts static HTML/CSS/JS files

### The Solution:

You have **TWO OPTIONS**:

---

## Option 1: Deploy Full Backend (Recommended for Full Features)

### Step 1: Deploy Backend to Render (Free)

1. **Go to Render.com**
   - Visit: https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service**
   ```
   Name: unruly-movies-backend
   Root Directory: server
   Build Command: npm install
   Start Command: node server.js
   ```

4. **Add Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://nduggahafizu67:...your-mongodb-uri...
   JWT_SECRET=your-secret-key-here
   TMDB_API_KEY=7713c910b9503a1da0d0e6e448bf890e
   PESAPAL_CONSUMER_KEY=WvGJPVXxUDzwvI3r1kSAkxr7rkrEWWRN
   PESAPAL_CONSUMER_SECRET=your-secret
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your backend will be at: `https://unruly-movies-backend.onrender.com`

### Step 2: Update Frontend to Use Backend

Update `js/auth.js` (if it exists) or create it:

```javascript
// API Configuration
const API_URL = 'https://unruly-movies-backend.onrender.com/api';

// Login Function
async function login(email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect to dashboard
            window.location.href = 'index.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed. Please try again.');
    }
}

// Register Function
async function register(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
}
```

---

## Option 2: Simple Solution - Remove Login (Temporary)

If you want to launch quickly without backend:

### Make All Content Free (No Login Required)

1. **Remove Login/Register buttons** from header
2. **Make all movies accessible** without authentication
3. **Add "Coming Soon" message** for premium features

This allows you to:
- ✅ Launch immediately
- ✅ Start getting traffic
- ✅ Apply for AdSense
- ✅ Add backend later when ready

---

## 🎬 How to Upload Movies

### Current Setup:
Your platform uses **TMDB API** for movie information and expects **external video hosting** for actual movie files.

### Method 1: Using TMDB + External Video Hosting (Recommended)

#### Step 1: Get Movie Information from TMDB

```javascript
// Already configured in your code
const TMDB_API_KEY = '7713c910b9503a1da0d0e6e448bf890e';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Search for a movie
async function searchMovie(title) {
    const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
    );
    const data = await response.json();
    return data.results;
}
```

#### Step 2: Host Video Files

**Option A: YouTube (Free, Easy)**
1. Upload movie to YouTube (unlisted)
2. Get video ID from URL
3. Use YouTube embed

**Option B: Vimeo (Better Quality)**
1. Upload to Vimeo
2. Get embed code
3. Use in player

**Option C: Cloud Storage (Full Control)**
1. **Google Drive:**
   - Upload movie
   - Get shareable link
   - Use in video player

2. **Cloudinary (Recommended):**
   - Sign up: https://cloudinary.com
   - Upload videos
   - Get streaming URL
   - Free tier: 25GB storage

3. **Bunny CDN (Best for Streaming):**
   - Sign up: https://bunny.net
   - Upload videos
   - Get HLS streaming URL
   - Pay as you go

#### Step 3: Add Movie to Database

**Via Backend API (After deployment):**

```javascript
// Add new Luganda movie
async function addMovie(movieData) {
    const response = await fetch(`${API_URL}/luganda-movies`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            originalTitle: "Movie Title",
            lugandaTitle: "Luganda Title",
            vjName: "VJ Junior",
            tmdbId: "12345",
            poster: "https://image.tmdb.org/t/p/w500/poster.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/backdrop.jpg",
            description: "Movie description",
            year: 2024,
            duration: 120,
            genres: ["Action", "Drama"],
            rating: {
                imdb: 8.5,
                translationRating: 4.5
            },
            video: {
                url: "https://your-video-host.com/movie.mp4",
                quality: "hd",
                format: "mp4"
            }
        })
    });
    
    return await response.json();
}
```

### Method 2: Admin Panel (Future Enhancement)

Create an admin panel where you can:
1. Search TMDB for movies
2. Add Luganda translation details
3. Upload/link video file
4. Publish to site

**Admin Panel Features:**
- Movie search from TMDB
- VJ translator selection
- Video URL input
- Quality selection
- Publish/Unpublish toggle

---

## 📊 Complete Workflow for Adding Movies

### Step-by-Step Process:

#### 1. **Prepare Movie File**
```
- Format: MP4 (H.264)
- Resolution: 1080p or 720p
- Audio: Luganda translation
- Size: Compress to reasonable size
```

#### 2. **Upload to Video Host**
```
Choose one:
- YouTube (unlisted)
- Vimeo
- Cloudinary
- Bunny CDN
- Google Drive
```

#### 3. **Get Movie Info from TMDB**
```
- Search movie on TMDB
- Get: Title, Poster, Description, Year, etc.
- Note the TMDB ID
```

#### 4. **Add to Database**
```
Option A: Via Backend API (after deployment)
Option B: Directly in MongoDB Atlas
Option C: Use admin panel (to be built)
```

#### 5. **Test**
```
- Visit your website
- Search for the movie
- Click play
- Verify video plays correctly
```

---

## 🛠️ Quick Start Guide

### For Immediate Launch (No Backend):

1. **Remove Login Requirements**
   - Edit `index.html`, remove login buttons
   - Make all content accessible

2. **Use Sample Data**
   - Movies display from `SAMPLE_LUGANDA_MOVIES` in `js/luganda-movies-api.js`
   - Add more sample movies to this array

3. **Deploy to Netlify**
   - Push changes to GitHub
   - Netlify auto-deploys

4. **Apply for AdSense**
   - Use the guides provided
   - Start earning immediately

### For Full Features (With Backend):

1. **Deploy Backend to Render**
   - Follow Option 1 above
   - Takes 30-60 minutes

2. **Connect Frontend to Backend**
   - Update API URLs
   - Test login/register

3. **Add Movies via API**
   - Use Postman or admin panel
   - Upload videos to cloud storage

4. **Launch & Monitor**
   - Test all features
   - Monitor performance

---

## 📝 Movie Upload Template

Use this template when adding movies:

```json
{
  "originalTitle": "Fast & Furious 9",
  "lugandaTitle": "Abasirikale ba Mooto 9",
  "vjName": "VJ Junior",
  "tmdbId": "385128",
  "poster": "https://image.tmdb.org/t/p/w500/poster.jpg",
  "backdrop": "https://image.tmdb.org/t/p/original/backdrop.jpg",
  "description": "Dom and the crew must take on an international terrorist...",
  "year": 2021,
  "duration": 143,
  "genres": ["Action", "Crime", "Thriller"],
  "rating": {
    "imdb": 5.2,
    "tmdb": 7.3,
    "translationRating": 4.5
  },
  "video": {
    "url": "https://your-cdn.com/fast-furious-9-luganda.mp4",
    "quality": "hd",
    "format": "mp4",
    "size": "2.5GB"
  },
  "trailer": "https://youtube.com/watch?v=...",
  "featured": true,
  "trending": true
}
```

---

## 🎯 Recommended Approach

### Phase 1: Launch Quickly (This Week)
1. ✅ Keep frontend as is
2. ✅ Use sample data
3. ✅ Apply for AdSense
4. ✅ Start getting traffic

### Phase 2: Add Backend (Next 2 Weeks)
1. Deploy backend to Render
2. Connect MongoDB
3. Enable user authentication
4. Add movie upload functionality

### Phase 3: Scale (Month 2+)
1. Build admin panel
2. Add more VJ translators
3. Implement subscriptions
4. Add premium features

---

## 💡 Pro Tips

### For Video Hosting:
1. **Start with YouTube** - Free and easy
2. **Upgrade to Bunny CDN** - Better streaming
3. **Use HLS format** - Adaptive quality

### For Movie Management:
1. **Create spreadsheet** - Track all movies
2. **Organize by VJ** - Easy to manage
3. **Tag properly** - Better search

### For Growth:
1. **Add 5-10 movies/week** - Consistent content
2. **Promote on social media** - Build audience
3. **Engage with users** - Get feedback

---

## 📞 Need Help?

**Contact Admin:**
- Email: nduggahafizu@gmail.com
- WhatsApp: +256 743 311 809

**Resources:**
- TMDB API Docs: https://developers.themoviedb.org
- Render Docs: https://render.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas

---

## ✅ Quick Checklist

### Before Adding Movies:
- [ ] Video file prepared and compressed
- [ ] Video uploaded to hosting service
- [ ] TMDB information gathered
- [ ] VJ translator confirmed
- [ ] Quality checked

### After Adding Movies:
- [ ] Movie appears on website
- [ ] Video plays correctly
- [ ] Poster/backdrop display properly
- [ ] Search works
- [ ] Mobile version tested

---

**Your platform is ready to launch! Start with sample data and add backend later for full features.** 🚀
