import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const KeywordGapReport = ({ data = {} }) => {
    const { matched = [], missing = [], weak = [] } = data;

    return (
        <div className="w-full">
            <div className="border-l-4 border-[#2934FF] pl-6 mb-8">
                <h2 className="text-3xl font-clash-display font-bold text-text-primary">
                    Keyword & Skill Gap Report
                </h2>
                <p className="text-text-secondary text-sm mt-1">
                    Beat ATS without keyword stuffing.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Matched */}
                <div className="bg-bg-card/40 border border-green-500/20 rounded-2xl p-6 backdrop-blur-sm hover:bg-bg-card/60 transition-colors">
                    <h3 className="flex items-center gap-2 text-green-400 font-bold mb-6 uppercase tracking-widest text-xs">
                        <CheckCircle2 size={16} /> Matched Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {matched.length > 0 ? matched.map((tag, i) => (
                            <span key={i} className="px-3 py-1.5 bg-green-500/10 text-green-300 text-xs font-bold rounded-lg border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                {tag}
                            </span>
                        )) : <p className="text-gray-500 text-sm italic">None found.</p>}
                    </div>
                </div>

                {/* Missing */}
                <div className="bg-bg-card/40 border border-red-500/20 rounded-2xl p-6 backdrop-blur-sm hover:bg-bg-card/60 transition-colors">
                    <h3 className="flex items-center gap-2 text-red-400 font-bold mb-6 uppercase tracking-widest text-xs">
                        <XCircle size={16} /> Critical Missing
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {missing.length > 0 ? missing.map((tag, i) => (
                            <span key={i} className="px-3 py-1.5 bg-red-500/10 text-red-300 text-xs font-bold rounded-lg border border-red-500/20 decoration-dotted underline shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                {tag}
                            </span>
                        )) : <p className="text-gray-500 text-sm italic">No critical gaps.</p>}
                    </div>
                </div>

                {/* Weak */}
                <div className="bg-bg-card/40 border border-orange-500/20 rounded-2xl p-6 backdrop-blur-sm hover:bg-bg-card/60 transition-colors">
                    <h3 className="flex items-center gap-2 text-orange-400 font-bold mb-6 uppercase tracking-widest text-xs">
                        <AlertTriangle size={16} /> Weakly Implied
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {weak.length > 0 ? weak.map((tag, i) => (
                            <span key={i} className="px-3 py-1.5 bg-orange-500/10 text-orange-300 text-xs font-bold rounded-lg border border-orange-500/20 border-dashed shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                {tag}
                            </span>
                        )) : <p className="text-text-secondary text-sm italic">None detected.</p>}
                    </div>
                    <p className="text-text-secondary text-[10px] mt-6 italic border-t border-border-primary pt-2">
                        *Consider adding specific evidence for these skills.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default KeywordGapReport;
