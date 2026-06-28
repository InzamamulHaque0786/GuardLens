import mongoose from 'mongoose';

const sosSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user', 
        required: true 
    },
    status: { 
        type: String, 
        enum: ['Active', 'Resolved', 'False Alarm'], 
        default: 'Active' 
    },
    // The exact location when they hit the button
    initialLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    // The breadcrumb trail of their movement
    locationHistory: [{
        latitude: Number,
        longitude: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    resolvedAt: {
        type: Date
    },
    sosPin: { type: String, default: "1234" }
}, { timestamps: true });

const sosModel = mongoose.model('SOSAlert',sosSchema)

export default sosModel;
