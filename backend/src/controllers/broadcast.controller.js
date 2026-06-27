import { Broadcast } from '../models/broadcast.model.js';
// Import your Cloudinary upload utility (adjust path to match your project)
import { uploadOnCloudinary } from '../services/cloudinary.config.js'; 

export const createBroadcast = async (req, res) => {
    try {
        const { title, message, latitude, longitude, radiusInMeters } = req.body;

        if (!title || !message || !latitude || !longitude || !radiusInMeters) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        let finalAudioUrl = null;

        // If your multer middleware caught the audio file, process it through Cloudinary
        if (req.file) {
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
            
            if (cloudinaryResponse && cloudinaryResponse.secure_url) {
                finalAudioUrl = cloudinaryResponse.secure_url;
            } else {
                console.warn("Cloudinary upload failed for broadcast audio.");
            }
        }

        const newBroadcast = new Broadcast({
            adminId: req.user.id,
            title,
            message,
            audioUrl: finalAudioUrl, // Saves the permanent Cloudinary URL
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            radiusInMeters: parseInt(radiusInMeters),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) 
        });

        const savedBroadcast = await newBroadcast.save();

        // Broadcast to all connected WebSockets
        req.io.emit('receive_broadcast', savedBroadcast);

        return res.status(201).json({
            success: true,
            message: "Broadcast sent successfully",
            data: savedBroadcast
        });

    } catch (error) {
        console.error("Create Broadcast Error:", error);
        return res.status(500).json({ success: false, message: "Failed to create broadcast." });
    }
};

export const getActiveBroadcasts = async (req, res) => {
    try {
        const broadcasts = await Broadcast.find({
            isActive: true,
            expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: broadcasts });
    } catch (error) {
        console.error("Fetch Broadcasts Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch broadcasts." });
    }
};