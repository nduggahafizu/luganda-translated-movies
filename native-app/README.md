# Unruly Movies Native Android App

This is a **real native Android app** using Capacitor, with full support for:
- ✅ Push Notifications (works when app is closed)
- ✅ Permission dialogs (like native apps)
- ✅ Background processes
- ✅ No web bar - full native experience
- ✅ Splash screen
- ✅ Status bar customization

## Prerequisites

1. **Android Studio** - Download from https://developer.android.com/studio
2. **Java JDK 17+** - Usually comes with Android Studio

## Build Steps

### Option 1: Using Android Studio (Recommended)

1. **Open the project in Android Studio:**
   ```bash
   cd native-app
   npx cap open android
   ```

2. **Wait for Gradle sync** to complete (may take a few minutes)

3. **Build APK:**
   - Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
   - APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Build Signed Release APK:**
   - Go to **Build → Generate Signed Bundle / APK**
   - Choose **APK**
   - Create new keystore or use existing
   - Complete the wizard

### Option 2: Command Line Build

```bash
# Sync web content
npx cap sync android

# Build debug APK
cd android
gradlew assembleDebug

# Build release APK
gradlew assembleRelease
```

## Push Notifications Setup

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project: "Unruly Movies"
3. Add Android app with package: `com.unrulymovies.app`
4. Download `google-services.json`
5. Place it in: `android/app/google-services.json`

### 2. Enable Cloud Messaging
1. In Firebase Console → Project Settings → Cloud Messaging
2. Copy the **Server Key**
3. Add to your backend for sending notifications

### 3. Send Test Notification

From your server/backend:
```javascript
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Send notification
async function sendNotification(token, title, body, data = {}) {
  await admin.messaging().send({
    token: token,
    notification: { title, body },
    data: data,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'unruly_movies'
      }
    }
  });
}

// Example: Notify about new movie
sendNotification(
  userToken,
  '🎬 New Movie Added!',
  'John Wick 4 is now available in Luganda',
  { movieId: '123', url: '/movie-details.html?id=123' }
);
```

## Configuration Files

### capacitor.config.json
- `server.url`: Points to your live website
- `appId`: Package name (com.unrulymovies.app)
- `plugins`: Notification and splash settings

### AndroidManifest.xml
- Permissions for notifications, vibration, wake lock
- Boot receiver for persistent notifications

## App Signing

For Play Store release, you need a signing key:

```bash
keytool -genkey -v -keystore unruly-release.keystore -alias unruly -keyalg RSA -keysize 2048 -validity 10000
```

Store these credentials safely:
- Keystore file
- Keystore password
- Key alias
- Key password

## Updating the App

When you update the website:
1. Push changes to Netlify/Cloudflare
2. The app auto-loads the latest content (no app update needed!)

For native code changes:
1. Run `npx cap sync android`
2. Rebuild the APK
3. Distribute to users

## Testing Notifications

1. Install the debug APK on your phone
2. Open the app - it will ask for notification permission
3. Check console logs for push token
4. Use Firebase Console to send test notification

## Troubleshooting

**App crashes on launch:**
- Check Android Studio Logcat for errors
- Verify website URL is accessible

**Notifications not working:**
- Verify google-services.json is in place
- Check Firebase project configuration
- Ensure POST_NOTIFICATIONS permission is granted

**White screen:**
- Check internet connection
- Verify capacitor.config.json server URL

## File Structure

```
native-app/
├── android/                 # Android Studio project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/         # Icons, splash
│   │   └── google-services.json  # Add Firebase config here
├── www/                     # Placeholder (loads from URL)
├── capacitor.config.json    # Capacitor settings
└── package.json             # Build scripts
```
