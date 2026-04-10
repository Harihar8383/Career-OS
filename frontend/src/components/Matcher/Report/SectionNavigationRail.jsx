import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Section 4.3.2: Vertical Floating Navigation Rail
// "A minimalist series of dots on the right side of the screen"
const SECTIONS = [
  { id: 'header', label: 'Match Overview' },
  { id: 'breakdown', label: 'Section Scores' },
  { id: 'keywords', label: 'Keyword Gaps' },
  { id: 'todos', label: 'Action Plan' },
  { id: 'feedback', label: 'AI Feedback' },
];

export const SectionNavigationRail = () => {
  const [activeSection, setActiveSection] = useState('header');

  useEffect(() => {
    const handleScroll = () => {
      // Find which section is currently in the top 30% of the viewport
      const scrollPosition = window.scrollY + window.innerHeight * 0.3;
      
      const current = SECTIONS.reduce((nearest, section) => {
        const el = document.getElementById(`section-${section.id}`);
        if (!el) return nearest;
        const { offsetTop } = el;
        if (scrollPosition >= offsetTop) {
          return section.id;
        }
        return nearest;
      }, 'header');
      
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) {
      // Offset by 80px to account for sticky header if visible
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-4"
    >
      {SECTIONS.map((section) => {
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className="group relative flex items-center justify-end"
            aria-label={`Scroll to ${section.label}`}
          >
            {/* Tooltip */}
            <span className={`absolute right-6 mr-2 px-2 py-1 bg-surface-card border border-surface-border text-text-high text-xs font-bold rounded shadow-lg whitespace-nowrap transition-all duration-200 ${
              isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0'
            }`}>
              {section.label}
            </span>
            
            {/* Dot */}
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isActive 
                ? 'bg-brand-primary scale-150 shadow-[0_0_8px_rgba(41,52,255,0.6)]' 
                : 'bg-surface-border-strong group-hover:bg-text-mid group-hover:scale-125'
            }`} />
          </button>
        );
      })}
    </motion.div>
  );
};
