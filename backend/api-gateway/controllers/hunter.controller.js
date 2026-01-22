// backend/api-gateway/controllers/hunter.controller.js
import HunterSession from '../models/HunterSession.js';
import JobResult from '../models/JobResult.js';
import { publishJob, QUEUES, getChannel } from '../rabbitMQ.js';
import crypto from 'crypto';

/**
 * @desc Start a new job hunt session
 * @route POST /api/hunter/hunt
 * @access Private
 */
export const startHunt = async (req, res) => {
  const { userId } = req.auth;
  const criteria = req.body;

  // Validate that we have at least a role or location
  if (!criteria || (!criteria.role && !criteria.jobTitles && !criteria.location)) {
    return res.status(400).json({ 
      error: "Please provide search criteria (role and/or location required)." 
    });
  }

  try {
    const sessionId = crypto.randomUUID();

    // 1. Create the session document in MongoDB
    const newSession = new HunterSession({
      userId,
      sessionId,
      status: 'queued',
      criteria,
      logs: [`[${new Date().toISOString()}] Job hunt session created`]
    });
    await newSession.save();

    // 2. Publish the job to RabbitMQ for the AI worker to process
    const job = {
      sessionId,
      userId,
      criteria
    };
    await publishJob(QUEUES.JOB_HUNTER, job);

    console.log(`[API] Job hunt session created with sessionId: ${sessionId}`);

    // 3. Return the sessionId to the frontend for polling
    res.status(202).json({ sessionId });

  } catch (error) {
    console.error("[API] Error starting job hunt:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get the status and logs of a job hunt session
 * @route GET /api/hunter/session/:sessionId
 * @access Private
 */
export const getSession = async (req, res) => {
  const { userId } = req.auth;
  const { sessionId } = req.params;

  try {
    const session = await HunterSession.findOne({ sessionId, userId });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    res.status(200).json({
      sessionId: session.sessionId,
      status: session.status,
      logs: session.logs,
      criteria: session.criteria,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    });

  } catch (error) {
    console.error("[API] Error fetching session:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get all job results for a specific session
 * @route GET /api/hunter/results/:sessionId
 * @access Private
 */
export const getResults = async (req, res) => {
  const { userId } = req.auth;
  const { sessionId } = req.params;

  try {
    // First verify the session exists and belongs to the user
    const session = await HunterSession.findOne({ sessionId, userId });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Fetch all job results for this session, sorted by match score (highest first)
    const results = await JobResult.find({ sessionId, userId })
      .sort({ matchScore: -1 })
      .lean();

    res.status(200).json({
      sessionId,
      status: session.status,
      totalResults: results.length,
      results
    });

  } catch (error) {
    console.error("[API] Error fetching results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Stream real-time logs for a job hunt session via SSE
 * @route GET /api/hunter/logs/:sessionId
 * @access Private
 */
export const streamLogs = async (req, res) => {
  const { userId } = req.auth;
  const { sessionId } = req.params;

  try {
    // Verify the session exists and belongs to the user
    const session = await HunterSession.findOne({ sessionId, userId });

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log(`[SSE] Client connected for session: ${sessionId}`);

    // Send initial existing logs
    if (session.logs && session.logs.length > 0) {
      session.logs.forEach(log => {
        res.write(`data: ${JSON.stringify({ type: 'info', message: log })}\n\n`);
      });
    }

    // Set up RabbitMQ consumer for real-time logs
    const channel = getChannel();
    
    if (!channel) {
      console.error('[SSE] RabbitMQ channel not available');
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Log streaming unavailable' })}\n\n`);
      res.end();
      return;
    }

    // Create a temporary queue for this SSE connection
    const { queue } = await channel.assertQueue('', { exclusive: true });
    
    // Bind to the logs exchange/queue with filter for this sessionId
    await channel.bindQueue(queue, '', QUEUES.JOB_HUNT_LOGS);

    // Consume messages
    const consumerTag = await channel.consume(queue, (msg) => {
      if (msg) {
        try {
          const logEntry = JSON.parse(msg.content.toString());
          
          // Filter logs for this session only
          if (logEntry.sessionId === sessionId) {
            // Send log to SSE client
            res.write(`data: ${JSON.stringify({
              type: logEntry.level || 'info',
              message: logEntry.message,
              timestamp: logEntry.timestamp
            })}\n\n`);

            // Also save to MongoDB
            HunterSession.updateOne(
              { sessionId },
              { $push: { logs: `[${logEntry.level}] ${logEntry.message}` } }
            ).catch(err => console.error('[SSE] Error saving log to DB:', err));
          }
        } catch (err) {
          console.error('[SSE] Error processing log message:', err);
        }
        
        channel.ack(msg);
      }
    }, { noAck: false });

    // Handle client disconnect
    req.on('close', async () => {
      console.log(`[SSE] Client disconnected for session: ${sessionId}`);
      try {
        await channel.cancel(consumerTag.consumerTag);
        await channel.deleteQueue(queue);
      } catch (err) {
        console.error('[SSE] Error cleaning up consumer:', err);
      }
      res.end();
    });

    // Send heartbeat every 15 seconds to keep connection alive
    const heartbeat = setInterval(() => {
      res.write(`: heartbeat\n\n`);
    }, 15000);

    req.on('close', () => {
      clearInterval(heartbeat);
    });

  } catch (error) {
    console.error("[API] Error in SSE stream:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
};
