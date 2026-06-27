import express from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { verifyJWT,roleAuthorization } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/getall', verifyJWT,roleAuthorization('admin'), getDashboardStats);

export default router;