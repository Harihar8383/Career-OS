// src/pages/ProfileCompletePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Loader2, ArrowRight, Plus, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

// --- Re-usable Form components ---
const Input = (props) => (
  <input
    {...props}
    className="w-full bg-slate-800/50 border border-white/10 rounded-md p-3 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full bg-slate-800/50 border border-white/10 rounded-md p-3 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
  />
);

const Label = ({ children }) => (
  <label className="block text-sm font-medium text-text-secondary mb-2 font-dm-sans">
    {children}
  </label>
);
// --------------------------------

// A blank item structure for adding new entries
const BLANK_EXPERIENCE = { company: "", role: "", start: "", end: "", description: "" };
const BLANK_EDUCATION = { institution: "", degree: "", start: "", end: "" };

function ProfileCompletePage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  // This state will hold the *entire* editable profile object
  const [formData, setFormData] = useState(null);
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

        // --- 2. Set the form data from the AI extraction ---
        setFormData({
          name: aiData.name || "",
          headline: aiData.headline || "",
          summary: aiData.summary || "",
          linkedin_url: aiData.linkedin_url || "",
          github_url: aiData.github_url || "",
          // Convert array to comma-separated string for simple editing
          skills: aiData.skills?.join(', ') || "",
          // Use the full arrays for experience and education
          experience: aiData.experience || [],
          education: aiData.education || [],
          // Add manual fields
          preferred_roles: "",
          target_location: "",
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

  // --- 3. State Handlers ---

  // Handles changes for simple, top-level fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- COMPLEX STATE HANDLER: Updates a field within an array (e.g., 'experience') ---
  const handleArrayChange = (e, index, section) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      // Create a *new* array for the section
      const newArray = [...prev[section]];
      
      // Create a *new* object for the item being edited
      newArray[index] = {
        ...newArray[index],
        [name]: value,
      };

      // Return the *new* state object
      return {
        ...prev,
        [section]: newArray,
      };
    });
  };

  // --- COMPLEX STATE HANDLER: Adds a blank item to an array ---
  const handleAddItem = (section) => {
    const blankItem = section === 'experience' ? BLANK_EXPERIENCE : BLANK_EDUCATION;
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], blankItem],
    }));
  };

  // --- COMPLEX STATE HANDLER: Removes an item from an array by its index ---
  const handleRemoveItem = (index, section) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  // --- 4. Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData) return;

    setIsSubmitting(true);
    
    // Re-format comma-separated strings back into arrays
    const completeProfile = {
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      preferred_roles: formData.preferred_roles.split(',').map(s => s.trim()).filter(Boolean),
      // experience and education are already in the correct array format
    };

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/profile/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profileData: completeProfile }),
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

  // --- 5. Render Loading State ---
  if (isLoading || !formData) {
    return (
      <div className="min-h-screen bg-bg-dark flex justify-center items-center">
        <Loader2 size={48} className="animate-spin text-blue-400" />
      </div>
    );
  }

  // --- 6. Render the Full, Editable Form ---
  return (
    <div className="min-h-screen bg-bg-dark text-text-primary antialiased p-8 pt-24 pb-24">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-clash-display text-white text-center mb-4">
          Review & Complete Your Profile
        </h1>
        <p className="mt-4 text-text-body text-lg font-dm-sans text-center mb-12">
          Our AI pre-filled what it could. Please review, edit, and add your career preferences.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- Personal & Links Section --- */}
          <div className="space-y-6">
            <h2 className="text-xl font-clash-display text-white">
              Personal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Full Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <Label>Headline (e.g., "Software Engineer")</Label>
                <Input name="headline" value={formData.headline} onChange={handleChange} />
              </div>
            </div>
            <div>
              <Label>AI-Extracted Summary</Label>
              <Textarea name="summary" rows={5} value={formData.summary} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>LinkedIn URL</Label>
                <Input name="linkedin_url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
              </div>
              <div>
                <Label>GitHub URL</Label>
                <Input name="github_url" value={formData.github_url} onChange={handleChange} placeholder="https://github.com/..." />
              </div>
            </div>
            <div>
              <Label>Skills (comma-separated)</Label>
              <Textarea name="skills" rows={3} value={formData.skills} onChange={handleChange} placeholder="React, Node.js, Python..." />
            </div>
          </div>

          {/* --- Career Preferences Section --- */}
          <div className="space-y-6 border-t border-white/10 pt-8">
            <h2 className="text-xl font-clash-display text-white">
              Career Preferences
            </h2>
            <div>
              <Label>Preferred Roles (comma-separated)</Label>
              <Input name="preferred_roles" value={formData.preferred_roles} onChange={handleChange} placeholder="AI Engineer, Frontend Developer" />
            </div>
            <div>
              <Label>Target Location</Label>
              <Input name="target_location" value={formData.target_location} onChange={handleChange} placeholder="Remote, New York, NY, etc." />
            </div>
          </div>

          {/* --- Experience Section --- */}
          <div className="space-y-6 border-t border-white/10 pt-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-clash-display text-white">Experience & Projects</h2>
              <button
                type="button"
                onClick={() => handleAddItem('experience')}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            {formData.experience.map((exp, index) => (
              <div key={index} className="bg-bg-dark/60 border border-white/10 rounded-xl p-4 space-y-4 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index, 'experience')}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Role / Project Title</Label>
                    <Input name="role" value={exp.role} onChange={e => handleArrayChange(e, index, 'experience')} />
                  </div>
                  <div>
                    <Label>Company / Affiliation</Label>
                    <Input name="company" value={exp.company} onChange={e => handleArrayChange(e, index, 'experience')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input name="start" value={exp.start} onChange={e => handleArrayChange(e, index, 'experience')} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input name="end" value={exp.end} onChange={e => handleArrayChange(e, index, 'experience')} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea name="description" rows={3} value={exp.description} onChange={e => handleArrayChange(e, index, 'experience')} />
                </div>
              </div>
            ))}
          </div>

          {/* --- Education Section --- */}
          <div className="space-y-6 border-t border-white/10 pt-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-clash-display text-white">Education</h2>
              <button
                type="button"
                onClick={() => handleAddItem('education')}
                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
              >
                <Plus size={16} /> Add
              </button>
            </div>
            {formData.education.map((edu, index) => (
              <div key={index} className="bg-bg-dark/60 border border-white/10 rounded-xl p-4 space-y-4 relative">
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index, 'education')}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-400 transition"
                >
                  <Trash2 size={16} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Institution</Label>
                    <Input name="institution" value={edu.institution} onChange={e => handleArrayChange(e, index, 'education')} />
                  </div>
                  <div>
                    <Label>Degree / Field of Study</Label>
                    <Input name="degree" value={edu.degree} onChange={e => handleArrayChange(e, index, 'education')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input name="start" value={edu.start} onChange={e => handleArrayChange(e, index, 'education')} />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input name="end" value={edu.end} onChange={e => handleArrayChange(e, index, 'education')} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- Submit Button --- */}
          <div className="pt-6 flex justify-end border-t border-white/10">
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative inline-flex items-center justify-center gap-2 px-6 py-3
                         rounded-[30px] transition-colors cursor-pointer
                         before:content-[''] before:absolute before:-top-px before:-left-px before:-z-1 before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px]
                         bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7]
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <span className="relative w-fit font-normal text-[16px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">
                  Complete Onboarding
                  <ArrowRight size={20} />
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileCompletePage;