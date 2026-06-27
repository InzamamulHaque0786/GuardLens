import express from 'express';
import { createBroadcast, getActiveBroadcasts } from '../controllers/broadcast.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {upload} from "../middlewares/multer.middleware.js"

const router = express.Router();


router.post('/create',verifyJWT,upload.single('audio'),createBroadcast);
router.get('/', verifyJWT, getActiveBroadcasts);

export default router;