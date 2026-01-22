// src/pages/JobHunterPage.jsx
import { useState, useEffect } from 'react';
import { AppLayout } from '../components/Layout/AppLayout';
import JobHunterForm from '../components/JobHunter/JobHunterForm';
import { JobHunterLogs } from '../components/JobHunter/JobHunterLogs';
import { JobCard } from '../components/JobHunter/JobCard';
import { useJobHunt } from '../hooks/useJobHunt';
import { Bot, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';

export default function JobHunterPage() {
  const [view, setView] = useState('form'); // 'form', 'terminal', 'results'
  const { sessionId, logs, status, error, results, startHunt, reset } = useJobHunt();

  /**
   * Handle form submission - start the job hunt
   */
  const handleStartHunt = async (criteria) => {
    try {
      await startHunt(criteria);
      setView('terminal');
    } catch (err) {
      console.error('Failed to start hunt:', err);
      // Stay on form view if start fails
    }
  };

  /**
   * Handle going back to form
   */
  const handleBackToForm = () => {
    reset();
    setView('form');
  };

  /**
   * When status becomes completed, switch to results view
   */
  useEffect(() => {
    if (status === 'completed' && view === 'terminal') {
      setView('results');
    }
  }, [status, view]);

  return (
    <AppLayout>
      <div className="max-w-7xl space-y-6">
        {/* Header - Changes based on view */}
        {view === 'form' && (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/30">
                <Bot size={24} className="text-blue-400" />
              </div>
              <h1 className="text-3xl font-clash-display text-white">Job Hunter Agent</h1>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30 flex items-center gap-1.5">
                <Sparkles size={12} />
                AI POWERED
              </span>
            </div>
            <p className="text-text-body text-base font-dm-sans max-w-2xl">
              Configure your intelligent job hunting assistant. We'll automatically search and match opportunities based on your preferences.
            </p>
          </div>
        )}

        {/* Back Button for Terminal and Results views */}
        {(view === 'terminal' || view === 'results') && (
          <button
            onClick={handleBackToForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-text-secondary hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
          >
            <ArrowLeft size={16} />
            Back to Configuration
          </button>
        )}

        {/* Content - Changes based on view */}
        {view === 'form' && (
          <JobHunterForm onSubmit={handleStartHunt} />
        )}

        {view === 'terminal' && (
          <JobHunterLogs logs={logs} status={status} />
        )}

        {view === 'results' && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-clash-display text-white">
                Found {results.length} Job{results.length !== 1 ? 's' : ''}
              </h2>
              <p className="text-text-secondary text-sm">
                Here are the best matches based on your criteria
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Results Grid */}
            {results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((job, index) => (
                  <JobCard key={job.id || index} job={job} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-text-secondary text-sm">
                  No jobs found. Try adjusting your search criteria.
                </p>
                <button
                  onClick={handleBackToForm}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                  <RefreshCw size={16} />
                  Start New Search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
