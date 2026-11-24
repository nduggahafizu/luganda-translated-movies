const crypto = require('crypto');

// One id per device (browser), not per tab and not per network connection.
// It is based on the browser's user agent only — not the IP address — so
// opening more tabs, or a phone switching between Wi-Fi and mobile data (which
// changes the IP), still counts as the same device. Used for the device limit,
// which only applies to the Daily plan (see PLAN_CONFIG in models/User.js).
module.exports = function deviceIdFor(req) {
    const ua = (req.headers && req.headers['user-agent']) || '';
    return crypto.createHash('md5').update(ua).digest('hex');
};
