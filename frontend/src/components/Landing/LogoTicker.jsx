// src/components/Landing/LogoTicker.jsx
import React from 'react';
import { motion } from 'framer-motion';

// Array of our logos, now using image paths
// Assumes icons are in the `public/icons/` directory
const logos = [
  { name: 'Google Gemini', src: '/icons/gemini.svg' },
  { name: 'LangChain', src: '/icons/langchain.jpeg' },
  { name: 'Bright Data', src: '/icons/brightData.png' },
  { name: 'Python', src: '/icons/python.png' },
  { name: 'JavaScript', src: '/icons/js.png' },
  {name: 'React', src: '/icons/react.png' },
  { name: 'MongoDB', src: '/icons/mongo.png' },
  { name: 'Git', src: '/icons/Git.png' },
  { name: 'GitHub', src: '/icons/github.png' },
];

// This is a single Logo item, now using <img>
const LogoItem = ({ src, name }) => (
  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-3 min-w-fit">
    {/* This parent div constrains the size */}
    <div className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8">
      <img
        src={src}
        alt={`${name} logo`}
        // These classes make the image fit the container uniformly
        className="w-full h-full object-contain"
      />
    </div>
    <span className="text-gray-400 font-medium text-lg sm:text-xl md:text-2xl whitespace-nowrap">
      {name}
    </span>
  </div>
);

export const LogoTicker = () => {
  return (
    <section className="bg-bg-dark pb-4 sm:pb-12 md:pb-5 pt-12 sm:pt-15 md:pt-18 relative select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* The parent container MUST have overflow-hidden */}
        <div className="overflow-hidden relative">
          {/* Fading gradients on the left and right */}
          <div className="absolute left-0 top-0 w-16 sm:w-24 md:w-32 lg:w-120 h-full bg-gradient-to-r from-bg-dark via-bg-dark/40 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-16 sm:w-24 md:w-32 lg:w-120 h-full bg-gradient-to-l from-bg-dark via-bg-dark/40 to-transparent z-10 pointer-events-none"></div>

          {/* Animated container */}
          <motion.div
            className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-10"
            animate={{
              x: ['0%', '-150%'], // Animate from start to the end of the first list
            }}
            transition={{
              ease: 'linear',
              duration: 25, // Adjust this duration to change speed
              repeat: Infinity,
            }}
          >
            {/* Render the list of logos */}
            {logos.map((logo, index) => (
              <LogoItem
                src={logo.src}
                name={logo.name}
                key={`logo-${index}`}
              />
            ))}

            {/* Render the list of logos AGAIN for the seamless loop */}
            {logos.map((logo, index) => (
              <LogoItem
                src={logo.src}
                name={logo.name}
                key={`logo-duplicate-${index}`}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};