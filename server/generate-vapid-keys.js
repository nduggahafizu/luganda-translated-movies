/**
 * Generate VAPID Keys for Web Push Notifications
 * Run this once: node generate-vapid-keys.js
 * Then add the keys to your .env file
 */

const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n========================================');
console.log('  VAPID KEYS FOR WEB PUSH NOTIFICATIONS');
console.log('========================================\n');
console.log('Add these to your .env file:\n');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:support@unrulymovies.com`);
console.log('\n========================================\n');
console.log('IMPORTANT:');
console.log('- Keep the PRIVATE_KEY secret!');
console.log('- The PUBLIC_KEY is safe to share (used by browsers)');
console.log('- Add these to Railway environment variables too');
console.log('\n');
