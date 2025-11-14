// src/components/Dashboard/OnboardingGate.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/clerk-react";
import { UploadDropzone } from "../../utils/uploadThing.js"; // <-- Imports the *new* pre-configured component
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";

import { useOnboardingStatus } from '../../hooks/usePolling';
import { useNavigate } from 'react-router-dom';

// (Spinner component is the same)
const Spinner = () => (
  <svg className="animate-spin h-8 w-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export function OnboardingGate() {
  const { getToken } = useAuth();
  const navigate = useNavigate(); // <-- 3. Get the navigate function
  const [uploadStatus, setUploadStatus] = useState("WAITING"); // WAITING, UPLOADING, QUEUED
  const [uploadProgress, setUploadProgress] = useState(0);

  // 4. Start polling *only* when the upload is "QUEUED"
  const { status: jobStatus } = useOnboardingStatus(uploadStatus === 'QUEUED');

  // 5. This effect checks the job status and redirects
  useEffect(() => {
    if (jobStatus === "validated") {
      // The AI is done! Redirect to the *complete* page.
      navigate("/onboarding/complete");
    }
  }, [jobStatus, navigate]);

  return (
    <div className="flex justify-center items-center pt-16 pb-24">
      <div 
        className="relative w-full max-w-xl mx-auto p-8 rounded-[20px] 
                   bg-bg-dark/90 backdrop-blur-xl border border-white/10"
      >
        <div 
          className="absolute inset-0 z-0 rounded-[19px] opacity-10" 
          style={{ background: 'linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg-dark) 100%)' }}
        ></div>
        
        <div className="relative z-10">
          
          {/* --- UPLOADING STATE --- */}
          {uploadStatus === "UPLOADING" && (
            <div className="flex flex-col items-center justify-center h-64">
              <Spinner />
              <h3 className="text-white text-2xl font-normal mt-4 mb-2 font-clash-display">
                Uploading...
              </h3>
              <p className="text-text-body text-lg font-dm-sans">
                Please wait while we upload your file.
              </p>
              <div className="w-1/2 bg-slate-700 rounded-full h-2.5 mt-4 overflow-hidden">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* --- 6. UPDATED "QUEUED" STATE (Now our polling state) --- */}
          {uploadStatus === "QUEUED" && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="text-green-400 animate-spin mb-3" size={32} />
              <h3 className="text-white text-3xl font-normal mb-4 font-clash-display">
                Processing Resume
              </h3>
              <p className="text-text-body text-lg font-dm-sans text-center mb-6">
                Your resume is being analyzed by our AI.
              </p>
              <p className="text-text-secondary text-sm font-dm-sans text-center">
                This may take up to a minute. Please wait...
              </p>
            </div>
          )}

          {/* --- WAITING STATE --- */}
          {uploadStatus === "WAITING" && (
            <>
              <h2 className="text-white text-3xl font-normal mb-4 font-clash-display leading-tight text-center">
                Welcome to CareerOS
              </h2>
              <p className="text-text-body text-lg max-w-2xl mx-auto leading-relaxed font-dm-sans mb-8 text-center">
                To get started, please upload your resume. Our AI will analyze it to
                build your "Smart Profile."
              </p>

              <UploadDropzone
                endpoint="resumeUploader" 
                headers={async () => {
                  const token = await getToken();
                  return token ? { Authorization: `Bearer ${token}` } : {};
                }}
                onUploadProgress={(p) => {
                  setUploadStatus("UPLOADING");
                  setUploadProgress(p);
                }}
                onClientUploadComplete={(res) => {
                  console.log("Files uploaded: ", res);
                  setUploadStatus("QUEUED"); // <-- This now triggers the poller
                }}
                onUploadError={(error) => {
                  alert(`Error! ${error.message}`);
                  setUploadStatus("WAITING");
                }}
                appearance={{
                  container:
                    "border-2 border-dashed border-border-secondary bg-transparent hover:border-accent/50 transition-all duration-300 p-6 rounded-[16px] flex flex-col items-center justify-center text-center cursor-pointer mt-4",
                  label:
                    "text-text-secondary text-lg font-normal font-dm-sans mt-2 hover:text-white",
                  allowedContent: "text-text-body text-sm mt-1 font-dm-sans",
                  uploadIcon:
                    "text-blue-400 w-12 h-12 mb-2",
                  button:
                    "relative inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-[30px] transition-colors cursor-pointer w-full max-w-xs mt-4 text-sm font-dm-sans before:content-[''] before:absolute before:-top-px before:-left-px before:-z-1 before:w-[calc(1row0%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px] bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7] text-white",
                }}
                uploadIcon={<UploadCloud size={48} />}
              />
               <p className="text-sm text-text-body text-center mt-4 font-dm-sans">
                Allowed file types: PDF, DOCX.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}