import 'dotenv/config';
import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth, getAuth } from "@clerk/express"; // <-- Removed clerkClient, not needed here
import { connectRabbitMQ } from "./rabbitMQ.js"; 
import { createRouteHandler } from "uploadthing/express"; 
import { ourFileRouter } from "./UploadRouter.js"; 
import connectDB from './config/db.js';
import User from './models/user.models.js'; // <-- This now imports our NEW schema
import PartialProfile from './models/partialProfile.models.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// UploadThing route
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: ourFileRouter,
    config: { isDev: true },
  })
);

// --- Health Check ---
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

// --- Onboarding Status Endpoint (Unchanged) ---
app.get("/api/onboarding/status", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);

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
      // Send the whole partial profile, including the new 'extracted_data'
      return res.json({ status: "validated", profile: partialProfile });
    }
    
    console.log(`[Status] No validated profile yet for user: ${userId}`);
    return res.json({ status: "pending" });

  } catch (error) {
    console.error("[Status] Error fetching status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --- Partial Profile Endpoint (Unchanged) ---
// This now returns the new, detailed JSON from the 'extracted_data' field
app.get("/api/profile/partial", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
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
    res.status(200).json(partialProfile); // Send the full partialProfile doc

  } catch (error) {
    console.error("[API] Error fetching partial profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --- *** MODIFIED: Complete Profile Endpoint *** ---
app.post("/api/profile/complete", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
  // We now expect the full profile object AND the original AI suggestions
  const { profileData, ai_suggestions } = req.body; 

  if (!profileData) {
    return res.status(400).json({ error: "No profile data provided." });
  }

  console.log(`[API] Completing profile for user: ${userId}`);

  try {
    // Get email and name from the user-verified data
    const userEmail = profileData.personal_info?.email;
    const userName = profileData.personal_info?.full_name;

    if (!userEmail || !userName) {
      return res.status(400).json({ error: "Missing required name or email in profile data." });
    }
    
    // Set the ai_suggestions field within the profile
    profileData.ai_suggestions = ai_suggestions || {};

    const result = await User.updateOne(
      { clerkId: userId },
      {
        $set: {
          clerkId: userId,
          email: userEmail,
          name: userName,
          profile: profileData, // Save the entire new profile object
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
});


// --- GET FULL PROFILE ENDPOINT (Unchanged) ---
app.get("/api/profile/full", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
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
});

// --- UPDATE FULL PROFILE ENDPOINT (Unchanged) ---
app.put("/api/profile/full", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req);
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
          "name": profileData.personal_info?.full_name // Also update top-level name if it changed
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    console.log(`[API] Full profile updated for user: ${userId}`);
    res.status(200).json({ status: "updated", profile: profileData });

  } catch (error)
 {
    console.error("[API] Error updating full profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --- Start the server (Unchanged) ---
const port = process.env.PORT || 8080;

const startServer = async () => {
  try {
    await connectDB();
    await connectRabbitMQ(); 
    
    app.listen(port, () => {
      console.log(`🚀 API Gateway running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
};

startServer();