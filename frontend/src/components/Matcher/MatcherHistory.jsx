import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, Briefcase, ChevronRight, Activity, Trash2, Bookmark, BookmarkCheck } from 'lucide-react';
import { useToast } from '../ui/Toast';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

const HistoryCard = ({ item, onLoadAnalysis, onDelete }) => {
    const { getToken } = useAuth();
    const toast = useToast();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveToTracker = async (e) => {
        e.stopPropagation();
        if (isSaved || isSaving) return;

        setIsSaving(true);
        try {
            const token = await getToken();
            const jobData = {
                title: item.jobTitle || 'Job from History',
                company: item.company || 'Unknown',
                location: '',
                salary: '',
                jobType: 'Full-time',
                description: `Imported from Matcher History (Run ID: ${item.runId})`,
                applyLink: '',
                source: 'matcher_history',
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

            setIsSaved(true);
            toast.success('Job saved to tracker!');
        } catch (error) {
            console.error('Error saving job:', error);
            toast.error('Failed to save job');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            onClick={() => onLoadAnalysis(item.runId)}
            className="group cursor-pointer bg-bg-card/50 border border-border-primary hover:border-blue-500/50 rounded-xl p-5 transition-all hover:bg-bg-card/80 relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                    onClick={handleSaveToTracker}
                    disabled={isSaved || isSaving}
                    className={`p-1.5 rounded-lg transition-colors ${isSaved
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-bg-dark hover:bg-blue-500/10 text-text-secondary hover:text-blue-400'
                        }`}
                    title={isSaved ? 'Saved to Tracker' : 'Save to Tracker'}
                >
                    {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                </button>
                <button
                    onClick={(e) => onDelete(e, item.runId)}
                    className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Delete Analysis"
                >
                    <Trash2 size={16} />
                </button>
                <ChevronRight className="text-blue-400 p-1" />
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
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = await getToken();
                const res = await fetch(`${API_URL}/api/matcher/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (err) {
                console.error("Failed to fetch history", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [getToken]);

    const handleDelete = async (e, runId) => {
        e.stopPropagation(); // Prevent triggering the card click
        if (!confirm("Are you sure you want to delete this analysis?")) return;

        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/api/matcher/${runId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                setHistory(prev => prev.filter(item => item.runId !== runId));
            } else {
                alert("Failed to delete analysis.");
            }
        } catch (err) {
            console.error("Error deleting analysis:", err);
            alert("Error deleting analysis.");
        }
    };

    if (loading) return <div className="text-text-secondary text-center p-8">Loading history...</div>;

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
            {history.map((item) => (
                <HistoryCard
                    key={item.runId}
                    item={item}
                    onLoadAnalysis={onLoadAnalysis}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
};
