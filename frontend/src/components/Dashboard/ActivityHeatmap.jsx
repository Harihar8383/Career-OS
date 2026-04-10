// frontend/src/components/Dashboard/ActivityHeatmap.jsx
//
// LeetCode-accurate implementation:
//  • Grid is week-columns × 7 rows (Mon–Sun)
//  • Month labels sit exactly above the first week-column that contains the 1st of each month
//  • A faint vertical separator is drawn at every month boundary
//  • Cell fill uses the original indigo palette
//  • SVG fills 100% width via viewBox scaling
//  • ResizeObserver drives dynamic cellSize so it always fills the card
//

import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// Only Mon / Wed / Fri shown, others are empty strings (same row height kept)
const DAY_LABELS  = ['Mon', '', 'Wed', '', 'Fri', '', ''];

// ─── Colour palette (LeetCode / GitHub Dark Mode Greens) ────────────────
const FILLS = [
  'rgba(255, 255, 255, 0.04)', // 0 contributions
  '#0e4429',   // level 1
  '#006d32',   // level 2
  '#26a641',   // level 3
  '#39d353',   // level 4
];

function getLevel(count, maxCount) {
  if (count === 0 || maxCount === 0) return 0;
  const r = count / maxCount;
  if (r > 0.75) return 4;
  if (r > 0.50) return 3;
  if (r > 0.25) return 2;
  return 1;
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function Tooltip({ date, count, px, py, containerW }) {
  const W = 118, H = 46, ARROW = 5;
  let left = px - W / 2;
  if (left < 0) left = 4;
  if (left + W > containerW) left = containerW - W - 4;
  const above = py - H - 10;
  const below = py + 16 + 8;
  const flip  = above < 0;

  return (
    <div style={{
      position: 'absolute',
      left,
      top: flip ? below : above,
      width: W,
      background: 'rgba(9,11,19,0.97)',
      border: '1px solid rgba(57,211,83,0.3)',
      borderRadius: '9px',
      padding: '7px 11px',
      pointerEvents: 'none',
      zIndex: 70,
      boxShadow: '0 8px 28px rgba(0,0,0,0.55)',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', fontFamily: 'system-ui,sans-serif' }}>
        {count} action{count !== 1 ? 's' : ''}
      </div>
      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'system-ui,sans-serif' }}>
        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}
      </div>
      {/* Arrow */}
      <div style={{
        position: 'absolute',
        [flip ? 'bottom' : 'top']: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: `${ARROW}px solid transparent`,
        borderRight: `${ARROW}px solid transparent`,
        [flip ? 'borderBottom' : 'borderTop']: `${ARROW}px solid rgba(9,11,19,0.97)`,
      }} />
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function Chip({ value, label, color, bg, border }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'5px 12px', borderRadius:'9px', background:bg, border:`1px solid ${border}`, flexShrink:0 }}>
      <span style={{ fontSize:'14px', fontWeight:800, color, lineHeight:1, fontVariantNumeric:'tabular-nums', fontFamily:'system-ui,sans-serif' }}>{value}</span>
      <span style={{ fontSize:'9px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:'#64748b', marginTop:'2px', fontFamily:'system-ui,sans-serif' }}>{label}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ActivityHeatmap({ data = [] }) {
  const wrapRef  = useRef(null);
  const [cs, setCs] = useState(11); // cell size
  const [tooltip, setTooltip] = useState(null);

  // ── Constants derived from cell size ──────────────────────────────────────
  const GAP      = 3;
  const STEP     = cs + GAP;           // pixels per col/row
  const DAY_W    = 32;                 // left gutter (day labels)
  const TOP_H    = 5;                  // top margin
  const BOTTOM_H = 22;                 // bottom gutter (month labels)
  const MONTH_GAP = 16;                // extra px separating isolated month blocks

  // ── Build calendar data ───────────────────────────────────────────────────
  const { columns, monthMeta, maxCount, totalActions, activeDays, maxStreak, curStreak } = useMemo(() => {
    const countMap = {};
    data.forEach(d => { countMap[d.date] = d.count; });

    const today     = new Date();
    const NUM_WEEKS = 53;

    // End on the Saturday of the current week (like LeetCode)
    const dow    = today.getDay(); // 0=Sun
    const toSat  = (6 - dow + 7) % 7;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + toSat);

    // Start = 53 weeks back from endDate, aligned to Sunday
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - NUM_WEEKS * 7 + 1);

    // Build columns array: Split weeks into month chunks
    let total = 0, max = 0, active = 0;
    const columns    = [];
    const monthMeta  = [];
    let   cur        = new Date(startDate);
    const totalDays  = NUM_WEEKS * 7;

    let currentMonth = cur.getMonth();
    let currentCol   = { days: new Array(7).fill(null), isMonthStart: true };
    monthMeta.push({ label: MONTH_NAMES[currentMonth], colIndex: 0 });

    for (let i = 0; i < totalDays; i++) {
      const d = cur.getDay();
      const m = cur.getMonth();

      // Start new column if month boundary crossed
      if (m !== currentMonth) {
        columns.push(currentCol);
        currentCol = { days: new Array(7).fill(null), isMonthStart: true };
        currentMonth = m;
        monthMeta.push({ label: MONTH_NAMES[m], colIndex: columns.length });
      } 
      // Start new column if Sunday (and current column has data)
      else if (d === 0 && currentCol.days.some(x => x !== null)) {
        columns.push(currentCol);
        currentCol = { days: new Array(7).fill(null), isMonthStart: false };
      }

      const dateStr  = cur.toISOString().split('T')[0];
      const count    = countMap[dateStr] || 0;
      const isFuture = cur > today;
      if (!isFuture) { total += count; if (count > 0) active++; if (count > max) max = count; }

      currentCol.days[d] = { date: dateStr, count, isFuture, level: 0 };
      cur.setDate(cur.getDate() + 1);
    }
    columns.push(currentCol);

    // Normalise levels
    columns.forEach(col => col.days.forEach(d => { if (d) d.level = getLevel(d.count, max); }));

    // Current streak (consecutive days ending today)
    const sorted = [...data].filter(x => x.count > 0).sort((a,b) => b.date.localeCompare(a.date));
    let cs2 = 0; const dd = new Date(today);
    for (const e of sorted) {
      if (e.date === dd.toISOString().split('T')[0]) { cs2++; dd.setDate(dd.getDate()-1); } else break;
    }

    // Max streak
    let ms = 0, run = 0, prev = null;
    [...data].filter(x=>x.count>0).sort((a,b)=>a.date.localeCompare(b.date)).forEach(e => {
      if (prev) { const diff = (new Date(e.date)-new Date(prev))/86400000; run = diff===1 ? run+1 : 1; }
      else run = 1;
      if (run>ms) ms=run;
      prev = e.date;
    });

    return { columns, monthMeta, maxCount:max, totalActions:total, activeDays:active, maxStreak:ms, curStreak:cs2 };
  }, [data]);

  // ── Compute per-column X positions with extra month gaps ──────────────────
  const colX = useMemo(() => {
    const xs = [];
    let x = 0;
    for (let c = 0; c < columns.length; c++) {
      if (c > 0 && columns[c].isMonthStart) {
        x += Math.max(MONTH_GAP - GAP, 0); // add separation for isolated months
      }
      xs.push(x);
      x += STEP;
    }
    return xs;
  }, [columns, STEP, GAP, MONTH_GAP]);

  // ── SVG dimensions ────────────────────────────────────────────────────────
  const svgW = DAY_W + (colX[colX.length - 1] || 0) + cs;
  const svgH = TOP_H + 7 * STEP - GAP + BOTTOM_H;

  // ── Dynamic cell size from container width ────────────────────────────────
  useEffect(() => {
    const calc = () => {
      if (!wrapRef.current) return;
      const avail = wrapRef.current.offsetWidth - DAY_W;
      const numCols = columns.length;
      let monthGaps = 0;
      for (let i = 1; i < numCols; i++) {
        if (columns[i].isMonthStart) monthGaps++;
      }
      const extraGapsPx = monthGaps * Math.max(MONTH_GAP - GAP, 0);
      const raw = (avail - (numCols - 1) * GAP - extraGapsPx) / numCols;
      // Shrink minimum size to fit the padded gaps if on smaller screens
      setCs(Math.max(9, Math.min(14, Math.floor(raw))));
    };
    calc();
    const ro = new ResizeObserver(calc);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [columns.length, columns, GAP, MONTH_GAP, DAY_W]);

  // ── Mouse handler: reverse-map pixel → column/day ─────────────────────────
  const handleMouseMove = useCallback((e) => {
    if (!wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const svgEl = wrapRef.current.querySelector('svg');
    if (!svgEl) return;
    const svgRect = svgEl.getBoundingClientRect();
    const scaleX = svgW / svgRect.width;
    const scaleY = svgH / svgRect.height;
    const mx = (e.clientX - svgRect.left) * scaleX;
    const my = (e.clientY - svgRect.top)  * scaleY;

    // Find nearest column
    let bestW = -1;
    for (let w = 0; w < colX.length; w++) {
      const cx = DAY_W + colX[w];
      if (mx >= cx && mx <= cx + cs) { bestW = w; break; }
    }
    const row = Math.floor((my - TOP_H) / STEP);

    if (bestW >= 0 && row >= 0 && row < 7) {
      const day = columns[bestW]?.days[row];
      if (day && !day.isFuture) {
        const ttx = (DAY_W + colX[bestW] + cs/2) * (svgRect.width / svgW);
        const tty = (TOP_H + row * STEP + cs/2) * (svgRect.height / svgH);
        setTooltip({ date: day.date, count: day.count, px: ttx, py: tty });
        return;
      }
    }
    setTooltip(null);
  }, [colX, cs, columns, svgW, svgH, STEP, TOP_H, DAY_W]);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);


  // ── Month separator lines (vertical) removed for LeetCode style ───────────

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 shadow-sm">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'24px', gap:'12px', flexWrap:'wrap' }}>
        <div style={{ minWidth:0 }}>
          <h3 style={{ fontSize:'15px', fontWeight:600, margin:'0 0 4px', color:'var(--text-primary,#e2e8f0)', letterSpacing:'-0.01em', fontFamily:'system-ui,sans-serif' }}>
            <span style={{ fontSize:'21px', fontWeight:700, color:'var(--text-primary,#e2e8f0)', marginRight:'7px', fontVariantNumeric:'tabular-nums' }}>
              {totalActions}
            </span>
            Actions in the past year
          </h3>
          <div style={{ display:'flex', gap:'16px', fontSize:'12px', color:'var(--text-secondary,#64748b)', fontFamily:'system-ui,sans-serif' }}>
            <span>Total active days: <b style={{ color:'var(--text-primary,#e2e8f0)', fontWeight: 600 }}>{activeDays}</b></span>
            <span>Max streak: <b style={{ color:'var(--text-primary,#e2e8f0)', fontWeight: 600 }}>{maxStreak}</b></span>
          </div>
        </div>

        <div style={{ display:'flex', gap:'7px', flexShrink:0 }}>
          <Chip value={totalActions} label="Actions" color="#39d353" bg="rgba(57,211,83,0.08)"  border="rgba(57,211,83,0.2)" />
          <Chip value={activeDays}   label="Active"  color="#39d353" bg="rgba(57,211,83,0.08)"  border="rgba(57,211,83,0.2)" />
          {curStreak > 0 && (
            <Chip value={`${curStreak}🔥`} label="Streak" color="#fbbf24" bg="rgba(245,158,11,0.08)" border="rgba(245,158,11,0.2)" />
          )}
        </div>
      </div>

      {/* ── SVG Grid ───────────────────────────────────────────────────── */}
      <div
        ref={wrapRef}
        style={{ width:'100%', position:'relative', userSelect:'none' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          width="100%"
          viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display:'block', overflow:'visible' }}
        >
          {/* ── Day labels ───────────────────────────────────────────── */}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text
                key={i}
                x={DAY_W - 8}
                y={TOP_H + i * STEP + cs * 0.8}
                fontSize="10"
                fontWeight="500"
                fill="rgba(255,255,255,0.4)"
                fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
                textAnchor="end"
              >
                {label}
              </text>
            ) : null
          )}

          {/* ── Cells ────────────────────────────────────────────────── */}
          {columns.map((wk, wi) =>
            wk.days.map((day, di) => {
              if (!day) return null; // skip null days for staggering effect

              const x = DAY_W + colX[wi];
              const y = TOP_H + di * STEP;

              if (day.isFuture) return null;

              const fill = FILLS[day.level];

              return (
                <motion.rect
                  key={`cell-${day.date}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(wi * 0.004, 0.25), duration: 0.2 }}
                  x={x} y={y}
                  width={cs} height={cs}
                  rx={2.5}
                  fill={fill}
                  style={{ outline: "none", cursor: 'pointer' }}
                />
              );
            })
          )}

          {/* ── Month labels (at bottom) ─────────────────────────────────────────── */}
          {monthMeta.map((m, i) => (
            <text
              key={i}
              x={DAY_W + colX[m.colIndex]}
              y={TOP_H + 7 * STEP + 14}
              fontSize="12"
              fontWeight="400"
              fill="rgba(255,255,255,0.6)"
              fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
              textAnchor="start"
            >
              {m.label}
            </text>
          ))}
        </svg>

        {/* ── Tooltip ──────────────────────────────────────────────────── */}
        {tooltip && (
          <Tooltip
            date={tooltip.date}
            count={tooltip.count}
            px={tooltip.px}
            py={tooltip.py}
            containerW={wrapRef.current?.offsetWidth || 600}
          />
        )}

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px', marginLeft:`${DAY_W}px` }}>
          <span style={{ fontSize:'12px', fontWeight:400, color:'rgba(255,255,255,0.6)', marginRight:'4px', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>Less</span>
          {FILLS.map((fill, i) => (
            <svg key={i} width={cs} height={cs} style={{ flexShrink:0, display:'block' }}>
              <rect
                x={0} y={0} width={cs} height={cs}
                rx={2.5}
                fill={fill}
              />
            </svg>
          ))}
          <span style={{ fontSize:'12px', fontWeight:400, color:'rgba(255,255,255,0.6)', marginLeft:'4px', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>More</span>
        </div>
      </div>
    </div>
  );
}