import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, ArrowRight } from 'lucide-react';

export default function ActionCard({ data }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (data.action === 'OPEN_JOB_HUNTER') {
            navigate('/dashboard/hunter', { state: { prefilled: data.payload } });
        } else if (data.action === 'OPEN_JD_MATCHER') {
            navigate('/dashboard/matcher', { state: { prefilled: data.payload } });
        }
    };

    const isJobHunter = data.action === 'OPEN_JOB_HUNTER';
    const Icon = isJobHunter ? Search : FileText;

    // Color scheme based on action type
    const colors = isJobHunter
        ? {
            border: 'from-blue-500/50 to-blue-600/50',
            glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]',
            icon: 'text-blue-400',
            button: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30'
        }
        : {
            border: 'from-purple-500/50 to-purple-600/50',
            glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.25)]',
            icon: 'text-purple-400',
            button: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30'
        };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`relative group cursor-pointer ${colors.glow
                } transition-all duration-300`}
            onClick={handleClick}
        >
            {/* Glassmorphism Card */}
            <div className="relative bg-bg-card/60 backdrop-blur-xl rounded-xl p-5 border border-border/50 overflow-hidden">
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl`} />
                <div className="absolute inset-[1px] bg-bg-card/80 backdrop-blur-xl rounded-xl" />

                {/* Content */}
                <div className="relative z-10 flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`p-3 rounded-lg bg-bg-secondary/50 ${colors.icon}`}
                    >
                        <Icon className="w-6 h-6" />
                    </motion.div>

                    {/* Text Content */}
                    <div className="flex-1">
                        <p className="text-xs text-text-secondary mb-1">AI Suggestion</p>
                        <h3 className="text-base font-medium text-text-primary mb-3">
                            {data.label}
                        </h3>

                        {/* Payload Badges */}
                        {data.payload && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {data.payload.role && (
                                    <span className="px-2 py-1 text-xs rounded-md bg-bg-secondary/50 text-text-secondary border border-border/30">
                                        {data.payload.role}
                                    </span>
                                )}
                                {data.payload.location && (
                                    <span className="px-2 py-1 text-xs rounded-md bg-bg-secondary/50 text-text-secondary border border-border/30">
                                        📍 {data.payload.location}
                                    </span>
                                )}
                                {data.payload.minSalary && (
                                    <span className="px-2 py-1 text-xs rounded-md bg-bg-secondary/50 text-text-secondary border border-border/30">
                                        💰 ${data.payload.minSalary.toLocaleString()}+
                                    </span>
                                )}
                                {data.payload.url && (
                                    <span className="px-2 py-1 text-xs rounded-md bg-bg-secondary/50 text-text-secondary border border-border/30 truncate max-w-[200px]">
                                        🔗 {new URL(data.payload.url).hostname}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Action Button */}
                        <button
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${colors.button
                                } group-hover:gap-3`}
                        >
                            <span className="text-sm font-medium">
                                {isJobHunter ? 'Search Jobs' : 'Analyze Job'}
                            </span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
