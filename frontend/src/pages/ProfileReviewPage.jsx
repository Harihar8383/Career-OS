// src/pages/ProfileReviewPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowRight, BookText, BrainCircuit, Briefcase, GraduationCap } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

// Helper component for displaying a loading spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-[70vh]">
    <Loader2 className="text-blue-400 animate-spin" size={48} />
  </div>
);

// Helper component for styling the data
const DataCard = ({ title, icon, children }) => (
  <div className="bg-bg-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="text-xl font-clash-display text-white ml-3">{title}</h3>
    </div>
    <div className="font-dm-sans">{children}</div>
  </div>
);

function ProfileReviewPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPartialProfile = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/profile/partial`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch partial profile");
        }
        const data = await response.json();
        // We save the 'extracted_data' object from the response
        setProfile(data.extracted_data); 
      } catch (err) {
        console.error(err);
        // Handle error, e.g., navigate back to dashboard
        navigate('/dashboard', { state: { error: "Could not load profile." } });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartialProfile();
  }, [getToken, navigate]);

  // Handler to pass the profile data to the next step
  const handleContinue = () => {
    navigate('/onboarding/complete', { state: { aiProfile: profile } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-dark text-text-primary antialiased p-8 pt-32">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-dark text-text-primary antialiased p-8 pt-32 text-center">
        <h1 className="text-2xl font-clash-display text-red-400">Error</h1>
        <p className="mt-4 text-text-body text-lg font-dm-sans">
          Could not load your AI-generated profile. Please try uploading again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark text-text-primary antialiased p-8 pt-24 pb-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-clash-display text-white text-center mb-4">
          Review Your AI-Generated Profile
        </h1>
        <p className="mt-4 text-text-body text-lg font-dm-sans text-center mb-12">
          This is the data our AI extracted. Please confirm it's correct.
        </p>

        {/* Render the extracted data */}
        <DataCard title="AI Summary" icon={<BookText className="text-blue-400" size={20} />}>
          <p className="text-text-secondary italic">"{profile.summary}"</p>
        </DataCard>

        <DataCard title="Technical Skills" icon={<BrainCircuit className="text-blue-400" size={20} />}>
          <div className="flex flex-wrap gap-2">
            {profile.skills?.map((skill, i) => (
              <span key={i} className="bg-blue-500/20 text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </DataCard>

        <DataCard title="Experience" icon={<Briefcase className="text-blue-400" size={20} />}>
          <div className="space-y-4">
            {profile.experience?.map((exp, i) => (
              <div key={i} className="border-b border-white/10 pb-4 last:pb-0 last:border-b-0">
                <h4 className="font-semibold text-white">{exp.role}</h4>
                <p className="text-text-secondary">{exp.company} ({exp.start} - {exp.end})</p>
                <p className="text-text-body mt-1 text-sm">{exp.description}</p>
              </div>
            ))}
          </div>
        </DataCard>
        
        <DataCard title="Education" icon={<GraduationCap className="text-blue-400" size={20} />}>
          <div className="space-y-4">
            {profile.education?.map((edu, i) => (
              <div key={i}>
                <h4 className="font-semibold text-white">{edu.institution}</h4>
                <p className="text-text-secondary">{edu.degree} ({edu.start} - {edu.end})</p>
              </div>
            ))}
          </div>
        </DataCard>

        {/* Confirmation Button */}
        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-text-secondary font-dm-sans text-sm hover:text-white transition-colors"
          >
            Upload a different resume?
          </button>
          <button
            onClick={handleContinue}
            className="relative inline-flex items-center justify-center gap-2 px-6 py-3
                       rounded-[30px] transition-colors cursor-pointer
                       before:content-[''] before:absolute before:-top-px before:-left-px before:-z-1 before:w-[calc(100%+2px)] before:h-[calc(1T00%+2px)] before:rounded-[30px] before:p-[1px]
                       bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7]"
            style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}
          >
            <span className="relative w-fit font-normal text-[16px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">
              Looks Good, Continue
              <ArrowRight size={20} />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfileReviewPage;