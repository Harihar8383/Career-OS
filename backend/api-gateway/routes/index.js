// backend/api-gateway/routes/index.js
import express from 'express';
import onboardingRoutes from './onboarding.routes.js';
import profileRoutes from './profile.routes.js';
import matcherRoutes from './matcher.routes.js';
import hunterRoutes from './hunter.routes.js'; // <-- Import hunter routes
import trackerRoutes from './tracker.routes.js'; // <-- Import tracker routes
import chatRoutes from './chat.routes.js'; // <-- Import chat routes

const router = express.Router();

// Health check for the API
router.get("/health", (_, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// Mount modular routers
router.use('/onboarding', onboardingRoutes);
router.use('/profile', profileRoutes);
router.use('/matcher', matcherRoutes);
router.use('/hunter', hunterRoutes); // <-- Mount hunter routes
router.use('/tracker', trackerRoutes); // <-- Mount tracker routes
router.use('/chat', chatRoutes); // <-- Mount chat routes

export default router;