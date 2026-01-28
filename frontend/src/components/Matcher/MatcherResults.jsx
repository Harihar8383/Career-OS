import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import JdMatcherHeader from './Report/JdMatcherHeader';
import SectionBreakdown from './Report/SectionBreakdown';
import KeywordGapReport from './Report/KeywordGapReport';
import ActionableTodoList from './Report/ActionableTodoList';
import BulletFeedback from './Report/BulletFeedback';
import confetti from 'canvas-confetti';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../ui/Toast';

export const MatcherResults = ({ results, onReset }) => {
  const containerRef = useRef(null);
  const { getToken } = useAuth();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToTracker = async () => {
    if (isSaved || isSaving) return;

    setIsSaving(true);
    try {
      const token = await getToken();
      const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

      const jobData = {
        title: results.jd_summary?.job_title || 'Job from JD Matcher',
        company: results.jd_summary?.company || 'Unknown',
        location: results.jd_summary?.location || '',
        salary: results.jd_summary?.salary_range || '',
        jobType: 'Full-time',
        description: results.jd_summary?.description || '',
        applyLink: '',
        source: 'matcher',
        matchScore: results.match_score || 0,
        stage: 'saved',
        priority: results.match_score >= 80 ? 'high' : results.match_score >= 60 ? 'medium' : 'low'
      };

      const response = await fetch(`${API_URL}/api/tracker/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      });

      if (!response.ok) {
        throw new Error('Failed to save job');
      }

      setIsSaved(true);
      toast.success('Job saved to tracker!');
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

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

      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-4 pt-12">
        {/* Save to Tracker Button */}
        <button
          onClick={handleSaveToTracker}
          disabled={isSaved || isSaving}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all duration-300 font-bold border shadow-lg backdrop-blur-sm ${isSaved
            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-default'
            : 'bg-bg-card hover:bg-blue-500/10 text-text-primary border-border-primary hover:border-blue-500/30 hover:scale-105'
            } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
        >
          {isSaved ? (
            <>
              <BookmarkCheck size={20} className="animate-pulse" />
              Saved to Tracker
            </>
          ) : (
            <>
              <Bookmark size={20} />
              Save to Tracker
            </>
          )}
        </button>

        {/* Start New Analysis Button */}
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