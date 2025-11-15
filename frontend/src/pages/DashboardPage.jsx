// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { OnboardingGate } from "../components/Dashboard/OnBoardingGate";
import { Sidenav } from "../components/Dashboard/Sidenav";
import { Routes, Route } from "react-router-dom";

// *** IMPORT THE REAL PAGES ***
import ProfilePage from "./ProfilePage"; 
import JDMatcherPage from "./JDMatcherPage"; // <-- IMPORT REAL PAGE
import JobHunterPage from "./JobHunterPage"; // <-- IMPORT REAL PAGE

// A placeholder for now
const PlaceholderComponent = ({ title }) => (
  <div className="text-center">
    <h1 className="text-3xl font-clash-display text-white">{title}</h1>
    <p className="mt-4 text-text-body text-lg font-dm-sans">This feature is coming soon.</p>
  </div>
);

// --- REMOVE PLACEHOLDER CONSTS ---
// const JdMatcherPage = () => <PlaceholderComponent title="JD Matcher Page" />;
// const JobHunterPage = () => <PlaceholderComponent title="Job Hunter Agent Page" />;


function DashboardPage() {
  const { getToken } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = await getToken();
        // --- FIX: Use API_URL ---
        const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";
        const response = await fetch(`${API_URL}/api/onboarding/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch status");
        const data = await response.json();
        setOnboardingStatus(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, [getToken]);

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary antialiased">
      {isLoading && (
        <div className="flex justify-center items-center h-screen text-text-secondary font-dm-sans">
          Loading your dashboard...
        </div>
      )}

      {!isLoading && onboardingStatus && (
        <>
          {onboardingStatus.status === 'complete' ? (
            <>
              <Sidenav />
              {/* --- Use bg-bg-card for the main content area --- */}
              <main className="ml-64 p-10 bg-bg-card min-h-screen"> 
                <Routes>
                  <Route path="/" element={<ProfilePage />} />
                  <Route path="/matcher" element={<JDMatcherPage />} /> {/* <-- Now uses the real page */}
                  <Route path="/hunter" element={<JobHunterPage />} /> {/* <-- Now uses the real page */}
                  {/* Add more dashboard-nested routes here */}
                </Routes>
              </main>
            </>
          ) : (
            <div className="max-w-7xl mx-auto px-6 pt-24">
              <OnboardingGate />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DashboardPage;