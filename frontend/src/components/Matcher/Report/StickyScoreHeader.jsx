import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, CheckCircle2, Zap, AlertTriangle, TrendingDown } from 'lucide-react';

const getScoreTier = (score) => {
  if (score >= 90) return {
    label: 'Elite Fit',
    Icon: Trophy,
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    bgColor: 'bg-amber-500/10',
  };
  if (score >= 80) return {
    label: 'Strong Candidate',
    Icon: CheckCircle2,
    textColor: 'text-green-400',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/10',
  };
  if (score >= 65) return {
    label: 'Competitive',
    Icon: Zap,
    textColor: 'text-[#8AA5FF]',
    borderColor: 'border-brand-primary/30',
    bgColor: 'bg-brand-primary/10',
  };
  if (score >= 50) return {
    label: 'Borderline',
    Icon: AlertTriangle,
    textColor: 'text-warning',
    borderColor: 'border-warning/30',
    bgColor: 'bg-warning-dim',
  };
  return {
    label: 'Resume Gap',
    Icon: TrendingDown,
    textColor: 'text-danger',
    borderColor: 'border-danger/30',
    bgColor: 'bg-danger-dim',
  };
};

const getVerdictStyle = (verdict) => {
  const v = verdict || '';
  if (v.includes('Filtered') || v.includes('Weak') || v.includes('Gap'))
    return 'bg-danger-dim text-danger border-danger/30';
  if (v.includes('Borderline'))
    return 'bg-warning-dim text-warning border-warning/30';
  if (v.includes('Competitive') || v.includes('Strong'))
    return 'bg-info-dim text-[#8AA5FF] border-brand-primary/30';
  if (v.includes('Elite'))
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  return 'bg-surface-overlay text-text-mid border-surface-border';
};

export const StickyScoreHeader = ({ score, verdict, jobTitle, visible }) => {
  const tier = getScoreTier(score);
  const TierIcon = tier.Icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.25, ease: [0.32, 0, 0, 1] }}
          className="fixed top-0 left-0 md:left-64 right-0 z-50 flex items-center justify-between px-6 py-3 bg-surface-card/90 backdrop-blur-2xl border-b border-surface-border shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className={`font-clash-display font-bold text-2xl ${tier.textColor}`}>
              {score}%
            </span>
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${tier.bgColor} ${tier.textColor} ${tier.borderColor}`}>
              <TierIcon size={12} aria-label={tier.label} />
              {tier.label}
            </div>
          </div>

          <p className="font-clash-display text-text-high text-sm font-medium truncate max-w-[40%] text-center">
            {jobTitle}
          </p>

          <span className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${getVerdictStyle(verdict)}`}>
            {verdict}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
