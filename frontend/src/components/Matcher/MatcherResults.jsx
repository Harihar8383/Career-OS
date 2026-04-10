import React, { useRef, useEffect, useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import JdMatcherHeader from './Report/JdMatcherHeader';
import { StickyScoreHeader } from './Report/StickyScoreHeader';
import { SectionNavigationRail } from './Report/SectionNavigationRail';
import SectionBreakdown from './Report/SectionBreakdown';
import KeywordGapReport from './Report/KeywordGapReport';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';

// Section 8.2: Lazy-load below-the-fold components
const ActionableTodoList = lazy(() => import('./Report/ActionableTodoList'));
const BulletFeedback     = lazy(() => import('./Report/BulletFeedback'));

export const MatcherResults = ({ results, onReset }) => {
  const containerRef              = useRef(null);
  const headerRef                 = useRef(null);
  const { getToken }              = useAuth();
  const toast                     = useToast();
  
  const [isSaved, setIsSaved]             = useState(false);
  const [isSaving, setIsSaving]           = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  // ── Section 4.3: Sticky Score Header ──
  // Appears when JdMatcherHeader scrolls out of view, disappears when scrolling back
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' }
    );
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [results]);

  // ── Save to Tracker ──
  const handleSaveToTracker = async () => {
    if (isSaved || isSaving) return;

    setIsSaving(true);
    try {
      const token   = await getToken();
      const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

      const jobData = {
        title:       results.jd_summary?.job_title || 'Job from JD Matcher',
        company:     results.jd_summary?.company   || 'Unknown',
        location:    results.jd_summary?.location  || '',
        salary:      results.jd_summary?.salary_range || '',
        jobType:     'Full-time',
        description: results.jdText || results.jd_summary?.description || '',
        applyLink:   '',
        source:      'matcher',
        matchScore:  results.match_score || 0,
        stage:       'saved',
        priority:    results.match_score >= 80 ? 'high' : results.match_score >= 60 ? 'medium' : 'low',
      };

      const response = await fetch(`${API_URL}/api/tracker/jobs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (!response.ok) throw new Error('Failed to save job');
      
      setIsSaved(true);
      toast.success('Job saved to tracker!');
    } catch (error) {
      console.error('Error saving job:', error);
      toast.error('Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Section 8.4: Lazy-import confetti only when score >= 80 ──
  useEffect(() => {
    if (results && results.match_score >= 80) {
      import('canvas-confetti').then((module) => {
        const confetti = module.default;
        const end      = Date.now() + 2000; // 2 seconds
        // Section 8.5: Brand blue + gold confetti (not white on white)
        const colors   = ['#2934FF', '#F59E0B'];
        
        const frame = () => {
          if (Date.now() > end) return;

          confetti({ particleCount: 2, angle: 60,  spread: 55, startVelocity: 60, origin: { x: 0, y: 0.5 }, colors });
          confetti({ particleCount: 2, angle: 120, spread: 55, startVelocity: 60, origin: { x: 1, y: 0.5 }, colors });
          
          requestAnimationFrame(frame);
        };

        frame();
      }).catch(console.error);
    }
  }, [results]);

  if (!results) return null;

  // Section 4.1 viewport: once: true, margin: "-100px" — per spec Section 4.3
  const sectionReveal = {
    initial:     { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport:    { once: true, margin: '-100px' },
  };

  return (
    <>
      {/* ── Sticky Score Header (Section 4.3) ── */}
      <StickyScoreHeader
        score={results.match_score || 0}
        verdict={results.verdict || ''}
        jobTitle={results.jd_summary?.job_title || ''}
        visible={stickyVisible}
      />

      <div
        ref={containerRef}
        className="max-w-7xl mx-auto px-6 py-8 pb-24 space-y-12 bg-gradient-modern-light rounded-3xl border border-surface-border shadow-sm dark:shadow-none dark:border-none dark:bg-transparent transition-all duration-300"
      >
        {/* ── Floating Navigation Rail (Section 4.3.2) ── */}
        <SectionNavigationRail />

        {/* 1. Header */}
        <div id="section-header" ref={headerRef} className="scroll-mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <JdMatcherHeader data={results} />
          </motion.div>
        </div>

        {/* 2. Section Breakdown */}
        <motion.div id="section-breakdown" className="scroll-mt-24" {...sectionReveal} transition={{ delay: 0.1 }}>
          <SectionBreakdown sections={results.sections} />
        </motion.div>

        {/* 3. Keyword Gap Report */}
        <motion.div id="section-keywords" className="scroll-mt-24" {...sectionReveal} transition={{ delay: 0.15 }}>
          <KeywordGapReport data={results.keyword_gap} />
        </motion.div>

        {/* 4. Actionable To-Do List — lazy loaded (Section 8.2) */}
        <motion.div id="section-todos" className="scroll-mt-24" {...sectionReveal} transition={{ delay: 0.2 }}>
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-2xl" />}>
            <ActionableTodoList data={results.actionable_todos} />
          </Suspense>
        </motion.div>

        {/* 5. Bullet Point Feedback — lazy loaded (Section 8.2) */}
        <motion.div id="section-feedback" className="scroll-mt-24" {...sectionReveal} transition={{ delay: 0.25 }}>
          <Suspense fallback={<Skeleton className="h-[300px] w-full rounded-2xl" />}>
            <BulletFeedback bullets={results.bullet_feedback} />
          </Suspense>
        </motion.div>

        {/* ── Action Buttons (Section 6.4: updated CTA copy) ── */}
        <div className="flex justify-center items-center gap-4 pt-4">
          <button
            type="button"
            onClick={handleSaveToTracker}
            disabled={isSaved || isSaving}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-xl transition-all duration-300 font-bold border shadow-lg backdrop-blur-sm ${
              isSaved
                ? 'bg-brand-primary/20 text-[#8AA5FF] border-brand-primary/30 cursor-default'
                : 'bg-surface-card hover:bg-brand-primary/10 text-text-high border-surface-border hover:border-brand-primary/30 hover:scale-105'
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
                Save This Job
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-8 py-3.5 bg-surface-card hover:bg-surface-overlay text-text-high rounded-xl transition-all duration-300 font-bold border border-surface-border hover:border-surface-border-strong hover:scale-105 shadow-lg backdrop-blur-sm"
          >
            Run Another Match
          </button>
        </div>
      </div>
    </>
  );
};