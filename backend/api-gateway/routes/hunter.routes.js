// backend/api-gateway/routes/hunter.routes.js
import express from 'express';
import { 
  startHunt,
  getSession,
  getResults,
  streamLogs
} from '../controllers/hunter.controller.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// All routes in this file are protected
router.use(requireAuth());

router.post('/start', startHunt);  // Changed from /hunt to /start to match frontend
router.get('/session/:sessionId', getSession);
router.get('/results/:sessionId', getResults);
router.get('/logs/:sessionId', streamLogs);  // SSE endpoint

export default router;
