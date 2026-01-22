import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, Building2, Award, TrendingUp } from 'lucide-react';

/**
 * JobCard - Displays a single job result with Phase 4 enhancements
 * @param {Object} job - Job data object with tier, badges, and gap analysis
 */
export function JobCard({ job }) {
    const {
        title,
        company,
        location,
        salary,
        type,
        postedDate,
        applyLink,
        description,
        matchScore,
        source,
        // Phase 4 fields
        tierLabel,
        tier,
        badges = [],
        gapAnalysis,
        rank
    } = job;

    const getSourceLabel = (src) => {
        if (!src) return 'Unknown Source';
        if (src.includes('adzuna')) return 'Adzuna';
        if (src.includes('tavily')) return 'Web Search';
        if (src.includes('hiringcafe')) return 'HiringCafe';
        return src;
    };

    // Tier color mapping
    const getTierColor = (tierValue) => {
        switch (tierValue) {
            case 'S': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
            case 'A+': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
            case 'A': return 'bg-green-500/20 text-green-300 border-green-500/40';
            case 'B+': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/40';
        }
    };

    return (
        <div className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 hover:border-blue-500/30 rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-text-secondary border border-white/5 uppercase tracking-wide">
                            {getSourceLabel(source)}
                        </span>

                        {/* Tier Label */}
                        {tierLabel && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getTierColor(tier)}`}>
                                {tierLabel}
                            </span>
                        )}

                        {/* Rank Badge */}
                        {rank && rank <= 3 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                #{rank}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                        {title}
                    </h3>

                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <Building2 size={14} />
                        <span className="truncate">{company}</span>
                    </div>
                </div>

                {matchScore && (
                    <div className="flex-shrink-0">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${matchScore >= 90
                            ? 'bg-green-500/20 text-green-300 border-green-500/30'
                            : matchScore >= 80
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                : matchScore >= 70
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                                    : 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                            }`}>
                            {matchScore}% Match
                        </div>
                    </div>
                )}
            </div>

            {/* Badges */}
            {badges && badges.length > 0 && (
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {badges.map((badge, index) => (
                        <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                        >
                            {badge}
                        </span>
                    ))}
                </div>
            )}

            {/* Details */}
            <div className="space-y-2 mb-4">
                {location && (
                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                        <MapPin size={14} className="flex-shrink-0" />
                        <span className="truncate">{location}</span>
                    </div>
                )}

                <div className="flex items-center gap-4 flex-wrap text-sm">
                    {type && (
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <Briefcase size={14} />
                            <span className="capitalize">{type}</span>
                        </div>
                    )}

                    {salary && (
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <DollarSign size={14} />
                            <span>{salary}</span>
                        </div>
                    )}

                    {postedDate && (
                        <div className="flex items-center gap-1.5 text-text-secondary">
                            <Clock size={14} />
                            <span>{postedDate}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Gap Analysis */}
            {gapAnalysis && gapAnalysis !== "Good match" && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                        <TrendingUp size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-medium text-yellow-300 mb-1">Gap Analysis</p>
                            <p className="text-xs text-yellow-200/80">{gapAnalysis}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Description */}
            {description && (
                <p className="text-text-secondary text-sm line-clamp-2 mb-4">
                    {description}
                </p>
            )}

            {/* Action Button */}
            <a
                href={applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-500 text-blue-300 hover:text-white rounded-lg text-sm font-medium transition-all duration-200 group/btn"
            >
                <span>View Job</span>
                <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </a>
        </div>
    );
}
