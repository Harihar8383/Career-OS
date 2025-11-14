// backend/api-gateway/uploadRouter.js
import { createUploadthing } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";
import { getAuth } from "@clerk/express";
import { publishJob } from "./rabbitMQ.js";

const f = createUploadthing();

const authMiddleware = ({ req }) => {
  const auth = getAuth(req); // Use getAuth(req)
  if (!auth.userId) throw new UploadThingError("Unauthorized");

  return { userId: auth.userId };
};

export const ourFileRouter = {
  resumeUploader: f({
    "application/pdf": { maxFileSize: "8MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
    },
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Upload complete for userId:", metadata.userId);
      console.log("[UploadThing] File URL:", file.ufsUrl);

      const job = {
        userId: metadata.userId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        fileKey: file.key,
      };

      try {
        await publishJob(job);
      } catch (error) {
        console.error("Failed to publish resume job:", error);
        throw new UploadThingError("Failed to queue processing job.");
      }

      return { uploadedBy: metadata.userId };
    }),
};