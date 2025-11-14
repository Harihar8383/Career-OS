// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, Edit, Save, X } from 'lucide-react';
import { ProfileForm } from '../components/Profile/ProfileForm'; // <-- Re-using our form
import { ProfileDisplay } from '../components/Profile/ProfileDisplay'; // <-- Using our new display
import { SubmitButton } from '../components/Forms/FormElements'; // <-- Re-using our button

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-[70vh]">
    <Loader2 className="text-blue-400 animate-spin" size={48} />
  </div>
);

// --- Data Cleaning Helpers (copied from ProfileCompletePage) ---
// These helpers convert data between API-ready and Form-ready formats

/**
 * Converts API data (arrays) into form-friendly strings
 */
const prepareDataForEdit = (profile) => {
  const editable = JSON.parse(JSON.stringify(profile)); // Deep copy

  // Convert experience description arrays to string
  editable.experience = (editable.experience || []).map(exp => ({
    ...exp,
    description_points: Array.isArray(exp.description_points) 
      ? exp.description_points.join('\n') 
      : (exp.description_points || "")
  }));

  // Convert project tech stack array to string
  editable.projects = (editable.projects || []).map(proj => ({
    ...proj,
    tech_stack: Array.isArray(proj.tech_stack) 
      ? proj.tech_stack.join(', ') 
      : (proj.tech_stack || "")
  }));

  return editable;
};

/**
 * Converts form-friendly strings back into API-ready arrays
 */
const cleanDataForApi = (data) => {
  const cleaned = { ...data };
  
  // Convert any skill "strings" back to arrays (just in case)
  Object.keys(cleaned.skills).forEach(key => {
    if (typeof cleaned.skills[key] === 'string') {
      cleaned.skills[key] = cleaned.skills[key].split(',').map(s => s.trim()).filter(Boolean);
    }
  });
  
  // Convert experience description from string to array of bullets
  cleaned.experience = (cleaned.experience || []).map(exp => ({
    ...exp,
    description_points: (exp.description_points || "").split('\n').filter(Boolean)
  }));

  // Convert project tech_stack from string to array
  cleaned.projects = (cleaned.projects || []).map(proj => ({
    ...proj,
    tech_stack: Array.isArray(proj.tech_stack) 
      ? proj.tech_stack 
      : (proj.tech_stack || "").split(',').map(s => s.trim()).filter(Boolean)
  }));
  
  return cleaned;
};


// --- Main Profile Page Component ---
function ProfilePage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null); // This will hold the "saved" profile
  const [editData, setEditData] = useState(null); // This will hold the data being edited
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 1. Data Fetching ---
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/profile/full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
      // Handle error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [getToken]);

  // --- 2. Edit State Handlers ---
  const handleEdit = () => {
    // Clone profile into editData, converting arrays to strings for forms
    setEditData(prepareDataForEdit(profile));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Format data back for the API
    const updatedProfile = cleanDataForApi(editData);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/profile/full`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ profileData: updatedProfile })
      });

      if (!response.ok) throw new Error("Failed to save profile");
      
      const { profile: savedProfile } = await response.json();
      setProfile(savedProfile); // Update main profile state
      setIsEditing(false);
      setEditData(null);

    } catch (err) {
      console.error(err);
      alert("Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };


  // --- 4. Render Logic ---
  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <p className="text-text-body">No profile data found. Please try refreshing.</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-clash-display text-white">My Profile</h1>
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm text-white"
            >
              <X size={16} /> Cancel
            </button>
            <SubmitButton onClick={handleSave} isLoading={isSaving}>
              <Save size={16} /> Save Changes
            </SubmitButton>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 transition text-sm text-white"
          >
            <Edit size={16} /> Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
          <ProfileForm 
            formData={editData} 
            setFormData={setEditData} 
          />
          <div className="pt-6 flex justify-end border-t border-white/10">
            <SubmitButton isLoading={isSaving}>
              <Save size={16} /> Save Changes
            </SubmitButton>
          </div>
        </form>
      ) : (
        <ProfileDisplay profile={profile} />
      )}

      {/* --- Placeholder for Features A & B --- */}
      {!isEditing && (
        <div className="mt-10 border-t border-white/10 pt-10">
          <h2 className="text-2xl font-clash-display text-white mb-6">Profile Hub</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-bg-dark/60 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-clash-display text-white mb-3">Feature A: Analyser</h3>
              <p className="text-text-body mb-4">Get a one-time AI analysis of your profile's strengths and weaknesses.</p>
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-sm text-white">Analyse My Profile</button>
            </div>
            <div className="bg-bg-dark/60 border border-white/10 rounded-xl p-6">
              <h3 className="text-xl font-clash-display text-white mb-3">Feature B: Mentor AI</h3>
              <p className="text-text-body mb-4">Ask our AI mentor questions about your career, based on your profile.</p>
              <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm text-white">Open Mentor Chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;