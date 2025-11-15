// backend/api-gateway/routes/index.js
import express from 'express';
import onboardingRoutes from './onboarding.routes.js';
import profileRoutes from './profile.routes.js';

const router = express.Router();

// Health check for the API
router.get("/health", (_, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Mount modular routers
router.use('/onboarding', onboardingRoutes);
router.use('/profile', profileRoutes);

export default router;