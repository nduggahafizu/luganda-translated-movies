const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Notification Service - Creates and sends notifications to users
 */

/**
 * Create notification for a new movie
 * @param {Object} movie - The movie that was added
 */
async function notifyNewMovie(movie) {
    try {
        // Get all users - send notifications to everyone by default
        // Users can opt-out via preferences.notifications.newMovies = false
        const users = await User.find({
            $or: [
                { 'preferences.notifications.newMovies': { $ne: false } },
                { 'preferences.notifications': { $exists: false } },
                { 'preferences': { $exists: false } }
            ]
        }).select('_id');

        if (users.length === 0) {
            console.log('No users to notify for new movie');
            return { success: true, notified: 0 };
        }

        const notifications = users.map(user => ({
            user: user._id,
            type: 'new_movie',
            title: '🎬 New Movie Added!',
            message: `"${movie.originalTitle}" by ${movie.vjName} is now available to watch!`,
            image: movie.poster || null,
            link: `/movie.html?id=${movie._id}`,
            data: {
                movieId: movie._id,
                movieTitle: movie.originalTitle,
                vjName: movie.vjName
            }
        }));

        await Notification.insertMany(notifications);
        console.log(`Sent new movie notifications to ${users.length} users`);

        return { success: true, notified: users.length };
    } catch (error) {
        console.error('Error sending new movie notifications:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create notification for new VJ movie (for followers of that VJ)
 * @param {Object} movie - The movie that was added
 * @param {String} vjName - The VJ's name
 */
async function notifyVjFollowers(movie, vjName) {
    try {
        // Get users who follow this VJ
        const users = await User.find({
            followingVjs: vjName
        }).select('_id');

        if (users.length === 0) {
            console.log(`No followers to notify for VJ: ${vjName}`);
            return { success: true, notified: 0 };
        }

        const notifications = users.map(user => ({
            user: user._id,
            type: 'new_vj_movie',
            title: `🎬 ${vjName} Added a New Movie!`,
            message: `"${movie.originalTitle}" has been translated by ${vjName}`,
            image: movie.poster || null,
            link: `/movie.html?id=${movie._id}`,
            data: {
                movieId: movie._id,
                movieTitle: movie.originalTitle,
                vjName: vjName
            }
        }));

        await Notification.insertMany(notifications);
        console.log(`Sent VJ movie notifications to ${users.length} followers of ${vjName}`);

        return { success: true, notified: users.length };
    } catch (error) {
        console.error('Error sending VJ follower notifications:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create system announcement notification for all users
 * @param {String} title - Announcement title
 * @param {String} message - Announcement message
 * @param {String} link - Optional link
 */
async function sendSystemAnnouncement(title, message, link = null) {
    try {
        const users = await User.find({}).select('_id');

        if (users.length === 0) {
            return { success: true, notified: 0 };
        }

        const notifications = users.map(user => ({
            user: user._id,
            type: 'system_announcement',
            title: `📢 ${title}`,
            message: message,
            link: link,
            data: {}
        }));

        await Notification.insertMany(notifications);
        console.log(`Sent system announcement to ${users.length} users`);

        return { success: true, notified: users.length };
    } catch (error) {
        console.error('Error sending system announcement:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify user when their subscription is expiring soon
 * @param {String} userId - User ID
 * @param {Number} daysLeft - Days until expiration
 */
async function notifySubscriptionExpiring(userId, daysLeft) {
    try {
        await Notification.create({
            user: userId,
            type: 'subscription_expiring',
            title: '⚠️ Subscription Expiring Soon',
            message: `Your subscription will expire in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew now to continue watching!`,
            link: '/subscription.html',
            data: { daysLeft }
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending subscription expiring notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Notify user when their subscription has expired
 * @param {String} userId - User ID
 */
async function notifySubscriptionExpired(userId) {
    try {
        await Notification.create({
            user: userId,
            type: 'subscription_expired',
            title: '❌ Subscription Expired',
            message: 'Your subscription has expired. Renew now to continue watching movies!',
            link: '/subscription.html',
            data: {}
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending subscription expired notification:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create a single notification for a specific user
 * @param {String} userId - User ID
 * @param {Object} notificationData - Notification details
 */
async function createNotification(userId, { type, title, message, image = null, link = null, data = {} }) {
    try {
        const notification = await Notification.create({
            user: userId,
            type,
            title,
            message,
            image,
            link,
            data
        });

        return { success: true, notification };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    notifyNewMovie,
    notifyVjFollowers,
    sendSystemAnnouncement,
    notifySubscriptionExpiring,
    notifySubscriptionExpired,
    createNotification
};
