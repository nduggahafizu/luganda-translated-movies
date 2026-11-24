// What the site is told when a plan with a device limit (only Daily: 1 device,
// see PLAN_CONFIG in models/User.js) is already in use on another device.
// The site then offers "Watch on this device" (POST /api/auth/device-switch).

// A plain name for a device, e.g. "Android phone, Chrome"
function deviceLabel(userAgent) {
    const ua = String(userAgent || '');
    let device = 'Computer';
    if (/SmartTV|SMART-TV|Tizen|Web0S|webOS|BRAVIA|AFT[A-Z]|CrKey/i.test(ua)) device = 'TV';
    else if (/iPhone/i.test(ua)) device = 'iPhone';
    else if (/iPad/i.test(ua)) device = 'iPad';
    else if (/Android/i.test(ua)) device = /Mobile/i.test(ua) ? 'Android phone' : 'Android tablet';
    else if (/Windows/i.test(ua)) device = 'Windows computer';
    else if (/Macintosh|Mac OS X/i.test(ua)) device = 'Mac';
    else if (/CrOS/i.test(ua)) device = 'Chromebook';
    else if (/Linux/i.test(ua)) device = 'Linux computer';

    let browser = '';
    if (/Edg(e|A|iOS)?\//.test(ua)) browser = 'Edge';
    else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
    else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';
    else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
    else if (/Chrome|CriOS/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua)) browser = 'Safari';

    return browser ? `${device}, ${browser}` : device;
}

// The device this account is in use on (the most recently active one)
function otherDeviceInfo(user) {
    const other = [...(user.activeDevices || [])]
        .sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive))[0];
    if (!other) return null;
    return {
        label: deviceLabel(other.userAgent),
        minutesAgo: Math.max(0, Math.round((Date.now() - new Date(other.lastActive).getTime()) / 60000))
    };
}

// 403 body for playback and downloads (code DEVICE_LIMIT)
function deviceLimitBody(user) {
    const max = user.getMaxDevices();
    const plan = String(user.subscription?.plan || '');
    const planName = plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Your';
    return {
        success: false,
        code: 'DEVICE_LIMIT',
        message: `The ${planName} plan plays on ${max} device at a time, and it's in use on another device.`,
        maxDevices: max,
        otherDevice: otherDeviceInfo(user)
    };
}

module.exports = { deviceLabel, otherDeviceInfo, deviceLimitBody };
