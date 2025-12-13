# 🗄️ Database Options for Netlify Deployment

## Current Setup: MongoDB Atlas

Your project is currently configured to use **MongoDB Atlas**, which is already set up and working:

**Current Configuration:**
- Database: MongoDB Atlas
- Connection: `mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies`
- Models: Mongoose-based (VJ, LugandaMovie, User, Payment, etc.)
- Status: ✅ Working and tested

---

## Option 1: Keep MongoDB Atlas (Recommended)

**Pros:**
- ✅ Already configured and working
- ✅ All your models are built for MongoDB
- ✅ 11 VJs already seeded
- ✅ No code changes needed
- ✅ Free tier available (512MB)
- ✅ Works perfectly with Netlify

**What You Need to Do:**
1. Add `MONGODB_URI` to Netlify environment variables
2. Deploy your site
3. Done!

**Netlify Environment Variable:**
```
Key:   MONGODB_URI
Value: mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority
```

---

## Option 2: Switch to Neon Database (PostgreSQL)

**What is Neon?**
- PostgreSQL database optimized for serverless
- Netlify has native integration
- Good for SQL-based applications

**Pros:**
- ✅ Native Netlify integration
- ✅ Serverless-optimized
- ✅ Free tier available
- ✅ Fast queries

**Cons:**
- ❌ Requires complete rewrite of all models
- ❌ Need to migrate from MongoDB to PostgreSQL
- ❌ Different query syntax (SQL vs MongoDB)
- ❌ Need to reseed all data
- ❌ Significant development time

**If You Want to Switch:**

### Step 1: Install Neon Package
```bash
npm install @netlify/neon
```

### Step 2: Create Neon Database
1. Go to: https://neon.tech/
2. Sign up for free account
3. Create new project
4. Get connection string

### Step 3: Rewrite Models (Example)

**Current MongoDB Model:**
```javascript
// server/models/VJ.js (MongoDB/Mongoose)
const vjSchema = new mongoose.Schema({
  name: String,
  slug: String,
  specialties: [String]
});
```

**New Neon/PostgreSQL Model:**
```javascript
// server/models/VJ.js (Neon/PostgreSQL)
import { neon } from '@netlify/neon';

export async function getVJs() {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  return await sql`SELECT * FROM vjs`;
}

export async function getVJBySlug(slug) {
  const sql = neon(process.env.NETLIFY_DATABASE_URL);
  const [vj] = await sql`SELECT * FROM vjs WHERE slug = ${slug}`;
  return vj;
}
```

### Step 4: Create Database Schema
```sql
-- Create VJs table
CREATE TABLE vjs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  bio TEXT,
  specialties TEXT[],
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create Movies table
CREATE TABLE movies (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  tmdb_id INTEGER,
  vj_id INTEGER REFERENCES vjs(id),
  watch_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 5: Migrate All Controllers
You'd need to rewrite:
- `server/controllers/lugandaMovieController.js`
- `server/controllers/authController.js`
- `server/controllers/paymentController.js`
- All other controllers

### Step 6: Reseed Data
- Rewrite seed scripts for PostgreSQL
- Migrate all existing data

**Estimated Time:** 2-3 days of development work

---

## 🎯 Recommendation

**Stick with MongoDB Atlas** because:

1. ✅ **Already Working:** Your entire backend is built for MongoDB
2. ✅ **No Rewrite Needed:** All models, controllers, and routes work as-is
3. ✅ **Data Already Seeded:** 11 VJs and all data ready to go
4. ✅ **Netlify Compatible:** MongoDB Atlas works perfectly with Netlify
5. ✅ **Free Tier:** 512MB free storage is plenty for your needs
6. ✅ **Quick Deploy:** Just add environment variable and deploy

**Switching to Neon would require:**
- ❌ Complete rewrite of all database code
- ❌ Learning PostgreSQL/SQL syntax
- ❌ Migrating all existing data
- ❌ Testing everything again
- ❌ 2-3 days of development time

---

## 🚀 Deploy with MongoDB Atlas (Quick Guide)

### Step 1: Connect GitHub to Netlify
Follow: `CONNECT_GITHUB_TO_NETLIFY.md`

### Step 2: Add Environment Variables

In Netlify, add these:

```
MONGODB_URI=mongodb+srv://nduggahafizu67:nduggahaf67@hafithu67.nyi9cp3.mongodb.net/luganda-movies?retryWrites=true&w=majority

TMDB_API_KEY=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

JWT_SECRET=your_jwt_secret_here

PESAPAL_CONSUMER_KEY=your_pesapal_key
PESAPAL_CONSUMER_SECRET=your_pesapal_secret
```

### Step 3: Deploy
- Netlify will auto-deploy from GitHub
- Your site will be live in 2 minutes
- All features working immediately

---

## 📊 Comparison Table

| Feature | MongoDB Atlas | Neon (PostgreSQL) |
|---------|---------------|-------------------|
| **Current Setup** | ✅ Yes | ❌ No |
| **Code Ready** | ✅ Yes | ❌ Needs rewrite |
| **Data Seeded** | ✅ Yes | ❌ Needs migration |
| **Netlify Compatible** | ✅ Yes | ✅ Yes |
| **Free Tier** | ✅ 512MB | ✅ 3GB |
| **Setup Time** | ⚡ 5 minutes | ⏰ 2-3 days |
| **Learning Curve** | ✅ Already know | ❌ Need to learn SQL |
| **Best For** | Document data | Relational data |

---

## 🤔 When to Use Neon?

Consider Neon if:
- Starting a NEW project from scratch
- Need complex relational queries
- Prefer SQL over NoSQL
- Have time for complete rewrite
- Need PostgreSQL-specific features

**For your current project:** MongoDB Atlas is the better choice because everything is already built for it.

---

## ✅ Final Recommendation

**Keep MongoDB Atlas and deploy now!**

1. Your code is ready
2. Your data is seeded
3. Everything is tested
4. Just add environment variables
5. Deploy in 5 minutes

**Don't switch to Neon unless:**
- You have 2-3 days for complete rewrite
- You specifically need PostgreSQL features
- You're willing to rewrite all database code

---

## 🚀 Next Steps

1. **Follow:** `CONNECT_GITHUB_TO_NETLIFY.md`
2. **Add environment variables** (MongoDB URI + TMDB API Key)
3. **Deploy your site**
4. **Test and verify**
5. **Revoke old API key**

Your site will be live and working in minutes!

---

**Need help with deployment? All instructions are in `CONNECT_GITHUB_TO_NETLIFY.md`**
