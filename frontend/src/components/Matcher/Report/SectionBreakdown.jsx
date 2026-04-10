import React, { useState, useMemo, useCallback, memo, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

// ─── helpers (stable references, no re-creation) ──────────────────────────────
const getBadgeStyle = (s) => {
  if (s === 'Strong') return 'text-green-400 bg-green-500/10 border-green-500/20';
  if (s === 'Average') return 'text-warning bg-warning-dim border-warning/20';
  return 'text-danger bg-danger-dim border-danger/20';
};
const getProgressBarColor = (sc) =>
  sc >= 80 ? 'bg-green-500' : sc >= 60 ? 'bg-warning' : 'bg-danger';
const getStatusDotColor = (sc) =>
  sc >= 80 ? 'bg-green-500' : sc >= 60 ? 'bg-warning' : 'bg-danger';

// ─── animated progress bar ─────────────────────────────────────────────────────
// Uses a CSS transition instead of Framer's whileInView so it never
// schedules JS work per animation frame.
const ProgressBar = memo(({ score }) => {
  const fillRef = useRef(null);

  useEffect(() => {
    // Defer so the initial width:0 renders first, triggering the CSS transition
    const id = requestAnimationFrame(() => {
      if (fillRef.current) fillRef.current.style.width = `${score}%`;
    });
    return () => cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className="hidden md:flex flex-1 items-center gap-4 px-8">
      <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
        <div
          ref={fillRef}
          style={{ width: 0, transition: 'width 0.8s ease' }}
          className={`h-full rounded-full ${getProgressBarColor(score)}`}
        />
      </div>
      <span className="text-xs font-mono font-bold text-text-mid w-8 text-right">{score}%</span>
    </div>
  );
});

// ─── accordion body ────────────────────────────────────────────────────────────
// Pure CSS max-height transition: no Framer spring math, no JS per frame,
// no layout recalculation on siblings.
const SectionBody = memo(({ section, isOpen }) => {
  const { what_worked = [], what_is_missing = [], impact } = section;

  return (
    <div
      // max-height trick: closed = 0, open = large enough value
      style={{
        maxHeight: isOpen ? '600px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease',
      }}
      className="border-t border-surface-border"
      aria-hidden={!isOpen}
    >
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-overlay">
        <div>
          <h4 className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest mb-4">
            <CheckCircle2 size={15} /> What Worked
          </h4>
          <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 terminal-scrollbar">
            {what_worked.length > 0 ? what_worked.map((item, i) => (
              <li key={i} className="text-text-high text-sm flex items-start gap-3 leading-relaxed pl-3 border-l-2 border-green-500/20">
                <span className="text-green-500/70 mt-0.5">✓</span>
                {item}
              </li>
            )) : (
              <li className="text-text-low text-sm italic pl-3 border-l-2 border-surface-border">
                No specific strengths detected.
              </li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-danger font-bold text-xs uppercase tracking-widest mb-4">
            <XCircle size={15} /> What Is Missing
          </h4>
          <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2 terminal-scrollbar">
            {what_is_missing.length > 0 ? what_is_missing.map((item, i) => (
              <li key={i} className="text-text-high text-sm flex items-start gap-3 leading-relaxed pl-3 border-l-2 border-danger/20">
                <span className="text-danger/70 mt-0.5">✕</span>
                {item}
              </li>
            )) : (
              <li className="text-text-low text-sm italic pl-3 border-l-2 border-surface-border">
                No critical gaps detected.
              </li>
            )}
          </ul>
        </div>

        {impact && (
          <div className="md:col-span-2 mt-2 pt-5 border-t border-surface-border">
            <div className="text-text-high text-sm bg-brand-primary/5 border border-brand-primary/10 p-4 rounded-xl flex items-start">
              <Lightbulb size={16} className="text-brand-primary mr-3 mt-0.5 flex-shrink-0" aria-label="Impact note" />
              <span className="leading-relaxed font-dm-sans">{impact}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── single accordion item ─────────────────────────────────────────────────────
// memo() prevents re-render of closed items when a different item opens.
const SectionItem = memo(({ section, isOpen, onToggle }) => {
  const { name, score = 0, status } = section;

  return (
    <div
      className={`border rounded-xl overflow-hidden mb-3 transition-colors duration-200 ${
        isOpen
          ? 'bg-surface-card border-brand-primary/30'
          : 'bg-surface-card/40 border-surface-border hover:border-surface-border-strong hover:bg-surface-card/60'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between p-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
      >
        <div className="flex items-center gap-4 w-1/3">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor(score)}`} />
          <span className="text-text-high font-bold font-dm-sans text-base md:text-lg text-left">{name}</span>
        </div>

        <ProgressBar score={score} />

        <div className="flex items-center justify-end gap-4 w-1/3">
          <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${getBadgeStyle(status)}`}>
            {status}
          </span>
          {/* CSS rotate instead of Framer spring — no JS per frame */}
          <ChevronDown
            className="text-text-mid group-hover:text-text-high transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            size={20}
          />
        </div>
      </button>

      <SectionBody section={section} isOpen={isOpen} />
    </div>
  );
});

// ─── score-at-a-glance dots ────────────────────────────────────────────────────
const GlanceDot = memo(({ section, onClick }) => (
  <div className="group relative" onClick={onClick} role="button" tabIndex={0}>
    <div className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-150 cursor-pointer ${getStatusDotColor(section.score)}`} />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-card border border-surface-border text-text-high text-xs font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
      {section.name} ({section.score}%)
    </div>
  </div>
));



// ─── root component ────────────────────────────────────────────────────────────
const SectionBreakdown = ({ sections = [] }) => {
  const defaultOpenIndex = useMemo(() => {
    if (!sections.length) return 0;
    return sections.reduce((minI, s, i, arr) =>
      (s.score ?? 0) < (arr[minI].score ?? 0) ? i : minI, 0);
  }, [sections]);

  const [openIndex, setOpenIndex] = useState(defaultOpenIndex);

  // Stable callback reference — wrapped items won't re-render just because the
  // parent re-renders.  Each item gets a pre-bound version via useMemo below.
  const toggleSection = useCallback((idx) => {
    setOpenIndex(prev => (prev === idx ? -1 : idx));
  }, []);

  // Pre-bind toggles so each SectionItem gets a stable function reference.
  const toggleHandlers = useMemo(
    () => sections.map((_, idx) => () => toggleSection(idx)),
    [sections, toggleSection],
  );

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="border-l-4 border-brand-primary pl-4">
          <h2 className="text-3xl font-clash-display font-medium text-text-high">
            Section Breakdown
          </h2>
          <p className="text-text-mid text-sm mt-1 font-dm-sans">
            Transparent breakdown of your profile's alignment.
          </p>
        </div>

        {sections.length > 0 && (
          <div className="flex items-center gap-1.5 p-2 px-3 rounded-full bg-surface-overlay border border-surface-border max-w-fit">
            {sections.map((sec, idx) => (
              <GlanceDot key={idx} section={sec} onClick={() => setOpenIndex(idx)} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {sections.length > 0 ? sections.map((section, idx) => (
          <SectionItem
            key={idx}
            section={section}
            isOpen={openIndex === idx}
            onToggle={toggleHandlers[idx]}
          />
        )) : (
          <div className="p-8 text-center text-text-mid border border-dashed border-surface-border rounded-xl">
            No section data available.
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionBreakdown;