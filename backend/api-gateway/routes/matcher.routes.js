// backend/api-gateway/routes/matcher.routes.js
import express from 'express';
import { 
  analyzeJd,
  getAnalysisStatus,
  getAnalysisResults,
  getAnalysisHistory,
  deleteAnalysis
} from '../controllers/matcher.controller.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// All routes in this file are protected
router.use(requireAuth());

router.post('/analyze', analyzeJd);
router.get('/history', getAnalysisHistory); // New Route
router.get('/status/:runId', getAnalysisStatus);
router.get('/results/:runId', getAnalysisResults);
router.delete('/:runId', deleteAnalysis);

export default router;