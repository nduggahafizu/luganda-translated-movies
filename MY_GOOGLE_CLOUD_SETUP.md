# 🚀 Your Personal Google Cloud Setup Guide

**Account**: nduggahafizu@gmail.com

This is your personalized step-by-step guide to set up Google Cloud Storage for Unruly Movies.

---

## ⏱️ Time Required: 30-45 minutes

---

## Step 1: Sign Up for Google Cloud (10 minutes)

### 1.1 Visit Google Cloud
1. Open your browser
2. Go to: **https://cloud.google.com/free**
3. Click **"Get started for free"** (big blue button)

### 1.2 Sign In
1. Use your Google account: **nduggahafizu@gmail.com**
2. Enter your password
3. Complete 2-factor authentication if enabled

### 1.3 Complete Registration
You'll need to provide:

**Country**: Select **Uganda** (or your current location)

**Account Type**: Select **Individual**

**Payment Information**:
- Credit or Debit card required
- ⚠️ **Don't worry**: You won't be charged during free tier
- Google needs it for verification only
- You get **$300 FREE credit** for 90 days!

**Billing Address**:
- Enter your address in Uganda
- Phone number: Your mobile number

**Agree to Terms**:
- ✅ Check "I agree to the Terms of Service"
- Click **"Start my free trial"**

### 1.4 Verify Your Account
- Google may send SMS verification
- Enter the code you receive
- Click **"Verify"**

✅ **Success!** You now have:
- $300 free credit (90 days)
- Always Free tier (5GB storage forever)
- Access to all Google Cloud services

---

## Step 2: Create Your Project (5 minutes)

### 2.1 Access Google Cloud Console
1. You should be at: **https://console.cloud.google.com**
2. If not, go there and sign in with **nduggahafizu@gmail.com**

### 2.2 Create New Project
1. Look at the top left, next to "Google Cloud"
2. Click the **project dropdown** (says "Select a project")
3. Click **"NEW PROJECT"** button (top right of popup)

### 2.3 Project Details
**Project name**: Enter `unruly-movies`

**Project ID**: Will auto-generate as `unruly-movies-XXXXXX`
- ⚠️ **IMPORTANT**: Copy this ID! You'll need it later
- Example: `unruly-movies-123456`

**Location**: Leave as "No organization"

Click **"CREATE"**

### 2.4 Wait for Project Creation
- Takes 10-30 seconds
- You'll see a notification when ready
- Click **"SELECT PROJECT"** in the notification

✅ **Your project is ready!**

**Write down your Project ID here:**
```
Project ID: unruly-movies-______
```

---

## Step 3: Enable Billing (2 minutes)

### 3.1 Link Billing Account
1. In the console, click the **☰ menu** (top left)
2. Go to **"Billing"**
3. Click **"Link a billing account"**
4. Select your billing account (should be auto-created)
5. Click **"SET ACCOUNT"**

✅ **Billing enabled!** (Using your $300 free credit)

---

## Step 4: Create Storage Bucket (5 minutes)

### 4.1 Navigate to Cloud Storage
1. Click **☰ menu** (top left)
2. Scroll down to **"Storage"** section
3. Click **"Cloud Storage"** → **"Buckets"**
4. Click **"CREATE BUCKET"** button

### 4.2 Bucket Configuration

**Step 1: Name your bucket**
- **Name**: `unruly-movies-ug` (or try `unruly-movies-uganda`)
- If taken, try: `unruly-movies-2025`, `unruly-movies-hafizu`
- ⚠️ **IMPORTANT**: Write down the exact name!
- Click **"CONTINUE"**

**Step 2: Choose where to store your data**
- **Location type**: Select **"Region"**
- **Location**: Select **"us-central1 (Iowa)"** (cheapest option)
- Click **"CONTINUE"**

**Step 3: Choose a storage class**
- Select **"Standard"**
- Click **"CONTINUE"**

**Step 4: Control access to objects**
- Select **"Uniform"**
- Uncheck "Enforce public access prevention"
- Click **"CONTINUE"**

**Step 5: Protect object data**
- Leave all as default (None)
- Click **"CREATE"**

✅ **Your bucket is created!**

