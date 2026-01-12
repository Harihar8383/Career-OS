// src/hooks/usePolling.js
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

export function useOnboardingStatus(shouldPoll, isReupload = false) {
  const [status, setStatus] = useState('pending');
  const [data, setData] = useState(null);
  const { getToken } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchStatus = async () => {
      console.log("Polling for status...");
      try {
        const token = await getToken();
        // Append reupload flag if needed
        const url = `${API_URL}/api/onboarding/status${isReupload ? '?reupload=true' : ''}`;
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch status");

        const result = await response.json();

        if (result.status === "validated") {
          console.log("Status is VALIDATED. Stopping poll.");
          setStatus("validated");
          setData(result.profile); // Save the profile data
          if (intervalRef.current) {
            clearInterval(intervalRef.current); // Stop polling
          }
        }
        // If status is "pending" or "complete", we just keep polling/waiting
        // (or stop if it's "complete" but we'll handle that logic in the component)

      } catch (err) {
        console.error(err);
        // Don't stop polling on a network error, just try again
      }
    };

    if (shouldPoll) {
      // Start polling immediately, then set an interval
      fetchStatus(); 
      intervalRef.current = setInterval(fetchStatus, 3000); // Poll every 3 seconds
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shouldPoll, getToken]);

  return { status, data };
}