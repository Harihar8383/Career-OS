import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, ArrowRight, MapPin, DollarSign, Briefcase } from 'lucide-react';

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-md my-4"
        >
            <div
                onClick={handleClick}
                className="group/card relative overflow-hidden rounded-2xl bg-bg-card border border-border-primary/50 hover:border-[#A855F7]/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_25px_-5px_rgba(168,85,247,0.15)] active:scale-[0.98]"
            >
                {/* Background Gradient Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#A855F7]/5 via-transparent to-blue-600/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

                <div className="relative p-5 flex items-start gap-4">
                    {/* Icon Box */}
                    <div className={`p-3 rounded-xl flex-shrink-0 transition-colors duration-300 ${isJobHunter ? 'bg-blue-500/10 text-blue-400 group-hover/card:bg-blue-500/20' : 'bg-[#A855F7]/10 text-[#A855F7] group-hover/card:bg-[#A855F7]/20'}`}>
                        <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold tracking-widest uppercase text-text-secondary/60">
                                {isJobHunter ? 'Job Search Agent' : 'Resume Analysis'}
                            </span>
                            <div className="p-1 rounded-full bg-white/5 opacity-0 group-hover/card:opacity-100 transition-all -translate-x-2 group-hover/card:translate-x-0">
                                <ArrowRight className="w-3 h-3 text-text-primary" />
                            </div>
                        </div>

                        <h3 className="font-clash-display font-medium text-lg text-text-primary mb-3 leading-snug group-hover/card:text-white transition-colors">
                            {data.label}
                        </h3>

                        {/* Payload Badges */}
                        {data.payload && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {data.payload.role && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 text-text-secondary border border-white/5 group-hover/card:border-white/10 transition-colors">
                                        <Briefcase className="w-3 h-3" />
                                        <span className="truncate max-w-[120px]">{data.payload.role}</span>
                                    </span>
                                )}
                                {data.payload.location && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 text-text-secondary border border-white/5 group-hover/card:border-white/10 transition-colors">
                                        <MapPin className="w-3 h-3" />
                                        <span className="truncate max-w-[100px]">{data.payload.location}</span>
                                    </span>
                                )}
                                {data.payload.minSalary && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-white/5 text-text-secondary border border-white/5 group-hover/card:border-white/10 transition-colors">
                                        <DollarSign className="w-3 h-3" />
                                        <span>{parseInt(data.payload.minSalary).toLocaleString()}</span>
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Call to Action - Appears on Hover */}
                        <div className="h-0 overflow-hidden group-hover/card:h-8 transition-all duration-300 ease-in-out opacity-0 group-hover/card:opacity-100 mt-0 group-hover/card:mt-3">
                            <span className="text-xs font-medium text-[#A855F7] flex items-center gap-1">
                                {isJobHunter ? 'Launch Job Hunter' : 'Run JD Matcher'}
                                <ArrowRight className="w-3 h-3" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