**Write down your Bucket Name here:**
```
Bucket Name: unruly-movies-______
```

---

## Step 5: Create Service Account (10 minutes)

This is the most important step - it allows your backend to access Google Cloud Storage.

### 5.1 Navigate to Service Accounts
1. Click **☰ menu** (top left)
2. Go to **"IAM & Admin"** → **"Service Accounts"**
3. Click **"CREATE SERVICE ACCOUNT"** (top)

### 5.2 Service Account Details
**Step 1: Service account details**
- **Service account name**: `unruly-backend`
- **Service account ID**: Will auto-fill as `unruly-backend`
- **Description**: `Backend service for Unruly Movies platform`
- Click **"CREATE AND CONTINUE"**

**Step 2: Grant this service account access**
- Click **"Select a role"** dropdown
- Type "Storage Admin" in the search
- Select **"Storage Admin"** (under Cloud Storage)
- Click **"CONTINUE"**

**Step 3: Grant users access** (optional)
- Leave empty
- Click **"DONE"**

### 5.3 Create Service Account Key
1. You'll see your new service account in the list
2. Find the row with **unruly-backend@unruly-movies-XXXXXX.iam.gserviceaccount.com**
3. Click the **three dots (⋮)** on the right
4. Click **"Manage keys"**
5. Click **"ADD KEY"** → **"Create new key"**
6. Select **"JSON"** format
7. Click **"CREATE"**

### 5.4 Save the Key File
- A JSON file will download automatically
- **File name**: Something like `unruly-movies-123456-abc123def456.json`
- ⚠️ **VERY IMPORTANT**: 
  - Rename it to: `gcp-service-key.json`
  - Move it to: `C:\Users\dell\OneDrive\Desktop\unruly\server\config\gcp-service-key.json`

**Create the config folder if it doesn't exist:**
```bash
mkdir server\config
```

**Move the file:**
```bash
move Downloads\unruly-movies-*.json server\config\gcp-service-key.json
```

✅ **Service account key saved!**

⚠️ **SECURITY WARNING**: 
- Never share this file
- Never commit it to Git (already in .gitignore)
- Keep it secure!

---

## Step 6: Configure Your Project (5 minutes)

### 6.1 Run Setup Script
Open Command Prompt in your project folder and run:

```bash
cd C:\Users\dell\OneDrive\Desktop\unruly
setup-google-cloud.bat
```

This will:
- Install required packages
- Create necessary folders
- Set up .env template

### 6.2 Update Environment Variables

Open `server\.env` file and update these values:

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=unruly-movies-XXXXXX
GCS_BUCKET_NAME=unruly-movies-ug
GCS_KEY_FILE=./config/gcp-service-key.json
GCS_PUBLIC_URL=https://storage.googleapis.com/unruly-movies-ug

# Other existing variables (keep as is)
PORT=5000
MONGODB_URI=mongodb://localhost:27017/unruly-movies
JWT_SECRET=your_secure_random_string_here
```

**Replace**:
- `unruly-movies-XXXXXX` with your actual Project ID from Step 2
- `unruly-movies-ug` with your actual Bucket Name from Step 4

### 6.3 Generate JWT Secret

Run this in Command Prompt to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and paste it as your `JWT_SECRET` in `.env`

✅ **Configuration complete!**

---

## Step 7: Test Your Setup (5 minutes)

### 7.1 Run the Test Script

```bash
cd server
node tests/testGCS.js
```

### 7.2 Expected Output

You should see:

```
============================================================
Google Cloud Storage Integration Test
============================================================

[Test 1] Checking environment variables...
✓ GCS_PROJECT_ID is set: unruly-movies-XXXXXX
✓ GCS_BUCKET_NAME is set: unruly-movies-ug

[Test 2] Creating test file...
✓ Test file created

[Test 3] Uploading file to Google Cloud Storage...
✓ File uploaded successfully!

... (more tests)

