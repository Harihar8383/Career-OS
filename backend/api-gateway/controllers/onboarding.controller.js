// backend/api-gateway/controllers/onboarding.controller.js
import User from '../models/user.models.js';
import PartialProfile from '../models/partialProfile.models.js';

/**
 * @desc Get the onboarding status for a user
 * @route GET /api/onboarding/status
 * @access Private
 */
export const getOnboardingStatus = async (req, res) => {
  const { userId } = req.auth; // Comes from requireAuth middleware

  try {
    const user = await User.findOne({ clerkId: userId });
    if (user && user.onboarding_complete) {
      console.log(`[Status] User already onboarded: ${userId}`);
      return res.json({ status: "complete" });
    }

    const partialProfile = await PartialProfile.findOne(
      { user_id: userId, status: "validated" }
    ).sort({ createdAt: -1 }); // Get the latest one

    if (partialProfile) {
      console.log(`[Status] Found validated partial profile for user: ${userId}`);
      return res.json({ status: "validated", profile: partialProfile });
    }
    
    console.log(`[Status] No validated profile yet for user: ${userId}`);
    return res.json({ status: "pending" });

  } catch (error) {
    console.error("[Status] Error fetching status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};