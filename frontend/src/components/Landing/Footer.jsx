// src/components/Footer.jsx
import React from 'react';

export const Footer = () => {
  return (
    <footer className="relative max-w-[1250px] mx-auto bg-syntask-bg/30 z-2 border-t border-slate-800/50 mt-10 sm:mt-20 overflow-hidden">
      <div className="absolute top-0 left-[-20%] transform translate-x-1/2 -translate-y-1/2" style={{ width: '459px', height: '1px', background: 'linear-gradient(270deg, rgba(115, 116, 116, 0.00) 2.51%, #939393 55.12%, rgba(111, 111, 112, 0.00) 94.61%)' }}></div>
      <div className="relative max-w-7xl mx-auto px-6 py-8 sm:py-16 pb-8">
        
        {/* Top Footer Section: Links */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          
          {/* Logo & Socials */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              {/* CareerOS Content */}
              <div className="font-normal text-text-primary text-[20px] tracking-[1.76px] uppercase">CareerOS</div>
              <div className="font-extralight text-text-secondary text-[24px] tracking-[2.42px] flex items-center">®</div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-sm mb-6">
              {/* CareerOS Content */}
              Your personal AI agent for a smarter, faster job hunt.
            </p>
            <div className="flex items-center gap-4">
              {/* Social Icons (Twitter, GitHub, LinkedIn, Email) */}
              <a href="#twitter" aria-label="Twitter" className="w-10 h-10 rounded-full bg-slate-700/60 border border-slate-600/60 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-600/70 hover:border-slate-500/70 transition-all duration-200 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M22 4.01c-1 .49 -1.98 .689 -3 .99c-1.121 -1.265 -2.783 -1.335 -4.38 -.737s-2.643 2.06 -2.62 3.737v1c-3.245 .083 -6.135 -1.395 -8 -4c0 0 -4.182 7.433 4 11c-1.872 1.247 -3.739 2.088 -6 2c3.308 1.803 6.913 2.423 10.034 1.517c3.58 -1.04 6.522 -3.723 7.651 -7.742a13.84 13.84 0 0 0 .497 -3.753c0 -.249 1.51 -2.772 1.818 -4.013z"></path></svg>
              </a>
              <a href="#github" aria-label="GitHub" className="w-10 h-10 rounded-full bg-slate-700/60 border border-slate-600/60 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-600/70 hover:border-slate-500/70 transition-all duration-200 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path></svg>
              </a>
              <a href="#linkedin" aria-label="LinkedIn" className="w-10 h-10 rounded-full bg-slate-700/60 border border-slate-600/60 flex items-center justify-center text-gray-300 hover:text-white hover:bg-slate-600/70 hover:border-slate-500/70 transition-all duration-200 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M8 11v5"></path><path d="M8 8v.01"></path><path d="M12 16v-5"></path><path d="M16 16v-3a2 2 0 1 0 -4 0"></path><path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z"></path></svg>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h3 className="font-medium text-gray-100 text-sm uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-3">
              <li><a href="#features" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Features</a></li>
              <li><a href="#how-it-works" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">How It Works</a></li>
              <li><a href="#integrations" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Integrations</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-100 text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#about" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">About</a></li>
              <li><a href="#blog" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Blog</a></li>
              <li><a href="#contact" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-100 text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#docs" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Documentation</a></li>
              <li><a href="#help" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Help Center</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-100 text-sm uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><a href="#privacy" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Privacy Policy</a></li>
              <li><a href="#terms" className="text-gray-300 text-sm hover:text-white transition-colors duration-200">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="relative mt-7 sm:mt-12 mb-0 py-8 border-t overflow-hidden border-slate-700/60 w-full flex justify-center">
          <div className="relative w-full max-w-[95%] mx-auto p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/20 flex flex-col items-center">
            <h3 className="font-medium text-gray-100 text-sm uppercase tracking-wider mb-3 text-center">Stay Updated</h3>
            <p className="text-gray-300 text-sm mb-4 text-center">Get the latest updates on AI in career development.</p>
            <div className="flex gap-3 w-full max-w-md">
              <div className="flex-grow basis-0 h-[42px] bg-slate-900/20 backdrop-blur-sm rounded-xl border border-slate-800/50 shadow-[0px_1px_4px_0px_rgba(0,0,0,0.18)] relative hover:border-slate-700/50 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all duration-200 flex-1">
                <input type="email" className="w-full h-full px-4 bg-transparent outline-none text-gray-200 text-[14px] tracking-[0.98px] font-light rounded-xl placeholder:text-gray-400 placeholder:font-light font-dm-sans" placeholder="Enter your email" />
              </div>
              <div className="z-10 select-none">
                <button type="button" className="relative inline-flex items-center justify-center gap-2 px-4 py-[9px] rounded-[30px] transition-colors cursor-pointer before:content-[''] before:absolute before:-top-[1px] before:-left-[1px] before:-z-[1] before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px] bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7]" style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}>
                  <span className="relative w-fit font-normal text-[14px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">Subscribe</span>
                </button>
              </div>
            </div>
          </div>
          {/* Decorative image - CORRECTED PATH */}
          <div 
            className="absolute -z-1 right-0 top-0 translate-x-1/2 rotate-z-180 w-[200px] sm:w-[250px] h-[300px] pointer-events-none" 
            style={{ 
              backgroundImage: "url('/images/hero_3d.webp')", 
              backgroundSize: 'contain', 
              backgroundPosition: 'center', 
              backgroundRepeat: 'no-repeat' 
            }}
          ></div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-slate-700/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">© 2025 CareerOS. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-400">Made with ❤️ for the modern professional</span>
          </div>
        </div>
      </div>
      
    </footer>
  );
};