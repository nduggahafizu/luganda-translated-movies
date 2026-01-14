# Unruly Movies - Android App

## Quick Build Guide

### Option 1: Use PWABuilder (Easiest - No coding needed!)

1. Go to **https://www.pwabuilder.com/**
2. Enter your URL: `https://translatedmovies.netlify.app`
3. Click **"Start"**
4. Click **"Package for stores"** → **"Android"**
5. Download the APK and AAB files
6. Install APK on your phone or upload AAB to Google Play Store

### Option 2: Use Bubblewrap CLI (For developers)

#### Prerequisites
- Node.js 14+
- Java JDK 11+
- Android SDK

#### Steps

```bash
# Install Bubblewrap
npm install -g @aspect-build/aspect-bubblewrap

# Navigate to android-app folder
cd android-app

# Initialize project (uses twa-manifest.json)
bubblewrap init --manifest https://translatedmovies.netlify.app/manifest.json

# Build APK
bubblewrap build

# Output: app-release-signed.apk
```

### Option 3: Build with Android Studio

1. Download Android Studio
2. Create new project → "Empty Activity"
3. Add TWA dependencies to build.gradle
4. Configure for your website URL
5. Build APK

---

## Digital Asset Links (REQUIRED for Play Store)

After building your app, you need to add asset links to your website.

### Get Your SHA-256 Fingerprint

When you build the APK, Bubblewrap will show you the SHA-256 fingerprint.
Example: `A1:B2:C3:D4:...`

### Add to Netlify

Create file: `/.well-known/assetlinks.json`

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.unrulymovies.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT_HERE"]
  }
}]
```

---

## App Store Publishing

### Google Play Store
- One-time $25 developer fee
- Upload AAB file (not APK)
- Takes 1-7 days for review

### Alternative Stores (Free)
- **APKPure** - Upload APK directly
- **Amazon Appstore** - Free for developers
- **Samsung Galaxy Store** - Free for developers
- **Huawei AppGallery** - Free for developers

### Direct Distribution
- Share APK file directly with users
- Host on your website for download
- Share via WhatsApp, Telegram, etc.

---

## App Configuration

| Setting | Value |
|---------|-------|
| Package ID | `com.unrulymovies.app` |
| App Name | Unruly Movies |
| Theme Color | #0a0a0a (dark) |
| Start URL | https://translatedmovies.netlify.app |
| Min SDK | Android 5.0 (API 21) |

---

## Quick APK Download Links

After building, you can host your APK at:
- `https://translatedmovies.netlify.app/downloads/unruly-movies.apk`

Create a downloads page on your site with install instructions.
