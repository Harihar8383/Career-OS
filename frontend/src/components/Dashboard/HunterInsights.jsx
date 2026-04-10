// frontend/src/components/Dashboard/HunterInsights.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Bookmark, Building2, ChevronRight, Clock, Crosshair, ArrowUpRight, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ── Shared design tokens ─────────────────────────────────────────────────────
const INDIGO = { color: '#818cf8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', glow: 'rgba(99,102,241,0.35)' };
const EMERALD = { color: '#34d399', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' };
const AMBER  = { color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' };

const STAT_CONFIGS = [
  { icon: Search,   label: 'Hunts',  key: 'totalSessions',  ...INDIGO },
  { icon: Package,  label: 'Found',  key: 'totalJobsFound', ...EMERALD },
  { icon: Bookmark, label: 'Saved',  key: 'jobsSaved',      ...AMBER  },
];

// ── Animated stat card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg, border, glow, delay }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '12px 8px',
        borderRadius: '12px',
        background: hov ? bg : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? border : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hov && glow ? `0 0 16px ${glow}` : 'none',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
        cursor: 'default',
        gap: '5px',
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: hov ? bg : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hov ? border : 'rgba(255,255,255,0.07)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s, border-color 0.2s',
        marginBottom: 2,
      }}>
        <Icon size={13} color={hov ? color : 'rgba(148,163,184,0.7)'} strokeWidth={2} style={{ transition: 'color 0.2s' }} />
      </div>
      <span style={{ fontSize: 17, fontWeight: 800, color: hov ? color : 'var(--text-primary,#e2e8f0)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui,sans-serif', transition: 'color 0.2s' }}>
        {value}
      </span>
      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#64748b', fontFamily: 'system-ui,sans-serif' }}>
        {label}
      </span>
    </motion.div>
  );
}

