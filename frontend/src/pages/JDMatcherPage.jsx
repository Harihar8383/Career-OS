// src/pages/JDMatcherPage.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMatcher } from '../hooks/useMatcher';
import { MatcherPolling } from '../components/Matcher/MatcherPolling';
import { MatcherResults } from '../components/Matcher/MatcherResults';
import { MatcherHistory } from '../components/Matcher/MatcherHistory';
import { SubmitButton } from '../components/Forms/FormElements';
import { AlertTriangle, Plus, History, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                SUB-COMPONENTS                              */
/* -------------------------------------------------------------------------- */

// 1. INPUT VIEW (Root /)
const MatcherInputView = () => {
  const navigate = useNavigate();
  const {
    jdText,
    setJdText,
    status,
    statusMessage,
    error,
    startAnalysis,
    resetMatcher,
    results,
    runId
  } = useMatcher();

  // Prefill JD Text from Action Card
  const location = useLocation();
  useEffect(() => {
    if (location.state?.prefilled?.url && !jdText) {
      setJdText(location.state.prefilled.url);
    }
  }, [location.state, setJdText, jdText]);

  // Auto-navigate to results when complete
  useEffect(() => {
    if (status === 'complete' && results) {
      navigate(`results/${results.runId || runId}`);
    }
  }, [status, results, navigate, runId]);

  const isLoading = status === 'loading' || status === 'pending' || status === 'validating' || status === 'parsing_jd' || status === 'analyzing' || status === 'analyzing_with_graph';

  const [validationMsg, setValidationMsg] = useState("");
  const wordCount = jdText ? jdText.trim().split(/\s+/).filter(w => w.length > 0).length : 0;

  const handleAnalyzeClick = () => {
    if (wordCount === 0) {
      setValidationMsg("Please paste a job description first.");
      return;
    }
    setValidationMsg("");
    startAnalysis();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading) {
          handleAnalyzeClick();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [wordCount, isLoading, startAnalysis]);

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center h-96 max-w-2xl mx-auto text-center">
        <AlertTriangle className="text-red-500 mb-6" size={48} />
        <h2 className="text-2xl font-clash-display text-white mb-2">Analysis Failed</h2>
        <p className="text-lg text-red-300 bg-red-500/10 border border-red-500/20 p-4 rounded-xl font-dm-sans">
          {error || "An unknown error occurred."}
        </p>
        <button
          onClick={resetMatcher}
          className="mt-8 px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <MatcherPolling statusMessage={statusMessage} />;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-clash-display  text-white tracking-wide">
          JD Matcher
        </h1>
        <span className="px-3 py-1 bg-[#A855F7]/10 text-[#A855F7] text-xs font-bold rounded-full border border-[#A855F7]/30 flex items-center gap-1 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
          <Sparkles size={12} />
          AI Powered
        </span>
      </div>

      <div className="relative group rounded-2xl p-[1px] bg-gradient-to-b from-border-primary to-transparent">
        <div className="bg-bg-card/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

          <p className="relative z-10 text-gray-400 text-lg font-dm-sans mb-6">
            Paste a job description below. Our AI will analyze it against your profile to find gaps and generate a tailored resume strategy.
          </p>

          <div className="relative z-10 w-full mb-6">
            <textarea
              value={jdText}
              onChange={(e) => {
                setJdText(e.target.value);
                if (validationMsg) setValidationMsg("");
              }}
              placeholder="Paste the full job description here. Role, requirements, nice-to-haves — all of it."
              className={`w-full h-80 bg-bg-dark/40 border-2 rounded-xl p-5 pb-12 text-text-primary font-dm-sans placeholder:text-text-secondary outline-none transition-all resize-none shadow-inner
                ${validationMsg ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/50'
                  : wordCount === 0 ? 'border-border-primary focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50'
                    : wordCount > 0 && wordCount < 100 ? 'border-amber-500/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50'
                      : 'border-brand-primary focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50'}`}
            />
            {validationMsg && <p className="text-red-400 text-sm mt-1 absolute -bottom-6">{validationMsg}</p>}
            <div className="absolute bottom-4 right-4 text-xs font-mono px-2 py-1 rounded-md bg-bg-dark text-text-secondary flex gap-2 border border-border-primary pointer-events-none">
              <span>{wordCount} words</span>
              {wordCount > 0 && wordCount < 100 && <span className="text-amber-500 border-l border-border-secondary pl-2">Short JD</span>}
              {wordCount >= 100 && <span className="text-[#8AA5FF] border-l border-border-secondary pl-2">Good length</span>}
            </div>
          </div>

          <div className="mt-8 flex justify-between items-center relative z-10">
            <div className="text-text-secondary font-mono text-xs hidden sm:flex items-center gap-2 opacity-50">
              <span className="px-1.5 py-0.5 rounded border border-border-primary bg-bg-dark">⌘ Cmd</span> /
              <span className="px-1.5 py-0.5 rounded border border-border-primary bg-bg-dark">Ctrl</span> +
              <span className="px-1.5 py-0.5 rounded border border-border-primary bg-bg-dark">Enter</span> to match
            </div>
            <SubmitButton onClick={handleAnalyzeClick} isLoading={isLoading}>
              Analyze My Fit →
            </SubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. HISTORY VIEW (/history)
const MatcherHistoryView = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard/matcher')} className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-3xl font-clash-display text-white">Analysis History</h1>
      </div>
      <MatcherHistory onLoadAnalysis={(runId) => navigate(`../results/${runId}`)} />
    </div>
  );
};

// 3. RESULTS VIEW (/results/:runId)
const MatcherResultView = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loadAnalysis, results, status, error } = useMatcher();

  useEffect(() => {
    if (runId) {
      loadAnalysis(runId);
    }
  }, [runId]);

  // Handle Back Navigation smartly
  const handleBack = () => {
    // If we have history in web browser (e.g. came from history list), go back
    // But if correct "previous" page is fuzzy, we default to history if we look like we came from there contextually?
    // Actually, easiest: Check if we have state or just always go to a safe place?
    // User request: "if from history... back to history. if from analysis... back to matcher"

    // We can just rely on standard router 'back' if available, otherwise default to /matcher.
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/dashboard/matcher');
    }
  };

  if (status === 'loading' || !results) { // 'complete' status is set immediately by loadAnalysis but results might be null briefly
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading analysis results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">{error}</p>
        <button onClick={() => navigate('/dashboard/matcher')} className="mt-4 text-blue-400 underline">Return to Matcher</button>
      </div>
    )
  }

  return (
    <div>
      {/* Back Button Header */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back
        </button>
      </div>

      <MatcherResults results={results} onReset={() => navigate('/dashboard/matcher')} />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                MAIN LAYOUT                                 */
/* -------------------------------------------------------------------------- */

export default function JDMatcherPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab based on URL
  const activeTab = location.pathname.includes('history') ? 'history' : 'new';

  return (
    <div className="w-full pb-20">
      {/* Navigation Tabs (Only show on root or history pages, hide on results) */}
      {!location.pathname.includes('results') && (
        <div className="flex justify-center mb-8">
          <div className="flex bg-bg-card/80 p-1 rounded-xl border border-border-primary backdrop-blur-md shadow-sm">
            <button
              onClick={() => navigate('/dashboard/matcher')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'new'
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <Plus size={16} /> New Analysis
            </button>
            <button
              onClick={() => navigate('history')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history'
                ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/25'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <History size={16} /> History
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={<MatcherInputView />} />
        <Route path="/history" element={<MatcherHistoryView />} />
        <Route path="/results/:runId" element={<MatcherResultView />} />
      </Routes>
    </div>
  );
}