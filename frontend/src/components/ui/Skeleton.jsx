import React from 'react';

export const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={`relative overflow-hidden bg-[#1E1E24]/50 border border-white/5 rounded-md ${className || ''}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-[#2934FF]/20 to-transparent w-full" />
    </div>
  );
};
