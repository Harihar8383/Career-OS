// frontend/src/pages/DashboardHome.jsx
import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Briefcase, Activity, CalendarCheck, Award, Target, FileSearch } from 'lucide-react';

// Dashboard Components
import KPICard from '../components/Dashboard/KPICard';
import PipelineFunnel from '../components/Dashboard/PipelineFunnel';
import ActionItemsFeed from '../components/Dashboard/ActionItemsFeed';
import SkillGapRadar from '../components/Dashboard/SkillGapRadar';
import MatchScoreTrend from '../components/Dashboard/MatchScoreTrend';
import RecentAnalyses from '../components/Dashboard/RecentAnalyses';
import HunterInsights from '../components/Dashboard/HunterInsights';
import TimeInStage from '../components/Dashboard/TimeInStage';
import SourceDistribution from '../components/Dashboard/SourceDistribution';
import ActivityHeatmap from '../components/Dashboard/ActivityHeatmap';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

export default function DashboardHome() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchDashboard = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await fetch(`${API_URL}/api/dashboard/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboard();
    return () => { cancelled = true; };
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">Loading your analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center text-text-secondary">
          <p className="text-lg font-medium mb-2">Couldn't load dashboard</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const d = data || {};
  const kpi = d.kpiCards || {};
  const firstName = user?.firstName || 'Career Hacker';

  return (
    <div className="max-w-7xl mx-auto custom-scrollbar pb-10">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-clash-display font-medium text-text-primary mb-2">
          Welcome back, {firstName} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-text-secondary font-dm-sans">
          Here's your job search overview at a glance.
        </p>
      </motion.div>

      {/* ── Row 1: KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <KPICard title="Total Tracked" value={kpi.totalTracked || 0} icon={Briefcase} color="#3b82f6" delay={0.05} />
        <KPICard title="Active Applied" value={kpi.activeApplications || 0} icon={Activity} color="#6366f1" delay={0.1} />
        <KPICard title="Interviews" value={kpi.interviewsScheduled || 0} icon={CalendarCheck} color="#8b5cf6" delay={0.15} />
        <KPICard title="Offers" value={kpi.offersReceived || 0} icon={Award} color="#eab308" delay={0.2} />
        <KPICard title="Avg Score" value={kpi.avgMatchScore || 0} icon={Target} suffix="%" color="#22c55e" delay={0.25} />
        <KPICard title="JD Analyses" value={kpi.jdAnalysesRun || 0} icon={FileSearch} color="#ec4899" delay={0.3} />
      </div>

      {/* ── Row 2: Pipeline + Action Items ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        <div className="lg:col-span-3">
          <PipelineFunnel pipeline={d.pipeline} />
        </div>
        <div className="lg:col-span-2">
          <ActionItemsFeed items={d.actionItems} />
        </div>
      </div>

      {/* ── Row 3: Skill Gap + Match Score Trend ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SkillGapRadar skillGaps={d.skillGaps} />
        <MatchScoreTrend data={d.matchScoreTrend} />
      </div>

      {/* ── Row 4: Recent Analyses + Hunter Insights ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentAnalyses analyses={d.recentAnalyses} />
        <HunterInsights hunterSummary={d.hunterSummary} topCompanies={d.topCompanies} />
      </div>

      {/* ── Row 5: Time in Stage + Source Distribution ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TimeInStage data={d.timeInStage} />
        <SourceDistribution distribution={d.sourceDistribution} />
      </div>

      {/* ── Row 6: Activity Heatmap (full width) ─────────────────────── */}
      <ActivityHeatmap data={d.activityHeatmap} />
    </div>
  );
}
