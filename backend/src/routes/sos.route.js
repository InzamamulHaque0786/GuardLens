import express from 'express';
import { triggerSOS, updateSOSLocation, cancelSOS } from '../controllers/sos.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/trigger', verifyJWT, triggerSOS);
router.put('/location', verifyJWT, updateSOSLocation);
router.post('/cancel', verifyJWT, cancelSOS);

export default router;