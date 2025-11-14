// src/components/Testimonials.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Animation for the cards
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  },
};

// A single testimonial card component - CORRECTED AVATAR PATHS
const TestimonialCard = ({ quote, name, title, company, avatarSrc }) => {
  return (
    <motion.div 
      className="flex-none min-w-0"
      variants={fadeIn}
      viewport={{ once: true }}
    >
      <div className="bg-gray-950/90 backdrop-blur-3xl border border-gray-800 rounded-xl p-4 sm:p-6 w-full h-full flex flex-col">
        <div className="flex gap-1 mb-3 sm:mb-4">
          {/* Star rating */}
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
            </svg>
          ))}
        </div>
        <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 flex-1 overflow-hidden">
          “{quote}”
        </p>
        <div className="flex items-center gap-2 sm:gap-3 mt-auto">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
            <img 
              alt={name} 
              loading="lazy" 
              decoding="async" 
              src={avatarSrc}
              className="object-cover w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <h4 className="text-white font-medium text-xs sm:text-sm truncate">{name}</h4>
            <p className="text-gray-400 text-xs truncate">{title} at {company}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


// The main Testimonials section component - CORRECTED PATHS
export const Testimonials = () => {
  return (
    <section className="bg-bg-dark relative select-none overflow-hidden">
      <div className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[1250px] mx-auto py-8 sm:py-12 md:py-15 px-4 sm:px-6 relative overflow-hidden z-20 border-[0.5px] border-slate-800/0 rounded-[12px]">
        
        {/* Decorative elements - CORRECTED PATHS */}
        <div className="absolute w-[200px] sm:w-[280px] md:w-[380px] h-[200px] sm:h-[280px] md:h-[380px] translate-y-[70%] -z-1 -translate-x-1/2 rounded-full bottom-0 left-1/2 opacity-40 sm:opacity-60" style={{ background: 'radial-gradient(circle, rgba(10, 51, 117,0.1) 0%, rgba(10, 51, 117, 1) 50%, transparent 100%)', filter: 'blur(120px)' }}></div>
        <div 
          className="absolute left-1/2 bottom-0 -translate-x-1/2 z-1 translate-y-[70%] w-[300px] sm:w-[450px] md:w-[580px] h-[300px] sm:h-[450px] md:h-[580px] opacity-20 sm:opacity-30 blur-xs" 
          style={{ 
            backgroundImage: "url('/images/hero_3d.webp')", 
            backgroundSize: '100% 100%', 
            backgroundRepeat: 'no-repeat', 
            backgroundPosition: 'center' 
          }}
        ></div>

        {/* Section Header - CORRECTED PATH */}
        <div className="text-center sm:mb-20 relative py-3 sm:py-10 pt-5 pb-8 bg-cover bg-center mb-9!" style={{ backgroundImage: "url('/images/section2/HeaderBg.svg')" }}>
          <div className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 bg-primary border border-primary-light rounded-full mb-4 sm:mb-6 relative z-10">
            <span className="text-accent text-xs sm:text-sm font-medium tracking-[0.98px] uppercase font-dm-sans">Testimonials</span>
          </div>
          <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal mb-4 sm:mb-6 relative z-10 font-clash-display leading-tight">
            Loved by Professionals
          </h2>
          <p className="text-text-body text-sm sm:text-base md:text-lg max-w-sm sm:max-w-lg md:max-w-2xl mx-auto leading-relaxed relative z-10 font-dm-sans">
            See what our users are saying about their experience with CareerOS.
          </p>
        </div>
        
        {/* CareerOS Testimonials Grid - CORRECTED AVATAR PATHS */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true }}
          transition={{ staggerChildren: 0.1 }}
        >
          <TestimonialCard
            quote="CareerOS found my dream job in 3 days. The Job Hunter agent is a game-changer."
            name="Alex J."
            title="Software Engineer"
            company="TechFlow"
            avatarSrc="/images/avatars/1.webp" 
          />
          <TestimonialCard
            quote="The AI Mentor completely rewrote my resume's project section. I started getting interviews immediately."
            name="Sarah K."
            title="Product Manager"
            company="GrowthLab"
            avatarSrc="/images/avatars/2.webp"
          />
          <TestimonialCard
            quote="I'll never write a cover letter by hand again. This is the new standard for job searching."
            name="David L."
            title="MERN Developer"
            company="StartupXYZ"
            avatarSrc="/images/avatars/3.webp"
          />
        </motion.div>
        
      </div>
    </section>
  );
};