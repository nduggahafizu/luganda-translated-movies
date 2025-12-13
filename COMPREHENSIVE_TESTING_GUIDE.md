# 🧪 Comprehensive Testing Guide - Uganda TV Streaming

## ⏱️ Before You Start

**Wait for Netlify Deployment:**
1. Go to https://app.netlify.com/
2. Check your site's deploys
3. Wait for the latest deploy to show "Published" status
4. Look for commits: "FIX: Correct invalid redirect rule" and "FIX: Add HLS.js support"

**Estimated wait time:** 1-2 minutes from when changes were pushed

---

## 🧹 Step 0: Clear Browser Cache (CRITICAL!)

**Before testing, you MUST clear your browser cache:**

### Chrome/Edge:
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

### Firefox:
1. Press `Ctrl + Shift + Delete`
2. Select "Cache"
3. Click "Clear Now"

### Safari:
1. Press `Cmd + Option + E`
2. Or Safari → Clear History

**Alternative:** Use Incognito/Private browsing mode

---

## 📋 Testing Checklist

### ✅ Phase 1: Website Access & Navigation

#### Test 1.1: Homepage Access
- [ ] Visit: `https://watch.unrulymovies.com`
- [ ] **Expected:** Site loads without errors
- [ ] **Expected:** No `ERR_INVALID_REDIRECT` error
- [ ] **Expected:** Homepage displays correctly
- [ ] **Result:** _______________

#### Test 1.2: Navigation Menu
- [ ] Click "Home" link
- [ ] Click "Movies" link
- [ ] Click "Series" link
- [ ] Click "Uganda TV" link
- [ ] **Expected:** All links work, no 404 errors
- [ ] **Result:** _______________

#### Test 1.3: Page Loading
- [ ] Visit: `https://watch.unrulymovies.com/movies.html`
- [ ] Visit: `https://watch.unrulymovies.com/series.html`
- [ ] Visit: `https://watch.unrulymovies.com/uganda-tv.html`
- [ ] **Expected:** All pages load correctly
- [ ] **Result:** _______________

---

### ✅ Phase 2: Uganda TV Page

#### Test 2.1: Uganda TV Page Display
- [ ] Visit: `https://watch.unrulymovies.com/uganda-tv.html`
- [ ] **Expected:** Page loads without errors
- [ ] **Expected:** Hero section displays with title "Uganda TV Stations"
- [ ] **Expected:** All TV station cards are visible
- [ ] **Result:** _______________

#### Test 2.2: TV Station Cards
Verify all 12 stations display:
- [ ] NTV Uganda card visible
- [ ] NBS TV card visible
- [ ] UBC TV card visible
- [ ] Bukedde TV card visible
- [ ] Urban TV card visible
- [ ] Spark TV card visible
- [ ] TV West card visible
- [ ] Salt TV card visible
- [ ] TV East card visible
- [ ] BBS TV card visible
- [ ] TV North card visible
- [ ] Wan Luo TV card visible
- [ ] **Expected:** All cards show station logo, name, description, and "Watch Now" button
- [ ] **Result:** _______________

#### Test 2.3: Station Images
- [ ] Check if station logos/images load
- [ ] **Expected:** Images display (or placeholder if image URL is broken)
- [ ] **Result:** _______________

---

### ✅ Phase 3: Video Player - Individual Station Tests

