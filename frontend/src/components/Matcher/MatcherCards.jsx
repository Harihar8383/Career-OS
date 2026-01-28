// frontend/src/components/Matcher/MatcherCards.jsx
import React from 'react';
import { Check, Sparkles, X, AlertTriangle, Lightbulb, Clipboard, BrainCircuit } from 'lucide-react';
import { SkillTag } from '../Profile/ProfileCards'; // Re-using our skill tag!
import ScoreGauge from './ScoreGauge';

/**
 * Main Card Shell
 */
const ResultCard = ({ title, icon, children, className = "" }) => (
  <div className={`bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-xl p-6 ${className}`}>
    <div className="flex items-center mb-4">
      {React.createElement(icon, { className: "text-text-primary w-5 h-5" })}
      <h3 className="text-xl font-clash-display text-text-primary ml-3">{title}</h3>
    </div>
    <div className="font-dm-sans space-y-4">{children}</div>
  </div>
);

/**
 * 1. The "Overall Match Score" Card
 */
export const MatchScoreCard = ({ score }) => {
  return (
    <ResultCard title="Overall Match Score" icon={BrainCircuit} className="col-span-1">
      <ScoreGauge score={score} />
    </ResultCard>
  );
};

/**
 * 2. The "JD Summary" Card
 */
export const JdSummaryCard = ({ summary }) => (
  <ResultCard title="Job Description Summary" icon={Clipboard} className="col-span-1 md:col-span-2">
    <div>
      <h5 className="text-sm text-text-secondary">Job Title</h5>
      <p className="text-text-primary">{summary.job_title || 'N/A'}</p>
    </div>
    <div>
      <h5 className="text-sm text-text-secondary">Company</h5>
      <p className="text-text-primary">{summary.company || 'N/A'}</p>
    </div>
    <div>
      <h5 className="text-sm text-text-secondary">Experience</h5>
      <p className="text-text-primary">{summary.experience || 'N/A'}</p>
    </div>
    <div>
      <h5 className="text-sm text-text-secondary">Top 3 Must-Have Skills</h5>
      <div className="flex flex-wrap gap-2 mt-2">
        {(summary.top_3_must_have_skills || []).map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)}
      </div>
    </div>
  </ResultCard>
);

/**
 * 3. The "Comparison Matrix" Card
 */
export const ComparisonMatrixCard = ({ matrix }) => (
  <ResultCard title="Comparison Matrix" icon={Clipboard} className="col-span-1 md:col-span-3">
    <div>
      <h5 className="flex items-center gap-2 text-md font-medium text-green-400 mb-2">
        <Check size={18} /> Matched Keywords
      </h5>
      <div className="flex flex-wrap gap-2">
        {matrix.matched_keywords.length > 0 ? (
          matrix.matched_keywords.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)
        ) : <p className="text-text-body text-sm">No strong matches found.</p>}
      </div>
    </div>
    <div>
      <h5 className="flex items-center gap-2 text-md font-medium text-red-400 mb-2">
        <X size={18} /> Missing Keywords
      </h5>
      <div className="flex flex-wrap gap-2">
        {matrix.missing_keywords.length > 0 ? (
          matrix.missing_keywords.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)
        ) : <p className="text-text-body text-sm">No major gaps found!</p>}
      </div>
    </div>
    <div>
      <h5 className="flex items-center gap-2 text-md font-medium text-yellow-400 mb-2">
        <AlertTriangle size={18} /> Needs Highlighting
      </h5>
      <div className="flex flex-wrap gap-2">
        {matrix.needs_highlighting.length > 0 ? (
          matrix.needs_highlighting.map((skill, i) => <SkillTag key={i}>{skill}</SkillTag>)
        ) : <p className="text-text-body text-sm">Profile seems well-aligned.</p>}
      </div>
    </div>
  </ResultCard>
);

/**
 * 4. The "Actionable To-Do List" Card (Suggestion)
 */
/**
 * 4. The "Actionable To-Do List" Card (Suggestion) - EDITABLE
 */
export const SuggestionCard = ({ suggestion, onEdit }) => {
  const Icon = {
    "Keyword Gap": AlertTriangle,
    "Highlight Opportunity": Lightbulb,
    "Quantify Achievement": Lightbulb,
    "Hard Gap Warning": X,
    "AI Summary": Sparkles,
  }[suggestion.type] || Lightbulb;

  const color = {
    "Keyword Gap": "border-yellow-500/30",
    "Highlight Opportunity": "border-blue-500/30",
    "Quantify Achievement": "border-blue-500/30",
    "Hard Gap Warning": "border-red-500/30",
    "AI Summary": "border-green-500/30",
  }[suggestion.type] || "border-border-primary";

  return (
    <div className={`bg-bg-card/60 border ${color} rounded-lg p-5 transition-all hover:bg-bg-card/80`}>
      <h4 className="flex items-center gap-2 text-lg font-clash-display text-text-primary mb-2">
        <Icon className="w-5 h-5" />
        {suggestion.title}
      </h4>

      {/* Editable Area */}
      <div className="relative group">
        <textarea
          value={suggestion.suggestion}
          onChange={(e) => onEdit(suggestion.id, e.target.value)}
          className="w-full bg-bg-dark/50 text-text-body text-sm leading-relaxed p-3 rounded border border-transparent focus:border-blue-500 outline-none resize-y min-h-[80px]"
        />
        <span className="absolute right-2 bottom-2 text-xs text-secondary opacity-0 group-hover:opacity-50 pointer-events-none">
          Click to edit
        </span>
      </div>

      {suggestion.ai_generated_summary && (
        <div className="mt-4 p-4 bg-bg-dark/50 border border-border-primary rounded-lg">
          <p className="text-text-secondary text-sm italic">
            {suggestion.ai_generated_summary}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * 5. The "Quick Win" Card
 */
export const QuickWinCard = ({ skill, isSelected, onToggle }) => (
  <div
    onClick={onToggle}
    className={`
      cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-all select-none
      ${isSelected ? 'bg-green-500/10 border-green-500/50' : 'bg-bg-card/40 border-border-primary hover:border-border-strong'}
    `}
  >
    <div>
      <h5 className={`font-bold ${isSelected ? 'text-green-400' : 'text-text-primary'}`}>
        + Add "{skill.skill}"
      </h5>
      <p className="text-xs text-text-secondary mt-1">{skill.reason}</p>
    </div>
    <div className={`
      w-6 h-6 rounded-full border flex items-center justify-center
      ${isSelected ? 'bg-green-500 border-green-500' : 'border-border-strong'}
    `}>
      {isSelected && <Check size={14} className="text-black" />}
    </div>
  </div>
);