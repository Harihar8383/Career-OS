// frontend/src/pages/JobTrackerPage.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid,
    List,
    Plus,
    Search,
    Filter,
    X
} from 'lucide-react';
import { useJobTracker } from '../hooks/useJobTracker';
import { KanbanBoard } from '../components/Tracker/KanbanBoard';
import { JobListView } from '../components/Tracker/JobListView';
import { JobDetailModal } from '../components/Tracker/JobDetailModal';
import { AddJobModal } from '../components/Tracker/AddJobModal';

/**
 * Main Job Tracker Page with Kanban and List views
 */
const JobTrackerPage = () => {
    const {
        jobs,
        loading,
        createJob,
        updateJob,
        updateStage,
        deleteJob,
        bulkUpdateStage,
        refreshJobs
    } = useJobTracker();

    const [view, setView] = useState('kanban'); // 'kanban' or 'list'
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        stage: '',
        priority: '',
        company: ''
    });
    const [selectedJob, setSelectedJob] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    // Filter jobs based on search and filters
    const filteredJobs = jobs.filter(job => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesSearch =
                job.title.toLowerCase().includes(query) ||
                job.company.toLowerCase().includes(query) ||
                (job.location && job.location.toLowerCase().includes(query));
            if (!matchesSearch) return false;
        }

        if (filters.stage && job.stage !== filters.stage) return false;
        if (filters.priority && job.priority !== filters.priority) return false;
        if (filters.company) {
            if (!job.company.toLowerCase().includes(filters.company.toLowerCase())) return false;
        }

        return true;
    });

    const handleViewDetails = (job) => {
        setSelectedJob(job);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setTimeout(() => setSelectedJob(null), 300); // Wait for animation
    };

    const handleUpdateJob = async (jobId, updates) => {
        await updateJob(jobId, updates);
        // Refresh the selected job data
        const updatedJob = jobs.find(j => j._id === jobId);
        if (updatedJob) {
            setSelectedJob(updatedJob);
        }
    };

    const handleCreateJob = async (jobData) => {
        await createJob(jobData);
    };

    const handleDelete = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            await deleteJob(jobId);
        }
    };

    const handleBulkAction = async (action, jobIds) => {
        if (action === 'delete') {
            if (window.confirm(`Delete ${jobIds.length} job(s)?`)) {
                await Promise.all(jobIds.map(id => deleteJob(id)));
            }
        }
    };

    const clearFilters = () => {
        setFilters({
            stage: '',
            priority: '',
            company: ''
        });
        setSearchQuery('');
    };

    const hasActiveFilters = searchQuery || filters.stage || filters.priority || filters.company;

    return (
        <div className="min-h-screen pb-12">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-clash-display font-bold text-text-primary mb-2">
                            Job Tracker
                        </h1>
                        <p className="text-text-secondary text-sm">
                            Manage your job applications from discovery to offer
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-3">
                        <div className="flex bg-bg-card border border-border-primary rounded-xl p-1">
                            <button
                                onClick={() => setView('kanban')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'kanban'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-text-secondary hover:text-text-primary'
                                    }`}
                            >
                                <LayoutGrid size={16} />
                                Kanban
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'list'
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'text-text-secondary hover:text-primary'
                                    }`}
                            >
                                <List size={16} />
                                List
                            </button>
                        </div>

                        {/* Add Manual Job Button */}
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-blue-600/25"
                        >
                            <Plus size={18} />
                            Add Job
                        </button>
                    </div>
                </div>

                {/* Search and Filters Bar */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Search jobs by title, company, or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-bg-card border border-border-primary rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${showFilters || hasActiveFilters
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-bg-card border border-border-primary text-text-secondary hover:text-text-primary'
                            }`}
                    >
                        <Filter size={18} />
                        Filters
                        {hasActiveFilters && (
                            <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs font-bold">
                                !
                            </span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 px-3 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-medium transition-colors"
                        >
                            <X size={16} />
                            Clear
                        </button>
                    )}
                </div>

                {/* Filters Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="mt-4 p-4 bg-bg-card border border-border-primary rounded-xl">
                                <div className="grid grid-cols-3 gap-4">
                                    {/* Stage Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                            Stage
                                        </label>
                                        <select
                                            value={filters.stage}
                                            onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
                                            className="w-full px-3 py-2 bg-bg-dark border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        >
                                            <option value="">All Stages</option>
                                            <option value="saved">Saved</option>
                                            <option value="applied">Applied</option>
                                            <option value="screening">Screening</option>
                                            <option value="interview">Interview</option>
                                            <option value="offer">Offer</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="accepted">Accepted</option>
                                        </select>
                                    </div>

                                    {/* Priority Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                            Priority
                                        </label>
                                        <select
                                            value={filters.priority}
                                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                                            className="w-full px-3 py-2 bg-bg-dark border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
                                        >
                                            <option value="">All Priorities</option>
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>

                                    {/* Company Filter */}
                                    <div>
                                        <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                            Company
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Filter by company..."
                                            value={filters.company}
                                            onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
                                            className="w-full px-3 py-2 bg-bg-dark border border-border-primary rounded-lg text-text-primary text-sm placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="p-4 bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl">
                    <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Total Jobs</p>
                    <p className="text-2xl font-bold text-text-primary">{filteredJobs.length}</p>
                </div>
                <div className="p-4 bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl">
                    <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Applied</p>
                    <p className="text-2xl font-bold text-purple-400">
                        {filteredJobs.filter(j => j.stage === 'applied').length}
                    </p>
                </div>
                <div className="p-4 bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl">
                    <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Interviewing</p>
                    <p className="text-2xl font-bold text-orange-400">
                        {filteredJobs.filter(j => j.stage === 'interview').length}
                    </p>
                </div>
                <div className="p-4 bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl">
                    <p className="text-xs text-text-secondary mb-1 uppercase tracking-wider">Offers</p>
                    <p className="text-2xl font-bold text-green-400">
                        {filteredJobs.filter(j => j.stage === 'offer').length}
                    </p>
                </div>
            </div>

            {/* Content - Kanban or List */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-text-secondary">Loading your tracked jobs...</div>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {view === 'kanban' ? (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <KanbanBoard
                                jobs={filteredJobs}
                                onUpdateStage={updateStage}
                                onViewDetails={handleViewDetails}
                                onDelete={handleDelete}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <JobListView
                                jobs={filteredJobs}
                                onViewDetails={handleViewDetails}
                                onDelete={handleDelete}
                                onBulkAction={handleBulkAction}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Empty State */}
            {!loading && filteredJobs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-text-primary/5 rounded-full flex items-center justify-center">
                        <LayoutGrid size={32} className="text-text-secondary/50" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">No jobs tracked yet</h3>
                    <p className="text-text-secondary mb-6 max-w-md mx-auto">
                        Start tracking your job applications by saving jobs from the Hunter Agent or JD Matcher
                    </p>
                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105">
                        Browse Jobs
                    </button>
                </motion.div>
            )}

            {/* Modals */}
            <JobDetailModal
                job={selectedJob}
                isOpen={showDetailModal}
                onClose={handleCloseDetailModal}
                onUpdate={handleUpdateJob}
                onDelete={handleDelete}
            />

            <AddJobModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onCreate={handleCreateJob}
            />
        </div>
    );
};

export default JobTrackerPage;
