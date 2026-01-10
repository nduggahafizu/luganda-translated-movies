const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
    // User info (can be from logged-in user or guest)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    
    // Request details
    subject: {
        type: String,
        required: true,
        enum: ['general', 'support', 'billing', 'content', 'vj', 'business', 'feedback', 'bug', 'feature', 'movie_request', 'other']
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    
    // For movie requests specifically
    movieDetails: {
        title: String,
        year: Number,
        imdbLink: String,
        preferredVJ: String
    },
    
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'resolved', 'closed', 'spam'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    
    // Admin response
    adminResponse: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    
    // Internal notes (admin only)
    notes: [{
        text: String,
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Metadata
    ipAddress: String,
    userAgent: String,
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
userRequestSchema.index({ status: 1, createdAt: -1 });
userRequestSchema.index({ email: 1 });
userRequestSchema.index({ subject: 1 });
userRequestSchema.index({ user: 1 });

// Static method to get request counts by status
userRequestSchema.statics.getStatusCounts = async function() {
    const counts = await this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const result = {
        pending: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
        spam: 0,
        total: 0
    };
    
    counts.forEach(c => {
        result[c._id] = c.count;
        result.total += c.count;
    });
    
    return result;
};

// Static method to get requests by subject
userRequestSchema.statics.getSubjectCounts = async function() {
    return await this.aggregate([
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('UserRequest', userRequestSchema);