// ── Latest session card ───────────────────────────────────────────────────────
function LatestSessionCard({ session, onClick }) {
  const [hov, setHov] = useState(false);
  const role = session.criteria?.role || session.criteria?.jobTitles?.[0] || 'Job Hunt';
  const loc  = session.criteria?.location
    ? (Array.isArray(session.criteria.location) ? session.criteria.location[0] : session.criteria.location)
    : null;
  const ago  = formatDistanceToNow(new Date(session.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden',
        padding: '12px 14px',
        borderRadius: '12px',
        background: hov ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hov ? 'rgba(99,102,241,0.28)' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer',
        transition: 'background 0.2s, border-color 0.2s',
      }}
    >
      {/* Subtle glow sweep on hover */}
      <motion.div
        animate={{ opacity: hov ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 90% 10%, rgba(99,102,241,0.12), transparent 65%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Row 1: label + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#818cf8', fontFamily: 'system-ui,sans-serif' }}>
            Latest Hunt
          </span>
          <motion.div animate={{ opacity: hov ? 1 : 0.4, x: hov ? 0 : -3 }} transition={{ duration: 0.18 }}>
            <ArrowUpRight size={13} color="#818cf8" />
          </motion.div>
        </div>

        {/* Row 2: role title */}
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary,#e2e8f0)', margin: '0 0 6px', fontFamily: 'system-ui,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
          {role}
        </p>

        {/* Row 3: meta chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {loc && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#64748b', fontFamily: 'system-ui,sans-serif' }}>
              <MapPin size={9} /> {loc}
            </span>
          )}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#64748b', fontFamily: 'system-ui,sans-serif' }}>
            <Package size={9} /> {session.jobCount} results
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#64748b', fontFamily: 'system-ui,sans-serif' }}>
            <Clock size={9} /> {ago}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Company bar row ───────────────────────────────────────────────────────────
function CompanyRow({ company, count, maxCount, rank, delay }) {
  const [hov, setHov] = useState(false);
  const pct = Math.max(6, (count / maxCount) * 100);
  const rankColors = ['#fbbf24', '#94a3b8', '#cd7c3f']; // gold, silver, bronze
  const isTop3 = rank < 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '8px 10px',
        borderRadius: '10px',
        background: hov ? 'rgba(255,255,255,0.035)' : 'transparent',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
        transition: 'background 0.15s, border-color 0.15s',
        cursor: 'default',
      }}
    >
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          {/* Rank badge */}
          <span style={{
            fontSize: 9, fontWeight: 900,
            color: isTop3 ? rankColors[rank] : '#475569',
            width: 14, flexShrink: 0, textAlign: 'center',
            fontFamily: 'system-ui,sans-serif',
            letterSpacing: '-0.02em',
          }}>
            {isTop3 ? ['①','②','③'][rank] : `${rank + 1}`}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: hov ? '#e2e8f0' : 'rgba(226,232,240,0.8)', fontFamily: 'system-ui,sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'color 0.15s' }}>
            {company}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: hov ? '#818cf8' : '#64748b', fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui,sans-serif', marginLeft: 8, flexShrink: 0, transition: 'color 0.15s' }}>
          {count}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{
            height: '100%', borderRadius: 99,
            background: isTop3
              ? `linear-gradient(90deg, ${rankColors[rank]}60, ${rankColors[rank]})`
              : 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(99,102,241,0.7))',
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Tab pill ──────────────────────────────────────────────────────────────────
function TabPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: 7,
        fontSize: 11, fontWeight: 700,
        background: active ? 'rgba(99,102,241,0.18)' : 'transparent',
        color: active ? '#a5b4fc' : '#64748b',
        border: `1px solid ${active ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
        cursor: 'pointer', transition: 'all 0.18s ease',
        fontFamily: 'system-ui,sans-serif',
        letterSpacing: '0.01em',
      }}
    >
      {label}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function Empty({ icon: Icon, text }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, padding: '24px 0' }}>
      <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color="rgba(99,102,241,0.5)" strokeWidth={1.5} />
      </div>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontFamily: 'system-ui,sans-serif' }}>{text}</p>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HunterInsights({ hunterSummary = {}, topCompanies = [] }) {
  const [tab, setTab] = useState('summary');
  const navigate = useNavigate();

  const { totalSessions = 0, totalJobsFound = 0, jobsSaved = 0, latestSession } = hunterSummary;

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-5 h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: INDIGO.bg, border: `1px solid ${INDIGO.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Crosshair size={13} color={INDIGO.color} strokeWidth={2} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--text-primary,#e2e8f0)', letterSpacing: '-0.01em', fontFamily: 'system-ui,sans-serif' }}>
            Job Hunter
          </h3>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 2, padding: '3px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <TabPill label="Summary"   active={tab === 'summary'}   onClick={() => setTab('summary')} />
          <TabPill label="Companies" active={tab === 'companies'} onClick={() => setTab('companies')} />
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }} className="custom-scrollbar">
        <AnimatePresence mode="wait">

          {/* ── Summary tab ── */}
          {tab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              {/* Stat cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {STAT_CONFIGS.map((s, i) => (
                  <StatCard
                    key={s.label}
                    {...s}
                    value={hunterSummary[s.key] ?? 0}
                    delay={i * 0.06}
                  />
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

              {/* Latest session */}
              {latestSession
                ? <LatestSessionCard session={latestSession} onClick={() => navigate(`/dashboard/hunter/session/${latestSession.sessionId}`)} />
                : <Empty icon={Search} text="No hunts run yet" />
              }
            </motion.div>
          )}

          {/* ── Companies tab ── */}
          {tab === 'companies' && (
            <motion.div
              key="companies"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
            >
              {topCompanies.length === 0
                ? <Empty icon={Building2} text="No company data yet" />
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Column header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 6px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#475569', fontFamily: 'system-ui,sans-serif' }}>Company</span>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#475569', fontFamily: 'system-ui,sans-serif' }}>Jobs</span>
                    </div>
                    {topCompanies.map((c, i) => (
                      <CompanyRow
                        key={c.company}
                        company={c.company}
                        count={c.count}
                        maxCount={topCompanies[0]?.count || 1}
                        rank={i}
                        delay={i * 0.05}
                      />
                    ))}
                  </div>
                )
              }
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}