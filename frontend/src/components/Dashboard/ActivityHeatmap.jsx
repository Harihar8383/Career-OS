// frontend/src/components/Dashboard/ActivityHeatmap.jsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

/**
 * GitHub-style activity heatmap.
 * Shows the last 20 weeks of job search activity.
 */
export default function ActivityHeatmap({ data = [] }) {
  const { grid, monthLabels, maxCount, totalActions } = useMemo(() => {
    // Build a lookup map from date strings
    const countMap = {};
    data.forEach(d => { countMap[d.date] = d.count; });

    const today = new Date();
    const weeksToShow = 20;
    const totalDays = weeksToShow * 7;

    // Start on the most recent Monday that completes a week
    const dayOfWeek = today.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() - mondayOffset + 6); // end on Sunday of current week

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Build grid: array of weeks, each week = array of 7 days
    const grid = [];
    const monthLabels = [];
    let currentDate = new Date(startDate);
    let week = [];
    let lastMonth = -1;
    let total = 0;
    let max = 0;

    for (let i = 0; i < totalDays; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = countMap[dateStr] || 0;
      const isFuture = currentDate > today;
      total += count;
      if (count > max) max = count;

      // Track month labels
      const month = currentDate.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTHS[month], weekIndex: Math.floor(i / 7) });
        lastMonth = month;
      }

      week.push({ date: dateStr, count, isFuture });

      if (week.length === 7) {
        grid.push(week);
        week = [];
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (week.length > 0) grid.push(week);

    return { grid, monthLabels, maxCount: max, totalActions: total };
  }, [data]);

  const getIntensity = (count) => {
    if (count === 0) return 'bg-text-primary/5';
    if (maxCount <= 1) return 'bg-blue-500/70';
    const ratio = count / maxCount;
    if (ratio > 0.75) return 'bg-blue-500/90';
    if (ratio > 0.5) return 'bg-blue-500/60';
    if (ratio > 0.25) return 'bg-blue-500/40';
    return 'bg-blue-500/20';
  };

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-clash-display font-medium text-text-primary">Activity Heatmap</h3>
        <span className="text-xs text-text-secondary">{totalActions} actions in {grid.length} weeks</span>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <div className="inline-flex flex-col gap-0 min-w-fit">
          {/* Month labels */}
          <div className="flex items-end mb-1 ml-8">
            {monthLabels.map((m, i) => (
              <span
                key={i}
                className="text-[10px] text-text-secondary"
                style={{ position: 'relative', left: `${m.weekIndex * 16}px` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0">
            {/* Day labels */}
            <div className="flex flex-col gap-[3px] mr-2 mt-0">
              {DAYS.map((d, i) => (
                <span key={i} className="text-[9px] text-text-secondary h-[13px] leading-[13px] w-5 text-right">
                  {d}
                </span>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[3px]">
              {grid.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => (
                    <motion.div
                      key={day.date}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.003, duration: 0.15 }}
                      title={`${day.date}: ${day.count} action${day.count !== 1 ? 's' : ''}`}
                      className={`w-[13px] h-[13px] rounded-sm ${
                        day.isFuture ? 'bg-transparent' : getIntensity(day.count)
                      } hover:ring-1 hover:ring-blue-400/50 transition-all cursor-default`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 mt-3 ml-8">
            <span className="text-[10px] text-text-secondary mr-1">Less</span>
            <div className="w-[11px] h-[11px] rounded-sm bg-text-primary/5" />
            <div className="w-[11px] h-[11px] rounded-sm bg-blue-500/20" />
            <div className="w-[11px] h-[11px] rounded-sm bg-blue-500/40" />
            <div className="w-[11px] h-[11px] rounded-sm bg-blue-500/60" />
            <div className="w-[11px] h-[11px] rounded-sm bg-blue-500/90" />
            <span className="text-[10px] text-text-secondary ml-1">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
