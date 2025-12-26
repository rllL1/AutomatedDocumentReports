import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/stats', authMiddleware, getDashboardStats);

export default router;
