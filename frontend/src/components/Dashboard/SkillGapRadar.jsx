// frontend/src/components/Dashboard/SkillGapRadar.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, CheckCircle2, AlertTriangle, XCircle, Zap } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 4 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
  }
};

const SECTION_CONFIG = {
  missing: {
    label: 'Critical Gaps',
    icon: XCircle,
    color: '#f87171',        // red-400
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.18)',
    hoverBg: 'rgba(239,68,68,0.14)',
    hoverBorder: 'rgba(239,68,68,0.38)',
    pillText: '#f87171',
    glow: '0 0 12px rgba(239,68,68,0.25)',
    badgeBg: 'rgba(239,68,68,0.15)',
    barColor: '#ef4444',
    accent: '#fca5a5',
  },
  weak: {
    label: 'Growth Targets',
    icon: AlertTriangle,
    color: '#fbbf24',        // amber-400
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.18)',
    hoverBg: 'rgba(245,158,11,0.14)',
    hoverBorder: 'rgba(245,158,11,0.38)',
    pillText: '#fbbf24',
    glow: '0 0 12px rgba(245,158,11,0.25)',
    badgeBg: 'rgba(245,158,11,0.15)',
    barColor: '#f59e0b',
    accent: '#fde68a',
  },
  matched: {
    label: 'Verified Strengths',
    icon: CheckCircle2,
    color: '#34d399',        // emerald-400
    bg: 'rgba(16,185,129,0.07)',
    border: 'rgba(16,185,129,0.18)',
    hoverBg: 'rgba(16,185,129,0.14)',
    hoverBorder: 'rgba(16,185,129,0.38)',
    pillText: '#34d399',
    glow: '0 0 12px rgba(16,185,129,0.25)',
    badgeBg: 'rgba(16,185,129,0.15)',
    barColor: '#10b981',
    accent: '#6ee7b7',
  },
};

// Animated count badge
const CountBadge = ({ count, config }) => (
  <motion.span
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.15 }}
    style={{
      background: config.badgeBg,
      color: config.pillText,
      fontSize: '9px',
      fontWeight: 900,
      letterSpacing: '0.04em',
      lineHeight: 1,
      padding: '2px 5px',
      borderRadius: '5px',
      minWidth: '16px',
      textAlign: 'center',
    }}
  >
    {count}
  </motion.span>
);

const SkillPill = ({ skill, count, variant }) => {
  const [hovered, setHovered] = useState(false);
  const cfg = SECTION_CONFIG[variant];

  return (
    <motion.div
      variants={itemVariants}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '4px 10px 4px 8px',
        borderRadius: '8px',
        background: hovered ? cfg.hoverBg : cfg.bg,
        border: `1px solid ${hovered ? cfg.hoverBorder : cfg.border}`,
        boxShadow: hovered ? cfg.glow : 'none',
        color: cfg.pillText,
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: 'default',
        transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        userSelect: 'none',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
    >
      {/* Tiny left accent dot */}
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        background: cfg.color,
        flexShrink: 0,
        boxShadow: hovered ? `0 0 6px ${cfg.color}` : 'none',
        transition: 'box-shadow 0.18s ease',
      }} />
      <span style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>{skill}</span>
      {count > 1 && <CountBadge count={count} config={cfg} />}
    </motion.div>
  );
};

// Compact summary bar showing relative counts
const SummaryBar = ({ missing, weak, matched }) => {
  const total = missing + weak + matched;
  if (total === 0) return null;
  const mp = (missing / total) * 100;
  const wp = (weak / total) * 100;
  const ep = (matched / total) * 100;

  return (
    <div style={{ display: 'flex', gap: '3px', height: '3px', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px', flexShrink: 0 }}>
      {missing > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${mp}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          style={{ background: SECTION_CONFIG.missing.barColor, borderRadius: '99px', height: '100%' }}
        />
      )}
      {weak > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${wp}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ background: SECTION_CONFIG.weak.barColor, borderRadius: '99px', height: '100%' }}
        />
      )}
      {matched > 0 && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ep}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          style={{ background: SECTION_CONFIG.matched.barColor, borderRadius: '99px', height: '100%' }}
        />
      )}
    </div>
  );
};

