import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
    },
    password:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default:'user',
        required:true
    },
    geoLocation:{
        type:{
            type:String,
            enum:['Point'],
            default:'Point'
        },
        coordinates:{
            type:['Number'],
            default:[0,0],
        }
    },
    phone:{
        type:String
    },
    bloodGroup: { 
        type: String, 
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
        default: 'Unknown'
    },
    emergencyContacts: [{
        name: { type: String},
        relationship: { type: String },
        phoneNumber: { type: String }
    }],
    // Quick safe zones (Home, Work, etc.) for geofencing
    safeZones: [{
        label: { type: String}, // e.g., "Home", "University"
        address: { type: String},
        location: {
            type: { type: String, enum: ['Point'], default: 'Point' },
            coordinates: { type: [Number] } // [longitude, latitude]
        }
    }],
    profileImage: {
        type: String,
        default: "" // Or you can put a default placeholder image URL here
    },
 
},{timestamps:true})

const userModel = mongoose.model('user',userSchema)

export default userModel;