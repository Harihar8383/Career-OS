// frontend/src/components/Dashboard/ActivityHeatmap.jsx
import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS   = ['Mon', '', 'Wed', '', 'Fri', '', ''];

// ── LeetCode-exact metrics ───────────────────────────────────────────────────
const CELL   = 11;   // cell width & height
const GAP    =  2;   // gap between cells
const STEP   = CELL + GAP;   // 13px per col/row
const DAY_W  = 28;   // left gutter for day labels
const TOP_H  = 20;   // top gutter for month labels

// ── Original indigo color palette (from the first version) ──────────────────
function cellFill(count, maxCount) {
  if (count === 0) return 'rgba(255,255,255,0.055)';
  const r = maxCount <= 1 ? 1 : count / maxCount;
  if (r > 0.75) return 'rgba(99,102,241,0.90)';
  if (r > 0.50) return 'rgba(99,102,241,0.62)';
  if (r > 0.25) return 'rgba(99,102,241,0.42)';
  return               'rgba(99,102,241,0.22)';
}
function cellGlow(count, maxCount) {
  if (count === 0) return null;
  const r = maxCount <= 1 ? 1 : count / maxCount;
  if (r > 0.75) return 'rgba(99,102,241,0.65)';
  if (r > 0.50) return 'rgba(99,102,241,0.45)';
  if (r > 0.25) return 'rgba(99,102,241,0.28)';
  return               'rgba(99,102,241,0.15)';
}

const LEGEND_FILLS = [
  'rgba(255,255,255,0.055)',
  'rgba(99,102,241,0.22)',
  'rgba(99,102,241,0.42)',
  'rgba(99,102,241,0.62)',
  'rgba(99,102,241,0.90)',
];

// ── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ date, count, x, y, svgRect }) {
  const W = 108, H = 42;
  // flip left if too close to right edge
  const left = svgRect ? Math.min(x, svgRect.width - W - 4) : x;
  const top  = y - H - 10;
  return (
    <div style={{
      position: 'absolute',
      left,
      top: top < 0 ? y + CELL + 6 : top,
      width: W,
      background: 'rgba(10,12,20,0.97)',
      border: '1px solid rgba(99,102,241,0.28)',
      borderRadius: '8px',
      padding: '6px 10px',
      pointerEvents: 'none',
      zIndex: 60,
      boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3, fontFamily: 'system-ui,sans-serif' }}>
        {count} action{count !== 1 ? 's' : ''}
      </div>
      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', fontFamily: 'system-ui,sans-serif' }}>
        {date}
      </div>
    </div>
  );
}

