// src/utils/uploadthing.js
import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

// 1. Get the API URL from your .env.local file
const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

if (!import.meta.env.VITE_API_GATEWAY_URL) {
  console.warn("WARN: VITE_API_GATEWAY_URL not set in .env.local. Defaulting to http://localhost:8080");
}

// 2. This is the fix from your new documentation
//    We pass the `url` parameter when *generating* the component.
export const UploadButton = generateUploadButton({
  url: `${API_URL}/api/uploadthing`,
});

export const UploadDropzone = generateUploadDropzone({
  url: `${API_URL}/api/uploadthing`,
});