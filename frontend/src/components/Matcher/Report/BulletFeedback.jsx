import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';

const BulletFeedback = ({ bullets = [] }) => {
    return (
        <div className="w-full">
            <div className="border-l-4 border-blue-500 pl-4 mb-6">
                <h2 className="text-2xl font-clash-display font-bold text-white">
                    Bullet-Point Feedback
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                    Advisory mode: Specific improvements without auto-editing.
                </p>
            </div>

            <div className="space-y-4">
                {bullets.map((item, idx) => (
                    <div key={idx} className="bg-[#0F1623] border border-white/5 rounded-xl overflow-hidden">
                        {/* Header Strip */}
                        <div className="bg-[#131B2C] px-6 py-3 border-b border-white/5 flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                Suggestion #{idx + 1}
                            </span>
                            <div className="flex gap-2">
                                {item.feedback_tag && (
                                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded border border-white/10">
                                        {item.feedback_tag}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Original Bullet */}
                            <div className="relative pl-4 border-l-2 border-slate-700 mb-6">
                                <p className="text-xl font-serif text-slate-300 italic leading-relaxed">
                                    "{item.original_bullet}"
                                </p>
                            </div>

                            {/* Explanation */}
                            <div className="flex items-start gap-3 mb-4 bg-blue-500/5 p-4 rounded-lg border border-blue-500/10">
                                <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-blue-200/80 text-sm">
                                    {item.explanation}
                                </p>
                            </div>

                            {/* Improvement */}
                            <div className="flex items-start gap-3">
                                <Zap size={16} className="text-green-400 mt-1 shrink-0" />
                                <div>
                                    <span className="text-green-400 font-bold text-sm uppercase tracking-wide mr-2">Try:</span>
                                    <span className="text-white text-sm leading-relaxed">
                                        {item.improvement_example}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
                {bullets.length === 0 && (
                    <div className="text-center p-8 text-slate-500 italic bg-white/5 rounded-xl">
                        No critical bullet point issues found. Good job!
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulletFeedback;
