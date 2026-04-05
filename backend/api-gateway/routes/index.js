// backend/api-gateway/routes/index.js
import express from 'express';
import onboardingRoutes from './onboarding.routes.js';
import profileRoutes from './profile.routes.js';
import matcherRoutes from './matcher.routes.js';
import hunterRoutes from './hunter.routes.js';
import trackerRoutes from './tracker.routes.js';
import chatRoutes from './chat.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = express.Router();

// Health check for the API
router.get("/health", (_, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Mount modular routers
router.use('/onboarding', onboardingRoutes);
router.use('/profile', profileRoutes);
router.use('/matcher', matcherRoutes);
router.use('/hunter', hunterRoutes);
router.use('/tracker', trackerRoutes);
router.use('/chat', chatRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;