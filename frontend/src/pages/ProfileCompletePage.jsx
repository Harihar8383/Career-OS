// frontend/src/pages/ProfileCompletePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, ArrowRight } from 'lucide-react';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { SubmitButton } from '../components/Forms/FormElements';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

// Blank profile acts as type/template defaults (no nulls)
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
  
  // Start with a sanitized blank profile so inputs are always controlled
  const [formData, setFormData] = useState(() => structuredClone(BLANK_PROFILE));
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: ensure a value is a string (no null) 
  const toSafeString = (v) => (v === null || v === undefined) ? "" : String(v);

  // Helper: ensure something is an array; if string split by comma; if single value wrap in array
  const toArray = (v) => {
    if (Array.isArray(v)) return v;
    if (v === null || v === undefined || v === "") return [];
    if (typeof v === 'string') {
      // If newline-separated list, keep as-is? We'll split by comma for generic lists.
      return v.split(',').map(s => s.trim()).filter(Boolean);
    }
    // For number/boolean/object fallback to single-element string representation
    return [String(v)];
  };

  // Sanitize the whole profile so fields are of expected types (strings/arrays)
  const sanitizeProfile = (raw = {}) => {
    const merged = {
      ...structuredClone(BLANK_PROFILE),
      ...raw,
      personal_info: { ...structuredClone(BLANK_PROFILE.personal_info), ...(raw.personal_info || {}) },
      skills: { ...structuredClone(BLANK_PROFILE.skills), ...(raw.skills || {}) },
      career_preferences: { ...structuredClone(BLANK_PROFILE.career_preferences), ...(raw.career_preferences || {}) },
      education: raw.education || [],
      experience: raw.experience || [],
      projects: raw.projects || [],
      achievements: raw.achievements || [],
      positions_of_responsibility: raw.positions_of_responsibility || [],
      certifications: raw.certifications || [],
      publications: raw.publications || [],
    };

    // Clean personal_info strings
    Object.keys(merged.personal_info).forEach(k => {
      merged.personal_info[k] = toSafeString(merged.personal_info[k]);
    });

    // Ensure each skill category is an array
    Object.keys(merged.skills).forEach(k => {
      merged.skills[k] = toArray(merged.skills[k]);
    });

    // Ensure career_preferences arrays plus availability string
    merged.career_preferences.preferred_roles = toArray(merged.career_preferences.preferred_roles);
    merged.career_preferences.job_type = toArray(merged.career_preferences.job_type);
    merged.career_preferences.target_locations = toArray(merged.career_preferences.target_locations);
    merged.career_preferences.availability = toSafeString(merged.career_preferences.availability);

    // Ensure education items exist as array of objects (best-effort)
    merged.education = Array.isArray(merged.education) ? merged.education.map(item => item || {}) : [];

    // Normalize experience: ensure description_points is array (but don't mutate original structure accidentally)
    merged.experience = Array.isArray(merged.experience)
      ? merged.experience.map(exp => ({
          ...exp,
          // keep other fields; ensure strings for title/company
          title: toSafeString(exp.title),
          company: toSafeString(exp.company),
          start_date: toSafeString(exp.start_date),
          end_date: toSafeString(exp.end_date),
          // description_points could be array or string or object — normalize to array of strings
          description_points: (() => {
            const rawPts = exp.description_points;
            if (Array.isArray(rawPts)) return rawPts.map(p => toSafeString(p)).filter(Boolean);
            if (rawPts === null || rawPts === undefined) return [];
            if (typeof rawPts === 'string') {
              // Split on newlines OR bullets (•). Keep it conservative.
              return rawPts.split(/\r?\n|•/).map(p => p.trim()).filter(Boolean);
            }
            // If it's an object (rare), stringify values
            if (typeof rawPts === 'object') {
              return Object.values(rawPts).map(v => toSafeString(v)).filter(Boolean);
            }
            return [toSafeString(rawPts)];
          })()
        }))
      : [];

    // Normalize projects: tech_stack array, strings sanitized
    merged.projects = Array.isArray(merged.projects)
      ? merged.projects.map(p => ({
          ...p,
          name: toSafeString(p.name),
          summary: toSafeString(p.summary),
          tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack.map(t => toSafeString(t)).filter(Boolean) : toArray(p.tech_stack)
        }))
      : [];

    // Other lists — coerce to arrays of strings/objects
    merged.achievements = Array.isArray(merged.achievements) ? merged.achievements.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).map(toSafeString) : [];
    merged.positions_of_responsibility = Array.isArray(merged.positions_of_responsibility) ? merged.positions_of_responsibility.map(toSafeString) : [];
    merged.certifications = Array.isArray(merged.certifications) ? merged.certifications.map(toSafeString) : [];
    merged.publications = Array.isArray(merged.publications) ? merged.publications.map(toSafeString) : [];

    return merged;
  };

  // --- 1. Fetch AI-extracted profile on page load ---
  useEffect(() => {
    let mounted = true;
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

        // Store the original AI data (as-is)
        if (mounted) setAiSuggestions(aiData);

        // Merge and sanitize so form inputs always receive strings/arrays (no null)
        const sanitized = sanitizeProfile(aiData);
        if (mounted) setFormData(sanitized);

      } catch (err) {
        console.error(err);
        // redirect with error message
        navigate('/dashboard', { state: { error: "Could not load profile." } });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchPartialProfile();
    return () => { mounted = false; };
  }, [getToken, navigate]);

  // --- 2. Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    
    // --- Helper to clean up data before sending ---
    const cleanData = (data) => {
      const cleaned = { ...data };

      // Ensure skills are arrays (if user composed them as comma-strings)
      Object.keys(cleaned.skills).forEach(key => {
        cleaned.skills[key] = Array.isArray(cleaned.skills[key])
          ? cleaned.skills[key].map(s => toSafeString(s)).filter(Boolean)
          : toArray(cleaned.skills[key]);
      });
      
      // Normalize experience description to arrays of strings
      cleaned.experience = Array.isArray(cleaned.experience)
        ? cleaned.experience.map(exp => {
            const rawPts = exp.description_points;
            let pts = [];
            if (Array.isArray(rawPts)) {
              pts = rawPts.map(p => toSafeString(p)).filter(Boolean);
            } else if (typeof rawPts === 'string') {
              pts = rawPts.split(/\r?\n|•/).map(p => p.trim()).filter(Boolean);
            } else if (rawPts === null || rawPts === undefined) {
              pts = [];
            } else if (typeof rawPts === 'object') {
              pts = Object.values(rawPts).map(v => toSafeString(v)).filter(Boolean);
            } else {
              pts = [toSafeString(rawPts)];
            }

            return {
              ...exp,
              description_points: pts
            };
          })
        : [];

      // Convert project tech_stack to arrays
      cleaned.projects = Array.isArray(cleaned.projects)
        ? cleaned.projects.map(proj => ({
            ...proj,
            tech_stack: Array.isArray(proj.tech_stack) ? proj.tech_stack.map(t => toSafeString(t)).filter(Boolean) : toArray(proj.tech_stack)
          }))
        : [];

      // Final safety: ensure strings are strings in personal_info and career_preferences.availability
      Object.keys(cleaned.personal_info || {}).forEach(k => {
        cleaned.personal_info[k] = toSafeString(cleaned.personal_info[k]);
      });
      cleaned.career_preferences = cleaned.career_preferences || {};
      cleaned.career_preferences.availability = toSafeString(cleaned.career_preferences.availability);
      cleaned.career_preferences.preferred_roles = toArray(cleaned.career_preferences.preferred_roles);
      cleaned.career_preferences.job_type = toArray(cleaned.career_preferences.job_type);
      cleaned.career_preferences.target_locations = toArray(cleaned.career_preferences.target_locations);

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

    } catch (err) {
      console.error(err);
      alert("Error saving profile. Please try again.");
      setIsSubmitting(false);
    }
  };

  // --- 3. Render Loading State ---
  if (isLoading) {
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
