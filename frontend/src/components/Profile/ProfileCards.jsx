// frontend/src/components/Profile/ProfileCards.jsx
import React from 'react';
import { Briefcase, GraduationCap, BrainCircuit, Award, GitBranch, Sparkles, User, Link2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { motion } from "framer-motion"; // <-- 1. Import motion

/**
 * Reusable card shell for profile sections
 */
export const DataCard = ({ title, icon, children, className = "", ...props }) => ( // <-- 2. Accept ...props
  // --- 3. Change from `div` to `motion.div` and spread props ---
  <motion.div 
    className={cn(
          "relative transform-gpu overflow-hidden",
          // Base Shape & Colors
          "rounded-2xl p-8 bg-zinc-950",
          // Borders & Shadows (The Glow Effect)
          "border border-white/30 hover:scale-101 transition-transform duration-300 ease-in-out",
          "shadow-[inset_0_-20px_80px_-20px_rgba(255,255,255,0.05),_0_0_20px_rgba(0,0,0,0.5)]",
          className
        )}
    {...props} // <-- 4. Apply inherited props (like variants)
  >
    {/* Header */}
        <div className="flex items-center gap-x-3 mb-6">
          <span className="text-zinc-400">
            {React.createElement(icon, { className: "w-6 h-6" })}
          </span>
          <h3 className="text-2xl font-clash-display text-shadow-neutral-500 text-shadow-xs text-white">{title}</h3>
        </div>
        
    <div className="font-dm-sans space-y-4">{children}</div>
  </motion.div>
);

/**
 * A small, colored tag for skills
 */
export const SkillTag = ({ children }) => (
  <span className="bg-bg-card text-white border border-syntask-border text-sm font-bold px-3 py-1 rounded-full">
    {children}
  </span>
);

/**
 * A component to display a single Experience item
 */
// ... (rest of the file is unchanged) ...
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