// frontend/src/components/Profile/ProfileDisplay.jsx
import React from 'react';
import { DataCard, SkillTag, ExperienceItem, ProjectItem, EducationItem } from './ProfileCards';
import { Briefcase, GraduationCap, BrainCircuit, Award, GitBranch, Sparkles, User, Link2, Target, MapPin } from 'lucide-react';

// This component lays out all the display cards
export const ProfileDisplay = ({ profile }) => {
  const p = profile; // shortcut

  return (
    <div className="space-y-6">
      
      {/* --- Personal Info Card --- */}
      <DataCard title="Personal Details" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm text-text-secondary">Full Name</h5>
            <p className="text-white">{p.personal_info.full_name}</p>
          </div>
          <div>
            <h5 className="text-sm text-text-secondary">Email</h5>
            <p className="text-white">{p.personal_info.email}</p>
          </div>
          <div>
            <h5 className="text-sm text-text-secondary">Phone</h5>
            <p className="text-white">{p.personal_info.phone || 'Not provided'}</p>
          </div>
          <div>
            <h5 className="text-sm text-text-secondary">Location</h5>
            <p className="text-white">{p.personal_info.location || 'Not provided'}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          {p.personal_info.linkedin_url && <a href={p.personal_info.linkedin_url} className="flex items-center gap-1 text-blue-400 hover:text-blue-300"><Link2 size={14} /> LinkedIn</a>}
          {p.personal_info.github_url && <a href={p.personal_info.github_url} className="flex items-center gap-1 text-blue-400 hover:text-blue-300"><Link2 size={14} /> GitHub</a>}
          {p.personal_info.portfolio_url && <a href={p.personal_info.portfolio_url} className="flex items-center gap-1 text-blue-400 hover:text-blue-300"><Link2 size={14} /> Portfolio</a>}
        </div>
      </DataCard>

      {/* --- Career Preferences --- */}
      <DataCard title="Career Preferences" icon={Target}>
         <div>
            <h5 className="text-sm text-text-secondary">Preferred Roles</h5>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.career_preferences.preferred_roles?.length > 0 ? (
                p.career_preferences.preferred_roles.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)
              ) : <p className="text-text-body text-sm">No roles listed.</p>}
            </div>
          </div>
           <div>
            <h5 className="text-sm text-text-secondary">Target Locations</h5>
            <div className="flex flex-wrap gap-2 mt-2">
              {p.career_preferences.target_locations?.length > 0 ? (
                p.career_preferences.target_locations.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)
              ) : <p className="text-text-body text-sm">No locations listed.</p>}
            </div>
          </div>
      </DataCard>

      {/* --- Skills Card --- */}
      <DataCard title="Technical Skills" icon={BrainCircuit}>
        {p.skills.programming_languages?.length > 0 && (
          <div>
            <h5 className="text-sm text-text-secondary mb-2">Programming Languages</h5>
            <div className="flex flex-wrap gap-2">
              {p.skills.programming_languages.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)}
            </div>
          </div>
        )}
        {p.skills.frameworks_libraries?.length > 0 && (
          <div>
            <h5 className="text-sm text-text-secondary mb-2">Frameworks & Libraries</h5>
            <div className="flex flex-wrap gap-2">
              {p.skills.frameworks_libraries.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)}
            </div>
          </div>
        )}
        {p.skills.databases?.length > 0 && (
          <div>
            <h5 className="text-sm text-text-secondary mb-2">Databases</h5>
            <div className="flex flex-wrap gap-2">
              {p.skills.databases.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)}
            </div>
          </div>
        )}
        {p.skills.developer_tools_platforms?.length > 0 && (
          <div>
            <h5 className="text-sm text-text-secondary mb-2">Tools & Platforms</h5>
            <div className="flex flex-wrap gap-2">
              {p.skills.developer_tools_platforms.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)}
            </div>
          </div>
        )}
      </DataCard>

      {/* --- Experience Card --- */}
      {p.experience?.length > 0 && (
        <DataCard title="Experience" icon={Briefcase}>
          {p.experience.map((item, i) => <ExperienceItem key={i} item={item} />)}
        </DataCard>
      )}
      
      {/* --- Projects Card --- */}
      {p.projects?.length > 0 && (
        <DataCard title="Projects" icon={GitBranch}>
          {p.projects.map((item, i) => <ProjectItem key={i} item={item} />)}
        </DataCard>
      )}

      {/* --- Education Card --- */}
      {p.education?.length > 0 && (
        <DataCard title="Education" icon={GraduationCap}>
          {p.education.map((item, i) => <EducationItem key={i} item={item} />)}
        </DataCard>
      )}
      
      {/* TODO: Add display cards for achievements, publications, etc. */}
      
    </div>
  );
};