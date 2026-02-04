import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobHistory } from '../hooks/useJobHistory';
import { SessionHistoryCard } from '../components/JobHunter/SessionHistoryCard';
import {
    History,
    ArrowLeft,
    RefreshCw,
    Sparkles,
    Inbox,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

export default function JobHunterHistoryPage() {
    const navigate = useNavigate();
    const { sessions, isLoading, error, pagination, fetchSessions, goToPage } = useJobHistory();

    // Fetch sessions on mount
    useEffect(() => {
        fetchSessions(1);
    }, [fetchSessions]);

    const handleRefresh = () => {
        fetchSessions(1);
    };

    const handleBackToHunter = () => {
        navigate('/dashboard/hunter');
    };

    // Generate page numbers to display
    const getPageNumbers = () => {
        const { page, totalPages } = pagination;
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (page <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="space-y-4">
                <button
                    onClick={handleBackToHunter}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-text-secondary hover:text-white rounded-lg text-sm font-medium transition-all duration-200"
                >
                    <ArrowLeft size={16} />
                    Back to Job Hunter
                </button>

                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-600/20 rounded-xl border border-purple-500/30">
                                <History size={24} className="text-purple-400" />
                            </div>
                            <h1 className="text-3xl font-clash-display text-text-primary">Hunt History</h1>
                            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30 flex items-center gap-1.5">
                                <Sparkles size={12} />
                                {pagination.totalSessions} SESSIONS
                            </span>
                        </div>
                        <p className="text-text-body text-base font-dm-sans max-w-2xl">
                            View and revisit your previous job hunt sessions. Click any session to see the results.
                        </p>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && sessions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-text-secondary text-sm">Loading your hunt history...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && sessions.length === 0 && !error && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="p-4 bg-bg-card/60 rounded-2xl border border-border-primary">
                        <Inbox size={48} className="text-text-secondary" />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-bold text-text-primary">No Hunt History Yet</h3>
                        <p className="text-text-secondary text-sm max-w-md">
                            Start your first job hunt to see your sessions here. All your searches will be saved for future reference.
                        </p>
                    </div>
                    <button
                        onClick={handleBackToHunter}
                        className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-blue-600/25"
                    >
                        <Sparkles size={16} />
                        Start Your First Hunt
                    </button>
                </div>
            )}

            {/* Sessions Grid */}
            {sessions.length > 0 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sessions.map((session) => (
                            <SessionHistoryCard key={session.sessionId} session={session} />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            {/* Previous Button */}
                            <button
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={pagination.page === 1 || isLoading}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-bg-card/60 hover:bg-bg-card border border-border-primary hover:border-blue-500/30 text-text-primary rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </button>

                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((pageNum, index) => (
                                    pageNum === '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-3 py-2 text-text-secondary">
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={pageNum}
                                            onClick={() => goToPage(pageNum)}
                                            disabled={isLoading}
                                            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${pagination.page === pageNum
                                                    ? 'bg-blue-600 text-white border border-blue-500'
                                                    : 'bg-bg-card/60 hover:bg-bg-card border border-border-primary hover:border-blue-500/30 text-text-primary'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                ))}
                            </div>

                            {/* Next Button */}
                            <button
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages || isLoading}
                                className="inline-flex items-center gap-1 px-3 py-2 bg-bg-card/60 hover:bg-bg-card border border-border-primary hover:border-blue-500/30 text-text-primary rounded-lg text-sm font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