============================================================
All tests completed successfully! ✓
============================================================
```

✅ **If all tests pass, you're ready to go!**

### 7.3 If Tests Fail

**Error: "Service account key not found"**
- Check file is at: `server\config\gcp-service-key.json`
- Verify the path in `.env` is correct

**Error: "Permission denied (403)"**
- Go back to Step 5 and verify service account has "Storage Admin" role
- Check billing is enabled

**Error: "Bucket not found (404)"**
- Verify bucket name in `.env` matches exactly
- Check bucket exists in Google Cloud Console

---

## Step 8: Start Your Server (2 minutes)

### 8.1 Update server.js

Open `server/server.js` and add this line with other route imports:

```javascript
const uploadRoutes = require('./routes/upload');
```

And add this line with other route registrations:

```javascript
app.use('/api/upload', uploadRoutes);
```

### 8.2 Start the Server

```bash
cd server
npm start
```

You should see:

```
Server running on port 5000
MongoDB connected
Google Cloud Storage initialized
```

✅ **Your server is running with Google Cloud Storage!**

---

## 🎉 Success! What You Can Do Now

### Upload Your First Movie

1. **Prepare a test video** (any MP4 file)
2. **Get authentication token** (login to get JWT)
3. **Upload using API**:

```bash
curl -X POST http://localhost:5000/api/upload/movie ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN" ^
  -F "movie=@path/to/movie.mp4" ^
  -F "movieId=YOUR_MOVIE_ID" ^
  -F "quality=hd" ^
  -F "type=original"
```

### Get Streaming URL

```bash
curl http://localhost:5000/api/upload/stream/YOUR_MOVIE_ID ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Check Storage Stats

```bash
curl http://localhost:5000/api/upload/stats ^
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Monitor Your Usage

### Check Storage Usage
1. Go to: https://console.cloud.google.com/storage
2. Click on your bucket: `unruly-movies-ug`
3. See total size and file count

### Check Costs
1. Go to: https://console.cloud.google.com/billing
2. Click "Reports"
3. View your spending (should be $0 during free tier)

### Set Up Billing Alerts
1. Go to: https://console.cloud.google.com/billing
2. Click "Budgets & alerts"
3. Click "CREATE BUDGET"
4. Set alerts at: $1, $5, $10

---

## 💰 Your Free Tier Benefits

### What You Get FREE Forever
- ✅ 5 GB storage per month
- ✅ 1 GB bandwidth per month (North America)
- ✅ 5,000 uploads per month
- ✅ 50,000 downloads per month

### Plus $300 Credit (90 Days)
- ✅ Valid until: [90 days from signup]
- ✅ Use for any Google Cloud service
- ✅ No automatic charges after expiry

### What This Means for You
- Store **2-3 HD movies** free forever
- Serve **~500 video views** per month free
- Perfect for testing and initial launch
- Scale up when you're ready

---

## 🔒 Security Checklist

- [x] Service account key saved securely
- [x] Key file in .gitignore
- [x] Environment variables configured
- [ ] Enable 2-factor authentication on Google account
- [ ] Set up billing alerts
- [ ] Review access logs regularly
- [ ] Rotate service account keys every 90 days

---

## 📞 Need Help?

### Common Issues

**Can't access Google Cloud Console**
- Clear browser cache
- Try incognito mode
- Use Chrome browser

**Billing verification failed**
- Try a different card
- Contact Google Cloud support
- Use PayPal if available

**Tests are failing**
- Double-check all values in `.env`
- Verify service account key location
- Check bucket name matches exactly

### Support Resources
- **Google Cloud Support**: https://cloud.google.com/support
- **Documentation**: https://cloud.google.com/storage/docs
- **Community**: https://stackoverflow.com/questions/tagged/google-cloud-storage

---

## ✅ Setup Complete!

Congratulations! You now have:
- ✅ Google Cloud account with $300 credit
- ✅ Project: `unruly-movies-XXXXXX`
- ✅ Storage bucket: `unruly-movies-ug`
- ✅ Service account configured
- ✅ Backend integration working
- ✅ Ready to upload movies!

**Next Steps**:
1. Upload your first test movie
2. Test streaming in your video player
3. Monitor usage and costs
4. Start building your movie library!

---

**Account**: nduggahafizu@gmail.com
**Setup Date**: January 2025
**Status**: ✅ Ready for Production

🎬 **Happy Streaming!**
