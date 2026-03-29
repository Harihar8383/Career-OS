import React from 'react';
import { motion } from 'framer-motion';

export const AnalyticsCard = ({ title, value, icon: Icon, trend, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-bg-dark/50 border border-border-primary rounded-2xl p-6 backdrop-blur-md hover:border-border-strong transition-all relative overflow-hidden group"
    >
      {/* Background glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <Icon className="w-6 h-6 text-blue-400" />
          </div>
          {trend && (
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${trend.isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </div>
          )}
        </div>
        
        <h3 className="text-text-secondary text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-clash-display font-semibold text-text-primary">
            {value}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
