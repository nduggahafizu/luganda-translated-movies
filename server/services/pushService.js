/**
 * Web Push Notification Service
 * Handles sending push notifications to subscribed users
 */

const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@unrulymovies.com';

// Initialize web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('✅ Web Push configured with VAPID keys');
} else {
    console.warn('⚠️ VAPID keys not configured - Push notifications disabled');
}

/**
 * Send push notification to a single subscription
 * @param {Object} subscription - PushSubscription document
 * @param {Object} payload - Notification payload
 * @returns {Promise}
 */
async function sendToSubscription(subscription, payload) {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        throw new Error('VAPID keys not configured');
    }

    try {
        const pushPayload = JSON.stringify({
            title: payload.title || 'Unruly Movies',
            body: payload.body || '',
            icon: payload.icon || '/assets/images/logo.png',
            badge: payload.badge || '/assets/images/icons/icon-72x72.png',
            image: payload.image || null,
            tag: payload.tag || 'general',
            url: payload.url || '/',
            data: payload.data || {},
            actions: payload.actions || [
                { action: 'open', title: 'Watch Now' },
                { action: 'dismiss', title: 'Later' }
            ],
            vibrate: payload.vibrate || [100, 50, 100],
            requireInteraction: payload.requireInteraction || false,
            timestamp: Date.now()
        });

        await webpush.sendNotification(subscription.getSubscriptionObject(), pushPayload);
        
        // Mark subscription as used successfully
        await subscription.markUsed();
        
        return { success: true, subscriptionId: subscription._id };
    } catch (error) {
        console.error(`Push failed for subscription ${subscription._id}:`, error.message);
        
        // Handle specific errors
        if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or not found - remove it
            await PushSubscription.findByIdAndDelete(subscription._id);
            return { success: false, removed: true, error: 'Subscription expired' };
        }
        
        // Mark as failed for retry logic
        await subscription.markFailed();
        
        return { success: false, error: error.message };
    }
}

/**
 * Send push notification to a user (all their subscriptions)
 * @param {String} userId - User ID
 * @param {Object} payload - Notification payload
 * @returns {Promise}
 */
async function sendToUser(userId, payload) {
    const subscriptions = await PushSubscription.getUserSubscriptions(userId);
    
    if (subscriptions.length === 0) {
        return { success: true, sent: 0, message: 'No active subscriptions' };
    }

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    const failed = results.length - sent;

    return { success: true, sent, failed, total: subscriptions.length };
}

/**
 * Send push notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} payload - Notification payload
 * @returns {Promise}
 */
async function sendToUsers(userIds, payload) {
    const results = await Promise.allSettled(
        userIds.map(userId => sendToUser(userId, payload))
    );

    const totalSent = results.reduce((sum, r) => {
        return sum + (r.status === 'fulfilled' ? r.value.sent : 0);
    }, 0);

    return { success: true, totalSent, userCount: userIds.length };
}

/**
 * Send push notification to users with specific preference enabled
 * @param {String} preference - Preference key (newMovies, newSeries, etc.)
 * @param {Object} payload - Notification payload
 * @returns {Promise}
 */
async function sendByPreference(preference, payload) {
    const subscriptions = await PushSubscription.getSubscriptionsByPreference(preference);
    
    if (subscriptions.length === 0) {
        return { success: true, sent: 0, message: 'No subscriptions with this preference' };
    }

    const results = await Promise.allSettled(
        subscriptions.map(sub => sendToSubscription(sub, payload))
    );

    const sent = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;

    return { success: true, sent, total: subscriptions.length };
}

/**
 * Send new movie notification
 * @param {Object} movie - Movie document
 * @returns {Promise}
 */
async function notifyNewMoviePush(movie) {
    const payload = {
        title: '🎬 New Movie Added!',
        body: `"${movie.originalTitle}" by ${movie.vjName} is now available!`,
        icon: movie.poster || '/assets/images/icons/icon-192x192.png',
        image: movie.backdrop || movie.poster,
        tag: `new-movie-${movie._id}`,
        url: `/movie.html?id=${movie._id}`,
        data: {
            type: 'new_movie',
            movieId: movie._id,
            movieTitle: movie.originalTitle
        }
    };

    return sendByPreference('newMovies', payload);
}

/**
 * Send new series notification
 * @param {Object} series - Series document
 * @returns {Promise}
 */
async function notifyNewSeriesPush(series) {
    const payload = {
        title: '📺 New Series Added!',
        body: `"${series.originalTitle}" is now available to watch!`,
        icon: series.poster || '/assets/images/icons/icon-192x192.png',
        image: series.backdrop || series.poster,
        tag: `new-series-${series._id}`,
        url: `/series-details.html?id=${series._id}`,
        data: {
            type: 'new_series',
            seriesId: series._id,
            seriesTitle: series.originalTitle
        }
    };

    return sendByPreference('newSeries', payload);
}