// ── Stat chip ────────────────────────────────────────────────────────────────
function Chip({ value, label, color, bg, border }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '5px 12px', borderRadius: '9px',
      background: bg, border: `1px solid ${border}`, flexShrink: 0,
    }}>
      <span style={{ fontSize: '14px', fontWeight: 800, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'system-ui,sans-serif' }}>
        {value}
      </span>
      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#64748b', marginTop: '2px', fontFamily: 'system-ui,sans-serif' }}>
        {label}
      </span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function ActivityHeatmap({ data = [] }) {
  const wrapRef  = useRef(null);
  const svgRef   = useRef(null);
  const [tooltip, setTooltip] = useState(null); // { date, count, x, y }
  const [svgRect, setSvgRect] = useState(null);

  const WEEKS = 53; // LeetCode shows 53 columns to always cover 12 months

  // ── data → grid ─────────────────────────────────────────────────────────
  const { grid, monthLabels, maxCount, totalActions, activeDays, maxStreak, curStreak } = useMemo(() => {
    const countMap = {};
    data.forEach(d => { countMap[d.date] = d.count; });

    const today    = new Date();
    const totalDays = WEEKS * 7;

    // Align: the grid always ENDS on the Saturday of the current week
    // so the last column is the current week (same as LeetCode/GitHub)
    const dow = today.getDay(); // 0=Sun,1=Mon,...,6=Sat
    // days until Saturday from today
    const toSat = (6 - dow + 7) % 7;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + toSat);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    const grid = [];
    const monthLabels = []; // { label, colIndex }
    let cur = new Date(startDate);
    let week = [];
    let lastMonth = -1, total = 0, max = 0, active = 0;

    for (let i = 0; i < totalDays; i++) {
      const dateStr  = cur.toISOString().split('T')[0];
      const count    = countMap[dateStr] || 0;
      const isFuture = cur > today;
      if (!isFuture) { total += count; if (count > 0) active++; }
      if (count > max) max = count;

      const month = cur.getMonth();
      // Place month label at the START of the first full week of that month
      if (month !== lastMonth) {
        const colIdx = Math.floor(i / 7);
        // Only label if there's room (not the very last column)
        if (colIdx < WEEKS - 1) {
          monthLabels.push({ label: MONTHS[month], col: colIdx });
        }
        lastMonth = month;
      }

      week.push({ date: dateStr, count, isFuture });
      if (week.length === 7) { grid.push(week); week = []; }
      cur.setDate(cur.getDate() + 1);
    }
    if (week.length) grid.push(week);

    // Current streak
    const sorted = [...data].filter(d => d.count > 0).sort((a, b) => b.date.localeCompare(a.date));
    let cs = 0;
    const d = new Date(today);
    for (const e of sorted) {
      if (e.date === d.toISOString().split('T')[0]) { cs++; d.setDate(d.getDate() - 1); }
      else break;
    }

    // Max streak
    let ms = 0, run = 0, prev = null;
    const asc = [...data].filter(d => d.count > 0).sort((a, b) => a.date.localeCompare(b.date));
    for (const e of asc) {
      if (prev) {
        const diff = (new Date(e.date) - new Date(prev)) / 86400000;
        run = diff === 1 ? run + 1 : 1;
      } else run = 1;
      if (run > ms) ms = run;
      prev = e.date;
    }

    return { grid, monthLabels, maxCount: max, totalActions: total, activeDays: active, maxStreak: ms, curStreak: cs };
  }, [data]);

  // ── SVG dimensions ─────────────────────────────────────────────────────
  // We want the SVG to fill the container width. Compute cellSize dynamically.
  const [dynCell, setDynCell] = useState(CELL);
  const [dynGap,  setDynGap]  = useState(GAP);

  useEffect(() => {
    const calc = () => {
      if (!wrapRef.current) return;
      const W = wrapRef.current.offsetWidth; // full card inner width
      // available = DAY_W + numCols*(cell+gap) - gap
      const avail = W - DAY_W;
      const raw = (avail + GAP) / WEEKS - GAP;
      const c = Math.max(9, Math.min(14, Math.floor(raw)));
      setDynCell(c);
      setDynGap(Math.max(2, Math.round(c * 0.18)));
      if (svgRef.current) setSvgRect(svgRef.current.getBoundingClientRect());
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const cs = dynCell, gs = dynGap, ss = cs + gs; // cell, gap, step
  const numCols = grid.length;
  const svgW = DAY_W + numCols * ss - gs;
  const svgH = TOP_H + 7 * ss - gs;

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setSvgRect(rect);
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // reverse-map pixel → col, row
    const col = Math.floor((mx - DAY_W) / ss);
    const row = Math.floor((my - TOP_H) / ss);
    if (col >= 0 && col < grid.length && row >= 0 && row < 7) {
      const day = grid[col]?.[row];
      if (day && !day.isFuture) {
        setTooltip({ date: day.date, count: day.count, x: mx, y: my });
        return;
      }
    }
    setTooltip(null);
  }, [grid, ss]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 3px', color: 'var(--text-primary,#e2e8f0)', letterSpacing: '-0.02em', fontFamily: 'system-ui,sans-serif' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#818cf8', marginRight: '7px', fontVariantNumeric: 'tabular-nums' }}>{totalActions}</span>
            submissions in the past year
          </h3>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: 'var(--text-secondary,#64748b)', fontFamily: 'system-ui,sans-serif' }}>
            <span>Total active days: <b style={{ color: 'var(--text-primary,#e2e8f0)' }}>{activeDays}</b></span>
            <span>Max streak: <b style={{ color: 'var(--text-primary,#e2e8f0)' }}>{maxStreak}</b></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexShrink: 0 }}>
          <Chip value={totalActions} label="Actions" color="#818cf8" bg="rgba(99,102,241,0.08)"  border="rgba(99,102,241,0.2)" />
          <Chip value={activeDays}   label="Active"  color="#34d399" bg="rgba(16,185,129,0.08)"  border="rgba(16,185,129,0.2)" />
          {curStreak > 0 && (
            <Chip value={`${curStreak}🔥`} label="Streak" color="#fbbf24" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.2)" />
          )}
        </div>
      </div>

      {/* SVG heatmap */}
      <div ref={wrapRef} style={{ width: '100%', position: 'relative' }}>
        <svg
          ref={svgRef}
          width="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: 'block', overflow: 'visible', cursor: 'default' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* ── Month labels ── */}
          {monthLabels.map((m, i) => (
            <text
              key={i}
              x={DAY_W + m.col * ss}
              y={TOP_H - 6}
              fontSize="9"
              fontWeight="700"
              letterSpacing="0.07"
              fill="rgba(100,116,139,0.9)"
              fontFamily="system-ui,sans-serif"
              textAnchor="start"
            >
              {m.label.toUpperCase()}
            </text>
          ))}

          {/* ── Day labels ── */}
          {DAYS.map((d, i) => d ? (
            <text
              key={i}
              x={DAY_W - 5}
              y={TOP_H + i * ss + cs * 0.72}
              fontSize="9"
              fontWeight="600"
              fill="rgba(100,116,139,0.85)"
              fontFamily="system-ui,sans-serif"
              textAnchor="end"
            >
              {d}
            </text>
          ) : null)}

          {/* ── Cells ── */}
          {grid.map((week, wi) =>
            week.map((day, di) => {
              const x = DAY_W + wi * ss;
              const y = TOP_H + di * ss;
              const fill = day.isFuture ? 'transparent' : cellFill(day.count, maxCount);
              const glow = day.isFuture ? null : cellGlow(day.count, maxCount);
              return (
                <g key={day.date}>
                  {glow && (
                    <rect
                      x={x - 1} y={y - 1}
                      width={cs + 2} height={cs + 2}
                      rx={cs * 0.27 + 1}
                      fill="none"
                      stroke={glow}
                      strokeWidth="1.5"
                      opacity="0.6"
                    />
                  )}
                  <rect
                    x={x} y={y}
                    width={cs} height={cs}
                    rx={cs * 0.27}
                    fill={fill}
                  />
                </g>
              );
            })
          )}
        </svg>

        {/* Tooltip overlay */}
        {tooltip && (
          <Tooltip
            date={tooltip.date}
            count={tooltip.count}
            x={tooltip.x}
            y={tooltip.y}
            svgRect={svgRect}
          />
        )}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '10px', marginLeft: `${DAY_W}px` }}>
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', marginRight: '3px', fontFamily: 'system-ui,sans-serif' }}>Less</span>
          {LEGEND_FILLS.map((fill, i) => (
            <svg key={i} width={cs} height={cs} style={{ flexShrink: 0 }}>
              <rect
                x={0} y={0} width={cs} height={cs}
                rx={cs * 0.27}
                fill={fill}
                stroke={i === 0 ? 'rgba(255,255,255,0.09)' : 'none'}
                strokeWidth="1"
              />
            </svg>
          ))}
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b', marginLeft: '3px', fontFamily: 'system-ui,sans-serif' }}>More</span>
        </div>
      </div>
    </div>
  );
}