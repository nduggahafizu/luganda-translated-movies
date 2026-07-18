const express = require('express');
const router = express.Router();

// Forces the mobile app to a blocking "please update" screen when the
// installed versionCode is below this. Bump MIN_ANDROID_VERSION_CODE in
// Railway's env vars to force everyone below a given release to update —
// no new build/deploy needed on either side to change the threshold.
router.get('/', (req, res) => {
    const minVersionCode = parseInt(process.env.MIN_ANDROID_VERSION_CODE || '0', 10);
    res.json({
        success: true,
        android: {
            minVersionCode,
            storeUrl: 'https://play.google.com/store/apps/details?id=com.unruly.movies'
        }
    });
});

module.exports = router;
