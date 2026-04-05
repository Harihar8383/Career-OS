// frontend/src/components/Dashboard/PipelineFunnel.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Send, Phone, Users, Award, CheckCircle, XCircle } from 'lucide-react';

const STAGES = [
  { key: 'saved', label: 'Saved', icon: Briefcase, color: '#6b7280' },
  { key: 'applied', label: 'Applied', icon: Send, color: '#3b82f6' },
  { key: 'screening', label: 'Screening', icon: Phone, color: '#6366f1' },
  { key: 'interview', label: 'Interview', icon: Users, color: '#8b5cf6' },
  { key: 'offer', label: 'Offer', icon: Award, color: '#eab308' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle, color: '#22c55e' },
];

export default function PipelineFunnel({ pipeline = {} }) {
  const maxCount = Math.max(1, ...STAGES.map(s => pipeline[s.key] || 0));
  const rejectedCount = pipeline.rejected || 0;

  // Conversion rates
  const saved = pipeline.saved || 0;
  const applied = pipeline.applied || 0;
  const interview = pipeline.interview || 0;
  const savedToApplied = saved > 0 ? Math.round((applied / saved) * 100) : 0;
  const appliedToInterview = applied > 0 ? Math.round((interview / applied) * 100) : 0;

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full">
      <h3 className="text-lg font-clash-display font-medium text-text-primary mb-6">Application Pipeline</h3>

      <div className="space-y-3">
        {STAGES.map((stage, i) => {
          const count = pipeline[stage.key] || 0;
          const widthPercent = Math.max(count > 0 ? 4 : 0, (count / maxCount) * 100);
          const Icon = stage.icon;
          return (
            <div key={stage.key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon className="w-4 h-4" style={{ color: stage.color }} />
                  <span className="font-medium">{stage.label}</span>
                </div>
                <span className="text-sm font-semibold text-text-primary tabular-nums">{count}</span>
              </div>
              <div className="h-3 w-full bg-bg-dark rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: stage.color, opacity: 0.85 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rejected  */}
      {rejectedCount > 0 && (
        <div className="mt-4 pt-4 border-t border-border-primary flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span>Rejected</span>
          </div>
          <span className="font-semibold text-red-400">{rejectedCount}</span>
        </div>
      )}

      {/* Conversion rates */}
      <div className="mt-5 pt-4 border-t border-border-primary grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-xs text-text-secondary">Saved → Applied</p>
          <p className="text-lg font-bold text-text-primary">{savedToApplied}%</p>
        </div>
        <div>
          <p className="text-xs text-text-secondary">Applied → Interview</p>
          <p className="text-lg font-bold text-text-primary">{appliedToInterview}%</p>
        </div>
      </div>
    </div>
  );
}
