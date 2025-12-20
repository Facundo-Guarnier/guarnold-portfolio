
import React from 'react';

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string }> = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase text-neutral-500 mb-1.5 tracking-wider">
    {children}
  </label>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input: React.FC<InputProps> = ({ className = '', ...props }) => (
  <input
    className={`w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-300 hover:border-neutral-300 ${className}`}
    {...props}
  />
);

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea: React.FC<TextAreaProps> = ({ className = '', ...props }) => (
  <textarea
    className={`w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-300 hover:border-neutral-300 min-h-[100px] resize-y ${className}`}
    {...props}
  />
);

export const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
    {icon}
    {children}
  </h2>
);
