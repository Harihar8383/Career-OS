// frontend/src/components/Dashboard/RecentAnalyses.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { FileSearch, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getScoreColor = (score) => {
  if (score >= 80) return 'bg-green-500/15 text-green-400 border-green-500/30';
  if (score >= 60) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
};

export default function RecentAnalyses({ analyses = [] }) {
  const navigate = useNavigate();

  if (analyses.length === 0) {
    return (
      <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col items-center justify-center text-text-secondary">
        <FileSearch className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No analyses yet</p>
        <p className="text-xs mt-1 opacity-60">Run a JD Match to get started</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-clash-display font-medium text-text-primary">Recent Analyses</h3>
        <button
          onClick={() => navigate('/dashboard/matcher')}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
        >
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-2.5">
        {analyses.map((a, i) => (
          <motion.div
            key={a.runId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/dashboard/matcher?run=${a.runId}`)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-bg-dark/50 cursor-pointer transition-colors group"
          >
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-sm font-medium text-text-primary truncate group-hover:text-blue-400 transition-colors">
                {a.jobTitle}
              </p>
              <p className="text-xs text-text-secondary truncate">{a.company} · {new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border tabular-nums ${getScoreColor(a.score)}`}>
              {a.score}%
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
