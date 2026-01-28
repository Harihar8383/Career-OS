// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Loader2, Edit, Save, X, Bot, Upload, BrainCircuit, CheckCircle2, AlertTriangle, UploadCloud
} from 'lucide-react';
import { ProfileForm } from '../components/Profile/ProfileForm';
import { ProfileDisplay } from '../components/Profile/ProfileDisplay';
import { SubmitButton } from '../components/Forms/FormElements';
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { UploadDropzone } from "@/utils/uploadThing";
import { useOnboardingStatus } from '@/hooks/usePolling';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-[70vh]">
    <Loader2 className="text-blue-400 animate-spin" size={48} />
  </div>
);

// (Data Cleaning Helpers are unchanged)
const prepareDataForEdit = (profile) => {
  const editable = JSON.parse(JSON.stringify(profile));
  editable.experience = (editable.experience || []).map(exp => ({
    ...exp,
    description_points: Array.isArray(exp.description_points)
      ? exp.description_points.join('\n')
      : (exp.description_points || "")
  }));
  editable.projects = (editable.projects || []).map(proj => ({
    ...proj,
    tech_stack: Array.isArray(proj.tech_stack)
      ? proj.tech_stack.join(', ')
      : (proj.tech_stack || "")
  }));
  return editable;
};
const cleanDataForApi = (data) => {
  const cleaned = { ...data };
  Object.keys(cleaned.skills).forEach(key => {
    if (typeof cleaned.skills[key] === 'string') {
      cleaned.skills[key] = cleaned.skills[key].split(',').map(s => s.trim()).filter(Boolean);
    }
  });
  cleaned.experience = (cleaned.experience || []).map(exp => ({
    ...exp,
    description_points: (exp.description_points || "").split('\n').filter(Boolean)
  }));
  cleaned.projects = (cleaned.projects || []).map(proj => ({
    ...proj,
    tech_stack: Array.isArray(proj.tech_stack)
      ? proj.tech_stack
      : (proj.tech_stack || "").split(',').map(s => s.trim()).filter(Boolean)
  }));
  return cleaned;
};
// --- End of Data Cleaning Helpers ---


