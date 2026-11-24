/**
 * Find customers who paid through PesaPal but never got their plan.
 *
 *   node scripts/find-unactivated-payments.js            list only (changes nothing)
 *   node scripts/find-unactivated-payments.js --fix      switch the plans on
 *   node scripts/find-unactivated-payments.js --days 60  look further back (default 30)
 *
 * Two kinds of problem are found:
 *  1. A payment still "pending" or "failed" in our records that PesaPal says
 *     is completed. --fix switches the plan on, exactly as if the payment had
 *     just been confirmed (a new full plan period from now).
 *  2. A payment marked "completed" whose plan was never switched on (the old
 *     code could mark the payment done and then fail to update the account).
 *     --fix gives the customer what they paid for: the plan from when they
 *     paid, if any of that time is left.
 *
 * Needs the same .env as the server (MONGODB_URI and the PESAPAL_* keys).
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { _test } = require('../controllers/paymentController');

const FIX = process.argv.includes('--fix');
const daysArg = process.argv.indexOf('--days');
const DAYS = daysArg > -1 ? Number(process.argv[daysArg + 1]) || 30 : 30;
const PLAN_DAYS = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };

const PESAPAL_BASE = process.env.PESAPAL_ENVIRONMENT === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

async function pesapalToken() {
    const r = await axios.post(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
    }, { headers: { 'Content-Type': 'application/json' } });
    if (!r.data || !r.data.token) throw new Error('PesaPal did not return a token');
    return r.data.token;
}

const fmt = d => (d ? new Date(d).toISOString().replace('T', ' ').slice(0, 16) : '-');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
    console.log(`${FIX ? 'FIXING' : 'Listing (no changes)'} — PesaPal payments since ${fmt(since)}\n`);

    // 1. Open or failed in our records — ask PesaPal what really happened
    const open = await Payment.find({
        paymentMethod: 'pesapal',
        status: { $in: ['pending', 'failed'] },
        'paymentDetails.pesapalOrderTrackingId': { $exists: true, $ne: null },
        createdAt: { $gte: since }
    }).sort({ createdAt: -1 });

    let token = null;
    let paidButOpen = 0;
    if (open.length) token = await pesapalToken();
    for (const p of open) {
        try {
            const r = await axios.get(
                `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(p.paymentDetails.pesapalOrderTrackingId)}`,
                { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 }
            );
            if (r.data && r.data.status_code === 1) {
                paidButOpen++;
                const user = await User.findById(p.user).select('email phone subscription');
                console.log(`[paid, not switched on] ${p.transactionId}  ${fmt(p.createdAt)}  ${p.subscriptionPlan}  UGX ${r.data.amount}  ${user ? user.email : 'user ' + p.user}`);
                if (FIX) {
                    await _test.processSuccessfulPesapalPayment(p, r.data);
                    console.log(`    -> ${p.status === 'completed' ? 'switched on' : 'NOT switched on (amount below the plan price)'}`);
                }
            }
        } catch (e) {
            console.log(`[could not check] ${p.transactionId}: ${e.message}`);
        }
        await new Promise(r => setTimeout(r, 200));
    }

    // 2. Completed payments whose plan was never applied to the account
    const done = await Payment.find({
        paymentMethod: 'pesapal',
        status: 'completed',
        completedAt: { $gte: since }
    }).sort({ completedAt: -1 });

    let missed = 0;
    for (const p of done) {
        const user = await User.findById(p.user).select('email subscription');
        if (!user) continue;
        const startedAt = user.subscription && user.subscription.startDate;
        // switched on at (or after) this payment — or by a later purchase — is fine
        if (startedAt && new Date(startedAt).getTime() >= new Date(p.completedAt).getTime() - 5 * 60 * 1000) continue;
        const days = PLAN_DAYS[p.subscriptionPlan] || 30;
        const shouldEnd = new Date(new Date(p.completedAt).getTime() + days * 24 * 60 * 60 * 1000);
        if (shouldEnd <= new Date()) continue; // that plan would have ended by now anyway
        missed++;
        console.log(`[completed, never switched on] ${p.transactionId}  paid ${fmt(p.completedAt)}  ${p.subscriptionPlan}  ${user.email}  (account plan: ${user.subscription.plan}, ends ${fmt(user.subscription.endDate)})`);
        if (FIX) {
            await User.updateOne({ _id: user._id }, {
                $set: {
                    'subscription.plan': p.subscriptionPlan,
                    'subscription.status': 'active',
                    'subscription.startDate': p.completedAt,
                    'subscription.endDate': shouldEnd
                }
            });
            console.log(`    -> switched on until ${fmt(shouldEnd)}`);
        }
    }

    console.log(`\nPaid at PesaPal but still open/failed here: ${paidButOpen}`);
    console.log(`Completed here but never switched on (time still left): ${missed}`);
    if (!FIX && (paidButOpen || missed)) console.log('Run again with --fix to switch these on.');
    await mongoose.disconnect();
})().catch(async (e) => {
    console.error('Failed:', e.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
