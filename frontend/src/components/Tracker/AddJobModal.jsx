// frontend/src/components/Tracker/AddJobModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase } from 'lucide-react';

/**
 * Add Job Modal - Form to manually add a job
 */
export const AddJobModal = ({ isOpen, onClose, onCreate }) => {
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        location: '',
        salary: '',
        jobType: 'Full-time',
        description: '',
        applyLink: '',
        stage: 'saved',
        priority: 'medium'
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await onCreate(formData);
            // Reset form
            setFormData({
                title: '',
                company: '',
                location: '',
                salary: '',
                jobType: 'Full-time',
                description: '',
                applyLink: '',
                stage: 'saved',
                priority: 'medium'
            });
            onClose();
        } catch (error) {
            console.error('Error creating job:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] bg-bg-card border border-border-primary rounded-2xl shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border-primary">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Briefcase size={20} className="text-blue-400" />
                                </div>
                                <h2 className="text-xl font-bold text-text-primary">Add Job Manually</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-text-primary/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="space-y-5">
                                {/* Job Title */}
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Job Title <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Senior Software Engineer"
                                        className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>

                                {/* Company */}
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Company <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Google"
                                        className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>

                                {/* Location & Salary */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Location
                                        </label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleChange}
                                            placeholder="e.g. Bangalore, India"
                                            className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Salary
                                        </label>
                                        <input
                                            type="text"
                                            name="salary"
                                            value={formData.salary}
                                            onChange={handleChange}
                                            placeholder="e.g. ₹15-25 LPA"
                                            className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Job Type, Stage & Priority */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Job Type
                                        </label>
                                        <select
                                            name="jobType"
                                            value={formData.jobType}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors"
                                        >
                                            <option value="Full-time">Full-time</option>
                                            <option value="Part-time">Part-time</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Stage
                                        </label>
                                        <select
                                            name="stage"
                                            value={formData.stage}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors"
                                        >
                                            <option value="saved">Saved</option>
                                            <option value="applied">Applied</option>
                                            <option value="screening">Screening</option>
                                            <option value="interview">Interview</option>
                                            <option value="offer">Offer</option>
                                            <option value="rejected">Rejected</option>
                                            <option value="accepted">Accepted</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-primary mb-2">
                                            Priority
                                        </label>
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-blue-500/50 transition-colors"
                                        >
                                            <option value="high">High</option>
                                            <option value="medium">Medium</option>
                                            <option value="low">Low</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Job Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={4}
                                        placeholder="Paste the job description here..."
                                        className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                                    />
                                </div>

                                {/* Apply Link */}
                                <div>
                                    <label className="block text-sm font-medium text-text-primary mb-2">
                                        Application Link
                                    </label>
                                    <input
                                        type="url"
                                        name="applyLink"
                                        value={formData.applyLink}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2.5 bg-bg-dark border border-border-primary rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-blue-500/50 transition-colors"
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border-primary bg-bg-dark/30">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.title || !formData.company}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                            >
                                {isSubmitting ? 'Adding...' : 'Add Job'}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
