import React from 'react';
import { Zap, AlertCircle } from 'lucide-react';

const BulletFeedback = ({ bullets = [] }) => {
    return (
        <div className="w-full">
            <div className="border-l-4 border-[#2934FF] pl-6 mb-8">
                <h2 className="text-3xl font-clash-display font-bold text-text-primary">
                    Bullet-Point Feedback
                </h2>
                <p className="text-text-secondary text-sm mt-1">
                    Advisory mode: Specific improvements without auto-editing.
                </p>
            </div>

            <div className="space-y-6">
                {bullets.map((item, idx) => (
                    <div key={idx} className="bg-bg-card border border-border-primary rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm group hover:border-blue-500/20 transition-all duration-300">
                        {/* Header Strip */}
                        <div className="bg-bg-dark/50 px-6 py-4 border-b border-border-secondary flex justify-between items-center">
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest group-hover:text-blue-500 transition-colors">
                                Suggestion #{idx + 1}
                            </span>
                            <div className="flex gap-2">
                                {item.feedback_tag && (
                                    <span className="px-3 py-1 bg-white/5 text-gray-300 text-[10px] font-bold uppercase rounded-lg border border-white/10 backdrop-blur-md">
                                        {item.feedback_tag}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-8">
                            {/* Original Bullet */}
                            <div className="relative pl-6 border-l-2 border-red-500/30 mb-8">
                                <p className="text-xl font-serif text-text-primary italic leading-relaxed">
                                    "{item.original_bullet}"
                                </p>
                            </div>

                            {/* Explanation */}
                            <div className="flex items-start gap-4 mb-6 bg-blue-500/5 p-5 rounded-xl border border-blue-500/10">
                                <AlertCircle size={20} className="text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-blue-200/90 text-sm leading-relaxed">
                                    {item.explanation}
                                </p>
                            </div>

                            {/* Improvement */}
                            <div className="flex items-start gap-4 p-5 bg-green-500/5 rounded-xl border border-green-500/10">
                                <Zap size={20} className="text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <span className="text-green-400 font-bold text-sm uppercase tracking-wide mr-2 mb-1 block">Try:</span>
                                    <span className="text-text-primary text-md leading-relaxed font-medium">
                                        {item.improvement_example}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
                {bullets.length === 0 && (
                    <div className="text-center p-12 text-gray-500 italic bg-white/5 rounded-2xl border border-dashed border-white/10">
                        No critical bullet point issues found. Good job!
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulletFeedback;
