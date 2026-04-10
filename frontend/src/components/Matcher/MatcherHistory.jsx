import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, Briefcase, ChevronRight, Activity, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

const HistoryCard = ({ item, onLoadAnalysis, onDelete, initialSavedJobId }) => {
  const { getToken } = useAuth();
  const toast = useToast();
  const [isSaved, setIsSaved] = useState(!!initialSavedJobId);
  const [isSaving, setIsSaving] = useState(false);
  const [savedJobId, setSavedJobId] = useState(initialSavedJobId);

  useEffect(() => {
    setIsSaved(!!initialSavedJobId);
    setSavedJobId(initialSavedJobId);
  }, [initialSavedJobId]);

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    if (isSaving) return;

    setIsSaving(true);
    try {
      const token = await getToken();

      if (isSaved && savedJobId) {
        // Remove from tracker
        const response = await fetch(`${API_URL}/api/tracker/jobs/${savedJobId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to remove job');
        }

        setIsSaved(false);
        setSavedJobId(null);
        toast.success('Job removed from tracker');
      } else {
        // Save to tracker
        const jobData = {
          title: item.jobTitle || 'Job from History',
          company: item.company || 'Unknown',
          location: '',
          salary: '',
          jobType: 'Full-time',
          description: item.jdText || '',
          applyLink: '',
          source: 'matcher',
          matchScore: item.score || 0,
          stage: 'saved',
          priority: item.score >= 80 ? 'high' : item.score >= 60 ? 'medium' : 'low'
        };

        const response = await fetch(`${API_URL}/api/tracker/jobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jobData)
        });

        if (!response.ok) {
          throw new Error('Failed to save job');
        }

        const result = await response.json();
        setIsSaved(true);
        setSavedJobId(result.data._id);
        toast.success('Job saved to tracker!');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error(isSaved ? 'Failed to remove job' : 'Failed to save job');
    } finally {
      setIsSaving(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  if (isDeleting) {
    return (
      <div className="group bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex flex-col items-center justify-center text-center transition-all h-full min-h-[140px]">
        <h4 className="text-red-400 font-bold mb-2">Delete this analysis?</h4>
        <div className="flex gap-3 mt-2">
          <button 
            onClick={(e) => {
               e.stopPropagation();
               setIsDeleting(false);
            }}
            className="px-4 py-1.5 rounded-lg text-sm bg-bg-dark text-text-secondary hover:text-white transition-colors border border-border-primary"
          >
            Cancel
          </button>
          <button 
            onClick={(e) => {
               e.stopPropagation();
               onDelete(item.runId);
            }}
            className="px-4 py-1.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onLoadAnalysis(item.runId)}
      className="group cursor-pointer bg-bg-card/50 border border-border-primary hover:border-brand-primary/50 rounded-xl p-5 transition-all hover:bg-bg-card/80 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button
          onClick={handleToggleSave}
          disabled={isSaving}
          className={`p-1.5 rounded-lg transition-colors ${isSaved
            ? 'bg-brand-primary/10 text-[#8AA5FF] hover:bg-danger-dim hover:text-red-400'
            : 'bg-bg-dark hover:bg-brand-primary/10 text-text-secondary hover:text-[#8AA5FF]'
            } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
          title={isSaved ? 'Remove from Tracker' : 'Save to Tracker'}
        >
          {isSaved ? <BookmarkCheck size={16} className="fill-current" /> : <Bookmark size={16} />}
        </button>
        <button
          onClick={(e) => {
             e.stopPropagation();
             setIsDeleting(true);
          }}
          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
          title="Delete Analysis"
        >
          <Trash2 size={16} />
        </button>
        <ChevronRight className="text-brand-primary p-1" />
      </div>

      <h4 className="font-clash-display text-lg text-text-primary pr-24 truncate">{item.jobTitle}</h4>
      <p className="text-text-secondary text-sm flex items-center gap-2 mt-1">
        <Briefcase size={14} /> {item.company}
      </p>

      <div className="mt-4 flex items-end justify-between border-t border-border-primary pt-4">
        <div className="text-xs text-text-secondary flex items-center gap-2">
          <Calendar size={14} />
          {new Date(item.date).toLocaleDateString()}
        </div>
        <div className={`text-2xl font-bold ${item.score >= 70 ? 'text-green-400' : item.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
          {item.score}%
        </div>
      </div>
    </div>
  );
};

export const MatcherHistory = ({ onLoadAnalysis }) => {
  const { getToken } = useAuth();
  const toast = useToast();
  const [history, setHistory] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistoryAndJobs = async () => {
      try {
        const token = await getToken();
        const [historyRes, jobsRes] = await Promise.all([
          fetch(`${API_URL}/api/matcher/history`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/api/tracker/jobs`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        if (historyRes.ok) {
          const data = await historyRes.json();
          setHistory(data);
        }
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setSavedJobs(jobsData.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch history/jobs data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistoryAndJobs();
  }, [getToken]);

  const handleDelete = async (runId) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/matcher/${runId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setHistory(prev => prev.filter(item => item.runId !== runId));
        toast.success("Analysis deleted");
      } else {
        toast.error("Failed to delete analysis");
      }
    } catch (err) {
      console.error("Error deleting analysis:", err);
      toast.error("Error deleting analysis");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-bg-card/40 border border-border-primary rounded-xl p-5 h-[150px] relative overflow-hidden flex flex-col shadow-sm">
            <div className="flex justify-between items-start mb-2">
               <div className="flex-1">
                 <Skeleton className="h-6 w-3/4 mb-3" />
                 <Skeleton className="h-4 w-1/2" />
               </div>
               <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            
            <div className="mt-auto flex justify-between items-end border-t border-border-primary pt-4">
               <div className="flex gap-2 items-center">
                 <Skeleton className="h-4 w-4 rounded-full" />
                 <Skeleton className="h-3 w-24" />
               </div>
               <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-bg-card/5 rounded-xl border border-border-primary">
        <Activity className="mx-auto text-text-secondary mb-4" size={48} />
        <h3 className="text-xl font-clash-display text-text-primary">No Analysis History</h3>
        <p className="text-text-secondary mt-2">Your past checks will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {history.map((item) => {
        const savedJob = savedJobs.find(j => 
          (j.title === (item.jobTitle || 'Job from History') && j.company === (item.company || 'Unknown'))
        );
        return (
          <HistoryCard
            key={item.runId}
            item={item}
            initialSavedJobId={savedJob?._id || null}
            onLoadAnalysis={onLoadAnalysis}
            onDelete={handleDelete}
          />
        );
      })}
    </div>
  );
};
