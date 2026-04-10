import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

const ScoreGauge = React.memo(({ score = 0 }) => {
  const safeScore = Math.min(Math.max(score, 0), 100);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Motion values for counting up
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  // SVG Size Definitions
  const width = 300;
  const height = 160;
  const strokeWidth = 28;
  const radius = 120;
  const arcLength = Math.PI * radius;

  useEffect(() => {
    // Animate score from 0 to safeScore over 1.5s
    const controls = animate(count, safeScore, {
      duration: 1.5,
      ease: "easeOut",
      onComplete: () => setHasAnimated(true)
    });
    return () => controls.stop();
  }, [safeScore, count]);

  // Dash Offset mapping
  const dashOffset = arcLength - (arcLength * (safeScore / 100));

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative flex flex-col items-center">

        {/* SVG Container */}
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-danger)" />
              <stop offset="50%" stopColor="var(--color-warning)" />
              <stop offset="100%" stopColor="var(--color-success)" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <path
            d={`M ${width / 2 - radius} ${height - 10} A ${radius} ${radius} 0 0 1 ${width / 2 + radius} ${height - 10}`}
            fill="none"
            stroke="var(--color-surface-border-strong)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          <motion.path
            d={`M ${width / 2 - radius} ${height - 10} A ${radius} ${radius} 0 0 1 ${width / 2 + radius} ${height - 10}`}
            fill="none"
            stroke="url(#score-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: arcLength }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeDasharray={arcLength}
            className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        </svg>

        {/* Score Text Overlay */}
        <div className="absolute bottom-0 text-center transform translate-y-2">
          <p className="text-text-mid text-sm font-bold uppercase tracking-widest mb-1">Match Score</p>
          <div className="flex items-end justify-center">
            <motion.span className="text-7xl font-clash-display font-bold dark:text-text-high drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]">
              {rounded}
            </motion.span>
            <span className="text-4xl font-clash-display font-bold dark:text-text-high pb-1 ml-1">%</span>
          </div>
        </div>

      </div>
    </div>
  );
});

export default ScoreGauge;
