// backend/api-gateway/routes/dashboard.routes.js
import express from 'express';
import { getDashboardAnalytics } from '../controllers/dashboard.controller.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

router.use(requireAuth());

router.get('/analytics', getDashboardAnalytics);

export default router;
