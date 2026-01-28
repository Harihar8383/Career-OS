// frontend/src/components/Tracker/JobDetailModal.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Building2,
    MapPin,
    DollarSign,
    Calendar,
    ExternalLink,
    Edit2,
    Trash2,
    Clock,
    FileText,
    MessageSquare,
    Video,
    Paperclip
} from 'lucide-react';
import { format } from 'date-fns';

/**
 * Job Detail Modal - Sliding modal from right with tabs
 * Based on inspiration image 3
 */
export const JobDetailModal = ({
    job,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    onAddNote,
    onAddReminder,
    onAddInterview
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState(job || {});
    const [newNote, setNewNote] = useState('');
    const [isAddingNote, setIsAddingNote] = useState(false);

    const [newInterview, setNewInterview] = useState({
        round: '',
        scheduledDate: '',
        interviewers: '',
        feedback: '',
        result: 'pending'
    });
    const [isAddingInterview, setIsAddingInterview] = useState(false);

    const [newReminder, setNewReminder] = useState({
        date: '',
        message: ''
    });
    const [isAddingReminder, setIsAddingReminder] = useState(false);

    // Update editedData when job changes
    React.useEffect(() => {
        if (job) {
            setEditedData(job);
        }
    }, [job]);

    // Don't render anything if no job or not open
    if (!job || !isOpen) return null;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: FileText },
        { id: 'notes', label: 'Notes', icon: MessageSquare },
        { id: 'interviews', label: 'Interviews', icon: Video },
        { id: 'reminders', label: 'Reminders', icon: Clock },
        { id: 'documents', label: 'Documents', icon: Paperclip }
    ];

    const stageOptions = [
        { value: 'saved', label: 'Saved', color: 'blue' },
        { value: 'applied', label: 'Applied', color: 'purple' },
        { value: 'screening', label: 'Screening', color: 'yellow' },
        { value: 'interview', label: 'Interview', color: 'orange' },
        { value: 'offer', label: 'Offer', color: 'green' },
        { value: 'rejected', label: 'Rejected', color: 'red' },
        { value: 'accepted', label: 'Accepted', color: 'emerald' }
    ];

    const priorityOptions = [
        { value: 'high', label: 'High', color: 'red' },
        { value: 'medium', label: 'Medium', color: 'blue' },
        { value: 'low', label: 'Low', color: 'gray' }
    ];

    const handleSave = () => {
        onUpdate(job._id, editedData);
        setIsEditing(false);
    };

    const handleSaveNote = async () => {
        if (!newNote.trim()) return;
        await onAddNote(job._id, newNote);
        setNewNote('');
        setIsAddingNote(false);
    };

    const handleSaveInterview = async () => {
        if (!newInterview.round) return;
        await onAddInterview(job._id, newInterview);
        setNewInterview({
            round: '',
            scheduledDate: '',
            interviewers: '',
            feedback: '',
            result: 'pending'
        });
        setIsAddingInterview(false);
    };

    const handleSaveReminder = async () => {
        if (!newReminder.date || !newReminder.message) return;
        await onAddReminder(job._id, newReminder);
        setNewReminder({ date: '', message: '' });
        setIsAddingReminder(false);
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        try {
            return format(new Date(date), 'MMM dd, yyyy');
        } catch {
            return 'Invalid date';
        }
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-bg-card border-l border-border-primary shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border-primary">
                            <div className="flex-1 min-w-0 pr-4">
                                <h2 className="text-2xl font-bold text-text-primary truncate mb-1">
                                    {job.title}
                                </h2>
                                <div className="flex items-center gap-3 text-sm text-text-secondary">
                                    <div className="flex items-center gap-1.5">
                                        <Building2 size={14} />
                                        <span>{job.company}</span>
                                    </div>
                                    {job.location && (
                                        <>
                                            <span>•</span>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin size={14} />
                                                <span>{job.location}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-text-primary/10 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-text-secondary" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-6 py-3 border-b border-border-primary bg-bg-dark/30 overflow-x-auto no-scrollbar">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'text-text-secondary hover:text-text-primary hover:bg-text-primary/5'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {/* Status & Priority */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                Status
                                            </label>
                                            <select
                                                value={editedData.stage || job.stage}
                                                onChange={(e) => setEditedData({ ...editedData, stage: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-bg-dark border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {stageOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                Priority
                                            </label>
                                            <select
                                                value={editedData.priority || job.priority}
                                                onChange={(e) => setEditedData({ ...editedData, priority: e.target.value })}
                                                disabled={!isEditing}
                                                className="w-full px-3 py-2 bg-bg-dark border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:border-blue-500/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {priorityOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Job Details */}
                                    <div className="space-y-4">
                                        {job.salary && (
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                    Salary
                                                </label>
                                                <div className="flex items-center gap-2 text-text-primary">
                                                    <DollarSign size={16} className="text-green-400" />
                                                    <span>{job.salary}</span>
                                                </div>
                                            </div>
                                        )}

                                        {job.jobType && (
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                    Job Type
                                                </label>
                                                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-sm">
                                                    {job.jobType}
                                                </span>
                                            </div>
                                        )}

                                        {job.applicationDate && (
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                    Application Date
                                                </label>
                                                <div className="flex items-center gap-2 text-text-primary">
                                                    <Calendar size={16} className="text-text-secondary" />
                                                    <span>{formatDate(job.applicationDate)}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {job.description && (
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                Description
                                            </label>
                                            <div className="p-4 bg-bg-dark/50 border border-border-primary rounded-lg text-sm text-text-secondary leading-relaxed">
                                                {job.description}
                                            </div>
                                        </div>
                                    )}

                                    {/* Apply Link */}
                                    {job.applyLink && (
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                Application Link
                                            </label>
                                            <a
                                                href={job.applyLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <ExternalLink size={16} />
                                                Open Application
                                            </a>
                                        </div>
                                    )}

                                    {/* Match Score (if from matcher/hunter) */}
                                    {job.matchScore !== undefined && (
                                        <div>
                                            <label className="block text-xs font-medium text-text-secondary mb-2 uppercase tracking-wider">
                                                Match Score
                                            </label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-bg-dark rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                        style={{ width: `${job.matchScore}%` }}
                                                    />
                                                </div>
                                                <span className="text-lg font-bold text-text-primary">{job.matchScore}%</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Timestamps */}
                                    <div className="pt-4 border-t border-border-primary text-xs text-text-secondary space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} />
                                            <span>Added {formatDate(job.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} />
                                            <span>Last updated {formatDate(job.updatedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes Tab */}
                            {activeTab === 'notes' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-text-primary">Notes</h3>
                                        <button
                                            onClick={() => setIsAddingNote(!isAddingNote)}
                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {isAddingNote ? 'Cancel' : '+ Add Note'}
                                        </button>
                                    </div>

                                    {isAddingNote && (
                                        <div className="p-4 bg-bg-dark border border-border-primary rounded-lg mb-4">
                                            <textarea
                                                value={newNote}
                                                onChange={(e) => setNewNote(e.target.value)}
                                                placeholder="Write your note here..."
                                                className="w-full h-24 bg-bg-card border border-border-primary rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-blue-500/50 mb-3"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setIsAddingNote(false)}
                                                    className="px-3 py-1.5 text-text-secondary text-sm hover:text-text-primary"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveNote}
                                                    disabled={!newNote.trim()}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                                >
                                                    Save Note
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {job.notes && job.notes.length > 0 ? (
                                        <div className="space-y-3">
                                            {job.notes.slice().reverse().map((note, index) => (
                                                <div key={index} className="p-4 bg-bg-dark/50 border border-border-primary rounded-lg">
                                                    <p className="text-sm text-text-primary mb-2 whitespace-pre-wrap">{note.content}</p>
                                                    <p className="text-xs text-text-secondary">{formatDate(note.createdAt)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        !isAddingNote && (
                                            <div className="text-center py-12">
                                                <MessageSquare size={48} className="mx-auto mb-3 text-text-secondary/30" />
                                                <p className="text-text-secondary">No notes yet</p>
                                                <p className="text-xs text-text-secondary/70 mt-1">Add notes to track your thoughts</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Interviews Tab */}
                            {activeTab === 'interviews' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-text-primary">Interview Rounds</h3>
                                        <button
                                            onClick={() => setIsAddingInterview(!isAddingInterview)}
                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {isAddingInterview ? 'Cancel' : '+ Add Interview'}
                                        </button>
                                    </div>

                                    {isAddingInterview && (
                                        <div className="p-4 bg-bg-dark border border-border-primary rounded-lg mb-4 space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">Round Name</label>
                                                <input
                                                    type="text"
                                                    value={newInterview.round}
                                                    onChange={(e) => setNewInterview({ ...newInterview, round: e.target.value })}
                                                    placeholder="e.g. Technical Screen"
                                                    className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={newInterview.scheduledDate}
                                                        onChange={(e) => setNewInterview({ ...newInterview, scheduledDate: e.target.value })}
                                                        className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">Result</label>
                                                    <select
                                                        value={newInterview.result}
                                                        onChange={(e) => setNewInterview({ ...newInterview, result: e.target.value })}
                                                        className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50"
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="passed">Passed</option>
                                                        <option value="failed">Failed</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">Interviewers</label>
                                                <input
                                                    type="text"
                                                    value={newInterview.interviewers}
                                                    onChange={(e) => setNewInterview({ ...newInterview, interviewers: e.target.value })}
                                                    placeholder="Names/Roles"
                                                    className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">Feedback/Notes</label>
                                                <textarea
                                                    value={newInterview.feedback}
                                                    onChange={(e) => setNewInterview({ ...newInterview, feedback: e.target.value })}
                                                    placeholder="Feedback or notes..."
                                                    className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50 h-20"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    onClick={() => setIsAddingInterview(false)}
                                                    className="px-3 py-1.5 text-text-secondary text-sm hover:text-text-primary"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveInterview}
                                                    disabled={!newInterview.round}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                                >
                                                    Save Interview
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {job.interviews && job.interviews.length > 0 ? (
                                        <div className="space-y-3">
                                            {job.interviews.map((interview, index) => (
                                                <div key={index} className="p-4 bg-bg-dark/50 border border-border-primary rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-medium text-text-primary">{interview.round}</h4>
                                                        {interview.result && (
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${interview.result === 'passed' ? 'bg-green-500/10 text-green-400' :
                                                                interview.result === 'failed' ? 'bg-red-500/10 text-red-400' :
                                                                    'bg-yellow-500/10 text-yellow-400'
                                                                }`}>
                                                                {interview.result}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {interview.scheduledDate && (
                                                        <p className="text-sm text-text-secondary mb-2 flex items-center gap-2">
                                                            <Calendar size={12} />
                                                            {formatDate(interview.scheduledDate)}
                                                        </p>
                                                    )}
                                                    {interview.interviewers && (
                                                        <p className="text-sm text-text-secondary mb-2">
                                                            <span className="text-xs uppercase tracking-wider opacity-70">Interviewers:</span> {interview.interviewers}
                                                        </p>
                                                    )}
                                                    {interview.feedback && (
                                                        <div className="mt-2 pt-2 border-t border-border-primary/50">
                                                            <p className="text-sm text-text-secondary italic">"{interview.feedback}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        !isAddingInterview && (
                                            <div className="text-center py-12">
                                                <Video size={48} className="mx-auto mb-3 text-text-secondary/30" />
                                                <p className="text-text-secondary">No interviews scheduled</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Reminders Tab */}
                            {activeTab === 'reminders' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-text-primary">Reminders</h3>
                                        <button
                                            onClick={() => setIsAddingReminder(!isAddingReminder)}
                                            className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            {isAddingReminder ? 'Cancel' : '+ Add Reminder'}
                                        </button>
                                    </div>

                                    {isAddingReminder && (
                                        <div className="p-4 bg-bg-dark border border-border-primary rounded-lg mb-4 space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">Message</label>
                                                <input
                                                    type="text"
                                                    value={newReminder.message}
                                                    onChange={(e) => setNewReminder({ ...newReminder, message: e.target.value })}
                                                    placeholder="e.g. Follow up on application"
                                                    className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-1">Date</label>
                                                <input
                                                    type="date"
                                                    value={newReminder.date}
                                                    onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                                                    className="w-full px-3 py-2 bg-bg-card border border-border-primary rounded-lg text-sm text-text-primary focus:outline-none focus:border-blue-500/50"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    onClick={() => setIsAddingReminder(false)}
                                                    className="px-3 py-1.5 text-text-secondary text-sm hover:text-text-primary"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveReminder}
                                                    disabled={!newReminder.message || !newReminder.date}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                                >
                                                    Set Reminder
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {job.reminders && job.reminders.length > 0 ? (
                                        <div className="space-y-2">
                                            {job.reminders.map((reminder, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-bg-dark/50 border border-border-primary rounded-lg">
                                                    <Clock size={16} className="text-blue-400 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-text-primary">{reminder.message}</p>
                                                        <p className="text-xs text-text-secondary">{formatDate(reminder.date)}</p>
                                                    </div>
                                                    {reminder.completed && <span className="text-xs text-green-400 font-bold">Done</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        !isAddingReminder && (
                                            <div className="text-center py-12">
                                                <Clock size={48} className="mx-auto mb-3 text-text-secondary/30" />
                                                <p className="text-text-secondary">No reminders set</p>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Documents Tab */}
                            {activeTab === 'documents' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-text-primary">Documents</h3>
                                        <button className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors">
                                            + Upload (Coming Soon)
                                        </button>
                                    </div>

                                    {job.attachments && job.attachments.length > 0 ? (
                                        <div className="space-y-2">
                                            {job.attachments.map((doc, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-bg-dark/50 border border-border-primary rounded-lg hover:border-blue-500/30 transition-colors">
                                                    <Paperclip size={16} className="text-text-secondary" />
                                                    <span className="flex-1 text-sm text-text-primary truncate">{doc.filename}</span>
                                                    <span className="text-xs text-text-secondary">{doc.type}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Paperclip size={48} className="mx-auto mb-3 text-text-secondary/30" />
                                            <p className="text-text-secondary">No documents attached</p>
                                            <p className="text-xs text-text-secondary/70 mt-1">Upload resume, cover letter, etc.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-between p-6 border-t border-border-primary bg-bg-dark/30">
                            <button
                                onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this job?')) {
                                        onDelete(job._id);
                                        onClose();
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Trash2 size={16} />
                                Delete Job
                            </button>

                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditedData(job);
                                            }}
                                            className="px-4 py-2 bg-text-primary/5 hover:bg-text-primary/10 text-text-secondary rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
