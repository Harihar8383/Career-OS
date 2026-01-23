// frontend/src/components/Forms/FormElements.jsx
import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * A sleek, reusable Input component
 */
/**
 * A sleek, reusable Input component
 */
export const Input = (props) => (
  <input
    {...props}
    className="w-full h-11 bg-[#18181B]/60 backdrop-blur-sm border border-white/10 rounded-xl px-4 text-white font-dm-sans placeholder:text-gray-500 focus:ring-2 focus:ring-[#2934FF]/50 focus:border-[#2934FF] outline-none transition-all shadow-inner"
  />
);

/**
 * A sleek, reusable Textarea component
 */
export const Textarea = (props) => (
  <textarea
    {...props}
    className="w-full bg-[#18181B]/60 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-white font-dm-sans placeholder:text-gray-500 focus:ring-2 focus:ring-[#2934FF]/50 focus:border-[#2934FF] outline-none transition-all shadow-inner"
  />
);

/**
 * A sleek, reusable Label component
 */
export const Label = ({ children, htmlFor }) => (
  <label
    htmlFor={htmlFor}
    className="block text-xs font-semibold text-gray-400 mb-2 font-dm-sans uppercase tracking-wider"
  >
    {children}
  </label>
);

/**
 * The main "Submit" button
 */
export const SubmitButton = ({ children, isLoading, className = "", ...props }) => (
  <button
    type="submit"
    disabled={isLoading}
    {...props}
    className={`inline-flex items-center justify-center gap-2 px-6 py-3
               rounded-xl transition-all duration-300 cursor-pointer
               bg-[#2934FF] hover:bg-[#1E28CC] disabled:bg-[#2934FF]/50
               text-white font-bold shadow-[0_0_20px_rgba(41,52,255,0.4)] hover:shadow-[0_0_30px_rgba(41,52,255,0.6)]
               hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed ${className}`}
  >
    {isLoading ? (
      <Loader2 size={20} className="animate-spin text-white" />
    ) : (
      children
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