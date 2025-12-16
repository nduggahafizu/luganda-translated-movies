# Google Cloud Free Tier Setup for Unruly Movies

## 🎉 Great News! Google Cloud Free Tier Benefits

Google Cloud offers a **generous free tier** that's perfect for getting started:

### Always Free Resources (No Time Limit)
- **5 GB** of Regional Cloud Storage per month
- **1 GB** of network egress from North America to all region destinations (excluding China and Australia) per month
- **5,000** Class A Operations per month (uploads, list operations)
- **50,000** Class B Operations per month (downloads, reads)

### $300 Free Credit (90 Days)
- Valid for 90 days from account creation
- Can be used for ANY Google Cloud service
- Perfect for testing and initial setup

---

## 📊 What You Can Do with Free Tier

### Storage Capacity
- **5 GB free storage** = approximately **2-3 movies** in HD quality
- Perfect for testing and proof of concept
- Can store 10-15 movies in SD quality

### Bandwidth
- **1 GB free egress** = approximately **500 video views** per month (assuming 2MB average per view)
- Good for initial testing with small audience

### Strategy for Free Tier
1. Start with 2-3 popular movies
2. Test the streaming functionality
3. Gather user feedback
4. Scale up when ready (pay-as-you-go)

---

## 🚀 Quick Start Guide (Free Tier)

### Step 1: Create Google Cloud Account (5 minutes)

