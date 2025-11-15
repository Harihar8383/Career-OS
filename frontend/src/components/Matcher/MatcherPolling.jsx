// frontend/src/components/Matcher/MatcherPolling.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

export const MatcherPolling = ({ statusMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center h-96 max-w-2xl mx-auto text-center">
      <Loader2 className="text-blue-400 animate-spin mb-6" size={48} />
      <h2 className="text-2xl font-clash-display text-white mb-2">
        Running Analysis...
      </h2>
      <p className="text-lg text-text-body font-dm-sans">
        {statusMessage || "Please wait..."}
      </p>
    </div>
  );
};