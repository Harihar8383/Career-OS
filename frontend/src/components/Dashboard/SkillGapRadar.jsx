// frontend/src/components/Dashboard/SkillGapRadar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const SkillPill = ({ skill, count, variant }) => {
  const styles = {
    missing: 'bg-red-500/10 text-red-400 border-red-500/20',
    matched: 'bg-green-500/10 text-green-400 border-green-500/20',
    weak: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[variant]} transition-all hover:brightness-125`}>
      {skill}
      {count > 1 && <span className="opacity-70">×{count}</span>}
    </span>
  );
};

export default function SkillGapRadar({ skillGaps = {} }) {
  const { repeatedlyMissing = [], usuallyMatched = [], sometimesWeak = [] } = skillGaps;
  const hasData = repeatedlyMissing.length > 0 || usuallyMatched.length > 0 || sometimesWeak.length > 0;

  if (!hasData) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col items-center justify-center text-text-secondary">
        <AlertCircle className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No skill gap data</p>
        <p className="text-xs mt-1 opacity-60">Run JD analyses to see your skill gaps</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-clash-display font-medium text-text-primary mb-5">Skill Gap Intelligence</h3>

      {/* Missing */}
      {repeatedlyMissing.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-red-400">Repeatedly Missing</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {repeatedlyMissing.map(s => <SkillPill key={s.skill} skill={s.skill} count={s.count} variant="missing" />)}
          </div>
        </motion.div>
      )}

      {/* Matched */}
      {usuallyMatched.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-green-400">Usually Matched</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {usuallyMatched.map(s => <SkillPill key={s.skill} skill={s.skill} count={s.count} variant="matched" />)}
          </div>
        </motion.div>
      )}

      {/* Weak */}
      {sometimesWeak.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-2 mb-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Sometimes Weak</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sometimesWeak.map(s => <SkillPill key={s.skill} skill={s.skill} count={s.count} variant="weak" />)}
          </div>
        </motion.div>
      )}
    </div>
  );
}
