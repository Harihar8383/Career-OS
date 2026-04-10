import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  Zap, ShieldAlert, RefreshCw, CheckCircle2,
  Circle, ChevronDown, Copy, AlertTriangle,
  ChevronRight, Info
} from 'lucide-react';

// ─── constants ─────────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  High:   { label: 'CRITICAL',  border: 'border-l-danger',          bg: 'bg-danger/5',        text: 'text-danger'    },
  Medium: { label: 'SHOULD DO', border: 'border-l-warning',         bg: 'bg-warning/5',       text: 'text-warning'   },
  Low:    { label: 'CONSIDER',  border: 'border-l-surface-border',  bg: 'bg-surface-card',    text: 'text-text-mid'  },
};

const SKILL_STATUS_STYLE = {
  Proven:   'bg-green-500/10 text-green-400 border-green-500/20',
  Verified: 'bg-brand-primary/10 text-brand-primary border-brand-primary/20',
  Unproven: 'bg-danger-dim text-danger border-danger/20',
};

const INITIAL_SKILL_STATS = { Proven: 0, Verified: 0, Unproven: 0 };

// ─── helpers ───────────────────────────────────────────────────────────────────

const copyToClipboard = (text) => navigator.clipboard?.writeText(text);

const getPriorityConfig = (priority) =>
  PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.Low;

const getSkillStatusStyle = (status) =>
  SKILL_STATUS_STYLE[status] ?? SKILL_STATUS_STYLE.Unproven;

// ─── TopImprovements ───────────────────────────────────────────────────────────

