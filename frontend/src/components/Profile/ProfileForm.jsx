// frontend/src/components/Profile/ProfileForm.jsx
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input, Textarea, Label, FormCard, CardHeader } from '../Forms/FormElements';

// --- Reusable Array Fieldset Component ---
// This component manages "Add" and "Remove" for arrays (e.g., Experience)
const ArrayFieldset = ({ title, items, onAddItem, onRemoveItem, renderItem }) => (
  <FormCard>
    <div className="flex justify-between items-center border-b border-white/10 pb-4">
      <h2 className="text-xl font-clash-display text-white">{title}</h2>
      <button
        type="button"
        onClick={onAddItem}
        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition"
      >
        <Plus size={16} /> Add
      </button>
    </div>
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="bg-slate-900/50 border border-white/10 rounded-lg p-4 relative">
          <button
            type="button"
            onClick={() => onRemoveItem(index)}
            className="absolute top-4 right-4 text-red-500 hover:text-red-400 transition"
          >
            <Trash2 size={16} />
          </button>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  </FormCard>
);


// --- The Main Reusable Profile Form ---
export const ProfileForm = ({ formData, setFormData }) => {

  // --- State Handlers ---

  // Simple key-value change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handles changes in nested objects (e.g., personal_info.full_name)
  const handleNestedChange = (e, section) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [name]: value,
      },
    }));
  };
  
  // Handles changes in arrays of objects (e.g., experience[0].role)
  const handleArrayChange = (e, index, section) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newArray = [...prev[section]];
      newArray[index] = { ...newArray[index], [name]: value };
      return { ...prev, [section]: newArray };
    });
  };

  // Handles comma-separated string-to-array for skills
  const handleSkillsChange = (e, category) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: value.split(',').map(s => s.trim()),
      }
    }));
  };
  
  // Handles comma-separated string-to-array for career_preferences
  const handlePreferenceChange = (e, key) => {
     const { value } = e.target;
     setFormData(prev => ({
       ...prev,
       career_preferences: {
         ...prev.career_preferences,
         [key]: value.split(',').map(s => s.trim()),
       }
     }));
  };

  // Adds a blank item to an array
  const handleAddItem = (section) => {
    const blankItem = {
      education: { institution_name: "", degree: "", branch: "", start_date: "", end_date: "", gpa: "" },
      experience: { role: "", company: "", location: "", start_date: "", end_date: "", description_points: "" },
      projects: { title: "", description: "", tech_stack: "", github_link: "" },
    }[section];
    
    // Special case for description_points, which should be a string in the form
    if (section === 'experience') blankItem.description_points = "";
    
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), blankItem],
    }));
  };

  // Removes an item from an array
  const handleRemoveItem = (index, section) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  };

  if (!formData) return null; // Don't render if no data

  // --- Render the Form ---
  return (
    <div className="space-y-8">
      
      {/* --- Personal Info --- */}
      <FormCard>
        <CardHeader title="Personal Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Full Name</Label>
            <Input name="full_name" value={formData.personal_info.full_name} onChange={e => handleNestedChange(e, 'personal_info')} />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" value={formData.personal_info.email} onChange={e => handleNestedChange(e, 'personal_info')} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Phone</Label>
            <Input name="phone" value={formData.personal_info.phone} onChange={e => handleNestedChange(e, 'personal_info')} />
          </div>
          <div>
            <Label>Location</Label>
            <Input name="location" value={formData.personal_info.location} onChange={e => handleNestedChange(e, 'personal_info')} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>LinkedIn URL</Label>
            <Input name="linkedin_url" value={formData.personal_info.linkedin_url} onChange={e => handleNestedChange(e, 'personal_info')} />
          </div>
          <div>
            <Label>GitHub URL</Label>
            <Input name="github_url" value={formData.personal_info.github_url} onChange={e => handleNestedChange(e, 'personal_info')} />
          </div>
        </div>
        <div>
          <Label>Portfolio URL</Label>
          <Input name="portfolio_url" value={formData.personal_info.portfolio_url} onChange={e => handleNestedChange(e, 'personal_info')} />
        </div>
      </FormCard>

      {/* --- Career Preferences --- */}
      <FormCard>
        <CardHeader title="Career Preferences" description="Help our AI find the perfect roles for you." />
         <div>
          <Label>Preferred Roles (comma-separated)</Label>
          <Input name="preferred_roles" 
            value={formData.career_preferences.preferred_roles?.join(', ')} 
            onChange={e => handlePreferenceChange(e, 'preferred_roles')} 
            placeholder="AI Engineer, Frontend Developer" 
          />
        </div>
        <div>
          <Label>Target Locations (comma-separated)</Label>
          <Input name="target_locations" 
            value={formData.career_preferences.target_locations?.join(', ')} 
            onChange={e => handlePreferenceChange(e, 'target_locations')} 
            placeholder="Remote, New York, NY" 
          />
        </div>
      </FormCard>

      {/* --- Skills --- */}
      <FormCard>
        <CardHeader title="Skills" description="Enter skills as comma-separated lists." />
        <div>
          <Label>Programming Languages</Label>
          <Input name="programming_languages" value={formData.skills.programming_languages?.join(', ')} onChange={e => handleSkillsChange(e, 'programming_languages')} />
        </div>
        <div>
          <Label>Frameworks & Libraries</Label>
          <Input name="frameworks_libraries" value={formData.skills.frameworks_libraries?.join(', ')} onChange={e => handleSkillsChange(e, 'frameworks_libraries')} />
        </div>
        <div>
          <Label>Databases</Label>
          <Input name="databases" value={formData.skills.databases?.join(', ')} onChange={e => handleSkillsChange(e, 'databases')} />
        </div>
        <div>
          <Label>Developer Tools & Platforms</Label>
          <Input name="developer_tools_platforms" value={formData.skills.developer_tools_platforms?.join(', ')} onChange={e => handleSkillsChange(e, 'developer_tools_platforms')} />
        </div>
        <div>
          <Label>Other Tech</Label>
          <Input name="other_tech" value={formData.skills.other_tech?.join(', ')} onChange={e => handleSkillsChange(e, 'other_tech')} />
        </div>
      </FormCard>

      {/* --- Experience --- */}
      <ArrayFieldset
        title="Experience"
        items={formData.experience || []}
        onAddItem={() => handleAddItem('experience')}
        onRemoveItem={(index) => handleRemoveItem(index, 'experience')}
        renderItem={(item, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Role</Label><Input name="role" value={item.role} onChange={e => handleArrayChange(e, index, 'experience')} /></div>
              <div><Label>Company</Label><Input name="company" value={item.company} onChange={e => handleArrayChange(e, index, 'experience')} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input name="start_date" value={item.start_date} onChange={e => handleArrayChange(e, index, 'experience')} /></div>
              <div><Label>End Date</Label><Input name="end_date" value={item.end_date} onChange={e => handleArrayChange(e, index, 'experience')} /></div>
            </div>
            <div>
              <Label>Description (Enter as a single block, we will parse bullets on save)</Label>
              <Textarea name="description_points" rows={4} 
                value={Array.isArray(item.description_points) ? item.description_points.join('\n') : item.description_points} 
                onChange={e => handleArrayChange(e, index, 'experience')} 
                placeholder="- Led the migration of...&#10;- Increased performance by..."
              />
            </div>
          </div>
        )}
      />

      {/* --- Projects --- */}
      <ArrayFieldset
        title="Projects"
        items={formData.projects || []}
        onAddItem={() => handleAddItem('projects')}
        onRemoveItem={(index) => handleRemoveItem(index, 'projects')}
        renderItem={(item, index) => (
          <div className="space-y-4">
            <div><Label>Title</Label><Input name="title" value={item.title} onChange={e => handleArrayChange(e, index, 'projects')} /></div>
            <div>
              <Label>Tech Stack (comma-separated)</Label>
              <Input name="tech_stack" 
                value={Array.isArray(item.tech_stack) ? item.tech_stack.join(', ') : item.tech_stack} 
                onChange={e => handleArrayChange(e, index, 'projects')} 
              />
            </div>
            <div>
              <Label>Description / Bullet Points (Enter as a single block)</Label>
              <Textarea name="description" rows={3} value={item.description} onChange={e => handleArrayChange(e, index, 'projects')} />
            </div>
            <div><Label>GitHub Link</Label><Input name="github_link" value={item.github_link} onChange={e => handleArrayChange(e, index, 'projects')} /></div>
          </div>
        )}
      />

      {/* --- Education --- */}
      <ArrayFieldset
        title="Education"
        items={formData.education || []}
        onAddItem={() => handleAddItem('education')}
        onRemoveItem={(index) => handleRemoveItem(index, 'education')}
        renderItem={(item, index) => (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Institution</Label><Input name="institution_name" value={item.institution_name} onChange={e => handleArrayChange(e, index, 'education')} /></div>
              <div><Label>Degree</Label><Input name="degree" value={item.degree} onChange={e => handleArrayChange(e, index, 'education')} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Start Date</Label><Input name="start_date" value={item.start_date} onChange={e => handleArrayChange(e, index, 'education')} /></div>
              <div><Label>End Date</Label><Input name="end_date" value={item.end_date} onChange={e => handleArrayChange(e, index, 'education')} /></div>
            </div>
             <div><Label>GPA</Label><Input name="gpa" value={item.gpa} onChange={e => handleArrayChange(e, index, 'education')} /></div>
          </div>
        )}
      />

      {/* Other sections (Achievements, etc.) can be added here following the same pattern */}

    </div>
  );
};