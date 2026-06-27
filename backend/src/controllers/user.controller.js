import userModel from '../models/user.model.js';
import { uploadOnCloudinary } from '../services/cloudinary.config.js'; 

// Get the logged-in user's profile
export const getUserProfile = async (req, res) => {
    try {
        // req.user comes from your verifyJWT middleware
        // .select('-password') ensures we never send the password hash to the frontend
        const user = await userModel.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Get Profile Error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch profile." });
    }
};

// Update the user's profile (Phone, Blood Group, Contacts, Zones)
export const updateUserProfile = async (req, res) => {
    try {
        const { name, phone, bloodGroup, emergencyContacts, safeZones } = req.body;
        const updateFields = {};

        // Standard text fields
        if (name !== undefined) updateFields.name = name;
        if (phone !== undefined) updateFields.phone = phone;
        if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup;

        // NEW: Cloudinary Image Upload Logic
        if (req.file) {
            const uploadedImage = await uploadOnCloudinary(req.file.path);
            if (uploadedImage && uploadedImage.secure_url) {
                updateFields.profileImage = uploadedImage.secure_url;
            }
        }

        // NEW: Parse arrays because FormData sends them as strings
        if (emergencyContacts !== undefined) {
            updateFields.emergencyContacts = typeof emergencyContacts === 'string' 
                ? JSON.parse(emergencyContacts) 
                : emergencyContacts;
        }
        
        if (safeZones !== undefined) {
            updateFields.safeZones = typeof safeZones === 'string' 
                ? JSON.parse(safeZones) 
                : safeZones;
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        return res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully.", 
            data: updatedUser 
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        return res.status(500).json({ success: false, message: "Failed to update profile." });
    }
};