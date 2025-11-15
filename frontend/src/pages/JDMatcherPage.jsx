// src/pages/JDMatcherPage.jsx
import React from 'react';
import { useMatcher } from '../hooks/useMatcher';
import { MatcherPolling } from '../components/Matcher/MatcherPolling';
import { MatcherResults } from '../components/Matcher/MatcherResults';
import { SubmitButton } from '../components/Forms/FormElements';
import { AlertTriangle } from 'lucide-react';

// The "Idle" state component, with the text area
const JdInputForm = ({ jdText, setJdText, onSubmit, isLoading }) => (
  <div className="max-w-3xl mx-auto">
    <h1 className="text-3xl font-clash-display text-white mb-4">
      Resume Tailoring Co-pilot
    </h1>
    <p className="mt-4 text-text-body text-lg font-dm-sans mb-6">
      Paste a full job description below. Our AI will analyze it against your
      profile and give you actionable advice to improve your match.
    </p>

    <textarea
      value={jdText}
      onChange={(e) => setJdText(e.target.value)}
      placeholder="Paste the full job description here..."
      className="w-full h-80 bg-slate-800/50 border border-white/10 rounded-xl p-4 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
    />

    <div className="mt-6 flex justify-end">
      <SubmitButton onClick={onSubmit} isLoading={isLoading}>
        Analyze Job Description
      </SubmitButton>
    </div>
  </div>
);

// The "Failed" state component
const ErrorDisplay = ({ error, onReset }) => (
  <div className="flex flex-col items-center justify-center h-96 max-w-2xl mx-auto text-center">
    <AlertTriangle className="text-red-400 mb-6" size={48} />
    <h2 className="text-2xl font-clash-display text-white mb-2">
      Analysis Failed
    </h2>
    <p className="text-lg text-red-300 bg-red-500/10 p-4 rounded-lg font-dm-sans">
      {error || "An unknown error occurred."}
    </p>
    <button
      onClick={onReset}
      className="mt-8 px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-white text-sm font-dm-sans"
    >
      Try Again
    </button>
  </div>
);


export default function JDMatcherPage() {
  const {
    jdText,
    setJdText,
    status,
    statusMessage,
    error,
    results,
    startAnalysis,
    resetMatcher,
  } = useMatcher();

  const isLoading = status === 'loading' || status === 'pending' || status === 'validating' || status === 'parsing_jd' || status === 'analyzing';

  // --- Render based on state ---
  
  if (status === 'failed') {
    return <ErrorDisplay error={error} onReset={resetMatcher} />;
  }

  if (isLoading) {
    return <MatcherPolling statusMessage={statusMessage} />;
  }

  if (status === 'complete' && results) {
    return <MatcherResults results={results} onReset={resetMatcher} />;
  }

  // Default: 'idle' state
  return (
    <JdInputForm 
      jdText={jdText}
      setJdText={setJdText}
      onSubmit={startAnalysis}
      isLoading={isLoading}
    />
  );
}