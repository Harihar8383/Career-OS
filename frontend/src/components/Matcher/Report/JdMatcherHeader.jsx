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
        if (v.includes("Likely Filtered") || v.includes("Weak")) return "bg-red-500/10 text-red-500 border-red-500/20";
        if (v.includes("Borderline")) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        if (v.includes("Competitive") || v.includes("Strong")) return "bg-green-500/10 text-green-500 border-green-500/20";
        return "bg-slate-800 text-slate-400 border-slate-700";
    };

    return (
        <div className="w-full bg-[#0B1221] rounded-3xl border border-slate-800/60 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[320px]">

            {/* LEFT PANEL: Score & Metrics (Darker bg) */}
            <div className="md:w-[40%] bg-[#0f1629] relative p-8 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-slate-800/50">
                {/* Gauge */}
                <div className="scale-90 mb-4">
                    <ScoreGauge score={match_score} />
                </div>

                {/* Verdict Badge */}
                <div className={`mt-[-20px] mb-6 px-5 py-2 rounded-full border text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${getVerdictStyle(verdict)}`}>
                    {verdict.includes("Borderline") && <span>⚠️</span>}
                    {verdict.includes("Competitive") && <span>✅</span>}
                    {verdict.includes("Filtered") && <span>❌</span>}
                    {verdict}
                </div>

                {/* Summary Text */}
                <div>
                    <h3 className="text-white font-bold text-lg mb-2 leading-tight">
                        {header_summary}
                    </h3>
                    <p className="text-slate-500 text-sm italic font-dm-sans px-4">
                        "{emotional_line}"
                    </p>
                </div>
            </div>

            {/* RIGHT PANEL: Job Details & Info */}
            <div className="md:w-[60%] p-10 flex flex-col justify-center relative">

                {/* Job Title & Company */}
                <div className="mb-8">
                    <h1 className="text-4xl font-clash-display font-bold text-white mb-3">
                        {job_title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider text-sm">
                        <span className="text-slate-500">at</span>
                        <span className="text-blue-400">{company}</span>
                    </div>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-3 mb-12">
                    <span className="px-4 py-2 bg-[#1e293b] text-blue-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-2">
                        <BriefcaseIcon size={14} /> {experience_level}
                    </span>
                    {top_skills.map((skill, idx) => (
                        <span key={idx} className="px-4 py-2 bg-[#1e293b] text-slate-300 text-xs font-bold rounded-lg border border-slate-700 uppercase">
                            {skill}
                        </span>
                    ))}
                </div>

                {/* File Info Footer */}
                <div className="absolute bottom-6 right-8 flex items-center gap-3 text-xs text-slate-600">
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
