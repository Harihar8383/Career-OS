// src/components/FeatureCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Animation for the card to fade in
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

// We pass props for title, description, className, and an optional image
export const FeatureCard = ({ title, description, className, imgSrc }) => {
  return (
    <motion.div
      className={`relative p-[1px] rounded-[20px] h-auto z-5 ${className}`}
      variants={fadeIn}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true }}
    >
      <div className="w-full h-full rounded-[19px] relative flex flex-col p-8 justify-end bg-bg-dark/90 backdrop-blur-xl border border-white/10 group-hover:border-white/20 transition-all duration-300">
        
        {/* Placeholder for the complex background SVGs - a simple gradient instead */}
        <div 
          className="absolute inset-0 z-0 rounded-[19px] opacity-10" 
          style={{ background: 'linear-gradient(180deg, var(--color-primary-light) 0%, var(--color-bg-dark) 100%)' }}
        ></div>
        
        {/* Conditional Image (like Card2Users.png) */}
        {imgSrc && (
          <div className="flex justify-center mb-3">
            <img src={imgSrc} className="h-10 z-1" alt={`${title} icon`} />
          </div>
        )}

        <h3 className="relative z-1 text-white text-center text-xl font-bold mb-3 font-clash-display">
          {title}
        </h3>
        <p className="relative z-1 text-text-body text-center text-base leading-relaxed font-dm-sans">
          {description}
        </p>
      </div>
    </motion.div>
  );
};