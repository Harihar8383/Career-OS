import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Send, Users, Phone, Award, XCircle, CheckCircle } from 'lucide-react';

const STAGE_CONFIG = {
  saved: { label: 'Saved', color: 'bg-gray-500', icon: Briefcase },
  applied: { label: 'Applied', color: 'bg-blue-500', icon: Send },
  screening: { label: 'Screening', color: 'bg-indigo-500', icon: Phone },
  interview: { label: 'Interview', color: 'bg-purple-500', icon: Users },
  offer: { label: 'Offer', color: 'bg-yellow-500', icon: Award },
  accepted: { label: 'Accepted', color: 'bg-green-500', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-500', icon: XCircle }
};

export const PipelineChart = ({ countsByStage, totalJobs }) => {
  // If no jobs, provide a better visual
  if (!totalJobs) {
    return (
      <div className="bg-bg-dark/50 border border-border-primary rounded-2xl p-6 backdrop-blur-md h-full flex flex-col justify-center items-center text-text-secondary">
        <Briefcase className="w-12 h-12 mb-4 opacity-50" />
        <p>No job data available in pipeline.</p>
      </div>
    );
  }

  const stages = ['saved', 'applied', 'screening', 'interview', 'offer', 'accepted', 'rejected'];
  
  // Calculate max count for relative bar widths
  const maxCount = Math.max(...Object.values(countsByStage));

  return (
    <div className="bg-bg-dark/50 border border-border-primary rounded-2xl p-6 backdrop-blur-md h-full">
      <h3 className="text-lg font-clash-display text-text-primary mb-6">Application Pipeline</h3>
      
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const count = countsByStage[stage] || 0;
          const config = STAGE_CONFIG[stage];
          const Icon = config.icon;
          
          // Width percentage for the bar (min 2% so it's always visible if > 0)
          const widthPercent = maxCount === 0 ? 0 : Math.max(count > 0 ? 2 : 0, (count / maxCount) * 100);

          return (
            <div key={stage} className="relative group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Icon className="w-4 h-4" />
                  <span>{config.label}</span>
                </div>
                <span className="text-sm font-medium text-text-primary">{count}</span>
              </div>
              
              <div className="h-2 w-full bg-bg-dark rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${config.color} shadow-[0_0_10px_currentColor] opacity-80 group-hover:opacity-100 transition-opacity`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
