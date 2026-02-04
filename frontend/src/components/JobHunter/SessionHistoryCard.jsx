import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Calendar,
    Briefcase,
    MapPin,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Loader2
} from 'lucide-react';

/**
 * SessionHistoryCard - Displays a summary of a single job hunt session
 */
export function SessionHistoryCard({ session }) {
    const navigate = useNavigate();

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

    const getStatusConfig = (status) => {
        switch (status) {
            case 'completed':
                return {
                    icon: CheckCircle2,
                    color: 'text-green-400',
                    bgColor: 'bg-green-500/10',
                    borderColor: 'border-green-500/30',
                    label: 'Completed'
                };
            case 'running':
                return {
                    icon: Loader2,
                    color: 'text-blue-400',
                    bgColor: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/30',
                    label: 'Running',
                    animate: true
                };
            case 'failed':
                return {
                    icon: AlertCircle,
                    color: 'text-red-400',
                    bgColor: 'bg-red-500/10',
                    borderColor: 'border-red-500/30',
                    label: 'Failed'
                };
            default:
                return {
                    icon: Clock,
                    color: 'text-yellow-400',
                    bgColor: 'bg-yellow-500/10',
                    borderColor: 'border-yellow-500/30',
                    label: 'Queued'
                };
        }
    };

    const statusConfig = getStatusConfig(session.status);
    const StatusIcon = statusConfig.icon;

    const handleClick = () => {
        // Navigate to results page for this session
        navigate(`/dashboard/hunter/session/${session.sessionId}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={handleClick}
            className="group relative bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl p-5 overflow-hidden hover:border-blue-500/30 transition-colors duration-300 cursor-pointer"
        >
            {/* Animated Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content Container */}
            <div className="relative z-10 space-y-4">
                {/* Header - Date and Status */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <Calendar size={14} />
                        <span>{formatDate(session.createdAt)}</span>
                    </div>

                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                        <StatusIcon
                            size={14}
                            className={`${statusConfig.color} ${statusConfig.animate ? 'animate-spin' : ''}`}
                        />
                        <span className={`text-xs font-semibold ${statusConfig.color}`}>
                            {statusConfig.label}
                        </span>
                    </div>
                </div>

                {/* Job Titles */}
                {session.criteria?.jobTitles && session.criteria.jobTitles.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Briefcase size={16} className="text-blue-400" />
                            <h3 className="text-base font-bold text-text-primary">
                                {session.criteria.jobTitles.join(', ')}
                            </h3>
                        </div>
                    </div>
                )}

                {/* Criteria Tags */}
                <div className="flex flex-wrap gap-2">
                    {/* Location Types */}
                    {session.criteria?.locationTypes && session.criteria.locationTypes.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30">
                            <MapPin size={12} />
                            {session.criteria.locationTypes.join(', ')}
                        </span>
                    )}

                    {/* Specific Locations */}
                    {session.criteria?.locations && session.criteria.locations.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/30">
                            {session.criteria.locations.slice(0, 2).join(', ')}
                            {session.criteria.locations.length > 2 && ` +${session.criteria.locations.length - 2}`}
                        </span>
                    )}

                    {/* Salary Range */}
                    {session.criteria?.salaryRange && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-300 border border-green-500/30">
                            <DollarSign size={12} />
                            {formatSalary(session.criteria.salaryRange)}
                        </span>
                    )}
                </div>

                {/* Footer - Job Count and CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-border-secondary">
                    <div className="text-sm">
                        <span className="text-text-secondary">Found </span>
                        <span className="font-bold text-text-primary">{session.jobCount || 0}</span>
                        <span className="text-text-secondary"> job{session.jobCount !== 1 ? 's' : ''}</span>
                    </div>

                    {session.status === 'completed' && session.jobCount > 0 && (
                        <button className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition-all duration-300">
                            View Results
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
