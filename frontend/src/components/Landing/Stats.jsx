// src/components/Stats.jsx
import React, { useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';

// ... (StatsCounter and StatCard helper components remain the same as before) ...
function StatsCounter({ from, to, suffix }) {
  const nodeRef = useRef();
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      const node = nodeRef.current;
      const controls = animate(from, to, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate(value) {
          node.textContent = Math.round(value);
        }
      });
      return () => controls.stop();
    }
  }, [from, to, isInView]);

  return (
    <span className="bg-gradient-to-b from-blue-400 from-30% to-blue-600 to-100% bg-clip-text inline-block" style={{ WebkitTextFillColor: 'transparent' }}>
      <span ref={nodeRef}>{from}</span>{suffix}
    </span>
  );
}

const StatCard = ({ title, description, from, to, suffix }) => (
  <motion.div 
    className="w-full text-center py-6 md:py-6 px-6 md:px-8 relative flex-1 min-w-0"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    viewport={{ once: true }}
  >
    <div className="w-full absolute inset-0 bg-gray-900/20 sm:bg-bg-dark/20 backdrop-blur-md rounded-lg"></div>
    <div className="relative z-10">
      <h3 className="text-gray-200 text-lg sm:text-xl md:text-xl font-medium mb-3 md:mb-2">
        {title}
      </h3>
      <div className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-clash-display font-[500] min-h-[80px] sm:min-h-[90px] md:min-h-[96px] lg:min-h-[112px] xl:min-h-[128px] flex items-center justify-center">
        <StatsCounter from={from} to={to} suffix={suffix} />
      </div>
      <p className="text-gray-400 text-base sm:text-lg md:text-base">
        {description}
      </p>
    </div>
  </motion.div>
);
// --- (End of helper components) ---


export const Stats = () => {
  return (
    <section className="relative bg-bg-dark py-12 sm:py-12 md:py-16 lg:py-20 overflow-hidden max-w-[1250px] mx-auto border-[0.5px] border-slate-800/0 rounded-[12px]">
      
      {/* Background 3D image - CORRECTED PATH */}
      <div 
        className="absolute left-0 top-0 -translate-x-[20%] translate-y-[10%] h-[120%] w-[140%] opacity-20 md:opacity-30" 
        style={{ 
          backgroundImage: "url('/images/hero_3d.webp')", 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          backgroundRepeat: 'no-repeat' 
        }}
      ></div>
      
      {/* Background Gradients from Aniq UI */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/80 via-bg-dark/10 to-bg-dark/80"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-bg-dark/90 via-bg-dark/50 to-bg-dark/90"></div>
      </div>
      <div className="absolute top-0 left-0 right-0 h-[200px] md:h-[300px] bg-gradient-to-b from-bg-dark/80 via-bg-dark/60 to-transparent"></div>

      {/* Section Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-6">
        <div className="relative z-10">
          <div className="text-center sm:mb-20 relative py-3 sm:py-10">
            <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 bg-primary border border-primary-light rounded-full mb-4 sm:mb-6 relative z-10">
              <span className="text-accent text-xs sm:text-sm font-medium tracking-[0.98px] uppercase font-dm-sans">Proven Results</span>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-4 sm:mb-6 relative z-10 font-clash-display leading-tight">
              Numbers that speak
            </h2>
            <p className="text-text-body text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed relative z-10 font-dm-sans">
              See why professionals choose CareerOS to accelerate their growth and make data-driven decisions.
            </p>
          </div>
        </div>
        
        {/* CareerOS Stats */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0 max-w-5xl mx-auto mt-2 sm:mt-8">
          <StatCard 
            title="Hours Saved Weekly"
            description="Per user, automating the job search"
            from={0}
            to={10}
            suffix="+"
          />
          <div className="hidden md:block h-[70px] lg:h-[90px] w-[1px] bg-gray-700/40 mx-2 lg:mx-4"></div>
          <StatCard 
            title="Job Match Accuracy"
            description="AI-powered profile vs. job ranking"
            from={0}
            to={95}
            suffix="%"
          />
          <div className="hidden md:block h-[70px] lg:h-[90px] w-[1px] bg-gray-700/40 mx-2 lg:mx-4"></div>
          <StatCard 
            title="Relevant Jobs Found"
            description="From thousands of live sources"
            from={0}
            to={50}
            suffix="k+"
          />
        </div>
      </div>
    </section>
  );
};