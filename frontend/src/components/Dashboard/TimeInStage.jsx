// frontend/src/components/Dashboard/TimeInStage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle } from 'lucide-react';

const TRANSITION_COLORS = {
  'saved→applied': '#6b7280',
  'applied→screening': '#3b82f6',
  'screening→interview': '#6366f1',
  'interview→offer': '#8b5cf6',
  'offer→accepted': '#22c55e',
};

export default function TimeInStage({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col items-center justify-center text-text-secondary">
        <Clock className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No stage transition data</p>
        <p className="text-xs mt-1 opacity-60">Move jobs between stages to build this report</p>
      </div>
    );
  }

  const maxDays = Math.max(1, ...data.map(d => d.avgDays));
  const bottleneck = data.reduce((prev, curr) => curr.avgDays > prev.avgDays ? curr : prev, data[0]);

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full">
      <h3 className="text-lg font-clash-display font-medium text-text-primary mb-5">Time in Stage</h3>

      <div className="space-y-3.5">
        {data.map((d, i) => {
          const widthPercent = Math.max(8, (d.avgDays / maxDays) * 100);
          const color = TRANSITION_COLORS[d.transition] || '#6b7280';
          const isBottleneck = d === bottleneck && data.length > 1;
          const [from, to] = d.transition.split('→');

          return (
            <div key={d.transition}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-secondary">
                  <span className="capitalize">{from}</span>
                  <span className="text-text-secondary/50 mx-1">→</span>
                  <span className="capitalize">{to}</span>
                </span>
                <span className="text-sm font-semibold text-text-primary tabular-nums">{d.avgDays}d</span>
              </div>
              <div className="h-2.5 w-full bg-bg-dark rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.7, delay: i * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: isBottleneck ? '#f97316' : color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.length > 1 && (
        <div className="mt-4 pt-3 border-t border-border-primary">
          <div className="flex items-center gap-2 text-xs text-orange-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bottleneck: <b className="capitalize">{bottleneck.transition.replace('→', ' → ')}</b> ({bottleneck.avgDays}d avg)</span>
          </div>
        </div>
      )}
    </div>
  );
}
