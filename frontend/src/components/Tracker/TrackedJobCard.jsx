// frontend/src/components/Tracker/TrackedJobCard.jsx
import React from 'react';
import { Building2, Clock, Eye, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

/**
 * Minimal job card for Kanban view
 */
export const TrackedJobCard = ({ job, onViewDetails, onDelete, className, isDragging }) => {
    const { title, company, createdAt, priority } = job;

    // Priority color for left border
    const getPriorityColor = () => {
        switch (priority) {
            case 'high':
                return 'border-l-red-500';
            case 'medium':
                return 'border-l-blue-500';
            case 'low':
                return 'border-l-gray-500';
            default:
                return 'border-l-blue-500';
        }
    };

    const formatDate = (date) => {
        try {
            return formatDistanceToNow(new Date(date), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    return (
        <div
            className={`group relative bg-bg-card/60 backdrop-blur-xl border ${getPriorityColor()} border-l-4 border-y-border-primary border-r-border-primary rounded-xl p-4 ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'} hover:border-blue-500/50 hover:bg-bg-card/80 transition-all duration-200 shadow-sm hover:shadow-md ${className || ''}`}
            onClick={onViewDetails}
        >
            {/* Content */}
            <div className="relative z-10">
                {/* Company Icon */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-bg-dark/50 rounded-lg flex items-center justify-center border border-border-primary">
                        <Building2 size={18} className="text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-text-primary truncate mb-1 group-hover:text-blue-400 transition-colors">
                            {title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                            <Building2 size={12} />
                            <span className="truncate">{company}</span>
                        </div>
                    </div>
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                    <Clock size={11} />
                    <span>Added {formatDate(createdAt)}</span>
                </div>
            </div>
        </div>
    );
};
