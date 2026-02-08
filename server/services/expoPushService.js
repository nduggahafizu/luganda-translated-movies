/**
 * Expo Push Notification Service
 * Handles sending push notifications to mobile app users via Expo's push service
 */

const ExpoPushToken = require('../models/ExpoPushToken');

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send push notification to Expo push tokens
 * @param {Array} tokens - Array of Expo push tokens
 * @param {Object} notification - Notification payload
 * @returns {Promise}
 */
async function sendExpoPushNotifications(tokens, notification) {
    if (!tokens || tokens.length === 0) {
        return { success: true, sent: 0, message: 'No tokens to send to' };
    }

    // Expo recommends sending in batches of 100
    const BATCH_SIZE = 100;
    const batches = [];
    
    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        batches.push(tokens.slice(i, i + BATCH_SIZE));
    }

    let totalSent = 0;
    let totalFailed = 0;
    const errors = [];

    for (const batch of batches) {
        try {
            const messages = batch.map(token => ({
                to: token.pushToken || token,
                sound: 'default',
                title: notification.title || 'UNRULY MOVIES',
                body: notification.body || '',
                data: notification.data || {},
                channelId: notification.channelId || 'new-movies',
                priority: 'high',
                badge: notification.badge || 1,
            }));

            const response = await fetch(EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            const result = await response.json();

            if (result.data) {
                for (let i = 0; i < result.data.length; i++) {
                    const ticket = result.data[i];
                    const tokenObj = batch[i];
                    
                    if (ticket.status === 'ok') {
                        totalSent++;
                        // Mark as used if we have the document
                        if (tokenObj._id) {
                            await ExpoPushToken.findByIdAndUpdate(tokenObj._id, {
                                lastUsed: new Date(),
                                failedAttempts: 0
                            });
                        }
                    } else if (ticket.status === 'error') {
                        totalFailed++;
                        errors.push({
                            token: tokenObj.pushToken || tokenObj,
                            error: ticket.message,
                            details: ticket.details
                        });

                        // Handle specific errors
                        if (ticket.details?.error === 'DeviceNotRegistered') {
                            // Remove invalid token
                            const tokenStr = tokenObj.pushToken || tokenObj;
                            await ExpoPushToken.removeToken(tokenStr);
                            console.log(`Removed invalid Expo token: ${tokenStr.substring(0, 20)}...`);
                        } else if (tokenObj._id) {
                            // Mark as failed
                            const doc = await ExpoPushToken.findById(tokenObj._id);
                            if (doc) await doc.markFailed();
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Expo push batch error:', error);
            totalFailed += batch.length;
            errors.push({ batch: true, error: error.message });
        }
    }

    return {
        success: totalSent > 0,
        sent: totalSent,
        failed: totalFailed,
        total: tokens.length,
        errors: errors.length > 0 ? errors : undefined
    };
}

/**
 * Send notification for new movie to all subscribed users
 * @param {Object} movie - Movie document
 * @returns {Promise}
 */
async function notifyNewMovie(movie) {
    try {
        const tokens = await ExpoPushToken.getActiveTokens('newMovies');
        
        if (tokens.length === 0) {
            console.log('No active tokens for new movie notification');
            return { success: true, sent: 0 };
        }

        const notification = {
            title: '🎬 New Movie Added!',
            body: `${movie.lugandaTitle || movie.title}${movie.vjName ? ` - Translated by VJ ${movie.vjName}` : ''}`,
            data: {
                type: 'new_movie',
                movieId: movie._id.toString(),
                url: `/movie/${movie._id}`
            },
            channelId: 'new-movies'
        };

        const result = await sendExpoPushNotifications(tokens, notification);
        console.log(`New movie notification sent: ${result.sent}/${result.total}`);
        return result;
    } catch (error) {
        console.error('notifyNewMovie error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification for new series episode
 * @param {Object} series - Series document
 * @param {Object} episode - Episode info
 * @returns {Promise}
 */
async function notifyNewEpisode(series, episode) {
    try {
        const tokens = await ExpoPushToken.getActiveTokens('newSeries');
        
        if (tokens.length === 0) {
            return { success: true, sent: 0 };
        }

        const notification = {
            title: '📺 New Episode!',
            body: `${series.lugandaTitle || series.title} - S${episode.season}E${episode.episode}`,
            data: {
                type: 'new_episode',
                seriesId: series._id.toString(),
                season: episode.season,
                episode: episode.episode,
                url: `/movie/${series._id}`
            },
            channelId: 'new-movies'
        };

        return await sendExpoPushNotifications(tokens, notification);
    } catch (error) {
        console.error('notifyNewEpisode error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send system announcement to all users
 * @param {String} title - Announcement title
 * @param {String} body - Announcement body
 * @param {Object} data - Additional data
 * @returns {Promise}
 */
async function sendSystemAnnouncement(title, body, data = {}) {
    try {
        const tokens = await ExpoPushToken.getActiveTokens('systemAnnouncements');
        
        if (tokens.length === 0) {
            return { success: true, sent: 0 };
        }

        const notification = {
            title,
            body,
            data: {
                type: 'announcement',
                ...data
            },
            channelId: 'default'
        };

        return await sendExpoPushNotifications(tokens, notification);
    } catch (error) {
        console.error('sendSystemAnnouncement error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send notification to a specific user
 * @param {String} userId - User ID
 * @param {Object} notification - Notification payload
 * @returns {Promise}
 */
async function sendToUser(userId, notification) {
    try {
        const tokens = await ExpoPushToken.getUserTokens(userId);
        
        if (tokens.length === 0) {
            return { success: true, sent: 0, message: 'User has no active tokens' };
        }

        return await sendExpoPushNotifications(tokens, notification);
    } catch (error) {
        console.error('sendToUser error:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendExpoPushNotifications,
    notifyNewMovie,
    notifyNewEpisode,
    sendSystemAnnouncement,
    sendToUser
};
