import React from 'react';
import ScoreGauge from '../ScoreGauge';
import { FileText, Building2 } from 'lucide-react';

const JdMatcherHeader = ({ data }) => {
    const {
        match_score = 0,
        verdict = "Pending Analysis",
        header_summary = "Analyzing...",
        emotional_line = "",
        jd_summary = {}
    } = data;

    const {
        job_title = "Job Title",
        company = "Company Name",
        experience_level = "N/A",
        top_skills = []
    } = jd_summary;

    // Verdict Color Logic (Badges)
    const getVerdictStyle = (v) => {
        if (v.includes("Likely Filtered") || v.includes("Weak")) return "bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
        if (v.includes("Borderline")) return "bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]";
        if (v.includes("Competitive") || v.includes("Strong")) return "bg-[#2934FF]/10 text-[#8AA5FF] border-[#2934FF]/30 shadow-[0_0_15px_rgba(41,52,255,0.3)]";
        return "bg-white/5 text-gray-400 border-white/10";
    };

    return (
        <div className="w-full bg-[#18181B]/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[320px]">

            {/* LEFT PANEL: Score & Metrics (Darker bg) */}
            <div className="md:w-[40%] bg-[#0A0A0A]/80 relative p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-white/10">
                {/* Gauge */}
                <div className="scale-90 mb-4">
                    <ScoreGauge score={match_score} />
                </div>

                {/* Verdict Badge */}
                <div className={`mt-[-20px] mb-6 px-6 py-2 rounded-full border text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${getVerdictStyle(verdict)}`}>
                    {verdict.includes("Borderline") && <span>⚠️</span>}
                    {verdict.includes("Competitive") && <span>✅</span>}
                    {verdict.includes("Filtered") && <span>❌</span>}
                    {verdict}
                </div>

                {/* Summary Text */}
                <div>
                    <h3 className="text-white font-bold text-xl mb-3 leading-tight font-clash-display">
                        {header_summary}
                    </h3>
                    <p className="text-gray-400 text-sm italic font-dm-sans px-4 leading-relaxed">
                        "{emotional_line}"
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL: Job Details & Info */}
            <div className="md:w-[60%] p-10 flex flex-col justify-center relative bg-gradient-to-br from-[#18181B]/50 to-transparent">

                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none" />

                {/* Job Title & Company */}
                <div className="mb-8 relative z-10">
                    <h1 className="text-4xl md:text-5xl font-clash-display font-medium text-white mb-4 leading-tight">
                        {job_title}
                    </h1>
                    <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                        <span className="text-gray-500">at</span>
                        <div className="flex items-center gap-2 text-[#8AA5FF]">
                            <Building2 size={16} />
                            <span className="text-lg tracking-normal capitalize">{company}</span>
                        </div>
                    </div>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-3 mb-12 relative z-10">
                    <span className="px-4 py-2 bg-white/5 text-gray-300 text-xs font-bold rounded-xl border border-white/10 flex items-center gap-2 backdrop-blur-md">
                        <BriefcaseIcon size={14} /> {experience_level}
                    </span>
                    {top_skills.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-blue-500/10 text-blue-200 text-xs font-bold rounded-xl border border-blue-500/20 uppercase backdrop-blur-md">
                            {skill}
                        </span>
                    ))}
                </div>

                {/* File Info Footer */}
                <div className="absolute bottom-6 right-8 flex items-center gap-3 text-xs text-gray-500 font-mono">
                    <FileText size={14} />
                    <span>{data.meta?.fileName || "resume.pdf"}</span>
                    <span>•</span>
                    <span>{data.meta?.analyzedAt ? new Date(data.meta.analyzedAt).toLocaleString() : "Just Now"}</span>
                </div>

            </div>

        </div>
    );
};

// Helper Icon
const BriefcaseIcon = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
    </svg>
);

export default JdMatcherHeader;