// --- Main Profile Page Component ---
function ProfilePage() {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editData, setEditData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isReuploading, setIsReuploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Pass isReuploading (true) as the second argument to bypass the "already complete" check
  const { status: jobStatus } = useOnboardingStatus(isReuploading, true);

  const fetchProfile = async () => {
    setIsLoading(prev => !prev);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [getToken]);

  useEffect(() => {
    if (jobStatus === 'validated') {
      console.log("Re-upload processed! Refreshing profile...");
      setIsReuploading(false);
      setShowUploadModal(false);
      fetchProfile();
    }
  }, [jobStatus]);

  const handleEdit = () => {
    setEditData(prepareDataForEdit(profile));
    setIsEditing(true);
  };
  const handleCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };
  const handleSave = async () => {
    setIsSaving(true);
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
      setProfile(savedProfile);
      setIsEditing(false);
      setEditData(null);
    } catch (err) {
      console.error(err);
      alert("Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setIsReuploading(false);
    setUploadError(null);
  }


  if (isLoading) return <LoadingSpinner />;
  if (!profile) return (
    <div className="text-center p-12">
      <h2 className="text-2xl font-clash-display text-text-primary mb-2">Error</h2>
      <p className="text-text-body">No profile data found. Please try refreshing.</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto relative min-h-[calc(100vh-100px)]">

      <div className="flex flex-wrap justify-between items-center gap-4 mb-8 pb-4 border-b border-border-primary">
        <h1 className="text-3xl font-clash-display text-text-primary">My Profile</h1>

        <div className="flex items-center gap-4 flex-wrap">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm text-white"
              >
                <X size={16} /> Cancel
              </button>
              <SubmitButton onClick={handleSave} isLoading={isSaving} className="py-2 h-auto">
                <Save size={16} /> Save Changes
              </SubmitButton>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                <Upload size={16} /> Update Resume
              </button>

              <ShimmerButton
                onClick={() => alert('This will be wired up later.')}
                className="flex items-center gap-2 text-md text-white transition-colors"
                background="#2934FF"
                shimmerColor="#8AA5FF"
              >
                <BrainCircuit size={16} /> Analyse Profile
              </ShimmerButton>

              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-bg-card border border-border-primary hover:bg-bg-dark transition text-sm text-text-primary"
              >
                <Edit size={16} /> Edit
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="pb-24">
        {isEditing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
            <ProfileForm
              formData={editData}
              setFormData={setEditData}
            />
            <div className="pt-6 flex justify-end border-t border-border-primary">
              <SubmitButton isLoading={isSaving} className="py-2 h-auto">
                <Save size={16} /> Save Changes
              </SubmitButton>
            </div>
          </form>
        ) : (
          <ProfileDisplay profile={profile} />
        )}
      </div>

      <button
        onClick={() => alert('This will open the Mentor AI chat.')}
        className="fixed bottom-10 right-10 z-50 w-16 h-16 bg-[#A855F7] hover:bg-[#9333EA] rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-110"
        title="Ask AI Mentor"
      >
        <Bot size={28} className="text-white" />
      </button>

      {/* --- UPLOAD MODAL --- */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-bg-card border border-border-primary rounded-xl p-8 shadow-2xl">
            <button
              onClick={closeUploadModal}
              className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {isReuploading ? (
              // Processing State
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="text-blue-400 animate-spin mb-6" size={48} />
                <h2 className="text-2xl font-clash-display text-white mb-2">
                  Processing New Resume...
                </h2>
                <p className="text-lg text-text-body font-dm-sans">
                  The AI is updating your profile. Please wait.
                </p>
              </div>
            ) : uploadError ? (
              // Error State
              // ... (unchanged)
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertTriangle className="text-red-400 mb-6" size={48} />
                <h2 className="text-2xl font-clash-display text-text-primary mb-2">
                  Upload Failed
                </h2>
                <p className="text-lg text-red-300 bg-red-500/10 p-4 rounded-lg font-dm-sans">
                  {uploadError}
                </p>
                <button
                  onClick={closeUploadModal}
                  className="mt-8 px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-white text-sm font-dm-sans"
                >
                  Close
                </button>
              </div>
            ) : (
              // Upload State
              <>
                <h2 className="text-2xl font-clash-display text-text-primary mb-4">
                  Update Your Resume
                </h2>
                <p className="text-text-body font-dm-sans mb-6">
                  Upload a new PDF or DOCX file. This will replace your old
                  AI suggestions and re-analyze your profile.
                </p>
                <UploadDropzone
                  endpoint="resumeUploader"
                  headers={async () => {
                    const token = await getToken();
                    return token ? { Authorization: `Bearer ${token}` } : {};
                  }}
                  onClientUploadComplete={(res) => {
                    console.log("Files uploaded: ", res);
                    setIsReuploading(true);
                  }}
                  onUploadError={(error) => {
                    setUploadError(error.message);
                  }}
                  // --- 2. THE FIX IS HERE ---
                  // Replaced `button: "hidden"` with styles from OnBoardingGate.jsx
                  appearance={{
                    container: "border-2 border-dashed border-border-secondary bg-transparent hover:border-blue-400/50 transition-all duration-300 p-6 rounded-[16px] flex flex-col items-center justify-center text-center cursor-pointer mt-4",
                    label: "text-text-secondary text-lg font-normal font-dm-sans mt-2 hover:text-white",
                    allowedContent: "text-text-body text-sm mt-1 font-dm-sans",
                    uploadIcon: "text-blue-400 w-12 h-12 mb-2",
                    button:
                      "relative inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-[30px] transition-colors cursor-pointer w-full max-w-xs mt-4 text-sm font-dm-sans before:content-[''] before:absolute before:-top-px before:-left-px before:-z-1 before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px] bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7] text-white",
                  }}
                  uploadIcon={<UploadCloud size={48} />}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;