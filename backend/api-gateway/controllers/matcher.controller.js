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
// ... imports
import PartialProfile from '../models/partialProfile.models.js';

// ... (in getAnalysisResults)
export const getAnalysisResults = async (req, res) => {
  const { userId } = req.auth;
  const { runId } = req.params;

  try {
    const analysis = await JdAnalysis.findOne({ runId, clerkId: userId });

    if (!analysis) {
      return res.status(404).json({ error: "Analysis not found." });
    }

    if (analysis.status !== 'complete') {
      return res.status(400).json({ error: "Analysis is not yet complete." });
    }

    // Fetch resume filename
    console.log(`[API] Fetching PartialProfile for user_id: ${userId}`);
    // Use _id for sorting (reliable timestamp in Mongo) and lean() to ignoring schema strictness
    const profile = await PartialProfile.findOne({ user_id: userId })
                                        .sort({ _id: -1 })
                                        .lean();

    if (profile) {
        console.log(`[API] Found PartialProfile: ${profile.file_name} (ID: ${profile._id})`);
    } else {
        console.log(`[API] ❌ No PartialProfile found for user_id: ${userId}`);
    }

    const responseData = {
        ...analysis.analysisResults,
        meta: {
            fileName: profile?.file_name || "resume.pdf",
            // Use snake_case created_at if it comes from Python, or camelCase if from Mongoose
            analyzedAt: analysis.createdAt || analysis.updatedAt || profile?.created_at
        }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error("[API] Error fetching analysis results:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get analysis history for the user
 * @route GET /api/matcher/history
 * @access Private
 */
export const getAnalysisHistory = async (req, res) => {
    const { userId } = req.auth;
    
    try {
        const history = await JdAnalysis.find({ clerkId: userId, status: 'complete' })
            .sort({ createdAt: -1 })
            .limit(20) // Limit to last 20
            .select('runId createdAt analysisResults.jd_summary analysisResults.match_score');
            
        // Transform for frontend
        const safeHistory = history.map(h => ({
            runId: h.runId,
            date: h.createdAt,
            jobTitle: h.analysisResults?.jd_summary?.job_title || 'Unknown Job',
            company: h.analysisResults?.jd_summary?.company || 'Unknown Company',
            score: h.analysisResults?.match_score || 0
        }));

        res.status(200).json(safeHistory);
    } catch (error) {
        console.error("[API] Error fetching history:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * @desc Delete an analysis from history
 * @route DELETE /api/matcher/:runId
 * @access Private
 */
export const deleteAnalysis = async (req, res) => {
    const { userId } = req.auth;
    const { runId } = req.params;

    try {
        const result = await JdAnalysis.deleteOne({ runId, clerkId: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Analysis not found." });
        }

        res.status(200).json({ message: "Analysis deleted successfully." });
    } catch (error) {
        console.error("[API] Error deleting analysis:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};