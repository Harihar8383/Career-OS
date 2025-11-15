// backend/api-gateway/controllers/matcher.controller.js
import JdAnalysis from '../models/jdAnalysis.models.js';
import { publishJob, QUEUES } from '../rabbitMQ.js';
import crypto from 'crypto';

/**
 * @desc Start a new JD analysis
 * @route POST /api/matcher/analyze
 * @access Private
 */
export const analyzeJd = async (req, res) => {
  // --- THE FIX ---
  const { userId } = req.auth; // Changed from clerkId
  // ---------------
  const { jdText } = req.body;

  if (!jdText || jdText.length < 100) {
    return res.status(400).json({ error: "Job Description text is too short." });
  }

  try {
    const runId = crypto.randomUUID();

    // 1. Create the analysis document in MongoDB
    const newAnalysis = new JdAnalysis({
      // --- THE FIX ---
      clerkId: userId, // Pass the userId to the clerkId field
      // ---------------
      runId,
      jdText,
      status: 'pending',
    });
    await newAnalysis.save();

    // 2. Publish the job to the AI worker
    const job = {
      clerkId: userId, // Pass the correct ID
      runId,
    };
    await publishJob(QUEUES.JD_ANALYSIS, job);

    console.log(`[API] JD Analysis job created with runId: ${runId}`);
    // 3. Return the runId to the frontend for polling
    res.status(202).json({ runId });

  } catch (error) {
    console.error("[API] Error starting JD analysis:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get the status of a running analysis
 * @route GET /api/matcher/status/:runId
 * @access Private
 */
export const getAnalysisStatus = async (req, res) => {
  // --- THE FIX ---
  const { userId } = req.auth; // Changed from clerkId
  // ---------------
  const { runId } = req.params;

  try {
    // --- THE FIX ---
    const analysis = await JdAnalysis.findOne({ runId, clerkId: userId });
    // ---------------

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found." });
    }

    res.status(200).json({ 
      status: analysis.status, 
      error: analysis.errorMessage 
    });

  } catch (error) {
    console.error("[API] Error fetching analysis status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get the final results of a completed analysis
 * @route GET /api/matcher/results/:runId
 * @access Private
 */
export const getAnalysisResults = async (req, res) => {
  // --- THE FIX ---
  const { userId } = req.auth; // Changed from clerkId
  // ---------------
  const { runId } = req.params;

  try {
    // --- THE FIX ---
    const analysis = await JdAnalysis.findOne({ runId, clerkId: userId });
    // ---------------

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found." });
    }

    if (analysis.status !== 'complete') {
      return res.status(400).json({ error: "Analysis is not yet complete." });
    }

    res.status(200).json(analysis.analysisResults);

  } catch (error) {
    console.error("[API] Error fetching analysis results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};