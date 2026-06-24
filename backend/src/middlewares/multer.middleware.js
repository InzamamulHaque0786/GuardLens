import multer from 'multer';
import path from 'path';

// Configure exactly where and how Multer should store the incoming files temporarily
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store files temporarily in a 'public/temp' directory before sending to Cloudinary
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        // Create a unique filename using a timestamp so concurrent uploads don't overwrite each other
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Create and export the middleware instance
export const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB maximum file size limit (important for accepting videos)
    }
});