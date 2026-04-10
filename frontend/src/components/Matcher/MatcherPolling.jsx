// frontend/src/components/Matcher/MatcherPolling.jsx
// Section 3.2 — "AI Thinking Terminal" (Approach A — Recommended)
// Uses the shared Terminal / AnimatedSpan / TypingAnimation components from ui/terminal.jsx
// UX: elapsed timer, overdue warning, cancel affordance, personality-driven steps

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { Terminal, AnimatedSpan, TypingAnimation } from '../ui/terminal';

// ─────────────────────────────────────────────────────────────────────────────
// Section 5.4: AI Personality System — steps map to real backend status values
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_ORDER = [
  'loading',
  'pending',
  'validating',
  'parsing_jd',
  'analyzing',
  'analyzing_with_graph',
];

const STEPS = [
  {
    statuses: ['loading', 'pending'],
    done:   '✓ Job submitted to analysis engine',
    active: '⟳ Submitting job description to analysis engine...',
    subtext: '$ run match_analysis --profile=current --mode=deep',
    className: 'text-green-400',
    activeClass: 'text-brand-primary',
  },
  {
    statuses: ['validating'],
    done:   '✓ Job description validated',
    active: '⟳ Validating job description quality...',
    subtext: 'Checking structure, length, and extractable signals',
    className: 'text-green-400',
    activeClass: 'text-brand-primary',
  },
  {
    statuses: ['parsing_jd'],
    done:   '✓ Skills and requirements parsed',
    active: '⟳ Parsing key skills, requirements & culture signals...',
    subtext: 'Extracting role title, experience level, must-have keywords',
    className: 'text-green-400',
    activeClass: 'text-brand-primary',
  },
  {
    statuses: ['analyzing'],
    done:   '✓ Profile cross-referenced against JD',
    active: '⟳ Cross-referencing your profile against JD requirements...',
    subtext: 'Scanning 230+ skills · Mapping overlaps · Scoring each section',
    className: 'text-green-400',
    activeClass: 'text-brand-primary',
  },
  {
    statuses: ['analyzing_with_graph'],
    done:   '✓ Deep AI insights generated',
    active: '⟳ Orchestrating AI agents for deep insight generation...',
    subtext: 'Calculating ATS score · Writing recommendations · Generating bullet improvements',
    className: 'text-green-400',
    activeClass: 'text-brand-primary',
  },
];

// Determine a step's visual state based on current backend status
function getStepState(step, currentStatus) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const stepMaxIdx  = Math.max(...step.statuses.map(s => STATUS_ORDER.indexOf(s)));
  const stepMinIdx  = Math.min(...step.statuses.map(s => STATUS_ORDER.indexOf(s)));

  if (step.statuses.includes(currentStatus)) return 'active';
  if (stepMaxIdx < currentIdx)               return 'done';
  return 'pending';
}

// ─────────────────────────────────────────────────────────────────────────────
// Elapsed timer hook — Section 3.2 edge case: > 30s → "Taking longer..."
// ─────────────────────────────────────────────────────────────────────────────
function useElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return elapsed;
}

// ─────────────────────────────────────────────────────────────────────────────
// MatcherPolling — Main Component
// Uses the shared <Terminal> shell. Feeds lines as AnimatedSpan children.
// ─────────────────────────────────────────────────────────────────────────────
export const MatcherPolling = ({ status = 'pending', onCancel }) => {
  const elapsed    = useElapsedTime();
  const isOverdue  = elapsed > 30;

  // Collect lines for the terminal body
  // Each visible step becomes one or two AnimatedSpan rows
  const terminalLines = [];

  // Prompt line
  terminalLines.push(
    <AnimatedSpan key="prompt" delay={0} className="text-text-mid opacity-60 mb-2">
      <span className="text-brand-primary font-bold">$</span>
      <span className="ml-2">career-os · match_analysis --mode=deep</span>
    </AnimatedSpan>
  );

  STEPS.forEach((step, idx) => {
    const state = getStepState(step, status);
    if (state === 'pending') return; // Don't render future steps — they reveal naturally

    const label     = state === 'done' ? step.done : step.active;
    const colorClass = state === 'done' ? step.className : step.activeClass;
    const baseDelay  = idx * 120; // stagger reveals

    terminalLines.push(
      <AnimatedSpan key={`step-${idx}`} delay={baseDelay} className={`font-mono ${colorClass}`}>
        {label}
      </AnimatedSpan>
    );

    // Show subtext only for the active step
    if (state === 'active') {
      terminalLines.push(
        <AnimatedSpan key={`sub-${idx}`} delay={baseDelay + 80} className="text-text-low pl-4 text-xs mb-1">
          {step.subtext}
        </AnimatedSpan>
      );
    }
  });

  // Overdue warning — Section 3.2 edge case
  if (isOverdue) {
    terminalLines.push(
      <AnimatedSpan key="overdue" delay={0} className="text-warning mt-2">
        ⚠ Taking longer than usual... Hang tight.
      </AnimatedSpan>
    );
  }

  return (
    <motion.div
      // Section 4.2: Polling view fades in from below (opacity 0→1, translateY 16→0)
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35, ease: [0.32, 0, 0, 1] }}
      className="flex flex-col items-center justify-center min-h-[480px] max-w-2xl mx-auto px-4 py-12"
    >
      {/* Ambient brand glow behind terminal */}
      <div
        className="absolute w-[380px] h-[180px] pointer-events-none -z-10 opacity-15"
        style={{
          background: 'radial-gradient(ellipse at center, #2934FF 0%, transparent 70%)',
          filter: 'blur(56px)',
        }}
      />

      {/* ── Shared Terminal Shell ── */}
      <div className="w-full">
        <Terminal
          startOnView={false}  // Start immediately — we're not in a scroll view
          sequence={false}     // We manage sequencing ourselves via status prop
          className="bg-surface-card border-surface-border shadow-2xl"
        >
          {terminalLines}

          {/* Blinking cursor on the active line */}
          <AnimatedSpan key="cursor" delay={0} className="text-brand-primary mt-1">
            <span className="terminal-cursor" />
          </AnimatedSpan>
        </Terminal>
      </div>

      {/* ── Footer row: timing hint + cancel ── */}
      <div className="w-full flex items-center justify-between mt-4 px-1">
        <p className="font-mono text-xs text-text-low">
          {isOverdue
            ? 'Complex role detected — generating deeper insights'
            : `This usually takes 10–20 seconds  ·  ${elapsed}s elapsed`}
        </p>

        {/* Cancel affordance — Section 3.2: "No cancellation affordance = frustration on slow connections" */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 text-xs text-text-low hover:text-danger transition-colors duration-150 font-mono group"
          >
            <XCircle size={13} className="group-hover:scale-110 transition-transform" />
            cancel
          </button>
        )}
      </div>
    </motion.div>
  );
};