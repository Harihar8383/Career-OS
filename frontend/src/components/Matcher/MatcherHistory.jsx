import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Calendar, Briefcase, ChevronRight, Activity, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:8080";

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

    if (loading) return <div className="text-white text-center p-8">Loading history...</div>;

    if (history.length === 0) {
        return (
            <div className="text-center py-12 bg-bg-card/5 rounded-xl border border-border-primary">
                <Activity className="mx-auto text-text-secondary mb-4" size={48} />
                <h3 className="text-xl font-clash-display text-text-primary">No Analysis History</h3>
                <p className="text-text-secondary mt-2">Your past checks will appear here.</p>
            </div>
        );
    }

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

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {history.map((item) => (
                <div
                    key={item.runId}
                    onClick={() => onLoadAnalysis(item.runId)}
                    className="group cursor-pointer bg-bg-card/50 border border-border-primary hover:border-blue-500/50 rounded-xl p-5 transition-all hover:bg-bg-card/80 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                            onClick={(e) => handleDelete(e, item.runId)}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                            title="Delete Analysis"
                        >
                            <Trash2 size={16} />
                        </button>
                        <ChevronRight className="text-blue-400 p-1" />
                    </div>

                    <h4 className="font-clash-display text-lg text-text-primary pr-16 truncate">{item.jobTitle}</h4>
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
            ))}
        </div>
    );
};
