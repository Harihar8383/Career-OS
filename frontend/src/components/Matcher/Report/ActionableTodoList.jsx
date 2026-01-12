import React from 'react';
import { AlertCircle, Check, ArrowRight, Copy, Zap, ShieldAlert } from 'lucide-react';

const PriorityBadge = ({ priority }) => {
    // priority could be 'High', 'Medium', 'Low'
    const color = priority === 'High' ? 'bg-red-500' : priority === 'Medium' ? 'bg-orange-500' : 'bg-yellow-500';
    return <div className={`w-3 h-3 rounded-full ${color} shadow shadow-${color}/50`} />;
};

const TopImprovements = ({ items = [] }) => (
    <div className="col-span-1 lg:col-span-7 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <span className="text-blue-400">⚡</span> Top Improvement Opportunities
        </h3>

        {items.map((item, idx) => (
            <div key={idx} className="bg-[#131B2C] border border-white/5 p-5 rounded-xl flex items-start gap-4 hover:border-blue-500/30 transition-colors group">
                <div className="mt-1.5 font-mono text-slate-600 text-sm font-bold opacity-50">{idx + 1}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <PriorityBadge priority={item.priority} />
                        <h4 className="text-white font-medium text-lg">{item.action}</h4>
                    </div>
                    <p className="text-slate-400 text-sm mb-3 leading-relaxed">
                        {item.why_it_matters}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-white/5 border border-white/5 rounded text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {item.where_to_apply || "General"}
                        </span>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const SkillValidator = ({ items = [] }) => (
    <div className="col-span-1 lg:col-span-5 border border-white/5 bg-[#0F1623] rounded-xl p-6 h-fit">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
            <span className="text-purple-400">🛡️</span> Skill Evidence Validator
        </h3>

        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-bold">{item.skill}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${item.status === 'Proven' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                item.status === 'Verified' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {item.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <span>Found in: {item.location || "Not found"}</span>
                    </div>
                    <p className={`text-xs leading-relaxed ${item.status === 'Proven' ? 'text-green-500/70' :
                            item.status === 'Verified' ? 'text-blue-500/70' :
                                'text-red-500/70'
                        }`}>
                        {item.evidence_strength}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

const ExperienceOptimizer = ({ items = [] }) => {
    if (items.length === 0) return null;

    // Just show first one for now as per design
    const item = items[0];

    return (
        <div className="col-span-full mt-8 bg-[#0F1623] border border-white/5 rounded-xl p-6">
            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                <span className="text-orange-400">🔄</span> Experience Optimizer
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Arrow in middle */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 rounded-full items-center justify-center border border-slate-700 z-10">
                    <ArrowRight size={14} className="text-slate-400" />
                </div>

                {/* Original */}
                <div className="bg-[#1A181E] p-6 rounded-xl border border-red-500/10">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Your Resume</p>
                    <p className="text-slate-300 font-dm-sans leading-relaxed italic opacity-80">
                        "{item.original_text}"
                    </p>
                </div>

                {/* Optimized */}
                <div className="bg-[#121F1F] p-6 rounded-xl border border-green-500/10 relative group">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3">Optimized for JD</p>
                    <p className="text-white font-dm-sans leading-relaxed">
                        "{item.optimized_text}"
                    </p>

                    <button
                        onClick={() => navigator.clipboard.writeText(item.optimized_text)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition opacity-0 group-hover:opacity-100"
                    >
                        <Copy size={12} /> Copy Text
                    </button>
                </div>
            </div>
        </div>
    );
}

const MissingSectionAlerts = ({ items = [] }) => {
    if (!items || items.length === 0) return null;

    return (
        <div className="col-span-full mt-6 space-y-4">
            {items.map((alert, idx) => (
                <div key={idx} className="border-l-4 border-orange-500 bg-[#161209] p-6 rounded-r-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-2">
                            <ShieldAlert className="text-orange-500" /> Missing Section Alert
                        </h4>
                        <p className="text-lg font-bold text-orange-200 mb-2">{alert.section_name}</p>
                        <p className="text-slate-400 mb-6">{alert.message}</p>

                        {alert.suggestion_template && (
                            <div className="bg-black/40 p-4 rounded-lg border border-white/5 relative group">
                                <p className="font-mono text-sm text-slate-300 mb-2">{alert.suggestion_template.title}</p>
                                <p className="font-dm-sans text-sm text-slate-500 italic border-l-2 border-slate-700 pl-3">
                                    {alert.suggestion_template.description}
                                </p>
                                <button className="absolute top-4 right-4 text-slate-500 hover:text-white">
                                    <Copy size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

const ActionableTodoList = ({ data = {} }) => {
    const {
        top_improvements = [],
        skill_evidence_validator = [],
        experience_optimizer = [],
        missing_section_alerts = []
    } = data;

    return (
        <div className="w-full">
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-2xl font-clash-display font-bold text-white">
                    Actionable To-Do List
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Your step-by-step optimization plan.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <TopImprovements items={top_improvements} />
                <SkillValidator items={skill_evidence_validator} />
                <ExperienceOptimizer items={experience_optimizer} />
                <MissingSectionAlerts items={missing_section_alerts} />
            </div>
        </div>
    );
};

export default ActionableTodoList;
