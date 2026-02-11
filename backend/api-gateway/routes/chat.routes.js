// backend/api-gateway/routes/chat.routes.js
import express from 'express';
import { requireAuth } from '@clerk/express';
import { streamChat, getChatHistory } from '../controllers/chat.controller.js';

const router = express.Router();

// POST /api/chat/stream - Stream AI Mentor responses
router.post('/stream', requireAuth(), streamChat);

// GET /api/chat/history/:threadId - Get chat history for a thread
router.get('/history/:threadId', requireAuth(), getChatHistory);

export default router;
