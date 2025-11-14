// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, BookText, BrainCircuit, Briefcase, GraduationCap, Edit, Save, X, Plus, Trash2 } from 'lucide-react'; // Added Plus and Trash2

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

// --- Form & Display Components (You can refactor these into a shared file) ---
const Input = (props) => (
  <input {...props} className="w-full bg-slate-800/50 border border-white/10 rounded-md p-3 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
);
const Textarea = (props) => (
  <textarea {...props} className="w-full bg-slate-800/50 border border-white/10 rounded-md p-3 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none" />
);
const Label = ({ children }) => (
  <label className="block text-sm font-medium text-text-secondary mb-2 font-dm-sans">{children}</label>
);
const DataCard = ({ title, icon, children }) => (
  <div className="bg-bg-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6">
    <div className="flex items-center mb-4">
      {React.createElement(icon, { className: "text-blue-400 w-5 h-5" })}
      <h3 className="text-xl font-clash-display text-white ml-3">{title}</h3>
    </div>
    <div className="font-dm-sans">{children}</div>
  </div>
);
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-[70vh]">
    <Loader2 className="text-blue-400 animate-spin" size={48} />
  </div>
);
// --- End Components ---


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

  // --- 2. Edit State Handlers (CORRECTED) ---
  const handleEdit = () => {
    // Clone profile into editData, converting arrays to strings for forms
    setEditData({
      ...profile,
      skills: profile.skills?.join(', ') || "", // <-- FIX: Use 'skills'
      preferred_roles: profile.preferred_roles?.join(', ') || "",
      // Use the full object arrays for complex fields
      experience: profile.experience || [], // <-- FIX: Use 'experience'
      education: profile.education || [],
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Format data back for the API (CORRECTED)
    const updatedProfile = {
      ...editData,
      skills: editData.skills.split(',').map(s => s.trim()).filter(Boolean), // <-- FIX: Use 'skills'
      preferred_roles: editData.preferred_roles.split(',').map(s => s.trim()).filter(Boolean),
      experience: editData.experience, // <-- FIX: Use 'experience'
      education: editData.education,
    };
    // No longer need to delete 'skills' key

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

  // --- 3. Form Change Handlers (same as ProfileCompletePage) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e, index, section) => {
    const { name, value } = e.target;
    setEditData(prev => {
      const newArray = [...prev[section]];
      newArray[index] = { ...newArray[index], [name]: value };
      return { ...prev, [section]: newArray };
    });
  };

  const handleAddItem = (section) => {
    const blankItem = section === 'experience' ? { company: "", role: "", start: "", end: "", description: "" } : { institution: "", degree: "", start: "", end: "" };
    setEditData(prev => ({
      ...prev,
      [section]: [...prev[section], blankItem],
    }));
  };

  const handleRemoveItem = (index, section) => {
    setEditData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  // --- 4. Render Logic ---
  if (isLoading) return <LoadingSpinner />;
  if (!profile) return <p>No profile data found.</p>;

  // Use 'editData' if in edit mode, otherwise use 'profile'
  const data = isEditing ? editData : profile;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-clash-display text-white">My Profile</h1>
        {isEditing ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition text-sm text-white disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-white/10 hover:bg-slate-700 transition text-sm"
          >
            <Edit size={16} /> Edit Profile
          </button>
        )}
      </div>

      {isEditing ? (
        <RenderEditForm
          data={editData}
          onChange={handleChange}
          onArrayChange={handleArrayChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
        />
      ) : (
        <RenderDisplayProfile profile={profile} />
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
              <button className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-sm">Open Mentor Chat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Display Component (CORRECTED) ---
const RenderDisplayProfile = ({ profile }) => (
  <div className="space-y-6">
    <DataCard title="Summary" icon={BookText}>
      <p className="text-text-secondary italic">"{profile.summary || 'Not provided.'}"</p>
    </DataCard>

    <DataCard title="Technical Skills" icon={BrainCircuit}>
      <div className="flex flex-wrap gap-2">
        {profile.skills?.length > 0 ? ( // <-- FIX: Use 'skills'
          profile.skills.map((skill, i) => ( // <-- FIX: Use 'skills'
            <span key={i} className="bg-blue-500/20 text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
              {skill}
            </span>
          ))
        ) : <p className="text-text-body">No skills listed.</p>}
      </div>
    </DataCard>

    <DataCard title="Experience & Projects" icon={Briefcase}>
      <div className="space-y-4">
        {profile.experience?.map((exp, i) => ( // <-- FIX: Use 'experience'
          <div key={i} className="border-b border-white/10 pb-4 last:pb-0 last:border-b-0">
            <h4 className="font-semibold text-white">{exp.role}</h4>
            <p className="text-text-secondary">{exp.company} ({exp.start} - {exp.end})</p>
            <p className="text-text-body mt-1 text-sm">{exp.description}</p>
          </div>
        ))}
      </div>
    </DataCard>
    
    <DataCard title="Education" icon={GraduationCap}>
      <div className="space-y-4">
        {profile.education?.map((edu, i) => (
          <div key={i}>
            <h4 className="font-semibold text-white">{edu.institution}</h4>
            <p className="text-text-secondary">{edu.degree} ({edu.start} - {edu.end})</p>
          </div>
        ))}
      </div>
    </DataCard>
  </div>
);

// --- Edit Form Component ---
// This component was missing icons, I've added them
const RenderEditForm = ({ data, onChange, onArrayChange, onAddItem, onRemoveItem }) => (
  <form className="space-y-8">
    <div className="space-y-6">
      <h2 className="text-xl font-clash-display text-white">Personal Details</h2>
      {/* (Same as ProfileCompletePage) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><Label>Full Name</Label><Input name="name" value={data.name} onChange={onChange} /></div>
        <div><Label>Headline</Label><Input name="headline" value={data.headline} onChange={onChange} /></div>
      </div>
      <div><Label>Summary</Label><Textarea name="summary" rows={5} value={data.summary} onChange={onChange} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div><Label>LinkedIn URL</Label><Input name="linkedin_url" value={data.linkedin_url} onChange={onChange} /></div>
        <div><Label>GitHub URL</Label><Input name="github_url" value={data.github_url} onChange={onChange} /></div>
      </div>
      <div><Label>Skills (comma-separated)</Label><Textarea name="skills" rows={3} value={data.skills} onChange={onChange} /></div>
    </div>
    
    <div className="space-y-6 border-t border-white/10 pt-8">
      <h2 className="text-xl font-clash-display text-white">Career Preferences</h2>
      <div><Label>Preferred Roles (comma-separated)</Label><Input name="preferred_roles" value={data.preferred_roles} onChange={onChange} /></div>
      <div><Label>Target Location</Label><Input name="target_location" value={data.target_location} onChange={onChange} /></div>
    </div>

    <div className="space-y-6 border-t border-white/10 pt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-clash-display text-white">Experience & Projects</h2>
        <button type="button" onClick={() => onAddItem('experience')} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"><Plus size={16} /> Add</button>
      </div>
      {data.experience.map((exp, index) => (
        <div key={index} className="bg-bg-dark/60 border border-white/10 rounded-xl p-4 space-y-4 relative">
          <button type="button" onClick={() => onRemoveItem(index, 'experience')} className="absolute top-3 right-3 text-red-500 hover:text-red-400 transition"><Trash2 size={16} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Role / Project Title</Label><Input name="role" value={exp.role} onChange={e => onArrayChange(e, index, 'experience')} /></div>
            <div><Label>Company / Affiliation</Label><Input name="company" value={exp.company} onChange={e => onArrayChange(e, index, 'experience')} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Start Date</Label><Input name="start" value={exp.start} onChange={e => onArrayChange(e, index, 'experience')} /></div>
            <div><Label>End Date</Label><Input name="end" value={exp.end} onChange={e => onArrayChange(e, index, 'experience')} /></div>
          </div>
          <div><Label>Description</Label><Textarea name="description" rows={3} value={exp.description} onChange={e => onArrayChange(e, index, 'experience')} /></div>
        </div>
      ))}
    </div>

    <div className="space-y-6 border-t border-white/10 pt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-clash-display text-white">Education</h2>
        <button type="button" onClick={() => onAddItem('education')} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"><Plus size={16} /> Add</button>
      </div>
      {data.education.map((edu, index) => (
        <div key={index} className="bg-bg-dark/60 border border-white/10 rounded-xl p-4 space-y-4 relative">
          <button type="button" onClick={() => onRemoveItem(index, 'education')} className="absolute top-3 right-3 text-red-500 hover:text-red-400 transition"><Trash2 size={16} /></button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Institution</Label><Input name="institution" value={edu.institution} onChange={e => onArrayChange(e, index, 'education')} /></div>
            <div><Label>Degree / Field of Study</Label><Input name="degree" value={edu.degree} onChange={e => onArrayChange(e, index, 'education')} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Start Date</Label><Input name="start" value={edu.start} onChange={e => onArrayChange(e, index, 'education')} /></div>
            <div><Label>End Date</Label><Input name="end" value={edu.end} onChange={e => onArrayChange(e, index, 'education')} /></div>
          </div>
        </div>
      ))}
    </div>
  </form>
);


export default ProfilePage;