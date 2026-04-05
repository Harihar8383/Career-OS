// frontend/src/components/Dashboard/ActionItemsFeed.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Bell, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

const URGENCY_CONFIG = {
  today:    { label: 'Today',    dotColor: 'bg-red-500',    borderColor: 'border-red-500/30',  bgColor: 'bg-red-500/5' },
  tomorrow: { label: 'Tomorrow', dotColor: 'bg-yellow-500', borderColor: 'border-yellow-500/30', bgColor: 'bg-yellow-500/5' },
  thisWeek: { label: 'This Week',dotColor: 'bg-blue-500',   borderColor: 'border-blue-500/30', bgColor: 'bg-blue-500/5' },
  stale:    { label: 'Stale',    dotColor: 'bg-orange-500', borderColor: 'border-orange-500/30',bgColor: 'bg-orange-500/5' },
  later:    { label: 'Later',    dotColor: 'bg-gray-500',   borderColor: 'border-gray-500/30', bgColor: 'bg-gray-500/5' },
};

const TYPE_ICON = {
  interview: Calendar,
  reminder: Bell,
  stale: AlertTriangle,
};

export default function ActionItemsFeed({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col items-center justify-center text-text-secondary">
        <Clock className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No action items right now</p>
        <p className="text-xs mt-1 opacity-60">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full overflow-y-auto custom-scrollbar">
      <h3 className="text-lg font-clash-display font-medium text-text-primary mb-4">Action Required</h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const config = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.later;
          const Icon = TYPE_ICON[item.type] || Bell;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${config.borderColor} ${config.bgColor} transition-colors hover:brightness-110 cursor-default`}
            >
              <div className="flex-shrink-0 mt-0.5">
                <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">{config.label}</span>
                  <Icon className="w-3 h-3 text-text-secondary" />
                </div>
                <p className="text-sm font-medium text-text-primary truncate">{item.title}</p>
                <p className="text-xs text-text-secondary truncate mt-0.5">{item.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
