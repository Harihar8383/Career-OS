// backend/api-gateway/routes/tracker.routes.js
import express from 'express';
import {
  createTrackedJob,
  getAllTrackedJobs,
  getTrackedJobById,
  updateTrackedJob,
  deleteTrackedJob,
  addNote,
  addReminder,
  addInterview,
  bulkUpdateStage
} from '../controllers/tracker.controller.js';
import { requireAuth } from '@clerk/express';

const router = express.Router();

// All routes in this file are protected
router.use(requireAuth());

// Main CRUD routes
router.post('/jobs', createTrackedJob);
router.get('/jobs', getAllTrackedJobs);
router.get('/jobs/:id', getTrackedJobById);
router.patch('/jobs/:id', updateTrackedJob);
router.delete('/jobs/:id', deleteTrackedJob);

// Sub-resource routes
router.post('/jobs/:id/notes', addNote);
router.post('/jobs/:id/reminders', addReminder);
router.post('/jobs/:id/interviews', addInterview);

// Bulk operations
router.patch('/jobs/bulk/stage', bulkUpdateStage);

export default router;
