# 🎬 Cloudflare R2 Video Hosting Setup (FREE & No Ads)

Cloudflare R2 is the **best free option** for hosting your movies - it has **FREE bandwidth** and **10GB free storage**.

## Why Cloudflare R2?
- ✅ **FREE bandwidth** - No egress fees (other providers charge $0.09/GB!)
- ✅ **10GB free storage** per month
- ✅ **No ads** - Direct MP4/HLS links
- ✅ **Global CDN** - Fast streaming worldwide
- ✅ **S3-compatible** - Easy to use

---

## Step 1: Create Cloudflare Account

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Create a free account
3. No credit card required for free tier

---

## Step 2: Create R2 Bucket

1. In Cloudflare Dashboard, click **R2** in the sidebar
2. Click **Create bucket**
3. Name it: `unruly-movies`
4. Click **Create bucket**

---

## Step 3: Enable Public Access

1. Go to your bucket **Settings**
2. Under **Public access**, click **Allow Access**
3. You'll get a public URL like: `https://pub-xxxxx.r2.dev`

---

## Step 4: Get API Credentials

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Give it **Object Read & Write** permissions
4. Save the:
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (from dashboard URL)

---

## Step 5: Add to Your .env File

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=unruly-movies
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

---

## Step 6: Upload Movies

### Option A: Cloudflare Dashboard (Easy)
1. Go to R2 → Your bucket
2. Click **Upload**
3. Select your movie file
4. Copy the public URL

### Option B: Use the Admin Panel
After setup, use your admin panel to upload movies directly.

---

## How to Use the Video URLs

Once uploaded, your videos will have URLs like:
```
https://pub-xxxxx.r2.dev/movies/the-great-battle.mp4
```

Just paste this URL in the admin panel when adding a movie!

---

## Free Tier Limits

| Resource | Free Allowance |
|----------|---------------|
| Storage | 10 GB |
| Class A ops (uploads) | 1 million/month |
| Class B ops (downloads) | 10 million/month |
| **Bandwidth** | **UNLIMITED FREE** |

For reference: A typical movie is 700MB-1.5GB. You can store 7-14 movies in the free tier.

---

## Pricing Beyond Free Tier

If you exceed free tier:
- Storage: $0.015/GB/month (very cheap)
- Bandwidth: **Still FREE!**

100GB storage = only $1.50/month with unlimited streaming!

---

## Alternative: Backblaze B2 + Cloudflare (Even Cheaper Storage)

For even cheaper storage with same free bandwidth:
- Backblaze B2: $0.005/GB/month (3x cheaper than R2)
- Use Cloudflare CDN in front (free bandwidth)

See: https://www.backblaze.com/b2/solutions/content-delivery.html
