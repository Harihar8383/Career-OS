import React from 'react';
import { MapPin, Briefcase, DollarSign, Clock, ExternalLink, Building2, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * JobCard - Displays a single job result with Phase 4 enhancements (Shiny Glass Design)
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

    // New Tier Colors - More vibrant/neon
    const getTierColor = (tierValue) => {
        switch (tierValue) {
            case 'S': return 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]';
            case 'A+': return 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(41,52,255,0.3)]';
            case 'A': return 'bg-green-500/20 text-green-300 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
            case 'B+': return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
            default: return 'bg-gray-500/20 text-gray-300 border-gray-500/50';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="group relative bg-bg-card/60 backdrop-blur-xl border border-border-primary rounded-2xl p-5 overflow-hidden hover:border-blue-500/30 transition-colors duration-300"
        >
            {/* Animated Gradient Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Spotlight Glow Effect */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/20 blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content Container (z-10 to stay above effects) */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        {/* Tags Row */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-text-primary/5 text-text-secondary border border-border-secondary uppercase tracking-wider backdrop-blur-md">
                                {getSourceLabel(source)}
                            </span>

                            {tierLabel && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getTierColor(tier)}`}>
                                    {tierLabel}
                                </span>
                            )}

                            {rank && rank <= 3 && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Award size={10} />
                                    #{rank}
                                </span>
                            )}
                        </div>

                        <h3 className="text-lg font-bold text-text-primary mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 transition-all duration-300">
                            {title}
                        </h3>

                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                            <Building2 size={14} className="text-blue-400" />
                            <span className="truncate hover:text-text-primary transition-colors cursor-default">{company}</span>
                        </div>
                    </div>

                    {/* Match Score Ring */}
                    {matchScore && (
                        <div className="flex-shrink-0 relative group/score">
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-lg ${matchScore >= 90
                                ? 'bg-green-500/10 text-green-300 border-green-500/30 shadow-green-500/10'
                                : matchScore >= 75
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30 shadow-blue-500/10'
                                    : 'bg-orange-500/10 text-orange-300 border-orange-500/30 shadow-orange-500/10'
                                }`}>
                                {matchScore}%
                            </div>
                        </div>
                    )}
                </div>

                {/* Badges / Tech Stack */}
                {badges && badges.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                        {badges.slice(0, 4).map((badge, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-text-primary/5 text-text-secondary border border-border-secondary hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
                            >
                                {badge}
                            </span>
                        ))}
                        {badges.length > 4 && (
                            <span className="text-[10px] text-text-secondary">+{badges.length - 4}</span>
                        )}
                    </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm">
                    {location && (
                        <div className="flex items-center gap-2 text-text-secondary">
                            <MapPin size={14} className="text-text-secondary" />
                            <span className="truncate">{location}</span>
                        </div>
                    )}
                    {salary && (
                        <div className="flex items-center gap-2 text-text-secondary">
                            <DollarSign size={14} className="text-text-secondary" />
                            <span className="truncate">{salary}</span>
                        </div>
                    )}
                    {type && (
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Briefcase size={14} className="text-text-secondary" />
                            <span className="capitalize">{type}</span>
                        </div>
                    )}
                    {postedDate && (
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Clock size={14} className="text-text-secondary" />
                            <span>{postedDate}</span>
                        </div>
                    )}
                </div>

                {/* Gap Analysis Warning (if needed) */}
                {gapAnalysis && gapAnalysis !== "Good match" && (
                    <div className="mb-4 p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex items-start gap-3">
                        <TrendingUp size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-orange-300 mb-0.5">Gap Analysis</p>
                            <p className="text-xs text-orange-200/70 leading-relaxed line-clamp-2">{gapAnalysis}</p>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                <a
                    href={applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                >
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 
                                     bg-text-primary/5 hover:bg-blue-600 border border-border-primary hover:border-blue-500
                                     text-text-primary hover:text-white rounded-xl text-sm font-semibold transition-all duration-300
                                     group/btn shadow-lg hover:shadow-blue-600/25">
                        <span className="group-hover/btn:mr-1 transition-all">View Opportunity</span>
                        <ExternalLink size={16} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 transition-all" />
                    </button>
                </a>
            </div>
        </motion.div>
    );
}
