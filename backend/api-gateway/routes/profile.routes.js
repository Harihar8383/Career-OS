// backend/api-gateway/routes/profile.routes.js
import express from 'express';
import { 
  getPartialProfile,
  completeProfile,
  getFullProfile,
  updateFullProfile
} from '../controllers/profile.controller.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// All routes in this file are protected
router.use(requireAuth());

router.get('/partial', getPartialProfile);
router.post('/complete', completeProfile);
router.get('/full', getFullProfile);
router.put('/full', updateFullProfile);

export default router;