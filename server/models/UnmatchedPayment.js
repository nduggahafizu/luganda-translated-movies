const mongoose = require('mongoose');

// Records a PesaPal transaction that showed as completed but couldn't be
// tied to a local Payment/User automatically (e.g. paid outside our own
// checkout flow, with no phone match on file). Kept visible for manual
// admin reconciliation instead of being silently dropped.
const unmatchedPaymentSchema = new mongoose.Schema({
    orderTrackingId: { type: String, required: true, unique: true },
    merchantReference: String,
    amount: Number,
    currency: String,
    paymentAccount: String, // phone number PesaPal reports for the payer
    paymentMethod: String,
    confirmationCode: String,
    rawStatusData: mongoose.Schema.Types.Mixed,
    candidateUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // best-effort phone match, unconfirmed
    reason: String, // why it couldn't be auto-resolved
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('UnmatchedPayment', unmatchedPaymentSchema);
