// frontend/src/components/Tracker/JobListView.jsx
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowUpDown,
    Eye,
    Trash2,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Sortable table view for tracked jobs
 */
export const JobListView = ({ jobs, onViewDetails, onDelete, onBulkAction }) => {
    const [sortConfig, setSortConfig] = useState({ key: 'updatedAt', direction: 'desc' });
    const [selectedJobs, setSelectedJobs] = useState(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Handle sorting
    const sortedJobs = useMemo(() => {
        const sorted = [...jobs];
        sorted.sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle dates
            if (sortConfig.key === 'updatedAt' || sortConfig.key === 'createdAt' || sortConfig.key === 'applicationDate') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            // Handle strings
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [jobs, sortConfig]);

    // Pagination
    const paginatedJobs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedJobs.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedJobs, currentPage]);

    const totalPages = Math.ceil(sortedJobs.length / itemsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const toggleSelectJob = (jobId) => {
        setSelectedJobs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(jobId)) {
                newSet.delete(jobId);
            } else {
                newSet.add(jobId);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedJobs.size === paginatedJobs.length) {
            setSelectedJobs(new Set());
        } else {
            setSelectedJobs(new Set(paginatedJobs.map(j => j._id)));
        }
    };

    const getStageColor = (stage) => {
        const colors = {
            saved: 'text-blue-400 bg-blue-500/10',
            applied: 'text-purple-400 bg-purple-500/10',
            screening: 'text-yellow-400 bg-yellow-500/10',
            interview: 'text-orange-400 bg-orange-500/10',
            offer: 'text-green-400 bg-green-500/10',
            rejected: 'text-red-400 bg-red-500/10',
            accepted: 'text-emerald-400 bg-emerald-500/10'
        };
        return colors[stage] || colors.saved;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            high: 'text-red-400 bg-red-500/10',
            medium: 'text-blue-400 bg-blue-500/10',
            low: 'text-gray-400 bg-gray-500/10'
        };
        return colors[priority] || colors.medium;
    };

    const formatDate = (date) => {
        if (!date) return '-';
        try {
            return format(new Date(date), 'MMM dd, yyyy');
        } catch {
            return '-';
        }
    };

    return (
        <div className="space-y-4">
            {/* Bulk Actions Toolbar */}
            {selectedJobs.size > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
                >
                    <span className="text-sm font-medium text-text-primary">
                        {selectedJobs.size} job{selectedJobs.size > 1 ? 's' : ''} selected
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onBulkAction('delete', Array.from(selectedJobs))}
                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                            <Trash2 size={14} />
                            Delete
                        </button>
                        <button
                            onClick={() => setSelectedJobs(new Set())}
                            className="px-3 py-1.5 bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary rounded-lg text-sm font-medium transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Table */}
            <div className="bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-bg-dark/50 border-b border-border-primary">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="text-text-secondary hover:text-text-primary transition-colors"
                                    >
                                        {selectedJobs.size === paginatedJobs.length && paginatedJobs.length > 0 ? (
                                            <CheckSquare size={18} />
                                        ) : (
                                            <Square size={18} />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('title')}
                                        className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
                                    >
                                        Job Title
                                        <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('company')}
                                        className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
                                    >
                                        Company
                                        <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('location')}
                                        className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
                                    >
                                        Location
                                        <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('stage')}
                                        className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
                                    >
                                        Stage
                                        <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('priority')}
                                        className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
                                    >
                                        Priority
                                        <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <button
                                        onClick={() => handleSort('updatedAt')}
                                        className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors"
                                    >
                                        Updated
                                        <ArrowUpDown size={14} />
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedJobs.map((job, index) => (
                                <motion.tr
                                    key={job._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="border-b border-border-primary hover:bg-text-primary/5 transition-colors cursor-pointer"
                                    onClick={() => onViewDetails(job)}
                                >
                                    <td className="px-4 py-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelectJob(job._id);
                                            }}
                                            className="text-text-secondary hover:text-text-primary transition-colors"
                                        >
                                            {selectedJobs.has(job._id) ? (
                                                <CheckSquare size={18} className="text-blue-400" />
                                            ) : (
                                                <Square size={18} />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-4 font-medium text-text-primary truncate max-w-xs">
                                        {job.title}
                                    </td>
                                    <td className="px-4 py-4 text-text-secondary truncate max-w-xs">
                                        {job.company}
                                    </td>
                                    <td className="px-4 py-4 text-text-secondary text-sm truncate max-w-xs">
                                        {job.location || '-'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStageColor(job.stage)} capitalize`}>
                                            {job.stage}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(job.priority)} capitalize`}>
                                            {job.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-text-secondary text-sm">
                                        {formatDate(job.updatedAt)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onViewDetails(job);
                                                }}
                                                className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(job._id);
                                                }}
                                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-border-primary bg-bg-dark/30">
                        <p className="text-sm text-text-secondary">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedJobs.length)} of {sortedJobs.length} jobs
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 bg-bg-card hover:bg-text-primary/10 text-text-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-3 py-1 bg-bg-card rounded-lg text-sm font-medium text-text-primary">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 bg-bg-card hover:bg-text-primary/10 text-text-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {jobs.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-text-secondary">No jobs in tracker yet</p>
                </div>
            )}
        </div>
    );
};
