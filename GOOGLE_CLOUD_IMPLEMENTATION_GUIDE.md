# Google Cloud Storage Implementation Guide

## 🎯 Complete Step-by-Step Setup

This guide will help you integrate Google Cloud Storage with your Unruly Movies platform using the **FREE TIER**.

---

## ✅ What We've Created

### 1. **Backend Service** (`server/services/googleCloudStorage.js`)
- Upload movies, posters, and subtitles to GCS
- Generate secure signed URLs for streaming
- Delete files from GCS
- Get storage statistics
- List and manage files

### 2. **API Routes** (`server/routes/upload.js`)
- `POST /api/upload/movie` - Upload movie files
- `POST /api/upload/poster` - Upload poster images
- `POST /api/upload/subtitle` - Upload subtitle files
- `GET /api/upload/stream/:movieId` - Get streaming URL
- `DELETE /api/upload/:movieId` - Delete movie files
- `GET /api/upload/stats` - Get storage statistics
- `GET /api/upload/list` - List all files

### 3. **Test Script** (`server/tests/testGCS.js`)
- Comprehensive testing of all GCS functionality
- Validates your setup is working correctly

### 4. **Setup Script** (`setup-google-cloud.bat`)
- Automated installation of dependencies
- Creates required directories
- Sets up environment variables

---

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] Node.js installed (v14 or higher)
- [ ] A Google account
- [ ] Credit/debit card for Google Cloud (won't be charged during free tier)
- [ ] Your Unruly Movies project set up

---

## 🚀 Step-by-Step Implementation

### Step 1: Run the Setup Script (5 minutes)

```bash
# Run the automated setup
setup-google-cloud.bat
```

This will:
- Install required npm packages
- Create necessary directories
- Set up .env template
- Update .gitignore

---

### Step 2: Create Google Cloud Account (10 minutes)

1. **Visit**: https://cloud.google.com/free

2. **Click**: "Get started for free"

3. **Sign in** with your Google account

4. **Enter billing information**:
   - Required but won't be charged
   - You get $300 free credit for 90 days
   - Plus always-free tier (5GB storage)

5. **Verify** your account via phone/SMS

6. **Complete** the signup process

✅ **You now have**: $300 credit + Always Free tier!

---

### Step 3: Create Google Cloud Project (5 minutes)

#### Option A: Using Web Console (Recommended)

1. Go to: https://console.cloud.google.com

2. Click the project dropdown (top left)

3. Click "New Project"

4. Enter project details:
   - **Project name**: `unruly-movies`
   - **Project ID**: `unruly-movies-XXXXX` (auto-generated)
   - **Location**: No organization

5. Click "Create"

6. **Copy your Project ID** - you'll need this!

#### Option B: Using Command Line

```bash
# Install Google Cloud SDK first
# Download from: https://cloud.google.com/sdk/docs/install

# Login
gcloud auth login

# Create project
gcloud projects create unruly-movies --name="Unruly Movies"

# Set as active project
gcloud config set project unruly-movies
```

---

### Step 4: Create Storage Bucket (5 minutes)

#### Option A: Using Web Console (Recommended)

1. Go to: https://console.cloud.google.com/storage

2. Click "Create Bucket"

3. Enter bucket details:
   - **Name**: `unruly-movies-free` (must be globally unique)
   - If taken, try: `unruly-movies-ug`, `unruly-movies-2025`, etc.

4. **Location type**: Region

5. **Location**: `us-central1` (Iowa - cheapest option)

6. **Storage class**: Standard

7. **Access control**: Uniform

8. **Protection tools**: None (for now)

9. Click "Create"

✅ **Your bucket is ready!**

#### Option B: Using Command Line

```bash
# Create bucket
gsutil mb -c STANDARD -l us-central1 gs://unruly-movies-free/

# Verify bucket was created
gsutil ls
```

---

### Step 5: Create Service Account (10 minutes)

This is the most important step - it allows your backend to access GCS.

#### Using Web Console (Recommended)

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts

2. Click "Create Service Account"

3. Enter details:
   - **Name**: `unruly-backend`
   - **Description**: `Backend service for Unruly Movies`

4. Click "Create and Continue"

5. **Grant permissions**:
   - Click "Select a role"
   - Search for "Storage Admin"
   - Select "Storage Admin"
   - Click "Continue"

6. Click "Done"

7. **Create Key**:
   - Find your new service account in the list
   - Click the three dots (⋮) on the right
   - Click "Manage keys"
   - Click "Add Key" → "Create new key"
   - Choose "JSON"
   - Click "Create"

8. **Save the downloaded file**:
   - Rename it to: `gcp-service-key.json`
   - Move it to: `server/config/gcp-service-key.json`

⚠️ **IMPORTANT**: Never commit this file to Git! It's already in .gitignore.

---

### Step 6: Configure Environment Variables (3 minutes)

1. Open `server/.env`

2. Update these values:

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=unruly-movies-XXXXX
GCS_BUCKET_NAME=unruly-movies-free
GCS_KEY_FILE=./config/gcp-service-key.json
GCS_PUBLIC_URL=https://storage.googleapis.com/unruly-movies-free

# Other existing variables...
PORT=5000
MONGODB_URI=mongodb://localhost:27017/unruly-movies
JWT_SECRET=your_secure_random_string_here
```

3. Replace:
   - `unruly-movies-XXXXX` with your actual project ID
   - `unruly-movies-free` with your actual bucket name
   - `your_secure_random_string_here` with a secure random string

---

### Step 7: Test the Integration (5 minutes)

```bash
cd server
node tests/testGCS.js
```

**Expected output**:
```
============================================================
Google Cloud Storage Integration Test
============================================================

[Test 1] Checking environment variables...
✓ GCS_PROJECT_ID is set: unruly-movies-XXXXX
✓ GCS_BUCKET_NAME is set: unruly-movies-free

[Test 2] Creating test file...
✓ Test file created: ...

[Test 3] Uploading file to Google Cloud Storage...
✓ File uploaded successfully!
  Bucket: unruly-movies-free
  File: test-uploads/test-1234567890.txt
  Size: 58 bytes
  Public URL: https://storage.googleapis.com/...

... (more tests)

============================================================
All tests completed successfully! ✓
============================================================
```

✅ **If all tests pass, you're ready to go!**

❌ **If tests fail**, check:
- Service account key is in the correct location
- Environment variables are set correctly
- Bucket name matches exactly
- Service account has Storage Admin role

---

### Step 8: Update Server to Use Upload Routes (2 minutes)

Open `server/server.js` and add the upload routes:

```javascript
// Add this with other route imports
const uploadRoutes = require('./routes/upload');

// Add this with other route registrations
app.use('/api/upload', uploadRoutes);
```

---

### Step 9: Start Your Server (1 minute)

```bash
cd server
npm start
```

Your server should start successfully with GCS integration enabled!

---

## 🎬 How to Use

### Upload a Movie

```bash
# Using curl
curl -X POST http://localhost:5000/api/upload/movie \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "movie=@path/to/movie.mp4" \
  -F "movieId=MOVIE_ID" \
  -F "quality=hd" \
  -F "type=original"
```

### Get Streaming URL

```bash
curl http://localhost:5000/api/upload/stream/MOVIE_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "movieId": "...",
    "title": "Movie Title",
    "streamUrl": "https://storage.googleapis.com/...",
    "expiresIn": 14400,
    "expiresAt": "2025-01-20T12:00:00.000Z",
    "quality": "hd",
    "subtitles": []
  }
}
```

### Upload Poster

```bash
curl -X POST http://localhost:5000/api/upload/poster \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "poster=@path/to/poster.jpg" \
  -F "movieId=MOVIE_ID"
