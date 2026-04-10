import React, { useState, useCallback, useRef, useEffect, memo } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, PlusCircle } from 'lucide-react';

// ─── constants ─────────────────────────────────────────────────────────────────

const TAG_STYLES = {
  matched: {
    pill: 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 hover:border-green-500/40 cursor-default',
    icon: CheckCircle2,
    iconClass: '',
    tooltipContent: () => <span>Verified across profile</span>,
    asButton: false,
  },
  missing: {
    pill: 'bg-danger-dim text-danger border-danger/20 hover:bg-danger/20 hover:border-danger/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger/50',
    icon: PlusCircle,
    iconClass: '',
    tooltipContent: () => (
      <>
        <strong className="block mb-0.5 text-danger text-[11px]">Missing keyword</strong>
        <span>Mention this in your <strong className="text-brand-primary">Experience</strong> section.</span>
      </>
    ),
    asButton: true,
  },
  weak: {
    pill: 'bg-warning-dim text-warning border-warning/30 border-dashed hover:bg-warning/20 cursor-pointer',
    icon: AlertTriangle,
    iconClass: 'opacity-50',
    tooltipContent: () => (
      <span>Present but not strongly evidenced — add metrics or context to prove it.</span>
    ),
    asButton: false,
  },
};

// ─── keyframes injection (once, client-side only) ──────────────────────────────