// Section header with icon + label + pill count
const SectionHeader = ({ variant, count }) => {
  const cfg = SECTION_CONFIG[variant];
  const Icon = cfg.icon;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '10px' }}>
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '6px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={12} color={cfg.color} strokeWidth={2.5} />
      </div>
      <span style={{
        fontSize: '10px',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: cfg.color,
        fontFamily: "'DM Sans', 'Inter', sans-serif",
      }}>
        {cfg.label}
      </span>
      <span style={{
        marginLeft: 'auto',
        fontSize: '9px',
        fontWeight: 700,
        color: cfg.pillText,
        background: cfg.badgeBg,
        borderRadius: '5px',
        padding: '1px 6px',
        letterSpacing: '0.04em',
      }}>
        {count}
      </span>
    </div>
  );
};

export default function SkillGapRadar({ skillGaps = {} }) {
  const { repeatedlyMissing = [], usuallyMatched = [], sometimesWeak = [] } = skillGaps;
  const hasData = repeatedlyMissing.length > 0 || usuallyMatched.length > 0 || sometimesWeak.length > 0;
  const [hoveredSection, setHoveredSection] = useState(null);
  const [pulse, setPulse] = useState(false);

  // Pulse the live dot every 4s
  useEffect(() => {
    const id = setInterval(() => setPulse(p => !p), 4000);
    return () => clearInterval(id);
  }, []);

  if (!hasData) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-3xl p-6 h-full flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
        {/* Animated radial pulse rings */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            animate={{ scale: [1, 2.2], opacity: [0.15, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '1px solid rgba(99,102,241,0.4)',
            }}
          />
        ))}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Target size={20} color="rgba(99,102,241,0.7)" />
          </div>
          <p className="text-sm font-semibold text-text-primary mb-1.5 font-dm-sans">
            No Intelligence Gathered
          </p>
          <p className="text-xs text-text-secondary max-w-[180px] leading-relaxed mx-auto">
            Run a JD analysis to map your market alignment.
          </p>
        </div>
      </div>
    );
  }

  const getSectionStyle = (name) => ({
    transition: 'opacity 0.25s ease, filter 0.25s ease',
    opacity: hoveredSection && hoveredSection !== name ? 0.35 : 1,
    filter: hoveredSection && hoveredSection !== name ? 'grayscale(40%)' : 'none',
  });

  return (
    <div className="bg-bg-card border border-border-primary rounded-3xl p-6 h-full flex flex-col shadow-sm relative overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-end justify-between mb-8 relative z-10 flex-shrink-0">
        <div>
          <h3 className="text-2xl font-clash-display font-medium text-text-primary leading-none mb-2">
            Skill Intelligence
          </h3>
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span>Market Alignment</span>
          </div>
        </div>

        {/* Live badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"
          />
          <span className="text-[9px] font-bold tracking-widest text-emerald-400 uppercase">
            By recent JDs
          </span>
        </div>
      </div>

      {/* ── Summary bar ── */}
      <SummaryBar
        missing={repeatedlyMissing.length}
        weak={sometimesWeak.length}
        matched={usuallyMatched.length}
      />

      {/* ── Scrollable Content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: '4px',
        marginRight: '-4px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        paddingBottom: '4px',
      }}
        className="custom-scrollbar"
      >
        <AnimatePresence>

          {/* Critical Gaps */}
          {repeatedlyMissing.length > 0 && (
            <motion.div
              key="missing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={getSectionStyle('missing')}
              onMouseEnter={() => setHoveredSection('missing')}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <SectionHeader variant="missing" count={repeatedlyMissing.length} />
              <motion.div variants={containerVariants} initial="hidden" animate="show"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {repeatedlyMissing.map(s => <SkillPill key={s.skill} skill={s.skill} count={s.count} variant="missing" />)}
              </motion.div>
            </motion.div>
          )}

          {/* Growth Targets */}
          {sometimesWeak.length > 0 && (
            <motion.div
              key="weak"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}
              style={getSectionStyle('weak')}
              onMouseEnter={() => setHoveredSection('weak')}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <SectionHeader variant="weak" count={sometimesWeak.length} />
              <motion.div variants={containerVariants} initial="hidden" animate="show"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sometimesWeak.map(s => <SkillPill key={s.skill} skill={s.skill} count={s.count} variant="weak" />)}
              </motion.div>
            </motion.div>
          )}

          {/* Verified Strengths */}
          {usuallyMatched.length > 0 && (
            <motion.div
              key="matched"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
              style={getSectionStyle('matched')}
              onMouseEnter={() => setHoveredSection('matched')}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <SectionHeader variant="matched" count={usuallyMatched.length} />
              <motion.div variants={containerVariants} initial="hidden" animate="show"
                style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {usuallyMatched.map(s => <SkillPill key={s.skill} skill={s.skill} count={s.count} variant="matched" />)}
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}