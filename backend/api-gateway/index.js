// backend/api-gateway/index.js
import 'dotenv/config';
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { connectRabbitMQ } from "./rabbitMQ.js"; 
import { createRouteHandler } from "uploadthing/express"; 
import { ourFileRouter } from "./UploadRouter.js"; 
import connectDB from './config/db.js';
import mainApiRouter from './routes/index.js'; // <-- 1. Import the new main router

const app = express();
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// --- Mount Routers ---

// 1. UploadThing router
app.use(
  "/api/uploadthing",
  createRouteHandler({
    router: ourFileRouter,
    config: { isDev: true },
  })
);

// 2. Main API router
app.use('/api', mainApiRouter); // <-- 2. Mount our new main router


// --- (All old route logic is now removed) ---


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