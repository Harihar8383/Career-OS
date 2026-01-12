import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const KeywordGapReport = ({ data = {} }) => {
    const { matched = [], missing = [], weak = [] } = data;

    return (
        <div className="w-full">
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-2xl font-clash-display font-bold text-white">
                    Keyword & Skill Gap Report
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Beat ATS without keyword stuffing.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Matched */}
                <div className="bg-[#0B1120] border border-green-500/20 rounded-xl p-6">
                    <h3 className="flex items-center gap-2 text-green-400 font-bold mb-4 uppercase tracking-widest text-sm">
                        <CheckCircle2 size={16} /> Matched Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {matched.length > 0 ? matched.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-green-500/10 text-green-300 text-xs font-bold rounded border border-green-500/20">
                                {tag}
                            </span>
                        )) : <p className="text-slate-600 text-sm">None found.</p>}
                    </div>
                </div>

                {/* Missing */}
                <div className="bg-[#0B1120] border border-red-500/20 rounded-xl p-6">
                    <h3 className="flex items-center gap-2 text-red-400 font-bold mb-4 uppercase tracking-widest text-sm">
                        <XCircle size={16} /> Critical Missing
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {missing.length > 0 ? missing.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-red-500/10 text-red-300 text-xs font-bold rounded border border-red-500/20 decoration-dotted underline">
                                {tag}
                            </span>
                        )) : <p className="text-slate-600 text-sm">No critical gaps.</p>}
                    </div>
                </div>

                {/* Weak */}
                <div className="bg-[#0B1120] border border-yellow-500/20 rounded-xl p-6">
                    <h3 className="flex items-center gap-2 text-yellow-400 font-bold mb-4 uppercase tracking-widest text-sm">
                        <AlertTriangle size={16} /> Weakly Implied
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {weak.length > 0 ? weak.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-yellow-500/10 text-yellow-300 text-xs font-bold rounded border border-yellow-500/20 border-dashed">
                                {tag}
                            </span>
                        )) : <p className="text-slate-600 text-sm">None detected.</p>}
                    </div>
                    <p className="text-slate-500 text-[10px] mt-4 italic">
                        *Consider adding specific evidence for these skills.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default KeywordGapReport;
