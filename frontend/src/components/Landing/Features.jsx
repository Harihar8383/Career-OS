// src/components/Features.jsx
import React from 'react';
import { FeatureCard } from './FeatureCard';

export const Features = () => {
  return (
    <section className="bg-bg-dark pb-6 sm:pb-8 md:pb-10 overflow-hidden">
      <div className="max-w-[95vw] sm:max-w-[90vw] w-[1250px] mx-auto overflow-hidden pt-0 sm:pt-12 md:pt-15 pb-8 sm:pb-12 md:pb-15 border-t-[0.5px] border-slate-800/0 rounded-[0] px-4 sm:px-6">
        
        {/* Section Header - CORRECTED PATH */}
        <div className="text-center sm:mb-20 relative py-3 sm:py-10 pt-5 pb-8 bg-cover bg-center mb-2! sm:mb-8!" style={{ backgroundImage: "url('/images/section2/HeaderBg.svg')" }}>
          <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 bg-primary border border-primary-light rounded-full mb-4 sm:mb-6 relative z-10">
            {/* CareerOS Content */}
            <span className="text-accent text-xs sm:text-sm font-medium tracking-[0.98px] uppercase font-dm-sans">Features</span>
          </div>
          <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-4 sm:mb-6 relative z-10 font-clash-display leading-tight">
            {/* CareerOS Content */}
            Your Agentic Workflow
          </h2>
          <p className="text-text-body text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed relative z-10 font-dm-sans">
            {/* CareerOS Content */}
            From resume to interview, your personal AI agent handles the heavy lifting.
          </p>
        </div>

        {/* --- CareerOS Features --- */}

        {/* Row 1 (2 Cards) */}
        <div className="flex flex-col sm:flex-row justify-between w-full gap-3 sm:gap-4 md:gap-6">
          <FeatureCard
            title="Smart Profile"
            description="Upload your resume, and our AI extracts key skills, projects, and experience to build your dynamic profile."
            className="w-full sm:w-[48%] md:w-[49%] h-[280px] sm:h-[320px] md:h-[367px] flex-shrink-0"
          />
          <FeatureCard
            title="AI Mentor & Analyser"
            description="Get hyper-personalized career advice and resume optimization tips from an AI trained on your own experience."
            className="w-full sm:w-[48%] md:w-[49%] h-[280px] sm:h-[320px] md:h-[367px] flex-shrink-0"
          />
        </div>
        
        {/* Row 2 (3 Cards) - CORRECTED PATH for imgSrc */}
        <div className="mt-4 sm:mt-6 md:mt-8 flex flex-col sm:flex-row justify-between w-full gap-3 sm:gap-4 md:gap-6">
          <FeatureCard
            title="JD Matcher"
            description="Instantly see how your profile stacks up against any job description with our in-depth RAG analysis."
            className="w-full sm:w-[31%] md:w-[32%] h-[280px] sm:h-[320px] md:h-[367px] flex-shrink-0"
          />
          <FeatureCard
            title="Job Hunter Agent"
            description="Activate your AI agent to search live portals, rank top matches, and deliver a curated list for your approval."
            className="w-full sm:w-[31%] md:w-[32%] h-[280px] sm:h-[320px] md:h-[367px] flex-shrink-0"
            imgSrc="/images/section2/Card2Users.png" // This matches the Aniq UI
          />
          <FeatureCard
            title="Interview & Letter Writer"
            description="Automatically generate AI cover letters and prepare for interviews with mock scenarios based on the exact job."
            className="w-full sm:w-[31%] md:w-[32%] h-[280px] sm:h-[320px] md:h-[367px] flex-shrink-0"
          />
        </div>
        {/* --- End of CareerOS Features --- */}

      </div>
    </section>
  );
};