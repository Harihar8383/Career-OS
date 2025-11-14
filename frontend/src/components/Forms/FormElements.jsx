// frontend/src/components/Forms/FormElements.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * A sleek, reusable Input component
 */
export const Input = (props) => (
  <input
    {...props}
    className="w-full h-11 bg-slate-800/50 border border-white/10 rounded-lg px-4 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
  />
);

/**
 * A sleek, reusable Textarea component
 */
export const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-4 text-white font-dm-sans placeholder:text-text-body focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
  />
);

/**
 * A sleek, reusable Label component
 */
export const Label = ({ children, htmlFor }) => (
  <label 
    htmlFor={htmlFor} 
    className="block text-sm font-medium text-text-secondary mb-2 font-dm-sans"
  >
    {children}
  </label>
);

/**
 * The main "Submit" button
 */
export const SubmitButton = ({ children, isLoading, ...props }) => (
  <button
    type="submit"
    disabled={isLoading}
    {...props}
    className="relative inline-flex items-center justify-center gap-2 px-6 py-3
               rounded-[30px] transition-colors cursor-pointer
               before:content-[''] before:absolute before:-top-px before:-left-px before:-z-1 before:w-[calc(100%+2px)] before:h-[calc(100%+2px)] before:rounded-[30px] before:p-[1px]
               bg-[#044fc7] hover:bg-[#0956d4] before:bg-gradient-to-b before:from-[#598ffa] before:to-[#044fc7]
               disabled:opacity-50 disabled:cursor-not-allowed"
    style={{ backgroundImage: 'linear-gradient(to bottom, rgba(108,108,108,0.15), transparent)' }}
  >
    {isLoading ? (
      <Loader2 size={20} className="animate-spin text-white" />
    ) : (
      <span className="relative w-fit font-normal text-[16px] leading-[20px] whitespace-nowrap flex items-center gap-2 transition-colors text-white [text-shadow:0px_0px_0.5px_#ffffff]">
        {children}
      </span>
    )}
  </button>
);

/**
 * A simple container for form sections
 */
export const FormCard = ({ children }) => (
  <div className="bg-bg-dark/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 space-y-6">
    {children}
  </div>
);

/**
 * A header for each card
 */
export const CardHeader = ({ title, description }) => (
  <div className="border-b border-white/10 pb-4">
    <h2 className="text-xl font-clash-display text-white">{title}</h2>
    {description && (
      <p className="mt-1 text-sm text-text-body font-dm-sans">{description}</p>
    )}
  </div>
);