#### Test 3.1: NTV Uganda
- [ ] Click "Watch Now" on NTV Uganda
- [ ] **Expected:** Redirects to player page
- [ ] **Expected:** URL contains `?station=ntv-uganda`
- [ ] **Expected:** Page title shows "NTV Uganda" or similar
- [ ] **Expected:** Video player is visible
- [ ] **Expected:** Stream starts loading (may take 5-10 seconds)
- [ ] **Expected:** Video plays OR shows play button
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.2: NBS TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on NBS TV
- [ ] **Expected:** Player loads with NBS TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.3: UBC TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on UBC TV
- [ ] **Expected:** Player loads with UBC TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.4: Bukedde TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on Bukedde TV
- [ ] **Expected:** Player loads with Bukedde TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.5: Urban TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on Urban TV
- [ ] **Expected:** Player loads with Urban TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.6: Spark TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on Spark TV
- [ ] **Expected:** Player loads with Spark TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.7: TV West
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on TV West
- [ ] **Expected:** Player loads with TV West stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.8: Salt TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on Salt TV
- [ ] **Expected:** Player loads with Salt TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.9: TV East
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on TV East
- [ ] **Expected:** Player loads with TV East stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.10: BBS TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on BBS TV
- [ ] **Expected:** Player loads with BBS TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.11: TV North
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on TV North
- [ ] **Expected:** Player loads with TV North stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

#### Test 3.12: Wan Luo TV
- [ ] Go back to uganda-tv.html
- [ ] Click "Watch Now" on Wan Luo TV
- [ ] **Expected:** Player loads with Wan Luo TV stream
- [ ] **Result:** _______________
- [ ] **Stream Status:** ☐ Playing ☐ Buffering ☐ Error ☐ Offline

---

### ✅ Phase 4: Player Controls (Test with any working stream)

#### Test 4.1: Play/Pause Button
- [ ] Click play button (if not auto-playing)
- [ ] **Expected:** Video starts playing
- [ ] Click pause button
- [ ] **Expected:** Video pauses
- [ ] **Result:** _______________

#### Test 4.2: Progress Bar
- [ ] Hover over progress bar
- [ ] **Expected:** Progress bar becomes visible
- [ ] Click on different positions in progress bar
- [ ] **Expected:** Video seeks to clicked position (may not work for live streams)
- [ ] **Result:** _______________

#### Test 4.3: Volume Control
- [ ] Click volume button
- [ ] **Expected:** Video mutes/unmutes
- [ ] Click on volume slider
- [ ] **Expected:** Volume changes
- [ ] **Result:** _______________

#### Test 4.4: Fullscreen
- [ ] Click fullscreen button
- [ ] **Expected:** Video goes fullscreen
- [ ] Press ESC or click fullscreen button again
- [ ] **Expected:** Exits fullscreen
- [ ] **Result:** _______________

#### Test 4.5: Keyboard Shortcuts
- [ ] Press Space bar
- [ ] **Expected:** Play/Pause toggles
- [ ] Press 'F' key
- [ ] **Expected:** Fullscreen toggles
- [ ] Press 'M' key
- [ ] **Expected:** Mute toggles
- [ ] Press Right Arrow
- [ ] **Expected:** Seeks forward 10 seconds (may not work for live)
- [ ] Press Left Arrow
- [ ] **Expected:** Seeks backward 10 seconds (may not work for live)
- [ ] **Result:** _______________

---

### ✅ Phase 5: Browser Console Check

#### Test 5.1: Console Errors
- [ ] Press F12 to open Developer Tools
- [ ] Go to Console tab
- [ ] Refresh the page
- [ ] **Expected:** No critical errors (warnings are okay)
- [ ] **Look for:** HLS.js messages (should show "HLS stream loaded successfully")
- [ ] **Result:** _______________
- [ ] **Errors Found:** _______________

#### Test 5.2: Network Tab
- [ ] Go to Network tab in Developer Tools
- [ ] Filter by "m3u8" or "media"
- [ ] **Expected:** See HLS stream requests
- [ ] **Expected:** Status 200 for successful streams
- [ ] **Result:** _______________

---

### ✅ Phase 6: Error Handling

#### Test 6.1: Offline Stream Handling
- [ ] If any stream shows as offline/error
- [ ] **Expected:** User-friendly error message displays
- [ ] **Expected:** Message says something like "Stream unavailable" or "Error loading stream"
- [ ] **Result:** _______________

#### Test 6.2: Network Error Recovery
- [ ] While a stream is playing, briefly disconnect internet
- [ ] Reconnect internet
- [ ] **Expected:** Stream attempts to recover automatically
- [ ] **Result:** _______________

---