```

### Get Storage Stats

```bash
curl http://localhost:5000/api/upload/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 💰 Cost Management

### Free Tier Limits (Always Free)
- **Storage**: 5 GB per month
- **Egress**: 1 GB per month (North America)
- **Class A Operations**: 5,000 per month (uploads)
- **Class B Operations**: 50,000 per month (downloads)

### What This Means
- **~2-3 HD movies** can be stored
- **~500 video views** per month
- Perfect for testing and initial launch

### Monitor Usage

1. Go to: https://console.cloud.google.com/billing

2. Click "Reports"

3. View your usage and costs

4. Set up billing alerts:
   - Click "Budgets & alerts"
   - Create budget
   - Set alerts at $1, $5, $10

---

## 🔒 Security Best Practices

### ✅ DO:
- Keep service account key secure
- Use signed URLs for all videos
- Implement user authentication
- Set URL expiration (4 hours recommended)
- Monitor access logs
- Rotate service account keys regularly

### ❌ DON'T:
- Commit service account key to Git
- Make video files public
- Share signed URLs publicly
- Use long expiration times
- Ignore billing alerts

---

## 🐛 Troubleshooting

### Error: "Service account key not found"
**Solution**: Ensure `gcp-service-key.json` is in `server/config/`

### Error: "Permission denied (403)"
**Solution**: 
- Check service account has "Storage Admin" role
- Verify billing is enabled
- Ensure bucket exists

### Error: "Bucket not found (404)"
**Solution**: 
- Verify bucket name in .env matches exactly
- Check bucket exists in Google Cloud Console

### Error: "Invalid credentials"
**Solution**:
- Re-download service account key
- Ensure JSON file is valid
- Check project ID is correct

### Videos won't play
**Solution**:
- Check signed URL hasn't expired
- Verify video file was uploaded successfully
- Test URL in browser directly
- Check CORS settings if needed

---

## 📈 Scaling Up

### When You Outgrow Free Tier

**Option 1: Pay-as-you-go**
- Storage: $0.020/GB/month
- Bandwidth: $0.08-0.12/GB
- Very affordable for small scale

**Option 2: Committed Use Discounts**
- Save 30-50% with 1-3 year commitments
- Good when you know your usage

**Option 3: Hybrid Approach**
- Keep popular movies on GCS
- Archive old content to cheaper storage
- Use YouTube for trailers (free)

---

## 🎯 Next Steps

Now that GCS is set up, you can:

1. ✅ **Create admin upload interface** (HTML form)
2. ✅ **Update video player** to use signed URLs
3. ✅ **Implement subscription checks**
4. ✅ **Add video quality selection**
5. ✅ **Monitor usage and costs**

---

## 📞 Support

### Google Cloud Support
- Documentation: https://cloud.google.com/docs
- Community: https://stackoverflow.com/questions/tagged/google-cloud-storage
- Support: https://cloud.google.com/support

### Common Issues
- Check the troubleshooting section above
- Review test script output
- Check Google Cloud Console logs

---

## ✨ Success!

You now have:
- ✅ Google Cloud Storage integrated
- ✅ Secure video streaming with signed URLs
- ✅ API endpoints for uploads and streaming
- ✅ Free tier for testing (5GB + $300 credit)
- ✅ Scalable infrastructure for growth

**Ready to upload your first movie!** 🎬

---

**Questions?** Review the `GOOGLE_CLOUD_FREE_TIER_SETUP.md` for more details.
