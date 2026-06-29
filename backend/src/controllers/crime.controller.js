import CrimeModel from '../models/crime.model.js'; 
import UserModel from '../models/user.model.js'
import { uploadOnCloudinary } from '../services/cloudinary.config.js'; 
import fs from 'fs';

export const reportCrime = async (req, res) => {
    try {
        console.log("incoming body ",req.body)
        const { 
            crimeType, 
            crimeDescription, 
            latitude, 
            longitude, 
            crimeTime, 
            reporterType 
        } = req.body;

        let imageUrls = [];
        let videoUrl = ''; 
        //
        console.log(req.files)
        // Handle Images
        if (req.files && req.files.images) {
            const imagePromises = req.files.images.map(file => uploadOnCloudinary(file.path));
            const imageResults = await Promise.all(imagePromises);
            
            imageUrls = imageResults
                .filter(result => result !== null)
                .map(result => result.secure_url);

            // Clean up local temp files
            req.files.images.forEach(file => {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            });
        }

        // Handle Video
        if (req.files && req.files.video && req.files.video.length > 0) {
            const videoFile = req.files.video[0];
            const videoResult = await uploadOnCloudinary(videoFile.path);
            
            if (videoResult) {
                videoUrl = videoResult.secure_url;
            }

            // Clean up local temp file
            if (fs.existsSync(videoFile.path)) fs.unlinkSync(videoFile.path);
        }

        // Save to Database (1:1 mapping)
        const newCrime = new CrimeModel({
            crimeType: crimeType,
            crimeDescription: crimeDescription,
            crimeLocation: { 
                latitude: parseFloat(latitude), 
                longitude: parseFloat(longitude) 
            },
            crimeTime: new Date(crimeTime),
            reporterType: reporterType.toLowerCase(), // Forces "Victim" to "victim" to pass enum validation
            reporter: req.user.id, 
            images: imageUrls,
            video: videoUrl 
        });

        await newCrime.save();

        return res.status(201).json({ 
            success: true, 
            message: "Report transmitted securely to law enforcement.", 
            crime: newCrime 
        });

    } catch (error) {
        console.error("Error creating crime report:", error);
        return res.status(500).json({ success: false, message: "Internal server error during submission." });
    }
};

export const getAllMyReports = async (req, res) => {
    try {
        // Find user's reports, sort by newest, and use .select() to grab only what the list needs
        const myReports = await CrimeModel.find({ reporter: req.user.id })
            .select('crimeType crimeTime status _id crimeLocation') // The Projection 
            .sort({ createdAt: -1 }); 

        return res.status(200).json({ 
            success: true, 
            count: myReports.length,
            data: myReports 
        });

    } catch (error) {
        console.error("Error fetching user reports:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error while fetching your reports." 
        });
    }
};

export const getReport = async (req, res) => {
    try {
        const { id } = req.params;
        // Find the report by its exact ID AND ensure the logged-in user is the one who created it
        const report = await CrimeModel.findOne({ 
            _id: id, 
            reporter: req.user.id 
        });
        // If the report doesn't exist, or it belongs to someone else, reject it
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: "Report not found or you do not have permission to view it." 
            });
        }
        // Return the full document
        return res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error("Error fetching report details:", error);
        
        // If the frontend sends a mangled ID string that isn't 24 characters, Mongoose crashes. 
        // This catches that specific crash and returns a clean 400 error instead of a 500.
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid report ID format." 
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: "Internal server error while fetching report details." 
        });
    }
};

export const getCrimeLocations = async (req, res) => {
    try {
        // Fetch all verified crimes PLUS the user's personal unverified crimes
        const mapCrimes = await CrimeModel.find({
            $or: [
                { status: 'verified' }, // Rule 1: Everyone sees verified crimes
                { reporter: req.user.id } // Rule 2: The user sees ALL of their own crimes (using .id as instructed)
            ]
        });

        return res.status(200).json({
            success: true,
            count: mapCrimes.length,
            data: mapCrimes
        });

    } catch (error) {
        console.error("Error fetching map locations:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error while fetching map data." 
        });
    }
};

// export const getAllAdminReports = async (req, res) => {
//     try {
//         // 1. Extract from req.query instead of req.body
//         const { adminLat, adminLng, radiusInKm = 10 } = req.query;

//         if (!adminLat || !adminLng) {
//             return res.status(400).json({ 
//                 success: false, 
//                 message: "Admin location coordinates are required in the query parameters." 
//             });
//         }

//         // Parse everything to numbers since query strings are text
//         const lat = parseFloat(adminLat);
//         const lng = parseFloat(adminLng);
//         const radius = parseFloat(radiusInKm);

//         // 2. The Bounding Box Math
//         const latDelta = radius / 111; 
//         const lngDelta = radius / (111 * Math.cos(lat * (Math.PI / 180)));

//         // 3. Query the database
//         const regionalCrimes = await CrimeModel.find({
//             "crimeLocation.latitude": { 
//                 $gte: lat - latDelta, 
//                 $lte: lat + latDelta 
//             },
//             "crimeLocation.longitude": { 
//                 $gte: lng - lngDelta, 
//                 $lte: lng + lngDelta 
//             }
//         }).sort({ createdAt: -1 });

//         return res.status(200).json({
//             success: true,
//             count: regionalCrimes.length,
//             radiusApplied: `${radius}km`,
//             data: regionalCrimes
//         });

//     } catch (error) {
//         console.error("Error fetching admin jurisdiction reports:", error);
//         return res.status(500).json({ 
//             success: false, 
//             message: "Internal server error while fetching regional reports." 
//         });
//     }
// };

export const getAllAdminReports = async (req, res) => {
    try {
        const allCrimes = await CrimeModel.find({})
            .select('crimeType crimeTime status severity crimeLocation _id')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: allCrimes.length,
            data: allCrimes
        });
    } catch (error) {
        console.error("Error fetching admin reports:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error while fetching reports." 
        });
    }
};
export const getAdminReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await CrimeModel.findById(id)
            .populate('reporter', 'name email'); // Adjust 'name email' to match whatever fields your User model uses

        // If the report doesn't exist, handle it gracefully
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: "Crime report not found in the database." 
            });
        }
        // Return the massive payload (images, videos, description, and reporter info)
        return res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error("Error fetching specific admin report:", error);
        // Catch mangled IDs so the server doesn't crash
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ 
                success: false, 
                message: "Invalid report ID format." 
            });
        }
        return res.status(500).json({ 
            success: false, 
            message: "Internal server error while fetching report details." 
        });
    }
};

export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, severity } = req.body;

        // Build a dynamic object that ONLY includes the fields that were actually sent
        const updateFields = {};
        if (status) updateFields.status = status;
        if (severity) updateFields.severity = severity;

        // If the object is empty, they didn't send anything to update
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ success: false, message: "No update fields provided." });
        }

        // Use $set to tell MongoDB to ONLY modify the fields inside our dynamic object
        const updatedReport = await CrimeModel.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true } 
        );

        if (!updatedReport) {
            return res.status(404).json({ success: false, message: "Crime report not found." });
        }

        return res.status(200).json({
            success: true,
            message: "Report updated successfully",
            data: updatedReport
        });

    } catch (error) {
        // ... (keep your existing error catch block here)
        console.error("Error updating report:", error);
        if (error.kind === 'ObjectId') {
            return res.status(400).json({ success: false, message: "Invalid report ID format." });
        }
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};