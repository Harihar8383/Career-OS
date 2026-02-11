// backend/api-gateway/controllers/chat.controller.js
import axios from 'axios';
import ChatHistory from '../models/ChatHistory.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export const streamChat = async (req, res) => {
  const { userId } = req.auth;
  const { message, threadId } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const actualThreadId = threadId || `thread_${userId}_${Date.now()}`;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  try {
    // Save user message to history
    await ChatHistory.create({
      userId,
      threadId: actualThreadId,
      role: 'user',
      content: message,
      metadata: { timestamp: new Date() }
    });

    // Call Python AI service
    const response = await axios.post(
      `${AI_SERVICE_URL}/mentor/stream`,
      {
        user_id: userId,
        thread_id: actualThreadId,
        message: message
      },
      {
        responseType: 'stream',
        timeout: 60000 // 60 second timeout
      }
    );

    let assistantMessage = '';

    // Pipe SSE events from Python to client
    response.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      res.write(chunk);

      // Extract assistant message content for saving
      const lines = chunkStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'response') {
              assistantMessage = data.content;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    });

    response.data.on('end', async () => {
      // Save assistant message to history
      if (assistantMessage) {
        await ChatHistory.create({
          userId,
          threadId: actualThreadId,
          role: 'assistant',
          content: assistantMessage,
          metadata: { timestamp: new Date() }
        });
      }

      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Stream error' })}\n\n`);
      res.end();
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ type: 'error', content: 'Failed to process message' })}\n\n`);
    res.end();
  }
};

export const getChatHistory = async (req, res) => {
  const { userId } = req.auth;
  const { threadId } = req.params;
  const { limit = 50 } = req.query;

  try {
    const history = await ChatHistory.find({
      userId,
      threadId
    })
      .sort({ createdAt: 1 })
      .limit(parseInt(limit));

    res.json({ history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};
