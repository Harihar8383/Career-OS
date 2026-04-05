// frontend/src/components/Dashboard/KPICard.jsx
import React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const isNumeric = typeof value === 'number';

  useEffect(() => {
    if (!isNumeric) return;
    const controls = animate(0, value, {
      duration: 1.2,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, isNumeric]);

  if (!isNumeric) return <span>{value}</span>;
  return <span>{display}</span>;
}

export default function KPICard({ title, value, icon: Icon, suffix = '', color = '#3b82f6', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className="relative group bg-bg-card border border-border-primary rounded-2xl p-5 overflow-hidden hover:border-blue-500/20 transition-all duration-300"
    >
      {/* Subtle gradient bg on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 80% 20%, ${color}10, transparent 60%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</span>
          {Icon && (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold font-clash-display text-text-primary tabular-nums">
            <AnimatedNumber value={typeof value === 'number' ? value : parseInt(value) || 0} />
          </span>
          {suffix && <span className="text-lg font-semibold text-text-secondary">{suffix}</span>}
        </div>
      </div>
    </motion.div>
  );
}