let keyframesInjected = false;
const ensureKeyframes = () => {
  if (keyframesInjected || typeof document === 'undefined') return;
  keyframesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes kw-pop {
      from { opacity: 0; transform: translateY(5px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    .kw-tag {
      opacity: 0;
      animation: kw-pop 0.2s ease both;
      will-change: opacity, transform;
    }
  `;
  document.head.appendChild(style);
};

// ─── InteractiveTag ────────────────────────────────────────────────────────────

const InteractiveTag = memo(({ type, text }) => {
  const cfg = TAG_STYLES[type];
  if (!cfg) return null;
  const { pill, icon: Icon, iconClass, tooltipContent: TooltipContent, asButton } = cfg;

  const inner = (
    <>
      <Icon size={12} aria-hidden="true" className={iconClass} />
      {text}
    </>
  );

  // Use a fixed tooltip width only for multi-line types; matched stays auto
  const tooltipStyle = {
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginBottom: '6px',
    ...(type !== 'matched' ? { width: '180px', whiteSpace: 'normal', textAlign: 'center' } : { whiteSpace: 'nowrap' }),
  };

  return (
    <div className="group relative inline-flex">
      {asButton ? (
        <button
          type="button"
          className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${pill}`}
        >
          {inner}
        </button>
      ) : (
        <span className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors ${pill}`}>
          {inner}
        </span>
      )}

      <div
        role="tooltip"
        style={tooltipStyle}
        className="absolute z-20 pointer-events-none opacity-0 group-hover:opacity-100
          transition-opacity duration-150 px-2.5 py-1.5 bg-surface-card border
          border-surface-border text-text-high text-[11px] font-dm-sans rounded shadow-lg"
      >
        <TooltipContent />
      </div>
    </div>
  );
});

// ─── TagCloud ──────────────────────────────────────────────────────────────────
// Stagger replay: forces reflow per tag to restart `kw-pop` every time
// the cloud mounts or its `keywords` prop changes (e.g. panel re-opens).

const TagCloud = memo(({ type, keywords }) => {
  const ref = useRef(null);

  useEffect(() => {
    ensureKeyframes();
    const tags = ref.current?.querySelectorAll('.kw-tag') ?? [];
    tags.forEach((el, i) => {
      // Cancel current animation, force a reflow, then re-apply with staggered delay
      el.style.animation = 'none';
      void el.offsetWidth; // reflow
      el.style.animation = '';
      el.style.animationDelay = `${i * 18}ms`;
    });
  // `type` included so keywords of different types also retrigger correctly
  }, [keywords, type]);

  return (
    <div ref={ref} className="flex flex-wrap gap-2">
      {keywords.map((kw, i) => (
        <div key={kw + i} className="kw-tag">
          <InteractiveTag type={type} text={kw} />
        </div>
      ))}
    </div>
  );
});

// ─── ProgressBar ──────────────────────────────────────────────────────────────
// Double-rAF pattern: guarantees width:0 is committed to the DOM before
// the transition starts — prevents snap-to-full in React StrictMode.

const ProgressBar = memo(({ pct }) => {
  const fillRef = useRef(null);

  useEffect(() => {
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        if (fillRef.current) fillRef.current.style.width = `${pct}%`;
      });
      return () => cancelAnimationFrame(raf2);
    });
    return () => cancelAnimationFrame(raf1);
  }, [pct]);

  return (
    <div className="flex-1 h-1.5 bg-surface-border rounded-full overflow-hidden">
      <div
        ref={fillRef}
        style={{ width: 0, transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)' }}
        className="h-full bg-green-500 rounded-full"
      />
    </div>
  );
});

// ─── MatchedPanel ──────────────────────────────────────────────────────────────
// max-height is computed from keyword count so the collapse animation
// is tight and doesn't "hang" on a large arbitrary value like 9999px.

const MatchedPanel = memo(({ matched, isOpen }) => {
  // Each row ≈ 36px, avg ~4 tags per row; add 80px for panel padding
  const estimatedHeight = Math.ceil(matched.length / 4) * 40 + 80;

  return (
    <div
      id="matched-panel"
      aria-hidden={!isOpen}
      style={{
        maxHeight: isOpen ? `${estimatedHeight}px` : '0',
        overflow: 'hidden',
        transition: 'max-height 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div className="border-t border-surface-border/50 bg-green-500/5 rounded-b-xl p-5">
        {matched.length > 0 ? (
          <TagCloud type="matched" keywords={matched} />
        ) : (
          <span className="text-sm text-text-mid italic">No exact matches found.</span>
        )}
      </div>
    </div>
  );
});

// ─── KeywordGapReport (root) ───────────────────────────────────────────────────

const KeywordGapReport = ({ data = {} }) => {
  const { matched = [], missing = [], weak = [] } = data;
  const [isMatchedOpen, setIsMatchedOpen] = useState(false);
  const toggleMatched = useCallback(() => setIsMatchedOpen((v) => !v), []);

  const total = matched.length + missing.length + weak.length;
  const matchPct = total > 0 ? Math.round((matched.length / total) * 100) : 0;
  const hasMissing = missing.length > 0;
  const hasWeak = weak.length > 0;

  if (total === 0) {
    return (
      <div className="w-full bg-surface-overlay border border-surface-border p-8 rounded-2xl text-center">
        <CheckCircle2 className="w-8 h-8 text-brand-primary/50 mx-auto mb-3" aria-hidden="true" />
        <h3 className="text-text-high font-bold mb-1">No keyword data</h3>
        <p className="text-text-mid text-sm">
          We couldn't extract ATS keywords from this job description. Try a more detailed listing.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="border-l-4 border-brand-primary pl-4 mb-6">
        <h2 className="text-3xl font-clash-display font-medium text-text-high">
          Keyword intelligence layer
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Beat ATS without keyword stuffing.
        </p>
        <p className="text-text-high font-dm-sans mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          You matched{' '}
          <strong className="text-green-400 font-mono text-lg">{matchPct}%</strong>
          {' '}of ATS keywords.{' '}
          {hasMissing ? (
            <span className="text-danger inline-flex items-center gap-1">
              <AlertTriangle size={14} aria-hidden="true" />
              {missing.length} critical gap{missing.length !== 1 ? 's' : ''} detected.
            </span>
          ) : (
            <span className="text-green-400 inline-flex items-center gap-1">
              <CheckCircle2 size={14} aria-hidden="true" />
              No critical gaps detected.
            </span>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-4">

        {/* Matched — collapsible bar */}
        <div className={`rounded-xl border transition-colors duration-200 ${
          !hasMissing ? 'bg-green-500/10 border-green-500/30' : 'bg-surface-card border-surface-border'
        }`}>
          <button
            type="button"
            onClick={toggleMatched}
            aria-expanded={isMatchedOpen}
            aria-controls="matched-panel"
            className="w-full flex items-center justify-between p-4 px-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-xl"
          >
            <div className="flex items-center gap-3 shrink-0" style={{ width: '28%' }}>
              <CheckCircle2 size={18} className="text-green-500" aria-hidden="true" />
              <span className="text-sm font-bold uppercase tracking-widest text-text-high">Matched</span>
            </div>

            <div className="flex flex-1 items-center gap-3 px-4 min-w-0">
              <ProgressBar pct={matchPct} />
              <span className="text-xs font-mono font-bold text-text-mid whitespace-nowrap">
                {matched.length} / {total}
              </span>
            </div>

            <ChevronDown
              size={18}
              aria-hidden="true"
              className={`text-text-mid shrink-0 transition-transform duration-200 ease-out ${isMatchedOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <MatchedPanel matched={matched} isOpen={isMatchedOpen} />
        </div>

        {/* Missing + Weak */}
        {(hasMissing || hasWeak) && (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: hasMissing && hasWeak ? '3fr 2fr' : '1fr',
            }}
          >
            {hasMissing && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-6 min-w-0">
                <h3 className="flex items-center gap-2 text-danger font-bold text-xs uppercase tracking-widest mb-5">
                  <XCircle size={15} aria-hidden="true" />
                  Critical missing
                  <span className="ml-auto font-mono text-danger/60">{missing.length}</span>
                </h3>
                <TagCloud type="missing" keywords={missing} />
              </div>
            )}

            {hasWeak && (
              <div className="bg-surface-card border border-surface-border rounded-xl p-6 min-w-0">
                <h3 className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-widest mb-5">
                  <AlertTriangle size={15} aria-hidden="true" />
                  Weakly implied
                  <span className="ml-auto font-mono text-warning/60">{weak.length}</span>
                </h3>
                <TagCloud type="weak" keywords={weak} />
              </div>
            )}
          </div>
        )}

        {(hasMissing || hasWeak) && (
          <p className="text-text-secondary text-[10px] italic border-t border-surface-border pt-2">
            * Add specific evidence for weakly implied skills to strengthen your match score.
          </p>
        )}

      </div>
    </div>
  );
};

export default KeywordGapReport;