const ImprovementItem = memo(({ item, idx, isDone, onToggle }) => {
  const config = getPriorityConfig(item.priority);

  return (
    <div
      className={`
        border border-surface-border border-l-4 rounded-xl p-4 sm:p-5
        flex items-start gap-4 transition-all duration-200
        ${config.border} ${isDone ? 'opacity-50 grayscale' : config.bg}
      `}
    >
      <button
        onClick={() => onToggle(idx)}
        aria-label={isDone ? 'Mark as undone' : 'Mark as done'}
        aria-pressed={isDone}
        className={`
          mt-1 flex-shrink-0 rounded focus:outline-none focus-visible:ring-2
          focus-visible:ring-brand-primary/50 transition-colors
          ${isDone ? 'text-green-500' : 'text-text-mid hover:text-text-high'}
        `}
      >
        {isDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
          <span className={`
            text-[10px] uppercase tracking-widest font-bold px-2 py-0.5
            rounded border border-current w-max flex-shrink-0 ${config.text}
          `}>
            {config.label}
          </span>
          <h4 className={`
            font-bold font-dm-sans leading-tight text-base sm:text-lg
            ${isDone ? 'line-through text-text-mid' : 'text-text-high'}
          `}>
            {item.action}
          </h4>
        </div>

        {item.why_it_matters && (
          <p className="text-text-secondary text-sm leading-relaxed font-dm-sans mb-3">
            {item.why_it_matters}
          </p>
        )}

        {item.where_to_apply && (
          <span className="inline-block px-2.5 py-1 bg-surface-overlay border border-surface-border rounded-md text-[10px] text-text-secondary font-bold uppercase tracking-wider">
            {item.where_to_apply}
          </span>
        )}
      </div>
    </div>
  );
});

const TopImprovements = memo(({ items = [] }) => {
  const [doneSet, setDoneSet] = useState(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleDone = useCallback((idx) => {
    setDoneSet((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }, []);

  const visibleItems = showAll ? items : items.slice(0, 4);
  const hasMore = items.length > 4;

  return (
    <div className="col-span-1 lg:col-span-7 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2 text-xl font-bold text-text-high font-clash-display">
          <Zap size={20} className="text-brand-primary" aria-hidden="true" />
          Top Improvement Opportunities
        </h3>
        <span className="text-xs font-bold text-text-mid font-mono" aria-live="polite">
          {doneSet.size} / {items.length} DONE
        </span>
      </div>

      <div className="flex flex-col gap-3" role="list">
        {visibleItems.map((item, idx) => (
          <div key={idx} role="listitem">
            <ImprovementItem
              item={item}
              idx={idx}
              isDone={doneSet.has(idx)}
              onToggle={toggleDone}
            />
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-sm font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1 w-max mx-auto transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded"
          aria-expanded={showAll}
        >
          {showAll ? 'Show less' : `Show all ${items.length} items`}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
});

// ─── SkillValidator ────────────────────────────────────────────────────────────

const SkillValidatorItem = memo(({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const statusStyle = getSkillStatusStyle(item.status);
  const borderAccent =
    item.status === 'Proven'   ? 'border-green-500/30' :
    item.status === 'Verified' ? 'border-brand-primary/30' :
                                 'border-danger/30';
  const textAccent =
    item.status === 'Unproven' ? 'text-danger/80' : 'text-text-high';

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl flex flex-col transition-colors hover:border-surface-border-strong overflow-hidden">
      <button
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        className="flex items-center justify-between p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 text-left w-full"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <span className="text-text-high font-bold truncate">{item.skill}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider w-max flex-shrink-0 ${statusStyle}`}>
            {item.status}
          </span>
        </div>
        <ChevronRight
          size={18}
          aria-hidden="true"
          className={`text-text-mid transition-transform duration-200 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* CSS max-height accordion — no Framer, no JS per frame */}
      <div
        style={{ maxHeight: isExpanded ? '200px' : '0', transition: 'max-height 0.3s ease', overflow: 'hidden' }}
        aria-hidden={!isExpanded}
      >
        <div className="p-4 pt-0 text-sm font-dm-sans bg-surface-overlay border-t border-surface-border">
          <p className="font-mono text-xs text-text-secondary font-bold mt-4 mb-3">
            Location: {item.location || 'Not found'}
          </p>
          {item.evidence_strength && (
            <p className={`leading-relaxed pl-3 border-l-2 ${borderAccent} ${textAccent}`}>
              "{item.evidence_strength}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

const SkillValidator = memo(({ items = [] }) => {
  const stats = useMemo(
    () => items.reduce((acc, { status }) => {
      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, { ...INITIAL_SKILL_STATS }),
    [items],
  );

  return (
    <div className="col-span-1 lg:col-span-5 border border-surface-border bg-surface-overlay rounded-2xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2 text-xl font-bold text-text-high font-clash-display">
          <ShieldAlert size={20} className="text-purple-400" aria-hidden="true" />
          Skill Evidence Check
        </h3>
      </div>

      <div className="flex items-center gap-2 mb-6 p-3 bg-surface-card border border-surface-border rounded-xl">
        {[
          { key: 'Proven',   color: 'text-green-400'   },
          { key: 'Verified', color: 'text-brand-primary' },
          { key: 'Unproven', color: 'text-danger'       },
        ].map(({ key, color }, i, arr) => (
          <div key={key} className={`flex-1 text-center ${i < arr.length - 1 ? 'border-r border-surface-border' : ''}`}>
            <div className={`font-bold text-lg ${color}`}>{stats[key]}</div>
            <div className="text-[10px] uppercase text-text-secondary font-bold tracking-wider">{key}</div>
          </div>
        ))}
      </div>

      <div
        className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1 terminal-scrollbar"
        role="list"
        aria-label="Skill evidence items"
      >
        {items.length > 0 ? items.map((item, idx) => (
          <div key={idx} role="listitem">
            <SkillValidatorItem item={item} />
          </div>
        )) : (
          <p className="text-center p-6 text-text-mid text-sm italic">
            No skill evidence available.
          </p>
        )}
      </div>
    </div>
  );
});

// ─── ExperienceOptimizer ───────────────────────────────────────────────────────

const ExperienceOptimizer = memo(({ items = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showWhy, setShowWhy]     = useState(false);

  const currentItem = items[activeTab];
  if (!currentItem) return null;

  return (
    <div className="col-span-full mt-4">
      <h3 className="flex items-center gap-2 text-xl font-bold text-text-high mb-6 font-clash-display">
        <RefreshCw size={20} className="text-warning" aria-hidden="true" />
        Experience Optimizer
      </h3>

      <div className="bg-surface-card border border-surface-border rounded-2xl overflow-hidden flex flex-col">

        {items.length > 1 && (
          <div
            className="flex items-center border-b border-surface-border overflow-x-auto terminal-scrollbar bg-surface-overlay"
            role="tablist"
            aria-label="Experience tabs"
          >
            {items.map((_, idx) => (
              <button
                key={idx}
                role="tab"
                aria-selected={activeTab === idx}
                onClick={() => setActiveTab(idx)}
                className={`
                  py-3 px-6 text-xs font-bold uppercase tracking-widest whitespace-nowrap
                  border-b-2 transition-colors focus:outline-none focus-visible:ring-2
                  focus-visible:ring-brand-primary/50
                  ${activeTab === idx
                    ? 'border-brand-primary text-brand-primary bg-surface-card'
                    : 'border-transparent text-text-mid hover:text-text-high hover:bg-surface-card/50'
                  }
                `}
              >
                Experience {idx + 1}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Original */}
            <div className="flex flex-col bg-surface-overlay p-6 rounded-xl border border-surface-border">
              <p className="text-[10px] font-bold text-text-mid uppercase tracking-widest mb-3 flex items-center gap-2">
                <ChevronRight size={14} aria-hidden="true" className="opacity-50" /> Original Text
              </p>
              <p className="text-text-secondary font-dm-sans leading-relaxed italic pl-4 border-l-2 border-surface-border text-sm flex-1">
                "{currentItem.original_text}"
              </p>
            </div>

            {/* Optimized */}
            <div className="flex flex-col bg-green-500/5 p-6 rounded-xl border border-green-500/20 h-full">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={14} aria-hidden="true" className="fill-green-400" /> Optimized for Match
                </p>
                <button
                  onClick={() => copyToClipboard(currentItem.optimized_text)}
                  aria-label="Copy optimized text"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500/50"
                >
                  <Copy size={12} aria-hidden="true" />
                  <span className="hidden sm:inline">Copy &amp; Apply</span>
                </button>
              </div>
              <p className="text-text-high font-dm-sans leading-relaxed pl-4 border-l-2 border-green-500 text-sm flex-1">
                "{currentItem.optimized_text}"
              </p>
            </div>
          </div>

          {/* Why this matters */}
          <div className="mt-6 border-t border-surface-border pt-4">
            <button
              onClick={() => setShowWhy((v) => !v)}
              aria-expanded={showWhy}
              className="flex items-center gap-2 text-sm text-brand-primary font-bold hover:text-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded transition-colors"
            >
              <Info size={16} aria-hidden="true" /> Why this improves your score
            </button>

            <div
              style={{ maxHeight: showWhy ? '200px' : '0', transition: 'max-height 0.3s ease', overflow: 'hidden' }}
              aria-hidden={!showWhy}
            >
              <p className="mt-3 p-4 bg-brand-primary/5 border border-brand-primary/10 rounded-xl text-sm text-text-high leading-relaxed">
                By quantifying the impact and injecting keywords directly from the job description,
                this rewording appeals to ATS logic that scans for specific noun-and-verb clusters.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── MissingSectionAlerts ──────────────────────────────────────────────────────

const MissingSectionAlerts = memo(({ items = [] }) => {
  if (!items?.length) return null;

  return (
    <div className="col-span-full mt-4 flex flex-col gap-4">
      <h3 className="flex items-center gap-2 text-xl font-bold text-text-high mb-2 font-clash-display">
        <AlertTriangle size={20} className="text-warning" aria-hidden="true" /> Structural Alerts
      </h3>

      {items.map((alert, idx) => (
        <div
          key={idx}
          className="bg-warning-dim border border-warning/30 rounded-xl overflow-hidden"
          role="alert"
        >
          <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-6">

            <div className="flex items-start gap-4 flex-1">
              <div className="bg-warning/20 p-2.5 rounded-full mt-0.5 flex-shrink-0">
                <ShieldAlert className="text-warning" size={20} aria-hidden="true" />
              </div>
              <div>
                <h4 className="flex flex-wrap items-center gap-2 text-lg font-bold text-text-high mb-1 font-clash-display">
                  Missing Section:
                  <span className="text-warning">{alert.section_name}</span>
                </h4>
                <p className="text-text-secondary text-sm leading-relaxed font-dm-sans">
                  {alert.message}
                </p>
              </div>
            </div>

            {alert.suggestion_template && (
              <div className="flex-1 bg-surface-card border border-surface-border p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-mono text-xs uppercase text-brand-primary font-bold tracking-widest">
                    {alert.suggestion_template.title}
                  </p>
                  <button
                    onClick={() => copyToClipboard(
                      `${alert.suggestion_template.title}\n${alert.suggestion_template.description}`
                    )}
                    aria-label="Copy template"
                    className="text-text-mid hover:text-text-high bg-surface-overlay hover:bg-surface-border border border-surface-border rounded p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
                  >
                    <Copy size={14} aria-hidden="true" />
                  </button>
                </div>
                <p className="font-dm-sans text-sm text-text-high italic opacity-90 pl-3 border-l-2 border-surface-border/50">
                  {alert.suggestion_template.description}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
});

// ─── ActionableTodoList (root) ─────────────────────────────────────────────────

const ActionableTodoList = ({ data = {} }) => {
  const {
    top_improvements       = [],
    skill_evidence_validator = [],
    experience_optimizer   = [],
    missing_section_alerts = [],
  } = data;

  return (
    <div className="w-full">
      <div className="border-l-4 border-brand-primary pl-4 mb-10 mt-6">
        <h2 className="text-3xl font-clash-display font-medium text-text-high">
          Action Command Center
        </h2>
        <p className="text-text-mid font-dm-sans text-sm mt-1">
          Your step-by-step optimization plan. Apply these to maximize your score.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        <TopImprovements items={top_improvements} />
        <SkillValidator  items={skill_evidence_validator} />
        <ExperienceOptimizer   items={experience_optimizer} />
        <MissingSectionAlerts  items={missing_section_alerts} />
      </div>
    </div>
  );
};

export default ActionableTodoList;