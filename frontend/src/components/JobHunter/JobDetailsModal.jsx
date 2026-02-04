import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ExternalLink,
    MapPin,
    Briefcase,
    DollarSign,
    Clock,
    Building2,
    Award,
    TrendingUp,
    Bookmark,
    BookmarkCheck,
    Calendar
} from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '../ui/Toast';

/**
 * JobDetailsModal - Full-screen modal showing comprehensive job information
 */
export function JobDetailsModal({ job, isOpen, onClose }) {
    const { getToken } = useAuth();
    const toast = useToast();
    const [isSaved, setIsSaved] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [savedJobId, setSavedJobId] = React.useState(null);

    // Check if job is already saved when modal opens
    useEffect(() => {
        const checkIfSaved = async () => {
            if (!job || !isOpen) return;

            try {
                const token = await getToken();
                const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

                const response = await fetch(`${API_URL}/api/tracker/jobs`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const result = await response.json();
                    const jobs = result.data || [];
                    const savedJob = jobs.find(j =>
                        j.applyLink === job.applyLink ||
                        (j.title === job.title && j.company === job.company)
                    );

                    if (savedJob) {
                        setIsSaved(true);
                        setSavedJobId(savedJob._id);
                    } else {
                        setIsSaved(false);
                        setSavedJobId(null);
                    }
                }
            } catch (error) {
                console.error('Error checking if job is saved:', error);
            }
        };

        checkIfSaved();
    }, [job, isOpen, getToken]);

    // Close on ESC key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleToggleSave = async () => {
        if (isSaving) return;

        setIsSaving(true);
        try {
            const token = await getToken();
            const API_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:8080';

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
                    title: job.title,
                    company: job.company,
                    location: job.location || '',
                    salary: job.salary || '',
                    jobType: job.type || 'Full-time',
                    description: job.description || '',
                    applyLink: job.applyLink,
                    source: 'hunter',
                    matchScore: job.matchScore,
                    tierLabel: job.tierLabel,
                    tier: job.tier,
                    badges: job.badges,
                    gapAnalysis: job.gapAnalysis,
                    stage: 'saved',
                    priority: 'medium'
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

    const getSourceLabel = (src) => {
        if (!src) return 'Unknown Source';
        if (src.includes('adzuna')) return 'Adzuna';
        if (src.includes('tavily')) return 'Web Search';
        if (src.includes('hiringcafe')) return 'HiringCafe';
        return src;
    };

    const getTierColor = (tierValue) => {
        switch (tierValue) {
            case 'S': return 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
            case 'A+': return 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(41,52,255,0.3)]';
            case 'A': return 'bg-green-500/20 text-green-300 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
            case 'B+': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
        }
    };

    if (!job) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg-card/95 backdrop-blur-xl border border-border-primary rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                            {/* Header */}
                            <div className="sticky top-0 z-10 bg-bg-card/95 backdrop-blur-xl border-b border-border-secondary p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Tags Row */}
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-text-primary/5 text-text-secondary border border-border-secondary uppercase tracking-wider">
                                                {getSourceLabel(job.source)}
                                            </span>

                                            {job.tierLabel && (
                                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${getTierColor(job.tier)}`}>
                                                    {job.tierLabel}
                                                </span>
                                            )}

                                            {job.matchScore && (
                                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${job.matchScore >= 90
                                                    ? 'bg-green-500/10 text-green-300 border-green-500/30'
                                                    : job.matchScore >= 75
                                                        ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                                        : 'bg-orange-500/10 text-orange-300 border-orange-500/30'
                                                    }`}>
                                                    {job.matchScore}% Match
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-2xl font-bold text-text-primary mb-2">
                                            {job.title}
                                        </h2>

                                        <div className="flex items-center gap-2 text-text-secondary">
                                            <Building2 size={16} className="text-blue-400" />
                                            <span className="text-lg">{job.company}</span>
                                        </div>
                                    </div>

                                    {/* Close Button */}
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <X size={24} className="text-text-secondary hover:text-text-primary" />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
                                {/* Key Details Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {job.location && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <MapPin size={16} className="text-text-secondary flex-shrink-0" />
                                            <span className="text-text-primary truncate">{job.location}</span>
                                        </div>
                                    )}

                                    {job.salary && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <DollarSign size={16} className="text-text-secondary flex-shrink-0" />
                                            <span className="text-text-primary truncate">{job.salary}</span>
                                        </div>
                                    )}

                                    {job.type && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Briefcase size={16} className="text-text-secondary flex-shrink-0" />
                                            <span className="text-text-primary capitalize">{job.type}</span>
                                        </div>
                                    )}

                                    {job.postedDate && (
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock size={16} className="text-text-secondary flex-shrink-0" />
                                            <span className="text-text-primary">{job.postedDate}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Tech Stack / Badges */}
                                {job.badges && job.badges.length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                                            Skills & Technologies
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {job.badges.map((badge, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
                                                >
                                                    {badge}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Gap Analysis */}
                                {job.gapAnalysis && job.gapAnalysis !== "Good match" && (
                                    <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                        <div className="flex items-start gap-3">
                                            <TrendingUp size={20} className="text-orange-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <h3 className="text-sm font-bold text-orange-300 mb-1">Gap Analysis</h3>
                                                <p className="text-sm text-orange-200/70 leading-relaxed">{job.gapAnalysis}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Job Description */}
                                {job.description && (
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
                                            Job Description
                                        </h3>
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            <div className="text-text-secondary leading-relaxed whitespace-pre-wrap break-words">
                                                {job.description}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Action Buttons */}
                            <div className="sticky bottom-0 bg-bg-card/95 backdrop-blur-xl border-t border-border-secondary p-6">
                                <div className="flex items-center gap-3">
                                    <a
                                        href={job.applyLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-600/25"
                                    >
                                        <span>Apply Now</span>
                                        <ExternalLink size={16} />
                                    </a>

                                    <button
                                        onClick={handleToggleSave}
                                        disabled={isSaving}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${isSaved
                                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30'
                                            : 'bg-bg-dark/50 hover:bg-blue-500/20 text-text-secondary hover:text-blue-400 border border-border-primary hover:border-blue-500/30'
                                            } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        {isSaved ? (
                                            <>
                                                <BookmarkCheck size={18} className="fill-current" />
                                                Saved
                                            </>
                                        ) : (
                                            <>
                                                <Bookmark size={18} />
                                                Save to Tracker
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
