// frontend/src/pages/ProfileCompletePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, ArrowRight } from 'lucide-react';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { SubmitButton } from '../components/Forms/FormElements';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

// This is a "blank" profile structure matching our new schema
// It's used as a fallback if the AI somehow returns nothing
const BLANK_PROFILE = {
  personal_info: { full_name: "", phone: "", email: "", location: "", linkedin_url: "", github_url: "", portfolio_url: "" },
  education: [],
  skills: { programming_languages: [], frameworks_libraries: [], databases: [], developer_tools_platforms: [], other_tech: [] },
  projects: [],
  experience: [],
  achievements: [],
  positions_of_responsibility: [],
  certifications: [],
  publications: [],
  career_preferences: { preferred_roles: [], job_type: [], target_locations: [], availability: "" }
};

function ProfileCompletePage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState(null); // This holds the *editable* data
  const [aiSuggestions, setAiSuggestions] = useState(null); // This holds the *original* AI data
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. Fetch AI-extracted profile on page load ---
  useEffect(() => {
    const fetchPartialProfile = async () => {
      setIsLoading(true);
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/profile/partial`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch partial profile");
        }
        
        const data = await response.json();
        const aiData = data.extracted_data || {};

        // Store the original AI data
        setAiSuggestions(aiData);

        // Pre-fill form data from AI, ensuring all keys from BLANK_PROFILE exist
        // This merges AI data with our blank template to prevent errors
        setFormData({
          ...BLANK_PROFILE,
          ...aiData,
          personal_info: { ...BLANK_PROFILE.personal_info, ...aiData.personal_info },
          skills: { ...BLANK_PROFILE.skills, ...aiData.skills },
          career_preferences: { ...BLANK_PROFILE.career_preferences, ...aiData.career_preferences },
          // Ensure arrays are arrays
          education: aiData.education || [],
          experience: aiData.experience || [],
          projects: aiData.projects || [],
          achievements: aiData.achievements || [],
          positions_of_responsibility: aiData.positions_of_responsibility || [],
          certifications: aiData.certifications || [],
          publications: aiData.publications || [],
        });

      } catch (err) {
        console.error(err);
        navigate('/dashboard', { state: { error: "Could not load profile." } });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartialProfile();
  }, [getToken, navigate]);


  // --- 2. Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    
    // --- Helper to clean up data before sending ---
    const cleanData = (data) => {
      const cleaned = { ...data };
      
      // Convert any skill "strings" back to arrays (just in case)
      Object.keys(cleaned.skills).forEach(key => {
        if (typeof cleaned.skills[key] === 'string') {
          cleaned.skills[key] = cleaned.skills[key].split(',').map(s => s.trim()).filter(Boolean);
        }
      });
      
      // Convert experience description from string to array of bullets
      cleaned.experience = cleaned.experience.map(exp => ({
        ...exp,
        description_points: (exp.description_points || "").split('\n').filter(Boolean)
      }));

      // Convert project tech_stack from string to array
      cleaned.projects = cleaned.projects.map(proj => ({
        ...proj,
        tech_stack: Array.isArray(proj.tech_stack) ? proj.tech_stack : (proj.tech_stack || "").split(',').map(s => s.trim()).filter(Boolean)
      }));
      
      return cleaned;
    };

    const finalProfileData = cleanData(formData);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/profile/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          profileData: finalProfileData,
          ai_suggestions: aiSuggestions // Send the original AI data too
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile.");
      }
      
      navigate('/dashboard'); // Success!

    } catch (err)
 {
      console.error(err);
      alert("Error saving profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  // --- 3. Render Loading State ---
  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-bg-dark flex justify-center items-center">
        <Loader2 size={48} className="animate-spin text-blue-400" />
      </div>
    );
  }

  // --- 4. Render the Full, Editable Form ---
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary antialiased p-8 pt-24 pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-clash-display text-white text-center mb-4">
          Review & Complete Your Profile
        </h1>
        <p className="mt-4 text-text-body text-lg font-dm-sans text-center mb-12">
          Our AI pre-filled what it could. Please review, edit, and add your career preferences.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <ProfileForm 
            formData={formData} 
            setFormData={setFormData} 
          />

          {/* --- Submit Button --- */}
          <div className="pt-6 flex justify-end border-t border-white/10">
            <SubmitButton isLoading={isSubmitting}>
              Complete Onboarding
              <ArrowRight size={20} />
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileCompletePage;