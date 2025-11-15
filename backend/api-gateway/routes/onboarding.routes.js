// backend/api-gateway/routes/onboarding.routes.js
import express from 'express';
import { getOnboardingStatus } from '../controllers/onboarding.controller.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// All routes in this file are protected
router.use(requireAuth());

router.get('/status', getOnboardingStatus);

export default router;