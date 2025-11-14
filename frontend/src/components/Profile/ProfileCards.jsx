// frontend/src/components/Profile/ProfileCards.jsx
import React from 'react';
import { Briefcase, GraduationCap, BrainCircuit, Award, GitBranch, Sparkles, User, Link2 } from 'lucide-react';

/**
 * Reusable card shell for profile sections
 */
export const DataCard = ({ title, icon, children }) => (
  <div className="bg-bg-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-6">
    <div className="flex items-center mb-4">
      {React.createElement(icon, { className: "text-blue-400 w-5 h-5" })}
      <h3 className="text-xl font-clash-display text-white ml-3">{title}</h3>
    </div>
    <div className="font-dm-sans space-y-4">{children}</div>
  </div>
);

/**
 * A small, colored tag for skills
 */
export const SkillTag = ({ children }) => (
  <span className="bg-blue-500/20 text-blue-300 text-sm font-medium px-3 py-1 rounded-full">
    {children}
  </span>
);

/**
 * A component to display a single Experience item
 */
export const ExperienceItem = ({ item }) => (
  <div className="border-b border-white/10 pb-4 last:pb-0 last:border-b-0">
    <h4 className="font-semibold text-white">{item.role}</h4>
    <p className="text-text-secondary">{item.company} {item.location && `(${item.location})`}</p>
    <p className="text-text-body text-sm">{item.start_date} - {item.end_date}</p>
    <ul className="list-disc list-outside text-text-body mt-2 pl-5 text-sm space-y-1">
      {Array.isArray(item.description_points) ? (
        item.description_points.map((point, i) => <li key={i}>{point}</li>)
      ) : (
        <li>{item.description_points}</li> // Fallback if it's just a string
      )}
    </ul>
  </div>
);

/**
 * A component to display a single Project item
 */
export const ProjectItem = ({ item }) => (
  <div className="border-b border-white/10 pb-4 last:pb-0 last:border-b-0">
    <div className="flex items-center justify-between">
      <h4 className="font-semibold text-white">{item.title}</h4>
      {item.github_link && (
        <a href={item.github_link} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-blue-400 transition-colors">
          <GitBranch size={16} />
        </a>
      )}
    </div>
    <p className="text-text-body mt-1 text-sm">{item.description}</p>
    <div className="flex flex-wrap gap-2 mt-3">
      {(item.tech_stack || []).map((tech, i) => <SkillTag key={i}>{tech}</SkillTag>)}
    </div>
  </div>
);

/**
 * A component to display a single Education item
 */
export const EducationItem = ({ item }) => (
  <div>
    <h4 className="font-semibold text-white">{item.institution_name}</h4>
    <p className="text-text-secondary">{item.degree}</p>
    <p className="text-text-body text-sm">{item.start_date} - {item.end_date} {item.gpa && `• GPA: ${item.gpa}`}</p>
  </div>
);