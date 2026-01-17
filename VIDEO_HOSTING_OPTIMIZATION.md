# Video Hosting Optimization for African Users

## Problem
Videos from Archive.org and Streamtape load slowly for users in Uganda because:
- Archive.org servers are in the US (San Francisco)
- Streamtape servers are in Europe
- Geographic distance = high latency (500-1000ms+ ping)
- No edge caching near Africa

## Best Solutions for African Video Delivery

### Option 1: Bunny.net CDN (RECOMMENDED)
**Best for: Fast setup, great African coverage, pay-as-you-go**

**Pricing:**
- Storage: $0.01/GB/month
- Bandwidth (Africa): ~$0.06/GB
- No minimum commitment

**African Edge Locations:**
- ✅ Johannesburg, South Africa
- ✅ Lagos, Nigeria
- ✅ Cairo, Egypt
- ✅ Nairobi, Kenya (close to Uganda!)

**Setup Steps:**
1. Create account at https://bunny.net
2. Create a "Storage Zone" (e.g., `unruly-videos`)
3. Connect to a "Pull Zone" (CDN)
4. Upload videos via FTP or API
5. Update movie URLs to use: `https://unruly-videos.b-cdn.net/video-name.mp4`

**Integration Code for Admin Panel:**
```javascript
// Add to admin-movies.html for Bunny.net upload
const BUNNY_API_KEY = 'your-api-key';
const BUNNY_STORAGE_ZONE = 'unruly-videos';
const BUNNY_CDN_URL = 'https://unruly-videos.b-cdn.net';

async function uploadToBunny(file, movieId) {
    const fileName = `${movieId}-${Date.now()}.mp4`;
    
    const response = await fetch(
        `https://storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`,
        {
            method: 'PUT',
            headers: {
                'AccessKey': BUNNY_API_KEY,
                'Content-Type': 'video/mp4'
            },
            body: file
        }
    );
    
    if (response.ok) {
        return `${BUNNY_CDN_URL}/${fileName}`;
    }
    throw new Error('Upload failed');
}
```

---

### Option 2: Cloudflare R2 + Cloudflare CDN (Most Cost-Effective)
**Best for: Zero egress costs, good global coverage**

**Pricing:**
- Storage: $0.015/GB/month
- Egress: FREE! (unlimited bandwidth)
- 10GB free forever

**Setup Steps:**
1. Create Cloudflare account at https://cloudflare.com
2. Enable R2 Storage in dashboard
3. Create a bucket (e.g., `unruly-videos`)
4. Add custom domain for CDN: `videos.unrulymovies.com`
5. Upload videos via S3-compatible API

**Integration Code:**
```javascript
// Using S3 SDK for R2 uploads
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY
    }
});

async function uploadToR2(file, movieId) {
    const fileName = `${movieId}.mp4`;
    
    await r2Client.send(new PutObjectCommand({
        Bucket: 'unruly-videos',
        Key: fileName,
        Body: file,
        ContentType: 'video/mp4'
    }));
    
    return `https://videos.unrulymovies.com/${fileName}`;
}
```

---

### Option 3: Backblaze B2 + Cloudflare (Budget Option)
**Best for: Cheapest storage, free CDN via Cloudflare**

**Pricing:**
- Storage: $0.006/GB/month (cheapest!)
- First 10GB free forever
- Free egress via Cloudflare (Bandwidth Alliance)

**Setup:**
1. Create B2 account at https://backblaze.com/b2
2. Create bucket: `unruly-videos`
3. Connect to Cloudflare (free egress through Bandwidth Alliance)
4. Add CNAME: `videos.unrulymovies.com` → B2 bucket

---

### Option 4: Google Cloud Storage (Enterprise)
**Best for: Reliability, African region (South Africa)**

**Pricing:**
- Standard: $0.02/GB/month
- Egress to Africa: ~$0.12/GB

**African Region:** `africa-south1` (Johannesburg)

---

## Recommended Implementation for Unruly Movies

### Phase 1: Quick Win (No code changes)
Use **Cloudflare** in front of Archive.org:
1. Add your domain to Cloudflare (free plan)
2. Enable "Tiered Cache" (caches at edge including Africa)
3. This proxies Archive.org through Cloudflare's global CDN

### Phase 2: Bunny.net Integration (Best for new uploads)

**Step 1: Add Bunny.net config to backend**

Create `server/config/bunny.js`:
```javascript
module.exports = {
    apiKey: process.env.BUNNY_API_KEY,
    storageZone: process.env.BUNNY_STORAGE_ZONE || 'unruly-videos',
    cdnUrl: process.env.BUNNY_CDN_URL || 'https://unruly-videos.b-cdn.net'
};
```

**Step 2: Add to .env on Railway:**
```env
BUNNY_API_KEY=your-bunny-api-key
BUNNY_STORAGE_ZONE=unruly-videos
BUNNY_CDN_URL=https://unruly-videos.b-cdn.net
```

**Step 3: Update video URL in movies**

Your player already supports direct URLs. Just update the movie's `video.embedUrl` to the Bunny CDN URL:
```
https://unruly-videos.b-cdn.net/movie-name.mp4
```

---

## Quick Comparison Table

| Service | Storage | Egress (Africa) | African Edge | Best For |
|---------|---------|-----------------|--------------|----------|
| **Bunny.net** | $0.01/GB | $0.06/GB | ✅ Nairobi | Speed + Simplicity |
| **Cloudflare R2** | $0.015/GB | FREE | ⚠️ Limited | Cost savings |
| **Backblaze B2** | $0.006/GB | FREE (via CF) | ⚠️ Via CF | Cheapest |
| **Archive.org** | Free | Free | ❌ None | Current (slow) |

---

## Next Steps

1. **Sign up for Bunny.net** (recommended) - https://bunny.net
   - Get API key from dashboard
   - Create storage zone: `unruly-videos`
   - Create pull zone (CDN)

2. **Add environment variables to Railway:**
   ```
   BUNNY_API_KEY=xxx
   BUNNY_STORAGE_ZONE=unruly-videos
   BUNNY_CDN_URL=https://unruly-videos.b-cdn.net
   ```

3. **Upload videos to Bunny:**
   - Use their web dashboard, or
   - Use FTP, or
   - Integrate API in admin panel

4. **Update movie URLs** in MongoDB:
   - Change `video.embedUrl` from Archive.org to Bunny CDN URL
   - Example: `https://unruly-videos.b-cdn.net/my-movie.mp4`

---

## Estimated Costs for Unruly Movies

Assuming 100 movies, 2GB each = 200GB storage, 500GB/month bandwidth:

| Service | Monthly Storage | Monthly Bandwidth | **Total/Month** |
|---------|----------------|-------------------|-----------------|
| Bunny.net | $2 | $30 | **~$32** |
| Cloudflare R2 | $3 | FREE | **~$3** |
| Backblaze + CF | $1.20 | FREE | **~$1.20** |
| Google Cloud | $4 | $60 | **~$64** |

**Recommendation:** Start with **Cloudflare R2** for the lowest cost with free bandwidth!
