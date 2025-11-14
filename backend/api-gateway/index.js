// import 'dotenv/config';
// ... (rest of the debugging code)

// above code is for debugging only, below is the final code
import 'dotenv/config';
import express from "express";
import cors from "cors";
import { clerkMiddleware, requireAuth, getAuth, clerkClient } from "@clerk/express"; // <-- 1. IMPORT clerkClient
import { connectRabbitMQ } from "./rabbitMQ.js"; 
import { createRouteHandler } from "uploadthing/express"; 
import { ourFileRouter } from "./UploadRouter.js"; 
import connectDB from './config/db.js';
import User from './models/user.models.js';
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

// --- Onboarding Status Endpoint (No changes) ---
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
    );

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
});


// --- Partial Profile Endpoint (No changes) ---
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
    res.status(200).json(partialProfile);

  } catch (error) {
    console.error("[API] Error fetching partial profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// --- Complete Profile Endpoint (FIXED) ---
app.post("/api/profile/complete", requireAuth(), async (req, res) => {
  const { userId } = getAuth(req); // This part is correct
  const { profileData } = req.body; 

  if (!profileData) {
    return res.status(400).json({ error: "No profile data provided." });
  }

  console.log(`[API] Completing profile for user: ${userId}`);

  try {
    // This is the profile sub-document, matching your user.model.js
    const newProfile = profileData;

    // --- THIS IS THE FIX ---
    // Use the userId to fetch the full user object from Clerk
    const clerkUser = await clerkClient.users.getUser(userId); 
    // --- END OF FIX ---

    const userEmail = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;

    if (!userEmail) {
      return res.status(400).json({ error: "Could not find user email." });
    }

    const result = await User.updateOne(
      { clerkId: userId },
      {
        $set: {
          clerkId: userId,
          email: userEmail,
          name: profileData.name,
          profile: newProfile,
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


// --- *** NEW: GET FULL PROFILE ENDPOINT *** ---
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

// --- *** NEW: UPDATE FULL PROFILE ENDPOINT *** ---
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
          "name": profileData.name // Also update top-level name if it changed
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


// --- Start the server (No changes) ---
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