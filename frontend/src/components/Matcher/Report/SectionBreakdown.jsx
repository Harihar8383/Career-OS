import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SectionItem = ({ section }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { name, score, status, what_worked = [], what_is_missing = [], impact } = section;

    // Determine Badge Color
    const getBadgeStyle = (s) => {
        if (s === 'Strong') return "text-green-400";
        if (s === 'Average') return "text-yellow-400";
        return "text-red-400";
    };

    const getScoreColor = (sc) => {
        if (sc >= 80) return "text-green-400";
        if (sc >= 60) return "text-yellow-400";
        return "text-red-400";
    };

    return (
        <div className="border border-white/5 rounded-xl bg-slate-900/40 overflow-hidden mb-3">
            {/* Header (Clickable) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${status === 'Strong' ? 'bg-green-500' : status === 'Average' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="text-white font-medium font-dm-sans">{name}</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className={`font-mono font-bold ${getScoreColor(score)}`}>{score}/100</span>
                        <span className={`text-xs font-bold uppercase ${getBadgeStyle(status)}`}>{status}</span>
                    </div>
                    <ChevronDown className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} size={20} />
                </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5"
                    >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-black/20">

                            {/* What Worked */}
                            <div>
                                <h4 className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-widest mb-4">
                                    <CheckCircle2 size={14} /> What Worked
                                </h4>
                                <ul className="space-y-2">
                                    {what_worked.length > 0 ? what_worked.map((item, i) => (
                                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                            <span className="text-green-500/50 mt-1">•</span>
                                            {item}
                                        </li>
                                    )) : (
                                        <li className="text-slate-500 text-sm italic">No specific strengths detected.</li>
                                    )}
                                </ul>
                            </div>

                            {/* What Is Missing */}
                            <div>
                                <h4 className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest mb-4">
                                    <XCircle size={14} /> What Is Missing
                                </h4>
                                <ul className="space-y-2">
                                    {what_is_missing.length > 0 ? what_is_missing.map((item, i) => (
                                        <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                                            <span className="text-red-500/50 mt-1">•</span>
                                            {item}
                                        </li>
                                    )) : (
                                        <li className="text-slate-500 text-sm italic">No critical gaps detected.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Impact Note */}
                            <div className="md:col-span-2 mt-2 pt-4 border-t border-white/5">
                                <p className="text-slate-500 text-xs italic">
                                    <span className="font-bold text-slate-400 not-italic">Impact:</span> {impact}
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
