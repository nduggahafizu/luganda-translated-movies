# 🚀 Complete Setup Guide - Luganda Movies

## Required Steps to Complete Before Production

Follow these steps in order to complete your production setup:

---

## Step 1: Set Up Environment Variables ✅

### Create .env file in server directory

```bash
cd server
copy .env.example .env
```

### Edit server/.env with your actual values:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database - Get from MongoDB Atlas
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/luganda-movies

# JWT - Generate strong secrets
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Session
SESSION_SECRET=your-session-secret-key

# CORS - Add your production domains
ALLOWED_ORIGINS=https://lugandamovies.com,https://www.lugandamovies.com

# Redis (if using caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
```

**Generate Strong Secrets:**
```bash
# Run this in Node.js to generate secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Step 2: Install Redis (Optional but Recommended) 🔴

### Windows:
1. Download Redis from: https://github.com/microsoftarchive/redis/releases
2. Install Redis
3. Start Redis:
```bash
redis-server
```

### Alternative: Use Redis Cloud (Free Tier)
1. Sign up at: https://redis.com/try-free/
2. Create a free database
3. Update .env with cloud credentials:
```env
REDIS_HOST=redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password
```

---

## Step 3: Configure MongoDB Atlas 📦

### If not already done:

1. **Sign up at MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Create free account

2. **Create a Cluster:**
   - Choose FREE tier (M0)
   - Select region closest to you
   - Name: luganda-movies-cluster

3. **Create Database User:**
   - Database Access → Add New User
   - Username: lugandaadmin
   - Password: (generate strong password)
   - Role: Read and write to any database

4. **Whitelist IP Address:**
   - Network Access → Add IP Address
   - For development: Add 0.0.0.0/0 (allow from anywhere)
   - For production: Add your server IP

5. **Get Connection String:**
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace <password> with your password
   - Update MONGODB_URI in .env

---

## Step 4: Install Dependencies 📦

```bash
cd server
npm install
```

This will install all required packages including:
- winston (logging)
- redis (caching)
- swagger (documentation)
- And all other dependencies

---

## Step 5: Test the Setup 🧪

### Start the server:
```bash
npm run dev
```

### Test endpoints:

1. **Health Check:**
```bash
curl http://localhost:5000/api/health
```

2. **API Documentation:**
Open browser: http://localhost:5000/api-docs

3. **Metrics:**
```bash
curl http://localhost:5000/api/metrics
```

4. **Cache Stats (if Redis running):**
```bash
curl http://localhost:5000/api/cache/stats
```

---

## Step 6: Verify Frontend 🌐

1. Open `index.html` in browser
2. Verify YouTube video loads
3. Check all pages work correctly

---

## Step 7: Production Deployment 🚀

### Option A: Deploy to Netlify (Frontend)

1. **Connect GitHub to Netlify:**
   - Go to: https://app.netlify.com
   - New site from Git
   - Choose your repository
   - Deploy settings:
     - Build command: (leave empty for static site)
     - Publish directory: /

2. **Configure Environment Variables in Netlify:**
   - Site settings → Environment variables
   - Add all variables from .env

### Option B: Deploy Backend to Heroku/Railway

1. **Heroku:**
```bash
heroku create luganda-movies-api
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
# Add all other env variables
git push heroku main
```

2. **Railway:**
   - Visit: https://railway.app
   - New Project → Deploy from GitHub
   - Add environment variables
   - Deploy

---

## Step 8: SSL/HTTPS Setup 🔒

### For Production:

1. **Get SSL Certificate:**
   - Use Let's Encrypt (free): https://letsencrypt.org
   - Or use Cloudflare (free): https://www.cloudflare.com

2. **Configure Domain:**
   - Point domain to your server IP
   - Update ALLOWED_ORIGINS in .env with your domain

---

## Step 9: Monitoring Setup 📊

### Set up monitoring alerts:

1. **Uptime Monitoring:**
   - Use UptimeRobot (free): https://uptimerobot.com
   - Monitor: https://your-domain.com/api/health

2. **Error Tracking:**
   - Use Sentry (free tier): https://sentry.io
   - Add SENTRY_DSN to .env

3. **Log Management:**
   - Logs are in `server/logs/`
   - Set up log rotation
   - Consider cloud logging (Papertrail, Loggly)

---

## Step 10: Final Checklist ✅

Before going live, verify:

- [ ] Environment variables configured
- [ ] MongoDB Atlas connected
- [ ] Redis running (optional)
- [ ] All dependencies installed
- [ ] Server starts without errors
- [ ] Health check returns healthy
- [ ] API documentation accessible
- [ ] Frontend loads correctly
- [ ] YouTube video plays
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Monitoring set up
- [ ] Backups configured
- [ ] Rate limiting tested
- [ ] Authentication working

---

## Quick Commands Reference

```bash
# Start development server
npm run dev

# Start production server
npm start

# Test MongoDB connection
npm run test:mongodb

# View logs
cd server/logs
type application-2024-01-15.log

# Clear Redis cache
curl -X POST http://localhost:5000/api/cache/clear

# Check health
curl http://localhost:5000/api/health
```

---

## Troubleshooting

### Server won't start:
1. Check .env file exists
2. Verify MongoDB connection string
3. Check port 5000 is available
4. Review logs in server/logs/

### Redis errors:
1. Redis is optional - server will work without it
2. Install Redis or use Redis Cloud
3. Update REDIS_HOST in .env

### MongoDB connection failed:
1. Check connection string format
2. Verify IP whitelist in MongoDB Atlas
3. Check username/password
4. Ensure network access

---

## Support

- Documentation: /api-docs
- Health Check: /api/health
- GitHub: https://github.com/nduggahafizu/luganda-translated-movies

---

## 🎉 You're Ready!

Once all steps are complete, your Luganda Movies platform will be:
- ✅ Fully functional
- ✅ Production-ready
- ✅ Secure and monitored
- ✅ Scalable and performant

**Launch your platform! 🚀🇺🇬**