/**
 * Send new episode notification
 * @param {Object} series - Series document
 * @param {Object} episode - Episode info
 * @returns {Promise}
 */
async function notifyNewEpisodePush(series, episode) {
    const payload = {
        title: `📺 New Episode: ${series.originalTitle}`,
        body: `S${episode.seasonNumber}E${episode.episodeNumber}: ${episode.title || 'New Episode'} is out!`,
        icon: series.poster || '/assets/images/icons/icon-192x192.png',
        image: episode.thumbnail || series.backdrop,
        tag: `new-episode-${series._id}-${episode.seasonNumber}-${episode.episodeNumber}`,
        url: `/watch-series.html?id=${series._id}&season=${episode.seasonNumber}&episode=${episode.episodeNumber}`,
        data: {
            type: 'new_episode',
            seriesId: series._id,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber
        }
    };

    return sendByPreference('newSeries', payload);
}

/**
 * Send VJ update notification (for VJ followers)
 * @param {String} vjName - VJ name
 * @param {Object} movie - Movie document
 * @returns {Promise}
 */
async function notifyVjFollowersPush(vjName, movie) {
    // Get users who follow this VJ
    const users = await User.find({ followingVjs: vjName }).select('_id');
    
    if (users.length === 0) {
        return { success: true, sent: 0, message: 'No followers' };
    }

    const payload = {
        title: `🎙️ ${vjName} Posted!`,
        body: `New movie: "${movie.originalTitle}"`,
        icon: movie.poster || '/assets/images/icons/icon-192x192.png',
        image: movie.backdrop || movie.poster,
        tag: `vj-${vjName}-${movie._id}`,
        url: `/movie.html?id=${movie._id}`,
        data: {
            type: 'vj_update',
            vjName,
            movieId: movie._id
        }
    };

    return sendToUsers(users.map(u => u._id), payload);
}

/**
 * Send subscription expiring notification
 * @param {String} userId - User ID
 * @param {Number} daysLeft - Days until expiration
 * @returns {Promise}
 */
async function notifySubscriptionExpiringPush(userId, daysLeft) {
    const payload = {
        title: '⚠️ Subscription Expiring',
        body: `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now!`,
        icon: '/assets/images/icons/icon-192x192.png',
        tag: 'subscription-expiring',
        url: '/subscription.html',
        requireInteraction: true,
        actions: [
            { action: 'renew', title: 'Renew Now' },
            { action: 'dismiss', title: 'Later' }
        ],
        data: {
            type: 'subscription_expiring',
            daysLeft
        }
    };

    return sendToUser(userId, payload);
}

/**
 * Send system announcement to all users
 * @param {String} title - Announcement title
 * @param {String} body - Announcement body
 * @param {String} url - Optional URL
 * @returns {Promise}
 */
async function sendSystemAnnouncementPush(title, body, url = '/') {
    const payload = {
        title: `📢 ${title}`,
        body,
        icon: '/assets/images/icons/icon-192x192.png',
        tag: 'system-announcement',
        url,
        data: {
            type: 'system_announcement'
        }
    };

    return sendByPreference('systemAnnouncements', payload);
}

/**
 * Send security alert (login from new device, etc.)
 * @param {String} userId - User ID
 * @param {String} alertType - Type of alert
 * @param {Object} details - Alert details
 * @returns {Promise}
 */
async function sendSecurityAlertPush(userId, alertType, details = {}) {
    const alerts = {
        new_device: {
            title: '🔐 New Device Login',
            body: `Your account was accessed from a new device: ${details.device || 'Unknown'}`
        },
        password_changed: {
            title: '🔐 Password Changed',
            body: 'Your password was recently changed. If this wasn\'t you, contact support.'
        },
        suspicious_activity: {
            title: '⚠️ Suspicious Activity',
            body: 'We detected unusual activity on your account. Please review your security settings.'
        }
    };

    const alert = alerts[alertType] || { title: '🔐 Security Alert', body: 'Check your account security' };

    const payload = {
        ...alert,
        icon: '/assets/images/icons/icon-192x192.png',
        tag: `security-${alertType}`,
        url: '/profile.html#security',
        requireInteraction: true,
        data: {
            type: 'security_alert',
            alertType,
            ...details
        }
    };

    return sendToUser(userId, payload);
}

/**
 * Get VAPID public key for client subscription
 * @returns {String}
 */
function getVapidPublicKey() {
    return VAPID_PUBLIC_KEY;
}

/**
 * Check if push notifications are configured
 * @returns {Boolean}
 */
function isPushConfigured() {
    return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}

module.exports = {
    sendToSubscription,
    sendToUser,
    sendToUsers,
    sendByPreference,
    notifyNewMoviePush,
    notifyNewSeriesPush,
    notifyNewEpisodePush,
    notifyVjFollowersPush,
    notifySubscriptionExpiringPush,
    sendSystemAnnouncementPush,
    sendSecurityAlertPush,
    getVapidPublicKey,
    isPushConfigured
};
