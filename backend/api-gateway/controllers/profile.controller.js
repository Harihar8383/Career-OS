// backend/api-gateway/controllers/profile.controller.js
import User from '../models/user.models.js';
import PartialProfile from '../models/partialProfile.models.js';

/**
 * @desc Get the AI-extracted partial profile
 * @route GET /api/profile/partial
 * @access Private
 */
export const getPartialProfile = async (req, res) => {
  const { userId } = req.auth;
  console.log(`[API] Fetching partial profile for user: ${userId}`);

  try {
    const partialProfile = await PartialProfile.findOne(
      { user_id: userId, status: "validated" }
    ).sort({ createdAt: -1 }); 

    if (!partialProfile) {
      console.log(`[API] No partial profile found for user: ${userId}`);
      return res.status(404).json({ error: "No partial profile found." });
    }

    console.log(`[API] Found partial profile. Returning data.`);
    res.status(200).json(partialProfile);

  } catch (error) {
    console.error("[API] Error fetching partial profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Complete the onboarding profile
 * @route POST /api/profile/complete
 * @access Private
 */
export const completeProfile = async (req, res) => {
  const { userId } = req.auth;
  const { profileData, ai_suggestions } = req.body; 

  if (!profileData) {
    return res.status(400).json({ error: "No profile data provided." });
  }

  console.log(`[API] Completing profile for user: ${userId}`);

  try {
    const userEmail = profileData.personal_info?.email;
    const userName = profileData.personal_info?.full_name;

    if (!userEmail || !userName) {
      return res.status(400).json({ error: "Missing required name or email in profile data." });
    }
    
    profileData.ai_suggestions = ai_suggestions || {};

    const result = await User.updateOne(
      { clerkId: userId },
      {
        $set: {
          clerkId: userId,
          email: userEmail,
          name: userName,
          profile: profileData,
          onboarding_complete: true, 
        },
      },
      { upsert: true } 
    );

    console.log(`[API] Profile completed and saved. Upserted: ${result.upsertedCount > 0}`);
    res.status(201).json({ status: "complete" });

  } catch (error) {
    console.error("[API] Error completing profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get the user's full, completed profile
 * @route GET /api/profile/full
 * @access Private
 */
export const getFullProfile = async (req, res) => {
  const { userId } = req.auth;
  console.log(`[API] Fetching FULL profile for user: ${userId}`);
  
  try {
    const user = await User.findOne({ clerkId: userId });
    if (!user || !user.profile) {
      return res.status(404).json({ error: "Full profile not found." });
    }
    res.status(200).json(user.profile);
  } catch (error) {
    console.error("[API] Error fetching full profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Update (PUT) the user's full profile
 * @route PUT /api/profile/full
 * @access Private
 */
export const updateFullProfile = async (req, res) => {
  const { userId } = req.auth;
  const { profileData } = req.body;
  
  if (!profileData) {
    return res.status(400).json({ error: "No profile data provided." });
  }

  console.log(`[API] Updating FULL profile for user: ${userId}`);

  try {
    const result = await User.updateOne(
      { clerkId: userId },
      {
        $set: {
          "profile": profileData,
          "name": profileData.personal_info?.full_name
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log(`[API] Full profile updated for user: ${userId}`);
    res.status(200).json({ status: "updated", profile: profileData });

  } catch (error) {
    console.error("[API] Error updating full profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};