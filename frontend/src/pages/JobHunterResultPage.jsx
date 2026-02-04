// src/pages/JobHunterSessionResultsPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { JobCard } from '../components/JobHunter/JobCard';
import { JobDetailsModal } from '../components/JobHunter/JobDetailsModal';
import {
    ArrowLeft,
    Calendar,
    Briefcase,
    MapPin,
    DollarSign,
    Loader2,
    AlertCircle,
    Inbox
} from 'lucide-react';

export default function JobHunterSessionResultsPage() {
    const params = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    // Handle both sessionId and runId params for backward compatibility
    const sessionId = params.sessionId || params.runId;

    const [session, setSession] = useState(null);
    const [results, setResults] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSessionData = async () => {
            if (!sessionId) {
                setError('No session ID provided');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const token = await getToken();
                const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

                // Fetch session details
                const sessionResponse = await fetch(
                    `${API_URL}/api/hunter/session/${sessionId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (!sessionResponse.ok) {
                    throw new Error('Failed to fetch session');
                }

                const sessionData = await sessionResponse.json();
                setSession(sessionData);

                // Fetch results
                const resultsResponse = await fetch(
                    `${API_URL}/api/hunter/results/${sessionId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (!resultsResponse.ok) {
                    throw new Error('Failed to fetch results');
                }

                const resultsData = await resultsResponse.json();
                setResults(resultsData.results || []);

            } catch (err) {
                console.error('Error fetching session data:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSessionData();
    }, [sessionId, getToken]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatSalary = (range) => {
        if (!range || !Array.isArray(range) || range.length !== 2) return null;
        const [min, max] = range;
        const formatINR = (val) => {
            if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
            if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
            if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
            return `₹${val}`;
        };
        return `${formatINR(min)} - ${formatINR(max)}`;
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard/hunter/history')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-text-secondary hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
            >
                <ArrowLeft size={16} />
                Back to History
            </button>

            {/* Loading State */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 size={48} className="text-blue-400 animate-spin" />
                    <p className="text-text-secondary text-sm">Loading session results...</p>
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={24} className="text-red-400 flex-shrink-0" />
                        <div>
                            <h3 className="text-lg font-bold text-red-400 mb-1">Error Loading Session</h3>
                            <p className="text-red-300 text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Session Header */}
            {session && !isLoading && (
                <div className="space-y-4">
                    <div className="bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl p-6">
                        <div className="flex items-center gap-2 text-text-secondary text-sm mb-4">
                            <Calendar size={14} />
                            <span>{formatDate(session.createdAt)}</span>
                        </div>

                        {/* Criteria Summary */}
                        <div className="space-y-3">
                            {session.criteria?.jobTitles && session.criteria.jobTitles.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Briefcase size={18} className="text-blue-400" />
                                    <h2 className="text-xl font-bold text-text-primary">
                                        {session.criteria.jobTitles.join(', ')}
                                    </h2>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                                {session.criteria?.locationTypes && session.criteria.locationTypes.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                        <MapPin size={14} />
                                        {session.criteria.locationTypes.join(', ')}
                                    </span>
                                )}

                                {session.criteria?.locations && session.criteria.locations.length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                                        {session.criteria.locations.join(', ')}
                                    </span>
                                )}

                                {session.criteria?.salaryRange && (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-500/10 text-green-300 border border-green-500/30">
                                        <DollarSign size={14} />
                                        {formatSalary(session.criteria.salaryRange)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results Header */}
                    <div className="text-center space-y-2">
                        <h3 className="text-2xl font-clash-display text-text-primary">
                            Found {results.length} Job{results.length !== 1 ? 's' : ''}
                        </h3>
                        <p className="text-text-secondary text-sm">
                            Here are the results from this hunt session
                        </p>
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {!isLoading && !error && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((job, index) => (
                        <JobCard key={job._id || index} job={job} onJobClick={setSelectedJob} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && results.length === 0 && session && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="p-4 bg-bg-card/60 rounded-2xl border border-border-primary">
                        <Inbox size={48} className="text-text-secondary" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-text-primary">No Results Found</h3>
                        <p className="text-text-secondary text-sm max-w-md">
                            This hunt session didn't find any matching jobs.
                        </p>
                    </div>
                </div>
            )}

            {/* Job Details Modal */}
            <JobDetailsModal
                job={selectedJob}
                isOpen={!!selectedJob}
                onClose={() => setSelectedJob(null)}
            />
        </div>
    );
}