### ✅ Phase 7: Mobile Testing (If Possible)

#### Test 7.1: Mobile Access
- [ ] Open site on mobile device
- [ ] Visit uganda-tv.html
- [ ] **Expected:** Page is responsive
- [ ] **Expected:** TV station cards display properly
- [ ] **Result:** _______________

#### Test 7.2: Mobile Player
- [ ] Click any TV station on mobile
- [ ] **Expected:** Player loads
- [ ] **Expected:** Touch controls work
- [ ] **Expected:** Video plays
- [ ] **Result:** _______________

---

### ✅ Phase 8: Cross-Browser Testing

#### Test 8.1: Chrome
- [ ] Test in Google Chrome
- [ ] **Expected:** All features work
- [ ] **Result:** _______________

#### Test 8.2: Firefox
- [ ] Test in Mozilla Firefox
- [ ] **Expected:** All features work
- [ ] **Result:** _______________

#### Test 8.3: Edge
- [ ] Test in Microsoft Edge
- [ ] **Expected:** All features work
- [ ] **Result:** _______________

#### Test 8.4: Safari (if available)
- [ ] Test in Safari
- [ ] **Expected:** All features work (uses native HLS)
- [ ] **Result:** _______________

---

## 📊 Test Results Summary

### Overall Results:
- **Total Tests:** 50+
- **Passed:** _____
- **Failed:** _____
- **Skipped:** _____

### Critical Issues Found:
1. _______________
2. _______________
3. _______________

### Minor Issues Found:
1. _______________
2. _______________
3. _______________

### Streams Working:
- [ ] NTV Uganda
- [ ] NBS TV
- [ ] UBC TV
- [ ] Bukedde TV
- [ ] Urban TV
- [ ] Spark TV
- [ ] TV West
- [ ] Salt TV
- [ ] TV East
- [ ] BBS TV
- [ ] TV North
- [ ] Wan Luo TV

**Total Working Streams:** _____ / 12

---

## 🐛 Issue Reporting Template

If you find any issues, report them using this format:

**Issue #1:**
- **Severity:** ☐ Critical ☐ Major ☐ Minor
- **Location:** (e.g., uganda-tv.html, player.html)
- **Description:** 
- **Steps to Reproduce:**
  1. 
  2. 
  3. 
- **Expected Behavior:** 
- **Actual Behavior:** 
- **Browser:** 
- **Screenshot/Error Message:** 

---

## ✅ Success Criteria

The testing is considered successful if:

1. ✅ Website loads without redirect errors
2. ✅ Uganda TV page displays all 12 stations
3. ✅ At least 8/12 streams are working (some may be offline)
4. ✅ Player controls work properly
5. ✅ HLS.js loads streams correctly
6. ✅ No critical console errors
7. ✅ Mobile responsive (if tested)
8. ✅ Works across multiple browsers

---

## 📝 Notes

**Important Considerations:**

1. **Stream Availability:** Not all streams may be online 24/7. Some stations may be offline temporarily.

2. **Loading Time:** HLS streams may take 5-10 seconds to start playing. This is normal.

3. **YouTube-based Streams:** Streams using ythls.onrender.com are most reliable:
   - NTV Uganda
   - NBS TV
   - UBC TV
   - Bukedde TV
   - BBS TV

4. **Direct Streams:** Other streams use direct HLS URLs which may be less reliable.

5. **Geo-restrictions:** Some streams may be geo-restricted to Uganda.

6. **Browser Compatibility:** HLS.js works on all modern browsers. Safari uses native HLS support.

---

## 🎯 Quick Test (Minimum Viable)

If you want to do a quick test instead of comprehensive:

1. ✅ Visit https://watch.unrulymovies.com
2. ✅ Verify no redirect error
3. ✅ Go to uganda-tv.html
4. ✅ Click NTV Uganda → Watch Now
5. ✅ Verify player loads and stream plays
6. ✅ Test play/pause and volume controls

If these 6 steps work, the core functionality is working!

---

**After completing testing, please share your results so I can address any issues found.**
