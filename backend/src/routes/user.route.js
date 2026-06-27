import express from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/user.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {upload} from '../middlewares/multer.middleware.js'

const router = express.Router();

// GET request to fetch data, PUT request to update data
router.get('/profile', verifyJWT, getUserProfile);
router.put('/profile', verifyJWT,upload.single('profileImage'),updateUserProfile);

export default router;