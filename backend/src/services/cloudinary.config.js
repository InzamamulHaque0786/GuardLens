import { v2 as cloudinary } from 'cloudinary'
//cloudnary configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});
//helper function to upload files
export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        // Upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // 'auto' automatically detects if it's an image or video
        });
        // The file has been uploaded successfully
        return response;

    } catch (error) {
        console.error("CLOUDINARY UPLOAD FAILED:", error); // <-- ADD THIS LINE
        return null;
    }
};

export default cloudinary;