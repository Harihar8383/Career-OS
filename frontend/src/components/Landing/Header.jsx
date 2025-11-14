// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="fixed top-3 sm:top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-[95%] sm:max-w-4xl pl-2 pr-2 sm:pl-8 sm:pr-4">
      <div className="backdrop-blur-[10px] backdrop-filter bg-syntask-bg/70  relative rounded-[500px] w-full h-14 sm:h-14 border border-syntask-border">
        <div className="block w-[129px] sm:w-[259px] absolute top-0 left-[75%] transform -translate-x-1/2 -translate-y-1/2" style={{ height: '1px', background: 'linear-gradient(270deg, rgba(115, 116, 116, 0.00) 2.51%, #939393 55.12%, rgba(111, 111, 112, 0.00) 94.61%)' }}></div>
        
        {/* Logo */}
        <div className="absolute left-4 sm:left-[4.464%] top-1/2 transform -translate-y-1/2 flex items-center gap-[5px] sm:gap-[7px]">
          <div className="font-normal text-text-primary text-[14px] sm:text-[16px] tracking-[1.4px] sm:tracking-[1.76px] uppercase">
            {/* CareerOS Content */}
            <span className="leading-[28px] sm:leading-[35px] whitespace-pre">CareerOS</span>
          </div>
          <div className="font-extralight text-text-secondary text-[18px] sm:text-[22px] tracking-[2px] sm:tracking-[2.42px] h-3 sm:h-3.5 flex justify-center items-center w-[8px] sm:w-[9px]">
            <span className="leading-[28px] sm:leading-[35px]">®</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center gap-6 lg:gap-8">
          {/* CareerOS Content */}
          <a href="#features" className="relative font-normal text-neutral-50 text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] px-3 lg:px-4 py-1 rounded-full border border-transparent transition-all duration-500 ease-out hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-black/30 hover:border-white/30 group">
            Features
            <div className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.07) 100%)' }}></div>
          </a>
          <a href="#how-it-works" className="relative font-normal text-neutral-50 text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] px-3 lg:px-4 py-1 rounded-full border border-transparent transition-all duration-500 ease-out hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-black/30 hover:border-white/30 group">
            How It Works
            <div className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.07) 100%)' }}></div>
          </a>
          <a href="#pricing" className="relative font-normal text-neutral-50 text-[14px] lg:text-[16px] leading-[20px] lg:leading-[24px] px-3 lg:px-4 py-1 rounded-full border border-transparent transition-all duration-500 ease-out hover:text-white hover:bg-white/10 hover:shadow-lg hover:shadow-black/30 hover:border-white/30 group">
            Pricing
            <div className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0.07) 100%)' }}></div>
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 group" aria-label="Toggle menu">
          <div className="relative w-4 h-3.5">
            <span className="absolute h-[1.5px] w-full bg-white left-0 top-0 transform transition-all duration-300 ease-out "></span>
            <span className="absolute h-[1.5px] w-full bg-white left-0 top-[6px] transition-all duration-200 ease-out opacity-100"></span>
            <span className="absolute h-[1.5px] w-full bg-white left-0 bottom-0 transform transition-all duration-300 ease-out "></span>
          </div>
        </button>

        {/* Sign Up Button */}
        <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 hidden sm:block">
          <div className="scale-75 sm:scale-100 origin-right">
            <div className="z-10 select-none">
            <Link to="/sign-up" className="z-10 select-none">
              
              <button type="button" className="relative inline-flex items-center justify-center gap-2 px-4 py-[9px] 
                rounded-[30px] transition-colors cursor-pointer
                before:content-[''] before:absolute before:-top-px before:-left-px before:-z-1 before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px]
                bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7] " style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}>
                <span className="relative w-fit font-normal text-[14px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">
                  <span className="hidden sm:inline">Sign Up Now</span>
                  <span className="sm:hidden">Sign Up</span>
                </span>
              </button>
            </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};