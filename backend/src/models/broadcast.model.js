import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  audioUrl: { 
    type: String, 
    default: null // Will hold the Cloudinary/AWS URL if they upload audio
  },
  
  // THE MAGIC: GeoJSON format for MongoDB map queries
  location: {
    type: { 
      type: String, 
      enum: ['Point'], 
      required: true,
      default: 'Point'
    },
    coordinates: { 
      type: [Number], 
      required: true // VERY IMPORTANT: MongoDB expects [longitude, latitude]
    } 
  },
  radiusInMeters: { 
    type: Number, 
    required: true // Size of the alert circle
  },
  expiresAt: { 
    type: Date, 
    required: true // So old alerts naturally disappear from the users' feeds
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// CRITICAL: This creates a spatial index. Without this, radius searches won't work!
broadcastSchema.index({ location: '2dsphere' });

export const Broadcast = mongoose.model('Broadcast', broadcastSchema);