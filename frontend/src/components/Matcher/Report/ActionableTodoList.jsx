import React from 'react';
import { AlertCircle, Check, ArrowRight, Copy, Zap, ShieldAlert } from 'lucide-react';

const PriorityBadge = ({ priority }) => {
    // priority could be 'High', 'Medium', 'Low'
    const color = priority === 'High' ? 'bg-red-500 shadow-red-500/50' : priority === 'Medium' ? 'bg-orange-500 shadow-orange-500/50' : 'bg-yellow-500 shadow-yellow-500/50';
    return <div className={`w-2.5 h-2.5 rounded-full ${color} shadow-[0_0_10px_currentColor]`} />;
};

const TopImprovements = ({ items = [] }) => (
    <div className="col-span-1 lg:col-span-7 space-y-4">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-4">
            <span className="text-blue-400">⚡</span> Top Improvement Opportunities
        </h3>

        {items.map((item, idx) => (
            <div key={idx} className="bg-[#18181B]/40 hover:bg-[#18181B]/80 hover:border-blue-500/30 border border-white/5 p-5 rounded-2xl flex items-start gap-5 transition-all duration-300 group">
                <div className="mt-1 font-mono text-gray-600 text-sm font-bold group-hover:text-blue-500 transition-colors w-6 text-center">0{idx + 1}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <PriorityBadge priority={item.priority} />
                        <h4 className="text-white font-bold text-lg leading-tight">{item.action}</h4>
                    </div>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed font-dm-sans">
                        {item.why_it_matters}
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-gray-400 font-bold uppercase tracking-wider backdrop-blur-sm">
                            {item.where_to_apply || "General"}
                        </span>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const SkillValidator = ({ items = [] }) => (
    <div className="col-span-1 lg:col-span-5 border border-white/10 bg-[#18181B]/40 backdrop-blur-sm rounded-2xl p-6 h-fit shadow-xl">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
            <span className="text-purple-400">🛡️</span> Skill Evidence Validator
        </h3>

        <div className="space-y-4">
            {items.map((item, idx) => (
                <div key={idx} className="bg-black/20 rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-bold">{item.skill}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${item.status === 'Proven' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            item.status === 'Verified' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}>
                            {item.status}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-mono">
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
        <div className="col-span-full mt-8 bg-[#18181B]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-orange-500/20 via-transparent to-transparent opacity-50" />

            <h3 className="flex items-center gap-2 text-lg font-bold text-white mb-6">
                <span className="text-orange-400">🔄</span> Experience Optimizer
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Arrow in middle */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-[#0A0A0A] rounded-full items-center justify-center border border-white/10 z-10 shadow-xl">
                    <ArrowRight size={16} className="text-gray-400" />
                </div>

                {/* Original */}
                <div className="bg-[#0A0A0A] p-6 rounded-xl border border-white/5 relative">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3">Your Resume</p>
                    <p className="text-gray-400 font-dm-sans leading-relaxed italic opacity-80 pl-4 border-l-2 border-red-500/20">
                        "{item.original_text}"
                    </p>
                </div>

                {/* Optimized */}
                <div className="bg-gradient-to-br from-[#121F1F] to-[#0A0A0A] p-6 rounded-xl border border-green-500/20 relative group hover:shadow-[0_0_30px_rgba(20,83,45,0.2)] transition-all">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Zap size={12} className="fill-green-400" /> Optimized for JD
                    </p>
                    <p className="text-white font-dm-sans leading-relaxed pl-4 border-l-2 border-green-500">
                        "{item.optimized_text}"
                    </p>

                    <button
                        onClick={() => navigator.clipboard.writeText(item.optimized_text)}
                        className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-green-600/20 hover:bg-green-600 text-green-300 hover:text-white border border-green-500/30 rounded-lg text-xs font-bold transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
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
                <div key={idx} className="border-l-4 border-orange-500 bg-[#18181B]/80 backdrop-blur-sm p-6 rounded-r-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent opacity-50" />

                    <div className="relative z-10">
                        <div className="flex items-start gap-4">
                            <ShieldAlert className="text-orange-500 flex-shrink-0 mt-1" size={24} />
                            <div>
                                <h4 className="flex items-center gap-2 text-xl font-bold text-white mb-1 font-clash-display">
                                    Missing Section Alert: <span className="text-orange-400">{alert.section_name}</span>
                                </h4>
                                <p className="text-gray-400 mb-6 font-dm-sans">{alert.message}</p>

                                {alert.suggestion_template && (
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5 relative group/code hover:border-white/10 transition-colors">
                                        <p className="font-mono text-sm text-blue-300 mb-2 font-bold">{alert.suggestion_template.title}</p>
                                        <p className="font-dm-sans text-sm text-gray-400 italic border-l-2 border-white/10 pl-4 py-1">
                                            {alert.suggestion_template.description}
                                        </p>
                                        <button
                                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
                                            onClick={() => navigator.clipboard.writeText(`${alert.suggestion_template.title}\n${alert.suggestion_template.description}`)}
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
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
            <div className="border-l-4 border-[#2934FF] pl-6 mb-8">
                <h2 className="text-3xl font-clash-display font-bold text-white">
                    Actionable To-Do List
                </h2>
                <p className="text-gray-400 text-sm mt-1">
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
