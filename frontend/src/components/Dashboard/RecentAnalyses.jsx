// frontend/src/components/Dashboard/RecentAnalyses.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSearch, ChevronRight, ArrowUpRight, Briefcase, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Score config ────────────────────────────────────────────────────────────
function getScoreConfig(score) {
  if (score >= 80) return {
    color: '#34d399',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)',
    glow: 'rgba(16,185,129,0.3)',
    track: 'rgba(16,185,129,0.12)',
    label: 'Strong',
    Icon: TrendingUp,
  };
  if (score >= 60) return {
    color: '#fbbf24',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
    glow: 'rgba(245,158,11,0.25)',
    track: 'rgba(245,158,11,0.12)',
    label: 'Fair',
    Icon: Minus,
  };
  return {
    color: '#f87171',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.22)',
    glow: 'rgba(239,68,68,0.25)',
    track: 'rgba(239,68,68,0.12)',
    label: 'Weak',
    Icon: TrendingDown,
  };
}

// ── Animated arc score badge ─────────────────────────────────────────────────
function ScoreArc({ score, delay }) {
  const cfg    = getScoreConfig(score);
  const R      = 14;
  const CIRC   = 2 * Math.PI * R;
  const filled = (score / 100) * CIRC;

  return (
    <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
      <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx="22" cy="22" r={R} fill="none" stroke={cfg.track} strokeWidth="3" />
        {/* Progress */}
        <motion.circle
          cx="22" cy="22" r={R}
          fill="none"
          stroke={cfg.color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC - filled }}
          transition={{ delay: delay + 0.15, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${cfg.glow})` }}
        />
      </svg>
      {/* Number inside arc */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: 800,
        color: cfg.color,
        fontVariantNumeric: 'tabular-nums',
        fontFamily: 'system-ui,sans-serif',
        letterSpacing: '-0.02em',
      }}>
        {score}
      </div>
    </div>
  );
}

// ── Single row ───────────────────────────────────────────────────────────────
function AnalysisRow({ a, i, onClick }) {
  const [hovered, setHovered] = useState(false);
  const cfg = getScoreConfig(a.score);
  const { Icon } = cfg;

  const dateStr = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: '12px',
        cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.035)' : 'transparent',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
        transition: 'background 0.18s ease, border-color 0.18s ease',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, scaleY: hovered ? 1 : 0.3 }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          left: 0, top: '20%', bottom: '20%',
          width: '2px',
          borderRadius: '99px',
          background: cfg.color,
          boxShadow: `0 0 8px ${cfg.glow}`,
          transformOrigin: 'center',
        }}
      />

      {/* Company icon tile */}
      <div style={{
        width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
        background: hovered ? cfg.bg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? cfg.border : 'rgba(255,255,255,0.06)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.18s ease, border-color 0.18s ease',
      }}>
        <Briefcase size={14} color={hovered ? cfg.color : 'rgba(148,163,184,0.7)'} style={{ transition: 'color 0.18s ease' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12.5px', fontWeight: 600,
          color: hovered ? '#e2e8f0' : 'rgba(226,232,240,0.85)',
          fontFamily: 'system-ui,sans-serif',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          transition: 'color 0.18s ease',
          letterSpacing: '-0.01em',
        }}>
          {a.jobTitle}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px',
        }}>
          <span style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'system-ui,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
            {a.company}
          </span>
          <span style={{ width: '2px', height: '2px', borderRadius: '50%', background: '#374151', flexShrink: 0 }} />
          <span style={{ fontSize: '10.5px', color: '#64748b', fontFamily: 'system-ui,sans-serif', flexShrink: 0 }}>
            {dateStr}
          </span>
          {/* Score label pill */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            marginLeft: '2px',
            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: '5px',
            padding: '1px 5px',
            flexShrink: 0,
          }}>
            <Icon size={8} strokeWidth={2.5} />
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Arc score */}
      <ScoreArc score={a.score} delay={i * 0.06} />

      {/* Arrow */}
      <motion.div
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -4 }}
        transition={{ duration: 0.18 }}
        style={{ flexShrink: 0 }}
      >
        <ArrowUpRight size={13} color={cfg.color} />
      </motion.div>
    </motion.div>
  );
}

// ── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '8px', padding: '24px',
    }} className="bg-bg-card border border-border-primary rounded-2xl">
      {[0,1,2].map(i => (
        <motion.div
          key={i}
          animate={{ scale: [1, 1.9, 1], opacity: [0.12, 0, 0.12] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            width: 48, height: 48,
            borderRadius: '50%',
            border: '1px solid rgba(99,102,241,0.35)',
          }}
        />
      ))}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 44, height: 44, borderRadius: '12px',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '4px',
      }}>
        <FileSearch size={20} color="rgba(99,102,241,0.7)" />
      </div>
      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary,#e2e8f0)', margin: 0, fontFamily: 'system-ui,sans-serif', position: 'relative', zIndex: 1 }}>
        No analyses yet
      </p>
      <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontFamily: 'system-ui,sans-serif', position: 'relative', zIndex: 1 }}>
        Run a JD Match to get started
      </p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function RecentAnalyses({ analyses = [] }) {
  const navigate = useNavigate();

  if (analyses.length === 0) return <EmptyState />;

  // Summary stats
  const avg    = Math.round(analyses.reduce((s, a) => s + a.score, 0) / analyses.length);
  const best   = Math.max(...analyses.map(a => a.score));
  const avgCfg = getScoreConfig(avg);

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-5 h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileSearch size={13} color="#818cf8" strokeWidth={2} />
          </div>
          <h3 style={{
            fontSize: '14px', fontWeight: 700, margin: 0,
            color: 'var(--text-primary,#e2e8f0)',
            letterSpacing: '-0.01em', fontFamily: 'system-ui,sans-serif',
          }}>
            Recent Analyses
          </h3>
        </div>

        <button
          onClick={() => navigate('/dashboard/matcher/history')}
          style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            fontSize: '11px', fontWeight: 600,
            color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer',
            padding: '3px 6px', borderRadius: '6px',
            transition: 'background 0.15s ease, color 0.15s ease',
            fontFamily: 'system-ui,sans-serif',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#a5b4fc'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#818cf8'; }}
        >
          View all <ChevronRight size={12} />
        </button>
      </div>

      {/* ── Mini summary bar ── */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '12px', flexShrink: 0,
      }}>
        {[
          { label: 'Avg Score', value: `${avg}%`, color: avgCfg.color, bg: avgCfg.bg, border: avgCfg.border },
          { label: 'Best Match', value: `${best}%`, color: getScoreConfig(best).color, bg: getScoreConfig(best).bg, border: getScoreConfig(best).border },
          { label: 'Analysed', value: analyses.length, color: '#818cf8', bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.18)' },
        ].map(chip => (
          <div key={chip.label} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '6px 8px', borderRadius: '9px',
            background: chip.bg, border: `1px solid ${chip.border}`,
          }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: chip.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui,sans-serif' }}>
              {chip.value}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', marginTop: '2px', fontFamily: 'system-ui,sans-serif' }}>
              {chip.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px', flexShrink: 0 }} />

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', marginRight: '-4px', paddingRight: '4px' }} className="custom-scrollbar">
        <AnimatePresence>
          {analyses.map((a, i) => (
            <AnalysisRow
              key={a.runId}
              a={a}
              i={i}
              onClick={() => navigate(`/dashboard/matcher?run=${a.runId}`)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}