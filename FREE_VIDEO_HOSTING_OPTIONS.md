# Free Video Hosting Options for Movie Streaming (No Ads)

## 🏆 RECOMMENDED OPTIONS (Best for Streaming Sites)

---

## 1. ⭐ Cloudflare R2 (BEST CHOICE)

**Why it's the best:**
- ✅ **FREE bandwidth** (unlimited egress!)
- ✅ 10GB free storage per month
- ✅ No ads whatsoever
- ✅ Super fast global CDN
- ✅ Direct MP4 links work perfectly

**Costs:**
- Storage: FREE first 10GB, then $0.015/GB/month
- Bandwidth: **ALWAYS FREE** (no egress fees!)

**Setup:** See `CLOUDFLARE_R2_SETUP.md` in this project.

---

## 2. 🎬 Internet Archive (archive.org)

**Why it's great:**
- ✅ **Completely free** (unlimited storage!)
- ✅ No ads
- ✅ Direct MP4 links
- ✅ Good global CDN
- ✅ No bandwidth limits

**Limitations:**
- Files are publicly viewable (not private)
- Upload can be slow
- Content must comply with their terms

**How to use:**
1. Create free account at https://archive.org/account/signup
2. Click "Upload" → Choose files
3. Set metadata (title, description)
4. After upload, get direct link: `https://archive.org/download/[identifier]/[filename].mp4`

**Embed in your site:**
```javascript
const embedUrl = 'https://archive.org/download/your-upload-id/movie.mp4';
```

---

## 3. 📱 Telegram (Unlimited Storage!)

**Why it's powerful:**
- ✅ **Unlimited storage** (really!)
- ✅ No ads
- ✅ Fast CDN
- ✅ Files up to 2GB each
- ✅ Can get direct download links

**How to use:**
1. Create a Telegram channel (can be private)
2. Upload videos to the channel
3. Use a Telegram bot or API to get direct links
4. Or use services like `tg-upload` to get direct URLs

**Getting Direct Links:**
```bash
# Using Telegram Bot API
# After uploading to channel, use getFile API to get direct link
```

**Integration example:**
```javascript
// Telegram direct link format:
// https://api.telegram.org/file/bot<TOKEN>/<file_path>
```

---

## 4. 🔵 Google Drive (15GB Free)

**Why it works:**
- ✅ 15GB free storage
- ✅ No ads
- ✅ Reliable & fast
- ✅ Good quality streaming

**Limitations:**
- Bandwidth limits (may block after heavy use)
- Requires link conversion for direct playback

**How to use:**
1. Upload video to Google Drive
2. Set sharing to "Anyone with link"
3. Get the file ID from the share link
4. Convert to direct link:

```javascript
// Google Drive share link:
// https://drive.google.com/file/d/FILE_ID/view

// Convert to direct playback link:
const fileId = '1abc123xyz...';
const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

// Or for streaming:
const streamUrl = `https://drive.google.com/file/d/${fileId}/preview`;
```

**Embed code:**
```html
<iframe src="https://drive.google.com/file/d/FILE_ID/preview" width="100%" height="480" allowfullscreen></iframe>
```

---

## 5. 💜 Streamable (Free Tier)

**Features:**
- ✅ No ads on uploaded videos
- ✅ Easy embed links
- ✅ Good quality

**Limitations:**
- 10 min video limit (free)
- Videos expire after 90 days of no views
- Limited storage

**Direct embed:**
```html
<iframe src="https://streamable.com/e/VIDEO_ID" allowfullscreen></iframe>
```

---

## 6. 🔥 BunnyCDN (Ultra Cheap, Not Free)

**Why consider it:**
- 14-day free trial
- $0.01/GB bandwidth (super cheap!)
- $0.02/GB storage
- Lightning fast global CDN
- Professional video streaming features

**Best for:** When you outgrow free options

---

## 7. 🅱️ Backblaze B2 + Cloudflare (Free Bandwidth!)

**How it works:**
- Backblaze B2: 10GB free storage
- Cloudflare: FREE bandwidth (Bandwidth Alliance)
- Combined: Free storage + free bandwidth!

**Setup:**
1. Create Backblaze B2 account (10GB free)
2. Create bucket, upload videos
3. Set up Cloudflare in front of B2
4. All downloads go through Cloudflare = FREE!

---

## COMPARISON TABLE

| Option | Storage | Bandwidth | Ads | Max File | Best For |
|--------|---------|-----------|-----|----------|----------|
| **Cloudflare R2** | 10GB free | ∞ FREE | None | 5GB | Production sites |
| **archive.org** | Unlimited | Free | None | 2GB+ | Public content |
| **Telegram** | Unlimited | Free | None | 2GB | Private hosting |
| **Google Drive** | 15GB | Limited | None | 5TB | Small sites |
| **Streamable** | Limited | Free | None | 250MB | Short clips |
| **B2+Cloudflare** | 10GB | FREE | None | 5GB | Production |

---

## 🚀 QUICK START: Using Cloudflare R2

Since R2 is already integrated in this project:

### Step 1: Create Cloudflare Account
```
1. Go to https://dash.cloudflare.com/sign-up
2. Create free account
3. Go to R2 → Create bucket → name it "movies"
```

### Step 2: Get API Keys
```
1. R2 → Manage R2 API Tokens
2. Create API Token with Object Read & Write
3. Copy Access Key ID and Secret Access Key
4. Copy Account ID from the URL
```

### Step 3: Add to .env
```env
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_ACCOUNT_ID=your_account_id
R2_BUCKET_NAME=movies
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

### Step 4: Upload Videos
Use the admin panel or API:
```javascript
// Upload via API
const formData = new FormData();
formData.append('video', file);

fetch('/api/r2/upload', {
    method: 'POST',
    body: formData
});
```

### Step 5: Use in Movies
```javascript
// Add movie with R2 URL
{
    embedUrl: 'https://pub-xxxxx.r2.dev/movies/movie-title.mp4',
    embedType: 'direct'
}
```

---

## 🎯 RECOMMENDATION BY USE CASE

| Your Situation | Best Option |
|----------------|-------------|
| Just starting out | Google Drive or archive.org |
| Need unlimited storage | archive.org or Telegram |
| Want best performance | Cloudflare R2 |
| Have some budget | BunnyCDN |
| Production site | Cloudflare R2 or B2+Cloudflare |

---

## ⚠️ Important Notes

1. **Copyright:** Always ensure you have rights to host the content
2. **Terms of Service:** Each platform has rules - read them
3. **Bandwidth:** Free options may have hidden limits
4. **Reliability:** Paid options are more reliable long-term

---

## Need Help Setting Up?

The project already has:
- ✅ R2 upload routes (`/api/r2/*`)
- ✅ Video proxy for extraction
- ✅ Admin panel for uploads

Just configure your `.env` with the credentials from your chosen platform!
