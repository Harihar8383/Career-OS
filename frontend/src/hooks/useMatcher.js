// frontend/src/hooks/useMatcher.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

// Define polling status messages
const STATUS_MESSAGES = {
  pending: "Job submitted. Waiting for worker...",
  validating: "Validating job description...",
  parsing_jd: "Parsing key skills and requirements...",
  analyzing: "Running deep analysis against your profile...",
};

export function useMatcher() {
  const { getToken } = useAuth();
  const [jdText, setJdText] = useState("");
  const [runId, setRunId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, loading, pending, validating, parsing_jd, analyzing, complete, failed
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const intervalRef = useRef(null);

  // --- 1. Start Analysis ---
  const startAnalysis = async () => {
    if (status === "loading" || status.startsWith("pending")) return;
    setStatus("loading");
    setError(null);
    setResults(null);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/matcher/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jdText }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to start analysis");
      }

      const { runId } = await response.json();
      setRunId(runId);
      setStatus("pending"); // Start polling
      setStatusMessage(STATUS_MESSAGES.pending);

    } catch (err) {
      console.error(err);
      setError(err.message);
      setStatus("failed");
    }
  };

  // --- 2. Fetch Final Results ---
  const fetchResults = async (currentRunId) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/matcher/results/${currentRunId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch results");
      
      const data = await response.json();
      setResults(data);
      setStatus("complete");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch final results.");
      setStatus("failed");
    }
  };

  // --- 3. Polling Effect ---
  useEffect(() => {
    const pollStatus = async () => {
      if (!runId || status === "complete" || status === "failed") {
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/matcher/status/${runId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!response.ok) throw new Error("Polling request failed");
        
        const data = await response.json();
        
        if (data.status === "complete") {
          setStatus("complete");
          setStatusMessage("Analysis complete! Fetching results...");
          if (intervalRef.current) clearInterval(intervalRef.current);
          fetchResults(runId); // Go fetch the final results
        } else if (data.status === "failed") {
          setStatus("failed");
          setError(data.error || "Analysis failed for an unknown reason.");
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else {
          // It's still processing
          setStatus(data.status);
          setStatusMessage(STATUS_MESSAGES[data.status] || "Processing...");
        }
      } catch (err) {
        console.error("Polling error:", err);
        setError("Network error while polling. Please wait.");
        setStatus("failed"); // Stop polling on network error
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // Start polling if status is in a processing state
    if (runId && (status === "pending" || status === "validating" || status === "parsing_jd" || status === "analyzing")) {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(pollStatus, 3000); // Poll every 3 seconds
      }
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [runId, status, getToken]);

  // --- 4. Reset Function ---
  const resetMatcher = () => {
    setJdText("");
    setRunId(null);
    setStatus("idle");
    setStatusMessage("");
    setError(null);
    setResults(null);
  };

  return {
    jdText,
    setJdText,
    status,
    statusMessage,
    error,
    results,
    startAnalysis,
    resetMatcher,
  };
}