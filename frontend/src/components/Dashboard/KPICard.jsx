// frontend/src/components/Dashboard/KPICard.jsx
import React, { useEffect, useState } from 'react';
import { motion, animate } from 'framer-motion';

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const isNumeric = typeof value === 'number';

  useEffect(() => {
    if (!isNumeric) return;
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, isNumeric]);

  if (!isNumeric) return <span>{value}</span>;
  return <span>{display}</span>;
}

export default function KPICard({ title, value, icon: Icon, suffix = '', color = '#3b82f6', delay = 0 }) {
  const [hovered, setHovered] = useState(false);
  const numericValue = typeof value === 'number' ? value : parseInt(value) || 0;

  // Derive a soft tint and a muted border from the accent color
  const tintBg   = `${color}12`;
  const tintBorder = `${color}30`;
  const tintGlow  = `${color}22`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group bg-bg-card border border-border-primary rounded-2xl p-5 overflow-hidden transition-all duration-300"
      style={{
        borderColor: hovered ? tintBorder : undefined,
        boxShadow: hovered ? `0 0 0 1px ${tintBorder}, 0 8px 32px ${tintGlow}` : '0 1px 4px rgba(0,0,0,0.15)',
      }}
    >
      {/* Radial glow — top-right, color-matched */}
      <motion.div
        aria-hidden
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at 90% 10%, ${color}18, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle bottom-edge accent line */}
      <motion.div
        aria-hidden
        animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
        initial={{ scaleX: 0, opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: '10%',
          right: '10%',
          height: '2px',
          borderRadius: '99px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          transformOrigin: 'center',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10">
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-secondary, #64748b)',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
          }}>
            {title}
          </span>

          {Icon && (
            <motion.div
              animate={{
                background: hovered ? `${color}22` : `${color}14`,
                boxShadow: hovered ? `0 0 14px ${color}30` : 'none',
              }}
              transition={{ duration: 0.3 }}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '9px',
                border: `1px solid ${hovered ? tintBorder : `${color}18`}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 0.3s',
              }}
            >
              <Icon style={{ width: '15px', height: '15px', color }} />
            </motion.div>
          )}
        </div>

        {/* Value row */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{
            fontSize: '30px',
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: 'var(--text-primary, #e2e8f0)',
            fontFamily: "'DM Sans', 'Inter', sans-serif",
            fontVariantNumeric: 'tabular-nums',
          }}>
            <AnimatedNumber value={numericValue} />
          </span>
          {suffix && (
            <span style={{
              fontSize: '15px',
              fontWeight: 600,
              color: 'var(--text-secondary, #64748b)',
              letterSpacing: '-0.01em',
              paddingBottom: '2px',
            }}>
              {suffix}
            </span>
          )}
        </div>

        {/* Thin progress-style accent bar under value */}
        <div style={{
          marginTop: '12px',
          height: '3px',
          borderRadius: '99px',
          background: 'var(--border-primary, rgba(255,255,255,0.06))',
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '90%' }}
            transition={{ delay: delay + 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: '100%',
              borderRadius: '99px',
              background: `linear-gradient(90deg, ${color}80, ${color})`,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}