// src/components/Hero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// --- Animation Variants ---
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const floatCard = (delay, rotate) => ({
  initial: { opacity: 0, y: 30, scale: 0.8, rotate: rotate },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: delay,
      ease: 'easeOut'
    }
  },
});
// --- End Animation Variants ---


export const Hero = () => {
  return (
    // section is relative and overflow-x-hidden
    <section className="relative w-full bg-bg-dark pt-23 sm:pt-24 md:pt-26 lg:pt-28 xl:pt-36 overflow-x-hidden pb-16 overflow-hidden">
      
      {/* Background animated beams (z-0 behind everything) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center"
        aria-hidden="true"
      >
        {/* Container to limit beam width and center */}
        <div className="relative w-full max-w-[1400px] h-full mx-auto">
          
          {/* --- NEW BEAMS --- */}
          {/* Beam 1 */}
          <div
            className="absolute top-[-50%] left-[10%] w-[8%] h-[200%] rounded-full opacity-15 mix-blend-lighten"
            style={{
              background: 'linear-gradient(180deg, rgba(62,130,255,0.4) 0%, rgba(62,130,255,0.05) 60%, transparent 100%)',
              transform: 'rotate(25deg)',
              filter: 'blur(60px)',
            }}
          />
          {/* Beam 2 */}
          <div
            className="absolute top-[-50%] left-[30%] w-[10%] h-[200%] rounded-full opacity-15 mix-blend-lighten"
            style={{
              background: 'linear-gradient(180deg, rgba(62,130,255,0.4) 0%, rgba(62,130,255,0.05) 60%, transparent 100%)',
              transform: 'rotate(35deg)',
              filter: 'blur(60px)',
            }}
          />
          {/* Beam 3 */}
          <div
            className="absolute top-[-50%] left-[55%] w-[6%] h-[200%] rounded-full opacity-10 mix-blend-lighten"
            style={{
              background: 'linear-gradient(180deg, rgba(62,130,255,0.4) 0%, rgba(62,130,255,0.05) 60%, transparent 100%)',
              transform: 'rotate(20deg)',
              filter: 'blur(50px)',
            }}
          />
          {/* Beam 4 */}
          <div
            className="absolute top-[-50%] left-[75%] w-[8%] h-[200%] rounded-full opacity-15 mix-blend-lighten"
            style={{
              background: 'linear-gradient(180deg, rgba(62,130,255,0.4) 0%, rgba(62,130,255,0.05) 60%, transparent 100%)',
              transform: 'rotate(30deg)',
              filter: 'blur(60px)',
            }}
          />
          {/* Beam 5 */}
          <div
            className="absolute top-[-50%] left-[90%] w-[10%] h-[200%] rounded-full opacity-10 mix-blend-lighten"
            style={{
              background: 'linear-gradient(180deg, rgba(62,130,255,0.4) 0%, rgba(62,130,255,0.05) 60%, transparent 100%)',
              transform: 'rotate(40deg)',
              filter: 'blur(72px)',
            }}
          />
          {/* --- END NEW BEAMS --- */}

        </div>
      </div>
      
      {/* Hero Content Area (z-30) */}
      <div className="relative z-30 flex flex-col items-center justify-start px-6 sm:px-6 text-left md:text-center">
        <motion.div 
          className="relative w-full max-w-4xl"
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
        >
          {/* Text & Buttons */}
          <div className="flex flex-col gap-6 sm:gap-6 md:gap-8 items-start md:items-center justify-start w-full">
            <div className="flex flex-col gap-5 sm:gap-4 items-start md:items-center justify-start w-full">
              
              <motion.div variants={fadeIn}>
                <div className="text-blue-200 sm:text-blue-300 text-[9px] sm:text-[12px] md:text-[14px] font-medium tracking-[0.98px] uppercase leading-[18px] sm:leading-[18px] md:leading-[20px] font-dm-sans bg-blue-500/20 sm:bg-blue-600/10 px-3 sm:px-3 py-[2px] sm:py-1 rounded-full border border-blue-400/50 sm:border-blue-500/30">
                  The Agentic Career Platform
                </div>
              </motion.div>
              
              <motion.h1 
                variants={fadeIn}
                className="text-[35px] sm:text-[35px] md:text-[42px] lg:text-[56px] xl:text-[76px] leading-[32px] sm:leading-[36px] md:leading-[46px] lg:leading-[60px] xl:leading-[77px] tracking-[-0.56px] sm:tracking-[-0.64px] md:tracking-[-0.84px] lg:tracking-[-1.12px] xl:tracking-[-1.42px] bg-gradient-to-b from-white from-20% to-gray-200 sm:from-white sm:from-30% sm:to-gray-300 to-100% bg-clip-text m-0 font-clash-display font-extrabold" 
                style={{ WebkitTextFillColor: 'transparent' }}
              >
                Go from Resume to Hired.<br/>Smarter.
              </motion.h1>
              
              <motion.p 
                variants={fadeIn}
                className="text-[16px] sm:text-[16px] md:text-[18px] lg:text-[20px] leading-[24px] sm:leading-[24px] md:leading-[28px] lg:leading-[35px] text-left md:text-center w-full max-w-[100%] md:max-w-[600px] lg:max-w-[676px] text-gray-100 sm:text-gray-200 font-normal font-dm-sans"
              >
                CareerOS is your personal agentic career platform. We turn your resume into a curated list of high-quality, relevant job opportunities, powered by AI.
              </motion.p>
            </div>
            
            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-3 sm:gap-3 items-stretch sm:items-center justify-start md:justify-center w-full md:max-w-[456px] mt-4 sm:mt-4"
            >
              {/* ... (Buttons are the same) ... */}
              <div className="z-10 select-none">
              <Link to="/sign-up" className="z-10 select-none">

                <button type="button" className="relative inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-[30px] transition-colors cursor-pointer before:content-[''] before:absolute before:-top-[1px] before:-left-[1px] before:-z-[1] before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px] bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7] w-full sm:w-auto" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}>
                  <span className="relative w-fit font-normal text-[14px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">Get Started Free</span>
                </button>
              </Link>
              </div>
              <div className="z-10 select-none">
                <button type="button" className="relative inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-[30px] transition-colors cursor-pointer before:content-[''] before:absolute before:-top-[1px] before:-left-[1px] before:-z-[1] before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px] bg-transparent hover:bg-white/5 border border-white/30 before:bg-transparent w-full sm:w-auto border-gray-400 sm:border-gray-500 text-gray-100 sm:text-gray-300 hover:bg-gray-800/50 sm:hover:bg-gray-700/30 hover:border-gray-300 sm:hover:border-gray-400">
                  <span className="relative w-fit font-normal text-[14px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white">How it Works</span>
                </button>
              </div>
            </motion.div>
            
            <motion.div 
              variants={fadeIn}
              className="text-[12px] sm:text-[12px] md:text-[14px] leading-[18px] sm:leading-[18px] md:leading-[20px] font-normal text-left md:text-center w-full font-dm-sans mt-3 sm:mt-2"
            >
              <span className="text-gray-200 sm:text-gray-300">Powered by Gemini, LangGraph, and Bright Data</span>
            </motion.div>
          </div>

          {/* MOVED: Floating UI cards (z-30 context) */}
          

        </motion.div>
      </div>

      {/* MODIFIED: 3D Image & Glow Section (z-10) */}
      <div className="relative z-10 w-full h-64 -mt-22"> {/* Pulled up more, made taller */}
        {/* The Glow - Made stronger and larger */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[250px] bg-blue-500/20 blur-3xl" />
        
        {/* The 3D Image (clipped) */}
        <motion.div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] overflow-hidden"
          initial={{ opacity: 0, y: 150 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          viewport={{ once: true }}
        >
          <motion.img 
            src="/images/hero_3d.webp"
            alt="Abstract 3D shape"
            className="absolute bottom-0 w-full h-auto object-contain opacity-60 md:opacity-70" // Increased opacity
            style={{ transform: 'translateY(35%) scale(1.2)' }} // Peeks up ~35%
            animate={{
              y: ['78%', '80%', '78%'], // Adjusted animation range
            }}
            transition={{
              duration: 8,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror"
            }}
          />
        </motion.div>
      </div>


      {/* CareerOS Kanban Board Preview (z-20) */}
      <motion.div 
        className="relative z-20 w-full max-w-6xl mx-auto -mt-28" // Negative margin to overlap
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <div className="relative h-[400px] md:h-[500px] lg:h-[600px] w-full max-w-5xl mx-auto p-4 md:p-6 bg-slate-900  rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-medium text-white font-clash-display">Job Tracker</h2>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Powered by CareerOS</span>
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 md:gap-5 h-full">
            {/* Column 1: Saved */}
            <div className="bg-black/20 rounded-lg p-2 md:p-4 h-full overflow-y-auto">
              <h3 className="text-sm md:text-base font-semibold text-gray-300 mb-3">Saved</h3>
              <div className="space-y-3">
                <JobCard company="Google" title="Senior React Developer" />
                <JobCard company="Netflix" title="AI Agent Engineer" />
              </div>
            </div>
            {/* Column 2: Applied */}
            <div className="bg-black/20 rounded-lg p-2 md:p-4 h-full overflow-y-auto">
              <h3 className="text-sm md:text-base font-semibold text-gray-300 mb-3">Applied</h3>
              <JobCard company="Vercel" title="Frontend Engineer" />
            </div>
            {/* Column 3: Interviewing */}
            <div className="bg-black/20 rounded-lg p-2 md:p-4 h-full overflow-y-auto">
              <h3 className="text-sm md:text-base font-semibold text-gray-300 mb-3">Interviewing</h3>
              <JobCard company="OpenAI" title="Research Scientist" />
            </div>
          </div>
          {/* Fading overlay */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none"></div>
        </div>
      </motion.div>
    </section>
  );
};

// Helper component for the Kanban Card
const JobCard = ({ company, title }) => (
  <div className="bg-slate-700/50 border border-slate-600/50 rounded-md p-2 md:p-3 shadow-md">
    <p className="text-xs md:text-sm font-medium text-white truncate">{title}</p>
    <p className="text-xs text-gray-400">{company}</p>
  </div>
);