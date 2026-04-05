// frontend/src/components/Dashboard/HunterInsights.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Package, Bookmark, Building2, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

/**
 * Combined Hunter Summary (7) + Top Companies (8)
 * Switchable tabs within one component
 */
export default function HunterInsights({ hunterSummary = {}, topCompanies = [] }) {
  const [tab, setTab] = useState('summary');
  const navigate = useNavigate();

  const { totalSessions = 0, totalJobsFound = 0, jobsSaved = 0, latestSession } = hunterSummary;

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-clash-display font-medium text-text-primary">Job Hunter</h3>
        <div className="flex bg-bg-dark rounded-lg p-0.5">
          {[
            { key: 'summary', label: 'Summary' },
            { key: 'companies', label: 'Companies' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${tab === t.key
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {tab === 'summary' ? (
            <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { icon: Search, label: 'Hunts', value: totalSessions },
                  { icon: Package, label: 'Found', value: totalJobsFound },
                  { icon: Bookmark, label: 'Saved', value: jobsSaved },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 bg-bg-dark/50 rounded-xl border border-border-primary">
                    <stat.icon className="w-4 h-4 mx-auto mb-1.5 text-blue-400" />
                    <p className="text-lg font-bold text-text-primary tabular-nums">{stat.value}</p>
                    <p className="text-[10px] text-text-secondary uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Latest Session */}
              {latestSession && (
                <div
                  onClick={() => navigate(`/dashboard/hunter/session/${latestSession.sessionId}`)}
                  className="mt-auto p-3.5 bg-bg-dark/50 rounded-xl border border-border-primary hover:border-blue-500/30 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Latest Hunt</span>
                    <ChevronRight className="w-3.5 h-3.5 text-text-secondary group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-text-primary truncate">
                    {latestSession.criteria?.role || latestSession.criteria?.jobTitles?.[0] || 'Job Hunt'}
                    {latestSession.criteria?.location ? ` in ${Array.isArray(latestSession.criteria.location) ? latestSession.criteria.location[0] : latestSession.criteria.location}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-text-secondary">
                    <Package className="w-3 h-3" />
                    <span>{latestSession.jobCount} results</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(latestSession.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              )}

              {!latestSession && (
                <div className="mt-auto text-center text-text-secondary text-sm p-4">
                  <p>No hunts run yet</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="companies" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {topCompanies.length === 0 ? (
                <div className="text-center text-text-secondary text-sm py-8">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No company data yet</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {topCompanies.map((c, i) => {
                    const maxCount = topCompanies[0]?.count || 1;
                    const widthPercent = Math.max(8, (c.count / maxCount) * 100);
                    return (
                      <div key={c.company} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-primary font-medium truncate">{c.company}</span>
                          <span className="text-xs text-text-secondary tabular-nums ml-2">{c.count}</span>
                        </div>
                        <div className="h-2 w-full bg-bg-dark rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${widthPercent}%` }}
                            transition={{ duration: 0.6, delay: i * 0.06 }}
                            className="h-full rounded-full bg-blue-500/60"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
