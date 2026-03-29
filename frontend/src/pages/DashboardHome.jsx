import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { AnalyticsCard } from '../components/Dashboard/AnalyticsCard';
import { PipelineChart } from '../components/Dashboard/PipelineChart';
import { UpcomingInterviews } from '../components/Dashboard/UpcomingInterviews';
import { Briefcase, Activity, CheckCircle, Target, TrendingUp } from 'lucide-react';

export default function DashboardHome() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";
        const response = await fetch(`${API_URL}/api/tracker/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const result = await response.json();
          setAnalytics(result.data);
        }
      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [getToken]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Fallback defaults if empty
  const data = analytics || {
    totalJobs: 0,
    countsByStage: {},
    conversionRate: 0,
    upcomingInterviews: [],
    upcomingReminders: []
  };

  const appliedOrFurther = Object.entries(data.countsByStage || {}).reduce((sum, [stage, count]) => {
    if (['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected'].includes(stage)) {
      return sum + count;
    }
    return sum;
  }, 0);

  const interviewOrFurther = Object.entries(data.countsByStage || {}).reduce((sum, [stage, count]) => {
    if (['interview', 'offer', 'accepted'].includes(stage)) {
      return sum + count;
    }
    return sum;
  }, 0);
  
  // Use length of explicitly tracked interviews from array since countsByStage only looks at the CURRENT stage
  // Actually the controller calculates it accurately and sets totalJobs? 
  // Wait, I can just use the controller's logic directly if I want, but appliedOrFurther is fine as a heuristic here if needed.
  // Actually the controller returned countsByStage, and conversionRate. I'll just rely on `data.conversionRate`.

  const firstName = user?.firstName || 'Career Hacker';

  return (
    <div className="max-w-7xl mx-auto custom-scrollbar">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-clash-display font-medium text-text-primary mb-2">
          Welcome back, {firstName} <span className="text-2xl">👋</span>
        </h1>
        <p className="text-text-secondary font-dm-sans">
          Here's what's happening with your job applications today.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnalyticsCard 
          title="Total Jobs Tracked" 
          value={data.totalJobs} 
          icon={Briefcase} 
          delay={0.1}
        />
        <AnalyticsCard 
          title="Active Applications" 
          value={appliedOrFurther} 
          icon={Activity} 
          delay={0.2} 
        />
        <AnalyticsCard 
          title="Interviews Reached" 
          value={interviewOrFurther} 
          icon={Target} 
          delay={0.3} 
        />
        <AnalyticsCard 
          title="Interview Rate" 
          value={`${data.conversionRate}%`} 
          icon={TrendingUp} 
          delay={0.4} 
          trend={parseFloat(data.conversionRate) > 10 ? { value: 'Good', isPositive: true } : null}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-10">
        <div className="col-span-1 lg:col-span-2">
          <PipelineChart countsByStage={data.countsByStage || {}} totalJobs={data.totalJobs} />
        </div>
        <div className="col-span-1">
          <UpcomingInterviews 
            interviews={data.upcomingInterviews} 
            reminders={data.upcomingReminders} 
          />
        </div>
      </div>
    </div>
  );
}
