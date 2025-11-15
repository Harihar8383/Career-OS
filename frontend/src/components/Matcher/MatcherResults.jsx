// frontend/src/components/Matcher/MatcherResults.jsx
import React from 'react';
import { MatchScoreCard, JdSummaryCard, ComparisonMatrixCard, SuggestionCard } from './MatcherCards';
import { Sparkles } from 'lucide-react';

export const MatcherResults = ({ results, onReset }) => {
  if (!results) return null;

  const { actionable_todo_list = [], ...otherResults } = results;

  // Find the AI Summary and separate it
  const aiSummary = actionable_todo_list.find(s => s.type === "AI Summary");
  const otherSuggestions = actionable_todo_list.filter(s => s.type !== "AI Summary");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* --- Top Row: Score + Summary --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MatchScoreCard score={otherResults.match_score_percent} />
        <JdSummaryCard summary={otherResults.jd_summary} />
      </div>

      {/* --- Comparison Matrix --- */}
      <ComparisonMatrixCard matrix={otherResults.comparison_matrix} />

      {/* --- AI Generated Summary --- */}
      {aiSummary && (
        <div className="bg-gradient-to-br from-blue-900/30 via-bg-dark/30 to-bg-dark/30 border border-blue-500/40 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="text-blue-400 w-5 h-5" />
            <h3 className="text-xl font-clash-display text-white ml-3">AI-Generated Summary</h3>
          </div>
          <p className="font-dm-sans text-text-body italic">
            {aiSummary.ai_generated_summary}
          </p>
          <p className="font-dm-sans text-sm text-text-secondary mt-3">
            {aiSummary.suggestion}
          </p>
        </div>
      )}

      {/* --- Actionable To-Do List --- */}
      <div>
        <h2 className="text-2xl font-clash-display text-white mb-4 mt-8">
          Actionable To-Do List
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {otherSuggestions.map((suggestion, i) => (
            <SuggestionCard key={i} suggestion={suggestion} />
          ))}
        </div>
      </div>
      
      {/* --- Reset Button --- */}
      <div className="flex justify-center pt-8">
        <button
          onClick={onReset}
          className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-white text-sm font-dm-sans"
        >
          Analyze Another Job
        </button>
      </div>
    </div>
  );
};