import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import JdMatcherHeader from './Report/JdMatcherHeader';
import SectionBreakdown from './Report/SectionBreakdown';
import KeywordGapReport from './Report/KeywordGapReport';
import ActionableTodoList from './Report/ActionableTodoList';
import BulletFeedback from './Report/BulletFeedback';
import confetti from 'canvas-confetti';

export const MatcherResults = ({ results, onReset }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Only fire confetti if score is high (e.g., >= 80)
    if (results && results.match_score >= 80) {
      const end = Date.now() + 2 * 1000; // 2 seconds
      const colors = [
        "#2934FF", // Design System Blue

        "#ffffff"
      ];
      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        });

        requestAnimationFrame(frame);
      };

      frame();
    }
  }, [results]);

  if (!results) return null;

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto px-6 py-8 pb-24 space-y-12 bg-gradient-modern-light rounded-3xl border border-border-secondary shadow-sm dark:shadow-none dark:border-none dark:bg-transparent transition-all duration-300">

      {/* 1. Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <JdMatcherHeader data={results} />
      </motion.div>

      {/* 2. Section Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <SectionBreakdown sections={results.sections} />
      </motion.div>

      {/* 3. Keyword Gap Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <KeywordGapReport data={results.keyword_gap} />
      </motion.div>

      {/* 4. Actionable To-Do List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
      >
        <ActionableTodoList data={results.actionable_todos} />
      </motion.div>

      {/* 5. Bullet Point Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
      >
        <BulletFeedback bullets={results.bullet_feedback} />
      </motion.div>

      {/* Reset Button */}
      <div className="flex justify-center pt-12">
        <button
          onClick={onReset}
          className="px-8 py-3.5 bg-bg-card hover:bg-bg-tertiary text-text-primary rounded-xl transition-all duration-300 font-bold border border-border-primary hover:border-border-strong hover:scale-105 shadow-lg backdrop-blur-sm"
        >
          Start New Analysis
        </button>
      </div>

    </div>
  );
};