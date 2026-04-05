// frontend/src/components/Dashboard/ActionItemsFeed.jsx
import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Bell, AlertTriangle, Clock,
  ArrowUpRight, CheckCircle2, MoreHorizontal
} from 'lucide-react';

const URGENCY_CONFIG = {
  today: { label: 'Today', color: 'text-rose-500', bg: 'bg-rose-500/10', glow: 'bg-rose-500/20', border: 'border-rose-500/20', icon: AlertTriangle },
  tomorrow: { label: 'Tomorrow', color: 'text-amber-500', bg: 'bg-amber-500/10', glow: 'bg-amber-500/20', border: 'border-amber-500/20', icon: Clock },
  thisWeek: { label: 'This Week', color: 'text-blue-500', bg: 'bg-blue-500/10', glow: 'bg-blue-500/20', border: 'border-blue-500/20', icon: Calendar },
  stale: { label: 'Stale', color: 'text-orange-500', bg: 'bg-orange-500/10', glow: 'bg-orange-500/20', border: 'border-orange-500/20', icon: AlertTriangle },
  later: { label: 'Later', color: 'text-gray-400', bg: 'bg-gray-500/10', glow: 'bg-gray-500/20', border: 'border-border-primary', icon: Bell },
};

const TYPE_ICON = {
  interview: Calendar,
  reminder: Bell,
  stale: AlertTriangle,
};

// Formats date nicely (e.g., "Apr 7")
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Fail gracefully if date is invalid
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Calculates the true urgency based on the actual date difference safely
const getDerivedUrgency = (dateString, fallbackUrgency) => {
  if (!dateString) return fallbackUrgency || 'later';

  const itemDate = new Date(dateString);
  if (isNaN(itemDate.getTime())) return fallbackUrgency || 'later'; // Safe fallback for invalid strings

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  itemDate.setHours(0, 0, 0, 0);

  const diffTime = itemDate.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'stale';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays > 1 && diffDays <= 7) return 'thisWeek';
  return 'later';
};

export default function ActionItemsFeed({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col relative overflow-hidden">
        <h3 className="text-xl font-clash-display font-semibold text-text-primary tracking-tight mb-4">
          Action Required
        </h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
            <div className="relative w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 transform -rotate-6">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
          </div>
          <p className="text-base font-semibold text-text-primary">You're all caught up!</p>
          <p className="text-xs text-text-secondary mt-1.5 max-w-[200px] leading-relaxed">
            No pending actions. Time to relax or hunt for more opportunities.
          </p>
        </div>
      </div>
    );
  }

  // BULLETPROOF SORTING LOGIC
  const processedItems = items.map(item => ({
    ...item,
    dynamicUrgency: getDerivedUrgency(item.date, item.urgency)
  })).sort((a, b) => {
    const weight = { stale: 0, today: 1, tomorrow: 2, thisWeek: 3, later: 4 };

    const weightA = weight[a.dynamicUrgency] ?? 5;
    const weightB = weight[b.dynamicUrgency] ?? 5;

    // 1. Primary Sort: Urgency Tier
    if (weightA !== weightB) {
      return weightA - weightB;
    }

    // 2. Secondary Sort: Chronological Date (Safe against NaN)
    const timeA = a.date ? new Date(a.date).getTime() : Infinity;
    const timeB = b.date ? new Date(b.date).getTime() : Infinity;

    const safeTimeA = isNaN(timeA) ? Infinity : timeA;
    const safeTimeB = isNaN(timeB) ? Infinity : timeB;

    // If both are Infinity (no dates), they are equal. Do NOT subtract them or you get NaN.
    if (safeTimeA === safeTimeB) return 0;

    return safeTimeA - safeTimeB;
  });

  const topUrgencyTier = processedItems[0].dynamicUrgency;
  const featuredItems = processedItems.filter(item => item.dynamicUrgency === topUrgencyTier);
  const queueItems = processedItems.filter(item => item.dynamicUrgency !== topUrgencyTier);

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-2xl font-clash-display font-medium text-text-primary ">
          Action Required
        </h3>
        <div className="bg-bg-dark text-text-secondary px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border border-border-primary">
          {items.length} Pending
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
        <div className="space-y-3">
          {featuredItems.map((featuredItem, idx) => {
            const featuredConfig = URGENCY_CONFIG[featuredItem.dynamicUrgency] || URGENCY_CONFIG.later;
            const FeaturedIcon = TYPE_ICON[featuredItem.type] || featuredConfig.icon;

            return (
              <motion.div
                key={`featured-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`group relative overflow-hidden rounded-2xl border ${featuredConfig.border} bg-bg-dark/40 p-4 transition-all duration-300 hover:bg-bg-dark/60 cursor-pointer`}
              >
                <div className={`absolute -right-8 -top-8 w-32 h-32 blur-3xl rounded-full ${featuredConfig.glow} opacity-40 transition-opacity group-hover:opacity-60`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${featuredConfig.bg}`}>
                        <FeaturedIcon className={`w-3.5 h-3.5 ${featuredConfig.color}`} />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${featuredConfig.color}`}>
                        {featuredConfig.label}
                      </span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-text-secondary opacity-50 hover:opacity-100 transition-opacity" />
                  </div>

                  <h4 className="text-base font-semibold text-text-primary mb-1 pr-4">
                    {featuredItem.title}
                  </h4>

                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-xs text-text-secondary line-clamp-1">
                      {featuredItem.subtitle}
                    </p>
                    {featuredItem.date && formatDate(featuredItem.date) && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border-primary" />
                        <span className="text-xs font-medium text-text-primary/70 whitespace-nowrap">
                          {formatDate(featuredItem.date)}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-3 border-t border-border-primary/50">
                    <span className="text-[11px] font-medium text-text-secondary">Up Next</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {queueItems.length > 0 && (
          <div className="mt-5">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mb-3 px-1">
              On The Radar
            </h5>
            <div className="space-y-1">
              {queueItems.map((item, i) => {
                const config = URGENCY_CONFIG[item.dynamicUrgency] || URGENCY_CONFIG.later;

                return (
                  <motion.div
                    key={`queue-${i}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 + 0.1 }}
                    className="group flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-border-primary hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.color.replace('text-', '') }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate transition-colors group-hover:text-white">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-text-secondary">
                          <span className="truncate">{item.subtitle}</span>
                          {item.date && formatDate(item.date) && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-text-secondary/40 flex-shrink-0" />
                              <span className="whitespace-nowrap font-semibold text-text-primary/70">
                                {formatDate(item.date)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pl-3">
                      <span className={`text-[9px] font-bold uppercase tracking-wider whitespace-nowrap ${config.color} opacity-80`}>
                        {config.label}
                      </span>
                      <div className="w-6 h-6 rounded-full bg-border-primary/20 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <ArrowUpRight className="w-3 h-3 text-text-primary" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}