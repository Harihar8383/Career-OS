// frontend/src/components/Tracker/TrackedJobCard.jsx
import React, { memo } from 'react';
import { Building2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Minimal job card for Kanban view
 * Memoized to prevent unnecessary re-renders during drag operations
 */
export const TrackedJobCard = memo(({ job, onViewDetails, className, isDragging }) => {
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

    const handleClick = (e) => {
        e.stopPropagation(); // Prevent drag start if clicking (though dnd-kit usually handles this via activationConstraint)
        onViewDetails(job);
    };

    return (
        <div
            className={`group relative bg-bg-card/90 backdrop-blur-sm border ${getPriorityColor()} border-l-4 border-y-border-primary border-r-border-primary rounded-xl p-4 ${isDragging ? 'cursor-grabbing ring-2 ring-blue-500/40' : 'cursor-pointer'} hover:border-blue-500/50 hover:bg-bg-card transition-colors duration-200 shadow-sm ${className || ''}`}
            onClick={handleClick}
        >
            {/* Content */}
            <div className="relative z-10 pointer-events-none"> {/* content doesn't need pointer events, wrapper handles click */}
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
});

TrackedJobCard.displayName = 'TrackedJobCard';
