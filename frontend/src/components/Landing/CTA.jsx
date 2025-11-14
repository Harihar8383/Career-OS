// src/components/CTA.jsx
import React from 'react';
import { motion } from 'framer-motion';

export const CTA = () => {
  return (
    <section id="contact" className="mx-auto max-w-[95vw] sm:max-w-[90vw] md:max-w-[1250px] border-[0.5px] border-slate-800/0 rounded-[12px] py-0 sm:py-12 md:py-16 pb-0 sm:pb-20 md:pb-25 relative w-full px-4 sm:px-6 overflow-hidden">
      <div className="relative z-10">
        
        {/* Section Header - CORRECTED PATH */}
        <div className="relative">
          <div className="text-center sm:mb-20 relative py-3 sm:py-10 pt-5 pb-8 bg-cover bg-center mb-0!" style={{ backgroundImage: "url('/images/section2/HeaderBg.svg')" }}>
            <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 bg-primary border border-primary-light rounded-full mb-4 sm:mb-6 relative z-10">
              {/* CareerOS Content */}
              <span className="text-accent text-xs sm:text-sm font-medium tracking-[0.98px] uppercase font-dm-sans">Start Your Journey</span>
            </div>
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-4 sm:mb-6 relative z-10 font-clash-display leading-tight">
              Ready to Get Started?
            </h2>
            <p className="text-text-body text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed relative z-10 font-dm-sans">
              {/* CareerOS Content */}
              Join professionals using our analytics platform to grow smarter and find their next role.
            </p>
          </div>
        </div>

        {/* Map & Form */}
        <div className="relative mx-auto max-w-7xl z-20 w-full mt-6 sm:mt-8">
          <div className="relative w-full h-[400px] sm:h-[500px] md:h-[500px]">
            
            {/* World Map Background - CORRECTED PATH */}
            <div className="relative">
              <div className="w-full aspect-2/1 rounded-lg ">
                <img 
                  src="/images/world-map.svg" 
                  className="h-full w-full pointer-events-none select-none opacity-40 sm:opacity-50" 
                  alt="world map" 
                  height="495" 
                  width="1056" 
                  style={{ filter: 'brightness(1.2) contrast(1.1) sepia(0.1) hue-rotate(200deg)' }} 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-bg-dark/20 via-transparent to-bg-dark/20"></div>
            </div>

            {/* CTA Form Card */}
            <motion.div 
              className="flex justify-center absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 items-center z-20 w-[90%] md:w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              viewport={{ once: true }}
            >
              <div className="bg-gradient-to-br from-slate-900/55 via-gray-900/45 to-slate-800/40 backdrop-blur-xs rounded-xl shadow-xl p-6 sm:p-8 md:p-7 md:py-6 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto md:mx-0 relative overflow-hidden border border-slate-700/30">
                <div className="relative z-10 text-start">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-clash-display font-normal tracking-normal mb-2 text-slate-100">
                    Get Started Free
                  </h3>
                  <p className="text-gray-300 text-sm sm:text-base mb-6 sm:mb-4 leading-relaxed font-normal">
                    {/* CareerOS Content */}
                    Join <span className="font-medium text-blue-300">thousands</span> of users finding their next role, faster.
                  </p>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="flex-grow basis-0 h-[42px] bg-slate-900/20 backdrop-blur-sm rounded-xl border border-slate-800/50 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.18)] relative hover:border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200 ">
                        <input type="email" className="w-full h-full px-4 bg-transparent outline-none text-gray-200 text-[14px] tracking-[0.98px] font-light rounded-xl placeholder:text-gray-400 placeholder:font-light font-dm-sans" placeholder="Enter your email address" />
                      </div>
                    </div>
                    <div className="z-10 select-none">
                      <button type="button" className="relative inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-[30px] transition-colors cursor-pointer before:content-[''] before:absolute before:-top-[1px] before:-left-[1px] before:-z-[1] before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px] bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7] w-full  bg-gradient-to-r from-blue-800 to-slate-700 hover:from-blue-900 hover:to-slate-800 border-0 shadow-md hover:shadow-blue-900/20 transition-all duration-200 text-base sm:text-lg font-medium" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}>
                        <span className="relative w-fit font-normal text-[14px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">Sign Up Now</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 mt-3 font-normal">No credit card required • 14-day free trial</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};