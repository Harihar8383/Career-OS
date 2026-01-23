import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectionItem = ({ section }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { name, score, status, what_worked = [], what_is_missing = [], impact } = section;

    // Determine Badge Color (Aligned with Design System)
    const getBadgeStyle = (s) => {
        if (s === 'Strong') return "text-green-400";
        if (s === 'Average') return "text-orange-400";
        return "text-red-400";
    };

    const getScoreColor = (sc) => {
        if (sc >= 80) return "text-green-400";
        if (sc >= 60) return "text-orange-400";
        return "text-red-400";
    };

    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-300 mb-3 group ${isOpen ? 'bg-[#18181B]/80 border-blue-500/30 shadow-[0_0_20px_rgba(41,52,255,0.1)]' : 'bg-[#18181B]/40 border-white/5 hover:border-white/10 hover:bg-[#18181B]/60'}`}>
            {/* Header (Clickable) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-5 transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_10px_currentColor] ${status === 'Strong' ? 'text-green-500 bg-green-500' : status === 'Average' ? 'text-orange-500 bg-orange-500' : 'text-red-500 bg-red-500'}`} />
                    <span className="text-white font-bold font-dm-sans text-lg">{name}</span>
                </div>

                <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                        <span className={`font-mono font-bold ${getScoreColor(score)}`}>{score}/100</span>
                        <div className="w-px h-4 bg-white/10" />
                        <span className={`text-xs font-bold uppercase tracking-wider ${getBadgeStyle(status)}`}>{status}</span>
                    </div>
                    <ChevronDown className={`text-gray-500 transition-transform duration-300 group-hover:text-white ${isOpen ? 'rotate-180' : ''}`} size={20} />
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="border-t border-white/5"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20">

                            {/* What Worked */}
                            <div>
                                <h4 className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest mb-4">
                                    <CheckCircle2 size={16} /> What Worked
                                </h4>
                                <ul className="space-y-3">
                                    {what_worked.length > 0 ? what_worked.map((item, i) => (
                                        <li key={i} className="text-gray-300 text-sm flex items-start gap-3 leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-1.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    )) : (
                                        <li className="text-gray-500 text-sm italic">No specific strengths detected.</li>
                                    )}
                                </ul>
                            </div>

                            {/* What Is Missing */}
                            <div>
                                <h4 className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-4">
                                    <XCircle size={16} /> What Is Missing
                                </h4>
                                <ul className="space-y-3">
                                    {what_is_missing.length > 0 ? what_is_missing.map((item, i) => (
                                        <li key={i} className="text-gray-300 text-sm flex items-start gap-3 leading-relaxed">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 flex-shrink-0" />
                                            {item}
                                        </li>
                                    )) : (
                                        <li className="text-gray-500 text-sm italic">No critical gaps detected.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Impact Note */}
                            <div className="md:col-span-2 mt-2 pt-4 border-t border-white/5">
                                <p className="text-gray-400 text-sm bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl">
                                    <span className="font-bold text-blue-300 mr-2">💡 Impact:</span>
                                    {impact}
                                </p>
                            </div>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SectionBreakdown = ({ sections = [] }) => {
    return (
        <div className="w-full">
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-2xl font-clash-display font-bold text-white">
                    Section-Wise Match Breakdown
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Transparent analysis to build trust in your score.
                </p>
            </div>

            <div className="flex flex-col gap-1">
                {sections.map((section, idx) => (
                    <SectionItem key={idx} section={section} />
                ))}
            </div>
        </div>
    );
};

export default SectionBreakdown;