1. **Visit**: https://cloud.google.com/free
2. **Click**: "Get started for free"
3. **Sign in** with your Google account
4. **Enter billing information** (required but won't be charged during free tier)
5. **Verify** your account

**Important**: You get $300 credit for 90 days + Always Free tier!

---

### Step 2: Create Your First Project (2 minutes)

```bash
# Option A: Using Web Console
1. Go to: https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name: "unruly-movies"
4. Click "Create"

# Option B: Using Command Line (if you prefer)
# Install Google Cloud SDK first: https://cloud.google.com/sdk/docs/install

gcloud projects create unruly-movies --name="Unruly Movies"
gcloud config set project unruly-movies
```

---

### Step 3: Create Storage Bucket (3 minutes)

```bash
# Using Web Console:
1. Go to: https://console.cloud.google.com/storage
2. Click "Create Bucket"
3. Name: "unruly-movies-free" (must be globally unique)
4. Location type: "Region"
5. Location: "us-central1" (Iowa - cheapest)
6. Storage class: "Standard"
7. Access control: "Uniform"
8. Click "Create"

# Using Command Line:
gsutil mb -c STANDARD -l us-central1 gs://unruly-movies-free/
```

---

### Step 4: Set Up Service Account (5 minutes)

```bash
# 1. Create service account
gcloud iam service-accounts create unruly-backend \
    --display-name="Unruly Movies Backend"

# 2. Grant storage permissions
gcloud projects add-iam-policy-binding unruly-movies \
    --member="serviceAccount:unruly-backend@unruly-movies.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# 3. Create and download key
gcloud iam service-accounts keys create gcp-service-key.json \
    --iam-account=unruly-backend@unruly-movies.iam.gserviceaccount.com
```

**Important**: Save `gcp-service-key.json` securely! Never commit to Git!

---

### Step 5: Install Node.js Dependencies (2 minutes)

```bash
cd server
npm install @google-cloud/storage --save
```

---

### Step 6: Create GCS Service (10 minutes)

I'll create the complete service file for you:

**File**: `server/services/googleCloudStorage.js`

---

### Step 7: Update Environment Variables (2 minutes)

Add to `server/.env`:

```env
# Google Cloud Storage
GCS_PROJECT_ID=unruly-movies
GCS_BUCKET_NAME=unruly-movies-free
GCS_KEY_FILE=./config/gcp-service-key.json
GCS_PUBLIC_URL=https://storage.googleapis.com/unruly-movies-free
```

---

### Step 8: Test Upload (5 minutes)

I'll create a test script for you to verify everything works.

---

## 💰 Cost Management Tips for Free Tier

### 1. Stay Within Free Limits
- Monitor usage in Google Cloud Console
- Set up billing alerts at $1, $5, $10
- Use Cloud Storage lifecycle policies

### 2. Optimize Storage
```bash
# Compress videos before upload
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium output.mp4

# This can reduce file size by 40-60%!
```

### 3. Use Efficient Formats
- **MP4 (H.264)**: Best compatibility
- **WebM (VP9)**: Better compression
- **Avoid**: Uncompressed formats

### 4. Implement Caching
- Cache video URLs in your app
- Reduce API calls to GCS
- Use browser caching headers

---

## 📈 Scaling Strategy

### Phase 1: Free Tier (Month 1-3)
- **Cost**: $0 (using free credits)
- **Storage**: 2-3 movies
- **Users**: 100-500 views/month
- **Goal**: Test and validate

### Phase 2: Minimal Paid (Month 4-6)
- **Cost**: $5-20/month
- **Storage**: 10-20 movies (20-40 GB)
- **Users**: 1,000-2,000 views/month
- **Goal**: Build audience

### Phase 3: Growth (Month 7-12)
- **Cost**: $50-200/month
- **Storage**: 50-100 movies (100-200 GB)
- **Users**: 5,000-10,000 views/month
- **Goal**: Monetize

### Phase 4: Scale (Year 2+)
- **Cost**: $500-2,000/month
- **Storage**: 500+ movies (1TB+)
- **Users**: 50,000+ views/month
- **Goal**: Profit

---

## 🎯 Free Tier Optimization Checklist

- [ ] Use regional storage (cheaper than multi-regional)
- [ ] Compress videos before upload (save 40-60% space)
- [ ] Delete old/unused files regularly
- [ ] Use signed URLs (prevent hotlinking)
- [ ] Implement video quality selection (SD for free users)
- [ ] Cache frequently accessed content
- [ ] Monitor usage daily
- [ ] Set up billing alerts
- [ ] Use lifecycle policies for old content
- [ ] Consider YouTube embedding for trailers (free bandwidth)

---

## 🔧 Alternative Free Options

While setting up Google Cloud, you can also use:

### 1. **Cloudflare R2** (Free Tier)
- 10 GB storage free
- No egress fees!
- S3-compatible API

### 2. **Backblaze B2** (Free Tier)
- 10 GB storage free
- 1 GB download free per day
- Very affordable beyond free tier

### 3. **Bunny.net** (Pay-as-you-go)
- $0.01/GB storage
- $0.01/GB bandwidth
- Very affordable for small scale

### 4. **YouTube** (Free for trailers)
- Unlimited storage
- Unlimited bandwidth
- Embed in your site
- Good for promotional content

---

## 📝 Implementation Checklist

### Week 1: Setup
- [ ] Create Google Cloud account
- [ ] Set up project and bucket
- [ ] Create service account
- [ ] Install dependencies
- [ ] Create GCS service module
- [ ] Test upload/download

### Week 2: Integration
- [ ] Update movie model
- [ ] Create upload API endpoints
- [ ] Update movie controller
- [ ] Test with sample movie
- [ ] Verify signed URLs work

### Week 3: Frontend
- [ ] Update video player
- [ ] Test streaming
- [ ] Add quality selector
- [ ] Test on mobile
- [ ] Optimize loading

### Week 4: Polish
- [ ] Add upload progress
- [ ] Implement error handling
- [ ] Add monitoring
- [ ] Create admin interface
- [ ] Document everything

---

## 🎬 Sample Movie Upload Process

```javascript
// 1. Compress video (optional but recommended)
ffmpeg -i original.mp4 -c:v libx264 -crf 23 -preset medium compressed.mp4

// 2. Upload via API
const formData = new FormData();
formData.append('movie', compressedFile);
formData.append('title', 'Movie Title');
formData.append('vjName', 'VJ Junior');

fetch('/api/upload/movie', {
    method: 'POST',
    body: formData
});

// 3. Movie is stored in GCS
// 4. Database updated with GCS path
// 5. Signed URL generated for streaming
```

---

## 🚨 Important Notes

### Security
1. **Never expose** service account keys in frontend
2. **Always use** signed URLs for videos
3. **Implement** user authentication
4. **Set** URL expiration (1-4 hours)
5. **Monitor** for abuse

### Legal
1. **Ensure** you have rights to host content
2. **Credit** VJ translators properly
3. **Implement** DMCA takedown process
4. **Add** terms of service
5. **Comply** with copyright laws

### Performance
1. **Compress** videos before upload
2. **Use** adaptive bitrate streaming
3. **Implement** lazy loading
4. **Cache** frequently accessed content
5. **Monitor** load times

---

## 📞 Next Steps

I'm ready to help you implement this! Here's what I can do:

1. ✅ **Create the GCS service module** (`server/services/googleCloudStorage.js`)
2. ✅ **Create upload API endpoints** (`server/routes/upload.js`)
3. ✅ **Update the movie model** to support GCS
4. ✅ **Create test scripts** to verify everything works
5. ✅ **Update the video player** to use GCS URLs
6. ✅ **Create admin upload interface**

**Would you like me to start implementing these files?**

Just confirm and I'll begin with:
1. The GCS service module
2. Upload API endpoints
3. Test scripts

Let me know when you're ready! 🚀
