const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'UGX',
        enum: ['UGX', 'USD', 'EUR', 'GBP']
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['stripe', 'pesapal', 'mtn_mobile_money', 'airtel_money', 'card']
    },
    paymentProvider: {
        type: String,
        enum: ['stripe', 'pesapal']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
        default: 'pending'
    },
    subscriptionPlan: {
        type: String,
        enum: ['basic', 'premium'],
        required: true
    },
    subscriptionDuration: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    paymentDetails: {
        // Stripe specific
        stripePaymentIntentId: String,
        stripeCustomerId: String,
        
        // Pesapal specific
        pesapalTrackingId: String,
        pesapalMerchantReference: String,
        pesapalOrderTrackingId: String,
        
        // Mobile Money specific
        phoneNumber: String,
        network: {
            type: String,
            enum: ['MTN', 'AIRTEL']
        },
        
        // General
        payerEmail: String,
        payerName: String
    },
    metadata: {
        ipAddress: String,
        userAgent: String,
        deviceInfo: String
    },
    refundDetails: {
        refundId: String,
        refundAmount: Number,
        refundReason: String,
        refundedAt: Date
    },
    invoiceUrl: String,
    receiptUrl: String,
    description: String,
    failureReason: String,
    completedAt: Date,
    expiresAt: Date
}, {
    timestamps: true
});

// Index for faster queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ 'paymentDetails.pesapalTrackingId': 1 });
paymentSchema.index({ 'paymentDetails.stripePaymentIntentId': 1 });

// Method to mark payment as completed
paymentSchema.methods.markAsCompleted = function() {
    this.status = 'completed';
    this.completedAt = Date.now();
    return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markAsFailed = function(reason) {
    this.status = 'failed';
    this.failureReason = reason;
    return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(refundId, amount, reason) {
    this.status = 'refunded';
    this.refundDetails = {
        refundId,
        refundAmount: amount,
        refundReason: reason,
        refundedAt: Date.now()
    };
    return this.save();
};

// Static method to get user payment history
paymentSchema.statics.getUserPayments = function(userId, limit = 10) {
    return this.find({ user: userId })
        .sort('-createdAt')
        .limit(limit);
};

// Static method to get successful payments
paymentSchema.statics.getSuccessfulPayments = function(startDate, endDate) {
    return this.find({
        status: 'completed',
        completedAt: {
            $gte: startDate,
            $lte: endDate
        }
    });
};

// Static method to calculate revenue
paymentSchema.statics.calculateRevenue = async function(startDate, endDate) {
    const result = await this.aggregate([
        {
            $match: {
                status: 'completed',
                completedAt: {
                    $gte: startDate,
                    $lte: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$amount' },
                totalTransactions: { $sum: 1 },
                averageTransaction: { $avg: '$amount' }
            }
        }
    ]);
    
    return result[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0
    };
};

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
    return `${this.currency} ${this.amount.toLocaleString()}`;
});

// Ensure virtuals are included in JSON
paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Payment', paymentSchema);
