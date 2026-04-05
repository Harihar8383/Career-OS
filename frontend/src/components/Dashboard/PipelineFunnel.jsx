// frontend/src/components/Dashboard/PipelineFunnel.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase, Send, Phone, Users, Award,
  CheckCircle, XCircle, TrendingUp, ArrowDown
} from 'lucide-react';

const STAGES = [
  { key: 'saved', label: 'Saved', icon: Briefcase, color: '#6b7280', description: 'Leads & saved jobs' },
  { key: 'applied', label: 'Applied', icon: Send, color: '#3b82f6', description: 'Applications sent' },
  { key: 'screening', label: 'Screening', icon: Phone, color: '#6366f1', description: 'Initial HR calls' },
  { key: 'interview', label: 'Interview', icon: Users, color: '#8b5cf6', description: 'Technical & cultural' },
  { key: 'offer', label: 'Offer', icon: Award, color: '#eab308', description: 'Contracts received' },
  { key: 'accepted', label: 'Accepted', icon: CheckCircle, color: '#22c55e', description: 'Hired' },
];

export default function PipelineFunnel({ pipeline = {} }) {
  const [hoveredStage, setHoveredStage] = useState(null);

  const counts = STAGES.map(s => pipeline[s.key] || 0);
  const maxCount = Math.max(1, ...counts);
  const rejectedCount = pipeline.rejected || 0;

  const getConversion = (current, next) => {
    const c = pipeline[current] || 0;
    const n = pipeline[next] || 0;
    return c > 0 ? Math.round((n / c) * 100) : 0;
  };

  return (
    <div className="bg-bg-card border border-border-primary rounded-2xl p-6 h-full flex flex-col shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-2xl font-clash-display font-medium text-text-primary leading-none">
            Hiring Pipeline
          </h3>
          <p className="text-xs text-text-secondary mt-1">Real-time application journey</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider">
          <TrendingUp className="w-3 h-3" />
          Active Flow
        </div>
      </div>

      {/* Timeline Wrapper - Mathematically aligned (pl-9 = 36px offset) */}
      <div className="flex-1 relative pl-9 pb-2">
        {/* Continuous Background Track Line - Center is exactly 18px from left edge */}
        <div className="absolute left-[17px] top-3 bottom-6 w-[2px] bg-border-primary/60 rounded-full" />

        {/* Increased vertical gaps for breathing room (space-y-5) */}
        <div className="space-y-5">
          {STAGES.map((stage, i) => {
            const count = pipeline[stage.key] || 0;
            const widthPercent = Math.max(count > 0 ? 2 : 0, (count / maxCount) * 100);
            const Icon = stage.icon;
            const isHovered = hoveredStage === stage.key;
            const isOtherHovered = hoveredStage !== null && !isHovered;

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                key={stage.key}
                className={`relative transition-all duration-300 ${isOtherHovered ? 'opacity-40 grayscale-[30%]' : 'opacity-100'}`}
                onMouseEnter={() => setHoveredStage(stage.key)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                {/* Timeline Node - w-6 (24px) pushed left by 30px aligns its center perfectly at 18px */}
                <div
                  className="absolute -left-[30px] top-2 w-6 h-6 rounded-full border-[2px] border-bg-card flex items-center justify-center z-10 shadow-sm transition-transform duration-300 hover:scale-110"
                  style={{ backgroundColor: stage.color }}
                >
                  <Icon className="w-3 h-3 text-white" />
                </div>

                {/* Micro-conversion Pill - Centered over the track */}
                {i < STAGES.length - 1 && (
                  <div className="absolute -left-[36px] -bottom-[18px] z-20 bg-bg-card border border-border-primary text-text-secondary text-[8px] font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center gap-0.5 shadow-sm min-w-[36px]">
                    <ArrowDown className="w-2 h-2" />
                    {getConversion(stage.key, STAGES[i + 1].key)}%
                  </div>
                )}

                {/* Stage Card */}
                <div className="group bg-black/[0.02] dark:bg-white/[0.02] border border-border-primary hover:border-border-secondary rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="py-2.5 px-3.5 flex items-center justify-between">
                    <div className="transition-transform duration-300 group-hover:translate-x-1">
                      <h4 className="text-sm font-semibold text-text-primary leading-tight transition-colors">
                        {stage.label}
                      </h4>
                      <p className="text-[10px] text-text-secondary font-medium leading-tight mt-0.5">
                        {stage.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-text-primary tabular-nums tracking-tight">
                        {count}
                      </span>
                    </div>
                  </div>

                  {/* Integrated Progress Bar */}
                  <div className="h-1 w-full bg-black/10 dark:bg-white/10 relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercent}%` }}
                      transition={{ duration: 1, delay: i * 0.1 + 0.2, ease: "easeOut" }}
                      className="absolute top-0 left-0 bottom-0 rounded-r-full"
                      style={{
                        backgroundColor: stage.color,
                        boxShadow: `0 0 8px ${stage.color}30`
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Drop-off / Rejected State Branch */}
        {rejectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="relative mt-5"
          >
            {/* Branching timeline line - Exactly aligned to track center (18px) */}
            <div className="absolute -left-[18px] top-[-18px] w-[20px] h-[28px] border-l-[2px] border-b-[2px] border-red-500/30 rounded-bl-xl z-0" />

            <div className="ml-0 flex items-center justify-between p-2.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 dark:border-red-500/20 rounded-xl relative z-10">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400">
                <div className="p-1.5 bg-red-500/10 dark:bg-red-500/20 rounded-lg">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-xs font-bold leading-none mb-0.5">Pipeline Drop-off</p>
                  <p className="text-[10px] font-medium opacity-80 leading-none">Rejected/Withdrawn</p>
                </div>
              </div>
              <span className="font-bold text-base text-red-600 dark:text-red-400 tabular-nums">{rejectedCount}</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}